import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Briefcase,
  CalendarClock,
  ClipboardList,
  Fingerprint,
  LineChart,
  MapPin,
  Package,
  Receipt,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  UserRoundCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// Single source of truth for the three audiences the platform serves equally.
// Accent classes are written as *literal* strings (no interpolation) so Tailwind's
// JIT keeps them — never build class names dynamically from the persona id.

export type PersonaId = "worker" | "employer" | "trader";

export interface Accent {
  /** gradient for headline emphasis + hero visuals */
  gradText: string;
  gradBg: string;
  /** eyebrow / small chip */
  chip: string;
  /** filled icon tile */
  iconBox: string;
  /** soft icon tile */
  softIcon: string;
  /** primary solid button */
  solid: string;
  /** progress / accent bar + dots */
  bar: string;
  dot: string;
  /** soft background wash + text */
  softBg: string;
  softText: string;
  /** active persona tab */
  tabActive: string;
  ring: string;
  border: string;
}

export interface Persona {
  id: PersonaId;
  label: string; // "Workers"
  singular: string; // "Worker"
  tagline: string;
  icon: LucideIcon;
  accent: Accent;
  hero: {
    lead: string;
    emphasis: string;
    sub: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
    chips: { icon: LucideIcon; label: string }[];
  };
  steps: { icon: LucideIcon; title: string; body: string }[];
  features: string[];
  faqs: { q: string; a: string }[];
}

const ACCENTS: Record<PersonaId, Accent> = {
  worker: {
    gradText: "from-brand-600 to-brand-400",
    gradBg: "from-brand-600 to-brand-700",
    chip: "border-brand-100 bg-brand-50/70 text-brand-700",
    iconBox: "bg-brand-600 text-white shadow-lg shadow-brand-600/25",
    softIcon: "bg-brand-50 text-brand-600",
    solid: "bg-brand-600 hover:bg-brand-700 shadow-brand-600/25",
    bar: "bg-brand-500",
    dot: "bg-brand-500",
    softBg: "bg-brand-50",
    softText: "text-brand-700",
    tabActive: "bg-brand-600 text-white shadow-sm shadow-brand-600/25",
    ring: "ring-brand-200",
    border: "hover:border-brand-200",
  },
  employer: {
    gradText: "from-emerald-600 to-emerald-400",
    gradBg: "from-emerald-600 to-emerald-700",
    chip: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
    iconBox: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25",
    softIcon: "bg-emerald-50 text-emerald-600",
    solid: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    softBg: "bg-emerald-50",
    softText: "text-emerald-700",
    tabActive: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25",
    ring: "ring-emerald-200",
    border: "hover:border-emerald-200",
  },
  trader: {
    gradText: "from-gold-600 to-gold-400",
    gradBg: "from-gold-500 to-gold-700",
    chip: "border-gold-100 bg-gold-50/70 text-gold-700",
    iconBox: "bg-gold-500 text-white shadow-lg shadow-gold-500/25",
    softIcon: "bg-gold-50 text-gold-700",
    solid: "bg-gold-500 hover:bg-gold-600 shadow-gold-500/25",
    bar: "bg-gold-500",
    dot: "bg-gold-500",
    softBg: "bg-gold-50",
    softText: "text-gold-700",
    tabActive: "bg-gold-500 text-white shadow-sm shadow-gold-500/25",
    ring: "ring-gold-200",
    border: "hover:border-gold-200",
  },
};

export const PERSONAS: Persona[] = [
  {
    id: "worker",
    label: "Workers",
    singular: "Worker",
    tagline: "Find work, get paid, grow",
    icon: Users,
    accent: ACCENTS.worker,
    hero: {
      lead: "Find real work.",
      emphasis: "Get paid the same day.",
      sub: "Discover verified jobs near you, confirm your shift with a code, and get paid straight to your bank — while every job builds a Tally Score that unlocks credit.",
      primary: { label: "Find work", href: "/signup?type=worker" },
      secondary: { label: "How it works", href: "/#how" },
      chips: [
        { icon: BadgeCheck, label: "Verified employers" },
        { icon: Wallet, label: "Same-day pay" },
        { icon: TrendingUp, label: "Build your score" },
      ],
    },
    steps: [
      { icon: Fingerprint, title: "Build your profile", body: "Sign up with a phone number, add your skills and location — no smartphone required." },
      { icon: Search, title: "Apply to nearby jobs", body: "See verified jobs matched to your skills and ward, and apply in a tap or over USSD." },
      { icon: Wallet, title: "Work & get paid", body: "Confirm attendance with the employer's code and get paid the same day, every time." },
    ],
    features: [
      "Verified, escrow-backed employers",
      "Professional profile with ratings & reviews",
      "Flexible shifts matched to your ward",
      "A Tally Score that opens real credit",
    ],
    faqs: [
      { q: "How fast do I get paid?", a: "Same day. The moment attendance is confirmed with the employer's 4-digit code, your escrowed pay lands in your Tally wallet and can be withdrawn to your bank." },
      { q: "Do I need a smartphone?", a: "No. You can sign up, apply, and confirm shifts over USSD (*347*82#) or WhatsApp. A smartphone unlocks the full app, but it's never required." },
      { q: "What is my Tally Score?", a: "A verifiable record built from completed jobs, on-time arrival, and repaid loans. A higher score unlocks better jobs and real, affordable credit." },
      { q: "Can I use Tally in my language?", a: "Yes — the app, USSD and WhatsApp work in English, Nigerian Pidgin, Yoruba, Hausa and Igbo. Pick your language once and it's saved for next time, across your devices." },
    ],
  },
  {
    id: "employer",
    label: "Employers",
    singular: "Employer",
    tagline: "Hire verified, pay on confirmation",
    icon: Briefcase,
    accent: ACCENTS.employer,
    hero: {
      lead: "Hire verified workers.",
      emphasis: "Pay only for confirmed work.",
      sub: "Post a job in minutes, invite people with real track records, and fund pay into escrow. Money is released only when attendance is confirmed — so you never pay for a no-show.",
      primary: { label: "Post a job", href: "/signup?type=employer" },
      secondary: { label: "See hiring flow", href: "/#how" },
      chips: [
        { icon: ShieldCheck, label: "NIN-verified talent" },
        { icon: BadgeCheck, label: "Pay on confirmation" },
        { icon: BarChart3, label: "Hiring analytics" },
      ],
    },
    steps: [
      { icon: ClipboardList, title: "Post & fund a job", body: "Set the role, headcount, pay, location and shift, then fund the total into secure escrow up front." },
      { icon: UserRoundCheck, title: "Invite & manage", body: "Review suggested verified workers, invite the best, and manage applicants from one dashboard." },
      { icon: BadgeCheck, title: "Confirm & pay", body: "Share the attendance code on site; escrow releases automatically only for confirmed work." },
    ],
    features: [
      "Verified, rated workers on tap",
      "Post jobs and manage applicants in minutes",
      "Escrow so you never pay for a no-show",
      "Performance analytics & team management",
    ],
    faqs: [
      { q: "How does escrow protect me?", a: "When you fund a job the pay is held in a dedicated escrow account — not sent yet. It's released only when the worker confirms attendance with your code, so you never pay for a no-show." },
      { q: "How do I find good workers?", a: "Tally suggests NIN-verified workers with real track records and ratings, matched to your job and location. You invite the ones you want; they confirm." },
      { q: "What does it cost to hire?", a: "A small, transparent fee per completed hire — shown before you confirm, with no monthly minimums." },
      { q: "Can I post jobs in a local language?", a: "Yes. Post in the language you prefer; the hiring interface works in English, Pidgin, Yoruba, Hausa and Igbo, and one-tap translation of posts for workers is on our roadmap." },
    ],
  },
  {
    id: "trader",
    label: "Traders",
    singular: "Trader",
    tagline: "Run and grow your business",
    icon: Store,
    accent: ACCENTS.trader,
    hero: {
      lead: "Run your business.",
      emphasis: "Turn every sale into credit.",
      sub: "Log your sales to build a verifiable record that unlocks stock loans today — and get ready for an all-in-one business toolkit: POS, inventory, payments and analytics, coming soon.",
      primary: { label: "Grow your business", href: "/signup?type=trader" },
      secondary: { label: "Explore the POS", href: "/#pos" },
      chips: [
        { icon: Receipt, label: "Log sales" },
        { icon: Banknote, label: "Unlock stock loans" },
        { icon: Package, label: "POS coming soon" },
      ],
    },
    steps: [
      { icon: Receipt, title: "Log your sales", body: "Record sales in seconds — each one becomes part of a verifiable business track record." },
      { icon: LineChart, title: "Build your history", body: "Consistent sales grow your Tally Score and prove your business to banks and lenders." },
      { icon: Banknote, title: "Unlock capital", body: "Qualify for stock advances and working capital sized to your real, verifiable sales." },
    ],
    features: [
      "Log sales & build a business record",
      "Unlock stock loans from real history",
      "Full POS & inventory toolkit (coming soon)",
      "Digital wallet & business payments (roadmap)",
    ],
    faqs: [
      { q: "Why should I log every sale?", a: "Each logged sale becomes part of a verifiable record — and that record is what qualifies you for stock loans. The more consistent your sales, the more capital you can access." },
      { q: "Is the POS available now?", a: "The full POS, inventory, and business toolkit are on our roadmap and clearly marked Coming Soon. You can start building your sales record today so you're ready on day one." },
      { q: "How do stock loans work?", a: "Once your sales history qualifies you, you can access a stock advance sized to your record, repaid as you sell. On-time repayment grows your score for larger limits." },
      { q: "Will the POS support local languages?", a: "Yes — the coming POS, receipts and product listings are being built multilingual from day one, in English, Pidgin, Yoruba, Hausa and Igbo." },
    ],
  },
];

export const PERSONA_MAP: Record<PersonaId, Persona> = {
  worker: PERSONAS[0],
  employer: PERSONAS[1],
  trader: PERSONAS[2],
};

// Icons re-exported for consumers that render persona chips/steps.
export { MapPin, CalendarClock };
