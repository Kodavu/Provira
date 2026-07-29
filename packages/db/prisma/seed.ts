// Local seed data: skills, Lagos locations, the platform Lender + a starter
// loan product, and three demo users (no-smartphone worker, trader, employer
// with a funded job). Enough to exercise scoring, escrow, matching, and every
// channel locally. Idempotent-ish: clears core tables then re-inserts.

import { PrismaClient } from "@prisma/client";
import { computeScore, ScoreEventInput } from "@tally/core";

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

  // eslint-disable-next-line no-console
  console.log("Seed complete:", { worker: worker.phone, trader: trader.phone, employer: employer.phone, job: job.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
