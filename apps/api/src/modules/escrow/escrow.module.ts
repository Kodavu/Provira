import { Global, Module } from "@nestjs/common";
import { EscrowService } from "./escrow.service.js";
import { LedgerService } from "./ledger.service.js";

// Global so escrow, payments, and lending share one ledger implementation.
@Global()
@Module({
  providers: [EscrowService, LedgerService],
  exports: [EscrowService, LedgerService],
})
export class EscrowModule {}
