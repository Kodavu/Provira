import {
  Intent,
  Language,
  LlmProvider,
  UnderstandInput,
  UnderstandResult,
} from "./types.js";

// Deterministic keyword-based NLU so multi-channel flows are testable offline.
// Recognizes intent phrases across English/Pidgin and a few Yoruba/Hausa/Igbo
// keywords. A real LLM adapter replaces this without touching callers.
const KEYWORDS: Array<{ intent: Intent; words: string[] }> = [
  { intent: "signup", words: ["register", "sign up", "join", "start"] },
  { intent: "find_jobs", words: ["job", "work", "ise", "aiki", "oru"] },
  { intent: "accept_job", words: ["accept", "yes", "i go do", "gba"] },
  { intent: "decline_job", words: ["decline", "no", "reject"] },
  { intent: "confirm_attendance", words: ["confirm", "present", "attend", "code"] },
  { intent: "check_score", words: ["score", "rating", "reliability"] },
  { intent: "check_balance", words: ["balance", "money", "wallet", "owo"] },
  { intent: "log_sale", words: ["sold", "sale", "sell"] },
  { intent: "apply_loan", words: ["loan", "borrow", "credit"] },
];

function detectLanguage(text: string): Language {
  const t = text.toLowerCase();
  if (/(ise|owo|gba|oru)/.test(t)) return "YO";
  if (/(aiki|kudi)/.test(t)) return "HA";
  if (/(oru|ego)/.test(t)) return "IG";
  if (/(abeg|wetin|i go|dey)/.test(t)) return "PCM";
  return "EN";
}

export class MockLlmProvider implements LlmProvider {
  readonly name = "mock";

  async understand(input: UnderstandInput): Promise<UnderstandResult> {
    const text = (input.text ?? "").toLowerCase();
    const language = input.language ?? detectLanguage(text);

    let intent: Intent = "unknown";
    for (const { intent: i, words } of KEYWORDS) {
      if (words.some((w) => text.includes(w))) {
        intent = i;
        break;
      }
    }

    const slots: Record<string, string> = {};
    const code = text.match(/\b(\d{4})\b/);
    if (code) slots.code = code[1];

    return {
      intent,
      language,
      slots,
      transcript: input.audioRef ? "[mock transcript of voice note]" : undefined,
      confidence: intent === "unknown" ? 0.2 : 0.85,
    };
  }

  async translate(text: string, target: Language): Promise<string> {
    // Mock: tag the message with the target language.
    return `[${target}] ${text}`;
  }
}
