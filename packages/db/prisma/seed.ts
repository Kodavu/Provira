// Local seed data: skills, Lagos locations, the platform Lender + a starter
// loan product, and three demo users (no-smartphone worker, trader, employer
// with a funded job). Enough to exercise scoring, escrow, matching, and every
// channel locally. Idempotent-ish: clears core tables then re-inserts.

import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { computeScore, ScoreEventInput } from "@tally/core";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

// Permission catalog (resource:action) — the single source of what's grantable.
const PERMISSIONS: Array<{ key: string; group: string; label: string }> = [
  ["Users", "View", "users:view"],
  ["Users", "Edit", "users:edit"],
  ["Users", "Suspend", "users:suspend"],
  ["Users", "Delete", "users:delete"],
  ["Disputes", "View", "disputes:view"],
  ["Disputes", "Assign", "disputes:assign"],
  ["Disputes", "Resolve", "disputes:resolve"],
  ["Disputes", "Escalate", "disputes:escalate"],
  ["Disputes", "Close", "disputes:close"],
  ["Finance", "View transactions", "finance:view_transactions"],
  ["Finance", "Approve withdrawals", "finance:approve_withdrawals"],
  ["Finance", "Reverse transactions", "finance:reverse_transactions"],
  ["Finance", "Issue refunds", "finance:issue_refunds"],
  ["Verification", "Review KYC", "verification:review"],
  ["Verification", "Approve", "verification:approve"],
  ["Verification", "Reject", "verification:reject"],
  ["Support", "View tickets", "support:view_tickets"],
  ["Support", "Reply", "support:reply"],
  ["Support", "Assign", "support:assign"],
  ["Admin Users", "Create", "admin_users:create"],
  ["Admin Users", "Edit", "admin_users:edit"],
  ["Admin Users", "Disable", "admin_users:disable"],
  ["Admin Users", "Assign roles", "admin_users:assign_roles"],
  ["Settings", "View", "settings:view"],
  ["Settings", "Update", "settings:update"],
  ["Reports", "View", "reports:view"],
  ["Reports", "Export", "reports:export"],
  ["Impersonation", "Request", "impersonation:request"],
  ["Impersonation", "Approve", "impersonation:approve"],
].map(([group, label, key]) => ({ group, label, key }));

// Roles are bundles of permission keys — nothing hardcoded in code.
const ROLES: Array<{ name: string; description: string; system?: boolean; perms: string[] | "*" }> = [
  { name: "Super Admin", description: "Unrestricted access", system: true, perms: "*" },
  {
    name: "HR / Admin Management",
    description: "Manages internal staff (not a super admin)",
    perms: ["admin_users:create", "admin_users:edit", "admin_users:disable", "admin_users:assign_roles", "reports:view"],
  },
  {
    name: "Finance Team",
    description: "Transactions, withdrawals, refunds",
    perms: ["finance:view_transactions", "finance:approve_withdrawals", "finance:reverse_transactions", "finance:issue_refunds", "reports:view", "reports:export"],
  },
  {
    name: "Operations Team",
    description: "Users and dispute assignment",
    perms: ["users:view", "disputes:view", "disputes:assign", "reports:view", "impersonation:request"],
  },
  {
    name: "Customer Support",
    description: "Tickets and user lookups",
    perms: ["support:view_tickets", "support:reply", "support:assign", "disputes:view", "users:view"],
  },
  {
    name: "Compliance & Risk",
    description: "KYC and escalations",
    perms: ["verification:review", "verification:approve", "verification:reject", "disputes:view", "disputes:escalate", "users:view", "reports:view", "impersonation:approve"],
  },
  {
    name: "Moderators",
    description: "Resolve disputes, suspend users",
    perms: ["disputes:view", "disputes:assign", "disputes:resolve", "disputes:close", "users:view", "users:suspend"],
  },
  {
    name: "Account Verification Team",
    description: "KYC review only",
    perms: ["verification:review", "verification:approve", "verification:reject", "users:view"],
  },
  {
    name: "Read-Only Auditors",
    description: "Read-only across the platform",
    perms: ["users:view", "disputes:view", "finance:view_transactions", "reports:view", "settings:view"],
  },
];

const prisma = new PrismaClient();

async function main() {
  const skills = ["bricklaying", "tailoring", "cleaning", "driving", "loading"];
  await Promise.all(
    skills.map((slug) =>
      prisma.skill.upsert({
        where: { slug },
        create: { slug, name: slug[0].toUpperCase() + slug.slice(1) },
        update: {},
      }),
    ),
  );

  const balogun = await prisma.location.create({
    data: { label: "Balogun Market", state: "Lagos", lga: "Lagos Island", lat: 6.4552, lng: 3.39 },
  });
  const ikeja = await prisma.location.create({
    data: { label: "Ikeja", state: "Lagos", lga: "Ikeja", lat: 6.6018, lng: 3.3515 },
  });

  // Platform lender + starter product.
  const lender = await prisma.lender.create({
    data: { name: "Tally", isPlatform: true },
  });
  await prisma.loanProduct.create({
    data: {
      lenderId: lender.id,
      name: "Stock Advance (Small)",
      minAmount: 500000n, // NGN 5,000
      maxAmount: 5000000n, // NGN 50,000
      interestBps: 500, // 5%
      termDays: 30,
      minScore: 250,
      minTier: "EMERGING",
    },
  });

  // Worker WITHOUT a smartphone (uses SMS/IVR). Includes a channel identity.
  const worker = await prisma.user.create({
    data: {
      phone: "+2348010000001",
      fullName: "Amaka (Worker)",
      language: "PCM",
      status: "ACTIVE",
      hasSmartphone: false,
      roles: { create: { role: "WORKER" } },
      workerProfile: {
        create: {
          languages: ["EN", "PCM", "IG"],
          locationId: balogun.id,
          skills: {
            create: [
              { skill: { connect: { slug: "cleaning" } } },
              { skill: { connect: { slug: "loading" } } },
            ],
          },
        },
      },
      channelIdentities: {
        create: [
          { channel: "SMS", externalId: "+2348010000001", isVerified: true },
          { channel: "IVR", externalId: "+2348010000001", isVerified: true },
        ],
      },
    },
  });

  // Trader with a few logged sales.
  const trader = await prisma.user.create({
    data: {
      phone: "+2348010000002",
      fullName: "Musa (Trader)",
      language: "HA",
      status: "ACTIVE",
      hasSmartphone: true,
      roles: { create: { role: "TRADER" } },
      traderProfile: {
        create: { businessName: "Musa Provisions", marketName: "Balogun", locationId: balogun.id },
      },
    },
    include: { traderProfile: true },
  });
  await prisma.saleRecord.createMany({
    data: [
      { traderId: trader.traderProfile!.id, amount: 250000n },
      { traderId: trader.traderProfile!.id, amount: 180000n },
      { traderId: trader.traderProfile!.id, amount: 500000n },
    ],
  });

  // Employer with a job.
  const employer = await prisma.user.create({
    data: {
      phone: "+2348010000003",
      fullName: "Bola (Employer)",
      language: "YO",
      status: "ACTIVE",
      hasSmartphone: true,
      roles: { create: { role: "EMPLOYER" } },
      employerProfile: {
        create: { businessName: "Bola Logistics", locationId: ikeja.id },
      },
    },
    include: { employerProfile: true },
  });

  const job = await prisma.job.create({
    data: {
      employerId: employer.employerProfile!.id,
      title: "Warehouse loading (1 day)",
      description: "Load and offload goods for one day.",
      payAmount: 800000n, // NGN 8,000
      headcount: 1,
      languages: ["EN", "PCM"],
      locationId: ikeja.id,
      status: "OPEN",
      skills: { create: [{ skill: { connect: { slug: "loading" } } }] },
    },
  });

  // Fund an escrow account for the job so the release flow is demoable.
  const escrowAccount = await prisma.account.create({ data: { type: "JOB_ESCROW" } });
  await prisma.escrowAccount.create({
    data: {
      jobId: job.id,
      accountId: escrowAccount.id,
      amount: job.payAmount,
      fundedAt: new Date(),
    },
  });

  // Give the worker a real score HISTORY (append-only events), then derive the
  // cached profile from the same engine the API uses — so the cached score and
  // the event log agree and stay coherent as new jobs are completed.
  const history: ScoreEventInput[] = [];
  for (let i = 0; i < 10; i++) {
    history.push({ type: "JOB_COMPLETED" });
    if (i < 9) history.push({ type: "JOB_ON_TIME" }); // 9/10 on time
  }
  history.push({ type: "LOAN_REPAID_ON_TIME" });

  await prisma.scoreEvent.createMany({
    data: history.map((e) => ({ userId: worker.id, type: e.type, refType: "seed" })),
  });

  const computed = computeScore(history);
  await prisma.scoreProfile.create({
    data: {
      userId: worker.id,
      score: computed.score,
      tier: computed.tier,
      jobsCompleted: computed.jobsCompleted,
      onTimeRate: computed.onTimeRate,
      salesCount: computed.salesCount,
    },
  });

  // --- Admin RBAC ---
  await Promise.all(
    PERMISSIONS.map((p) =>
      prisma.permission.upsert({ where: { key: p.key }, create: p, update: { group: p.group, label: p.label } }),
    ),
  );
  const allPerms = await prisma.permission.findMany();
  const permByKey = new Map(allPerms.map((p) => [p.key, p.id]));

  const roleByName = new Map<string, string>();
  for (const r of ROLES) {
    const keys = r.perms === "*" ? allPerms.map((p) => p.key) : r.perms;
    const role = await prisma.role.create({
      data: {
        name: r.name,
        description: r.description,
        isSystem: r.system ?? false,
        permissions: { create: keys.map((k) => ({ permissionId: permByKey.get(k)! })) },
      },
    });
    roleByName.set(r.name, role.id);
  }

  // Admin users — a Super Admin and a Support agent (to show RBAC differences).
  await prisma.adminUser.create({
    data: {
      email: "superadmin@tally.ng",
      fullName: "Ada Okoro",
      passwordHash: hashPassword("admin1234"),
      status: "ACTIVE",
      department: "Executive",
      roles: { create: { roleId: roleByName.get("Super Admin")! } },
    },
  });
  await prisma.adminUser.create({
    data: {
      email: "support@tally.ng",
      fullName: "Tunde Bello",
      passwordHash: hashPassword("support1234"),
      status: "ACTIVE",
      department: "Customer Support",
      roles: { create: { roleId: roleByName.get("Customer Support")! } },
    },
  });
  await prisma.adminUser.create({
    data: {
      email: "hr@tally.ng",
      fullName: "Ngozi Eze",
      passwordHash: hashPassword("hr1234"),
      status: "ACTIVE",
      department: "People Ops",
      roles: { create: { roleId: roleByName.get("HR / Admin Management")! } },
    },
  });
  // Ops admin can REQUEST impersonation; compliance admin can APPROVE it — so the
  // write-impersonation two-person rule is testable with distinct accounts.
  await prisma.adminUser.create({
    data: {
      email: "ops@tally.ng",
      fullName: "Chidi Nwosu",
      passwordHash: hashPassword("ops1234"),
      status: "ACTIVE",
      department: "Operations",
      roles: { create: { roleId: roleByName.get("Operations Team")! } },
    },
  });
  await prisma.adminUser.create({
    data: {
      email: "compliance@tally.ng",
      fullName: "Fatima Bello",
      passwordHash: hashPassword("compliance1234"),
      status: "ACTIVE",
      department: "Compliance",
      roles: { create: { roleId: roleByName.get("Compliance & Risk")! } },
    },
  });

  // A couple of disputes so the queue isn't empty.
  await prisma.dispute.create({
    data: {
      code: "DSP-1001",
      title: "Worker not paid after confirmed shift",
      reporterId: worker.id,
      defendantId: employer.id,
      subjectType: "job",
      subjectId: job.id,
      priority: "HIGH",
      status: "OPEN",
      events: { create: { type: "created", note: "Dispute opened by worker" } },
    },
  });
  await prisma.dispute.create({
    data: {
      code: "DSP-1002",
      title: "Chargeback on a card sale",
      reporterId: trader.id,
      subjectType: "transaction",
      priority: "MEDIUM",
      status: "UNDER_REVIEW",
      events: { create: { type: "created", note: "Flagged by risk engine" } },
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete:", {
    worker: worker.phone,
    employer: employer.phone,
    admin: "superadmin@tally.ng / admin1234",
    support: "support@tally.ng / support1234",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
