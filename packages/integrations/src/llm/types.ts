// LLM/NLU adapter: understands free-text and voice notes across our five
// languages and resolves them to an intent + slots the channel router can act
// on. Behind this interface sits a mock (keyword rules) locally, or a real
// LLM provider in production.

export type Language = "EN" | "PCM" | "YO" | "HA" | "IG";

export type Intent =
  | "signup"
  | "find_jobs"
  | "accept_job"
  | "decline_job"
  | "confirm_attendance"
  | "check_score"
  | "check_balance"
  | "log_sale"
  | "apply_loan"
  | "unknown";

export interface UnderstandInput {
  text?: string;
  audioRef?: string; // voice note to transcribe first
  language?: Language; // hint; adapter may override via detection
}

export interface UnderstandResult {
  intent: Intent;
  language: Language;
  slots: Record<string, string>; // e.g. { code: "1234", jobId: "..." }
  transcript?: string; // when audio was transcribed
  confidence: number; // 0..1
}

export interface LlmProvider {
  readonly name: string;
  understand(input: UnderstandInput): Promise<UnderstandResult>;
  /** Localize an outbound message into the target language. */
  translate(text: string, target: Language): Promise<string>;
}
