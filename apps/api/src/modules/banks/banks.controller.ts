import { Controller, Get } from "@nestjs/common";

// Curated Nigerian bank list using SQUAD's institution codes (the codes Squad's
// account-lookup and transfer endpoints expect — NOT the raw NIP 3-digit codes).
// Commercial banks first, then the fintechs/PSBs people in the informal economy
// actually use. Extend as needed; a future version can proxy Squad's
// /payout/institutions endpoint instead of this static list.
const BANKS: { code: string; name: string }[] = [
  // Commercial / merchant banks
  { code: "000014", name: "Access Bank" },
  { code: "000010", name: "Ecobank" },
  { code: "000019", name: "Enterprise Bank" },
  { code: "000003", name: "FCMB" },
  { code: "000007", name: "Fidelity Bank" },
  { code: "000016", name: "First Bank of Nigeria" },
  { code: "000027", name: "Globus Bank" },
  { code: "000013", name: "GTBank" },
  { code: "000020", name: "Heritage Bank" },
  { code: "000006", name: "Jaiz Bank" },
  { code: "000002", name: "Keystone Bank" },
  { code: "000029", name: "Lotus Bank" },
  { code: "000036", name: "Optimus Bank" },
  { code: "000008", name: "Polaris Bank" },
  { code: "000031", name: "Premium Trust Bank" },
  { code: "000023", name: "Providus Bank" },
  { code: "000034", name: "Signature Bank" },
  { code: "000012", name: "Stanbic IBTC Bank" },
  { code: "000021", name: "Standard Chartered" },
  { code: "000001", name: "Sterling Bank" },
  { code: "000022", name: "Suntrust Bank" },
  { code: "000026", name: "Taj Bank" },
  { code: "000025", name: "Titan Trust Bank" },
  { code: "000018", name: "Union Bank" },
  { code: "000004", name: "United Bank for Africa (UBA)" },
  { code: "000011", name: "Unity Bank" },
  { code: "000017", name: "Wema Bank" },
  { code: "000015", name: "Zenith Bank" },
  // Fintechs, MFBs & PSBs
  { code: "100004", name: "OPay" },
  { code: "100033", name: "PalmPay" },
  { code: "090267", name: "Kuda Microfinance Bank" },
  { code: "090325", name: "Sparkle" },
  { code: "090110", name: "VFD Microfinance Bank" },
  { code: "090328", name: "Eyowo" },
  { code: "090551", name: "FairMoney Microfinance Bank" },
  { code: "100002", name: "Paga" },
  { code: "100022", name: "GoMoney" },
  { code: "090286", name: "Safe Haven Microfinance Bank" },
  { code: "090134", name: "Accion Microfinance Bank" },
  { code: "090177", name: "LAPO Microfinance Bank" },
  { code: "120001", name: "9 Payment Service Bank (9PSB)" },
  { code: "120002", name: "Hope PSB" },
  { code: "120003", name: "MoMo PSB" },
  { code: "120004", name: "SmartCash PSB" },
];

@Controller("banks")
export class BanksController {
  @Get()
  list() {
    return BANKS;
  }
}
