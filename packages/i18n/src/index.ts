// Message catalogs for all channels. Keys are language-agnostic; the channel
// layer resolves them to the user's language. Placeholders use {name} syntax.
// Translations here are seed-quality and should be reviewed by native speakers.

export type Language = "EN" | "PCM" | "YO" | "HA" | "IG";

export type MessageKey =
  | "otp.code"
  | "welcome"
  | "job.offer"
  | "job.accepted"
  | "attendance.prompt"
  | "attendance.confirmed"
  | "payout.sent"
  | "score.summary"
  | "loan.eligible"
  | "unknown.command";

type Catalog = Record<MessageKey, string>;

const EN: Catalog = {
  "otp.code": "Your Truvo code is {code}. It expires in 5 minutes.",
  welcome: "Welcome to Truvo, {name}! Reply with JOBS to find work near you.",
  "job.offer": "New job: {title} pays {pay} at {location}. Reply YES to accept.",
  "job.accepted": "You accepted {title}. Show up and share code {code} to confirm.",
  "attendance.prompt": "Reply with the 4-digit code from the employer to confirm attendance.",
  "attendance.confirmed": "Attendance confirmed. Your payment is on the way.",
  "payout.sent": "{amount} has been sent to your account.",
  "score.summary": "Your reliability score is {score} ({tier}).",
  "loan.eligible": "You qualify for a loan up to {amount}. Reply LOAN to apply.",
  "unknown.command": "Sorry, I didn't understand. Reply HELP for options.",
};

// Seed translations. Pidgin is fairly complete; YO/HA/IG cover core prompts and
// otherwise fall back to English via the resolver.
const PCM: Partial<Catalog> = {
  "otp.code": "Your Truvo code na {code}. E go expire for 5 minutes.",
  welcome: "Welcome to Truvo, {name}! Reply JOBS make you find work wey dey near you.",
  "job.offer": "New work: {title} go pay {pay} for {location}. Reply YES to collect am.",
  "job.accepted": "You don collect {title}. Show face, share code {code} make dem confirm.",
  "attendance.prompt": "Reply with the 4-number code wey employer give you make we confirm say you show.",
  "attendance.confirmed": "We don confirm say you show. Your money dey come.",
  "payout.sent": "We don send {amount} enter your account.",
  "score.summary": "Your reliability score na {score} ({tier}).",
  "loan.eligible": "You fit collect loan reach {amount}. Reply LOAN to apply.",
  "unknown.command": "Abeg I no understand. Reply HELP make you see options.",
};

const YO: Partial<Catalog> = {
  "otp.code": "Koodu Truvo re ni {code}. Yoo pari ni iseju marun.",
  welcome: "Kaabo si Truvo, {name}! Fi JOBS ranse lati wa ise nitosi re.",
  "attendance.confirmed": "A ti jerisi wiwa re. Owo re n bo.",
  "score.summary": "Iwon igbekele re ni {score} ({tier}).",
};

const HA: Partial<Catalog> = {
  "otp.code": "Lambar Truvo ce {code}. Za ta kare cikin minti biyar.",
  welcome: "Barka da zuwa Truvo, {name}! Aika JOBS domin nemo aiki kusa da kai.",
  "attendance.confirmed": "An tabbatar da kasancewarka. Kudin ka na zuwa.",
  "score.summary": "Makin amincin ka shine {score} ({tier}).",
};

const IG: Partial<Catalog> = {
  "otp.code": "Koodu Truvo gi bu {code}. O ga-agwu na nkeji ise.",
  welcome: "Nnoo na Truvo, {name}! Zipu JOBS iji choo oru di gi nso.",
  "attendance.confirmed": "Emeela ka odida gi. Ego gi na-abia.",
  "score.summary": "Akara ntukwasi obi gi bu {score} ({tier}).",
};

const CATALOGS: Record<Language, Partial<Catalog>> = {
  EN,
  PCM,
  YO,
  HA,
  IG,
};

/** Resolve a message key + language + params into a final string. */
export function t(
  key: MessageKey,
  language: Language = "EN",
  params: Record<string, string | number> = {},
): string {
  const template = CATALOGS[language]?.[key] ?? EN[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] != null ? String(params[name]) : `{${name}}`,
  );
}

export const SUPPORTED_LANGUAGES: Language[] = ["EN", "PCM", "YO", "HA", "IG"];
