import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ScoringService } from "../scoring/scoring.service.js";
import { meetsThreshold } from "@provira/core";
import { zTraderDashboard } from "@provira/contracts";

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
}
