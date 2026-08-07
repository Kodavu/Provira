// Local seed data: skills, Lagos locations, the platform Lender + a starter
// loan product, and three demo users (no-smartphone worker, trader, employer
// with a funded job). Enough to exercise scoring, escrow, matching, and every
// channel locally. Idempotent-ish: clears core tables then re-inserts.

import { createHash, randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { computeScore, ScoreEventInput } from "@truvo/core";

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
  ["Disputes", "Respond", "disputes:respond"],
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
  ["Notifications", "Manage templates", "notifications:manage"],
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
    perms: ["users:view", "disputes:view", "disputes:assign", "disputes:respond", "reports:view", "impersonation:request", "notifications:manage"],
  },
  {
    name: "Customer Support",
    description: "Tickets and user lookups",
    perms: ["support:view_tickets", "support:reply", "support:assign", "disputes:view", "disputes:respond", "users:view"],
  },
  {
    name: "Compliance & Risk",
    description: "KYC and escalations",
    perms: ["verification:review", "verification:approve", "verification:reject", "disputes:view", "disputes:escalate", "users:view", "reports:view", "impersonation:approve"],
  },
  {
    name: "Moderators",
    description: "Resolve disputes, suspend users",
    perms: ["disputes:view", "disputes:assign", "disputes:respond", "disputes:resolve", "disputes:close", "users:view", "users:suspend"],
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
  // Informal-economy skill catalog. Keep in sync with the INSERTs in
  // supabase-setup.sql (and the paste-able SQL in docs).
  const skills: { slug: string; name: string }[] = [
    { slug: "cleaning", name: "Cleaning" },
    { slug: "loading", name: "Loading & offloading" },
    { slug: "driving", name: "Driving" },
    { slug: "dispatch", name: "Dispatch / delivery rider" },
    { slug: "bricklaying", name: "Bricklaying" },
    { slug: "masonry", name: "Masonry / concrete" },
    { slug: "carpentry", name: "Carpentry" },
    { slug: "painting", name: "Painting" },
    { slug: "plumbing", name: "Plumbing" },
    { slug: "electrical", name: "Electrical work" },
    { slug: "welding", name: "Welding / fabrication" },
    { slug: "tailoring", name: "Tailoring / fashion" },
    { slug: "hairdressing", name: "Hairdressing" },
    { slug: "barbing", name: "Barbing" },
    { slug: "makeup", name: "Makeup artistry" },
    { slug: "cooking", name: "Cooking / catering" },
    { slug: "waiter", name: "Waiter / server" },
    { slug: "bartending", name: "Bartending" },
    { slug: "security", name: "Security guard" },
    { slug: "farming", name: "Farming / agriculture" },
    { slug: "sales", name: "Sales / shop attendant" },
    { slug: "cashier", name: "Cashier / POS agent" },
    { slug: "laundry", name: "Laundry / dry cleaning" },
    { slug: "nanny", name: "Nanny / childcare" },
    { slug: "gardening", name: "Gardening / landscaping" },
    { slug: "mechanic", name: "Auto mechanic" },
    { slug: "generator-repair", name: "Generator repair" },
    { slug: "phone-repair", name: "Phone / gadget repair" },
    { slug: "event-usher", name: "Event usher" },
  ];
  await Promise.all(
    skills.map((sk) =>
      prisma.skill.upsert({
        where: { slug: sk.slug },
        create: { slug: sk.slug, name: sk.name },
        update: { name: sk.name },
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
    data: { name: "Truvo", isPlatform: true },
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

  // Give the worker a payout-wallet balance (as if past shifts settled), then
  // stage one pending withdrawal so the finance queue isn't empty.
  const workerWallet = await prisma.account.create({
    data: { type: "WORKER_PAYOUT", ownerId: worker.id, balance: 4500000n }, // NGN 45,000
  });
  const suspenseAcct = await prisma.account.create({ data: { type: "SUSPENSE" } });
  const holdTxn = await prisma.ledgerTransaction.create({
    data: {
      type: "WITHDRAWAL",
      status: "POSTED",
      reference: `withdraw-hold:${worker.id}:seed`,
      postedAt: new Date(),
      entries: {
        create: [
          { accountId: workerWallet.id, direction: "DEBIT", amount: 1500000n }, // NGN 15,000 held
          { accountId: suspenseAcct.id, direction: "CREDIT", amount: 1500000n },
        ],
      },
    },
  });
  await prisma.account.update({ where: { id: workerWallet.id }, data: { balance: 3000000n } }); // 45k - 15k held
  await prisma.account.update({ where: { id: suspenseAcct.id }, data: { balance: 1500000n } });
  await prisma.paymentIntent.create({
    data: {
      direction: "OUTBOUND",
      status: "CREATED",
      amount: 1500000n,
      provider: "mock",
      transactionId: holdTxn.id,
      metadata: { kind: "withdrawal", userId: worker.id },
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
      email: "superadmin@truvo.com.ng",
      fullName: "Ada Okoro",
      passwordHash: hashPassword("admin1234"),
      status: "ACTIVE",
      department: "Executive",
      roles: { create: { roleId: roleByName.get("Super Admin")! } },
    },
  });
  await prisma.adminUser.create({
    data: {
      email: "support@truvo.com.ng",
      fullName: "Tunde Bello",
      passwordHash: hashPassword("support1234"),
      status: "ACTIVE",
      department: "Customer Support",
      roles: { create: { roleId: roleByName.get("Customer Support")! } },
    },
  });
  await prisma.adminUser.create({
    data: {
      email: "hr@truvo.com.ng",
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
      email: "ops@truvo.com.ng",
      fullName: "Chidi Nwosu",
      passwordHash: hashPassword("ops1234"),
      status: "ACTIVE",
      department: "Operations",
      roles: { create: { roleId: roleByName.get("Operations Team")! } },
    },
  });
  await prisma.adminUser.create({
    data: {
      email: "compliance@truvo.com.ng",
      fullName: "Fatima Bello",
      passwordHash: hashPassword("compliance1234"),
      status: "ACTIVE",
      department: "Compliance",
      roles: { create: { roleId: roleByName.get("Compliance & Risk")! } },
    },
  });
  await prisma.adminUser.create({
    data: {
      email: "finance@truvo.com.ng",
      fullName: "Ifeoma Okafor",
      passwordHash: hashPassword("finance1234"),
      status: "ACTIVE",
      department: "Finance",
      roles: { create: { roleId: roleByName.get("Finance Team")! } },
    },
  });

  // A couple of disputes so the queue isn't empty. DSP-1001 carries a
  // user↔admin conversation, an internal note, and a piece of evidence so the
  // detail view's Conversation / Internal notes / Evidence sections are populated.
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
      messages: {
        create: [
          { authorType: "USER", body: "I finished the loading job but I never got paid.", isInternal: false },
          { authorType: "ADMIN", body: "Thanks for reporting — we're checking the escrow release now.", isInternal: false },
          { authorType: "ADMIN", body: "Escrow shows funded but not released. Chasing the employer.", isInternal: true },
        ],
      },
      evidence: {
        create: { label: "Shift confirmation SMS log", url: "https://example.com/evidence/dsp-1001-sms.pdf" },
      },
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

  // --- Notifications ---
  // Admin-editable templates (event × channel × language). The engine falls
  // back to code defaults when a row is missing, so we only seed a couple.
  const templates: Array<{
    eventKey: string;
    channel: "INAPP" | "SMS";
    language: "EN" | "PCM";
    subject?: string;
    body: string;
  }> = [
    { eventKey: "dispute.replied", channel: "INAPP", language: "EN", subject: "New reply on {code}", body: "Support replied on your case {code}: {preview}" },
    { eventKey: "dispute.replied", channel: "SMS", language: "EN", body: "Truvo: support replied on case {code}. Open the app to read and respond." },
    { eventKey: "dispute.replied", channel: "INAPP", language: "PCM", subject: "New reply for {code}", body: "Support don reply your case {code}: {preview}" },
    { eventKey: "dispute.replied", channel: "SMS", language: "PCM", body: "Truvo: support don reply your case {code}. Open app make you read am." },
    { eventKey: "payout.sent", channel: "INAPP", language: "EN", subject: "Payment sent", body: "{amount} has been sent to your account." },
    { eventKey: "payout.sent", channel: "SMS", language: "EN", body: "Truvo: {amount} has been sent to your account." },
  ];
  await Promise.all(
    templates.map((t) =>
      prisma.notificationTemplate.upsert({
        where: { eventKey_channel_language: { eventKey: t.eventKey, channel: t.channel, language: t.language } },
        create: t,
        update: { subject: t.subject ?? null, body: t.body },
      }),
    ),
  );

  // A couple of in-app feed rows for the worker so the bell isn't empty.
  await prisma.notification.createMany({
    data: [
      {
        userId: worker.id,
        category: "TRANSACTIONAL",
        eventKey: "payout.sent",
        channel: "INAPP",
        language: worker.language,
        title: "Payment sent",
        body: "NGN 8,000 has been sent to your account.",
        status: "SENT",
        sentAt: new Date(),
      },
      {
        userId: worker.id,
        category: "ACTIVITY",
        eventKey: "dispute.replied",
        channel: "INAPP",
        language: worker.language,
        title: "New reply on DSP-1001",
        body: "Support replied on your case DSP-1001: We're checking the escrow release now.",
        status: "SENT",
        sentAt: new Date(),
      },
    ],
  });

  // --- KYC / verification queue ---
  // A couple of pending requests so the review queue isn't empty. BVN is hashed.
  const bvnHash = (bvn: string) => createHash("sha256").update(bvn).digest("hex");
  await prisma.verificationRequest.create({
    data: {
      userId: worker.id,
      requestedLevel: "BVN_VERIFIED",
      bvnHash: bvnHash("22212345678"),
      documents: {
        create: [
          { type: "NIN", label: "National ID card", url: "https://example.com/kyc/amaka-nin.jpg" },
          { type: "SELFIE", label: "Selfie with ID", url: "https://example.com/kyc/amaka-selfie.jpg" },
        ],
      },
    },
  });
  await prisma.verificationRequest.create({
    data: {
      userId: trader.id,
      requestedLevel: "FULL",
      bvnHash: bvnHash("22287654321"),
      documents: {
        create: [
          { type: "DRIVERS_LICENSE", label: "Driver's licence", url: "https://example.com/kyc/musa-licence.jpg" },
          { type: "UTILITY_BILL", label: "Electricity bill", url: "https://example.com/kyc/musa-bill.pdf" },
        ],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete:", {
    worker: worker.phone,
    employer: employer.phone,
    admin: "superadmin@truvo.com.ng / admin1234",
    support: "support@truvo.com.ng / support1234",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
