import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ScoringService } from "../scoring/scoring.service.js";
import { meetsThreshold } from "@provira/core";
import { zTraderDashboard, zTraderReports } from "@provira/contracts";

/**
 * Traders log card/cash sales at their stall. Each logged sale is a scoring
 * signal (SALE_LOGGED) that builds the reliability record, which — once a track
 * record exists — unlocks stock loans.
 */
@Injectable()
export class TradersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  private async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { traderProfile: true, scoreProfile: true },
    });
    if (!user?.traderProfile)
      throw new NotFoundException("Trader profile not found");
    return user;
  }

  async logSale(userId: string, amount: bigint, method = "card") {
    if (amount <= 0n) throw new BadRequestException("Amount must be positive");
    const user = await this.profile(userId);
    const sale = await this.prisma.saleRecord.create({
      data: { traderId: user.traderProfile!.id, amount, method },
    });
    await this.scoring.recordEvent({
      userId,
      type: "SALE_LOGGED",
      refType: "sale",
      refId: sale.id,
    });
    return sale;
  }

  async dashboard(userId: string) {
    const user = await this.profile(userId);
    const traderId = user.traderProfile!.id;

    const sales = await this.prisma.saleRecord.findMany({
      where: { traderId },
      orderBy: { occurredAt: "desc" },
      take: 50,
    });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const total = sales.reduce((s, r) => s + r.amount, 0n);
    const weekTotal = sales
      .filter((r) => r.occurredAt >= weekAgo)
      .reduce((s, r) => s + r.amount, 0n);

    const score = user.scoreProfile?.score ?? 0;
    const tier = user.scoreProfile?.tier ?? "BUILDING";
    const products = await this.prisma.loanProduct.findMany({
      where: { isActive: true },
    });

    return zTraderDashboard.parse({
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        businessName: user.traderProfile!.businessName,
        marketName: user.traderProfile!.marketName,
      },
      score: {
        value: score,
        tier,
        salesCount: user.scoreProfile?.salesCount ?? sales.length,
      },
      totals: {
        allTime: total.toString(),
        thisWeek: weekTotal.toString(),
        count: sales.length,
      },
      sales: sales.map((s) => ({
        id: s.id,
        amount: s.amount.toString(),
        method: s.method,
        occurredAt: s.occurredAt,
      })),
      loanOffers: products.map((p) => ({
        productId: p.id,
        name: p.name,
        maxAmount: p.maxAmount.toString(),
        minScore: p.minScore,
        minTier: p.minTier,
        eligible: meetsThreshold({ score, tier }, p.minScore, p.minTier),
      })),
    });
  }

  /**
   * Trading record for the trader over the last `days` days: a daily sales
   * series, all-time + in-range totals, distinct active days, months trading,
   * and a payment-method split. Powers the reports page and the downloadable
   * proof-of-trade record.
   */
  async reports(userId: string, days = 90) {
    const user = await this.profile(userId);
    const traderId = user.traderProfile!.id;
    const range = Math.min(365, Math.max(7, days));
    const since = new Date(Date.now() - range * 86_400_000);

    const sales = await this.prisma.saleRecord.findMany({
      where: { traderId },
      orderBy: { occurredAt: "asc" },
    });

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const byDay = new Map<string, bigint>();
    for (let i = range - 1; i >= 0; i--)
      byDay.set(dayKey(new Date(Date.now() - i * 86_400_000)), 0n);

    let allTime = 0n;
    let inRange = 0n;
    const activeDays = new Set<string>();
    const months = new Set<string>();
    const methodAgg = new Map<string, { amount: bigint; count: number }>();

    for (const s of sales) {
      allTime += s.amount;
      months.add(s.occurredAt.toISOString().slice(0, 7));
      if (s.occurredAt >= since) {
        inRange += s.amount;
        const k = dayKey(s.occurredAt);
        if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0n) + s.amount);
        activeDays.add(k);
        const m = methodAgg.get(s.method) ?? { amount: 0n, count: 0 };
        m.amount += s.amount;
        m.count += 1;
        methodAgg.set(s.method, m);
      }
    }

    const avg = sales.length ? allTime / BigInt(sales.length) : 0n;

    return zTraderReports.parse({
      rangeDays: range,
      memberSince: user.createdAt,
      firstSaleAt: sales[0]?.occurredAt ?? null,
      score: {
        value: user.scoreProfile?.score ?? 0,
        tier: user.scoreProfile?.tier ?? "BUILDING",
      },
      totals: {
        allTime: allTime.toString(),
        inRange: inRange.toString(),
        salesCount: sales.length,
        avgSale: avg.toString(),
        activeDays: activeDays.size,
        monthsActive: months.size,
      },
      series: [...byDay.entries()].map(([date, amount]) => ({ date, amount: amount.toString() })),
      byMethod: [...methodAgg.entries()]
        .map(([method, v]) => ({ method, amount: v.amount.toString(), count: v.count }))
        .sort((a, b) => b.count - a.count),
    });
  }
}
