"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  HardHat,
  Loader2,
  Phone,
  Store,
  User,
} from "lucide-react";
import { OtpInput } from "./otp-input";
import {
  completeOnboarding,
  isValidPhone,
  requestOtp,
  resolveSessionRoute,
  routeForRoles,
  verifyOtp,
  type UserType,
  type VerifiedUser,
} from "@/lib/auth";

type Step = "phone" | "otp" | "profile" | "type" | "success";
const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

const TYPES: { value: UserType; icon: typeof HardHat }[] = [
  { value: "worker", icon: HardHat },
  { value: "trader", icon: Store },
  { value: "employer", icon: Briefcase },
];

export function AuthFlow({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const t = useTranslations("Auth");

  // Map the API's terse auth errors to friendly, localized copy.
  function showError(e: unknown) {
    const m = (e as Error).message.replace(/^API \d+:\s*/, "");
    if (/expired/i.test(m)) return setError(t("errors.expired"));
    if (/invalid code/i.test(m)) return setError(t("errors.invalidCode"));
    if (/too many/i.test(m)) return setError(t("errors.tooMany"));
    if (/no pending/i.test(m)) return setError(t("errors.noPending"));
    setError(m || t("errors.generic"));
  }

  const [booting, setBooting] = useState(true); // checking for an existing session
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [type, setType] = useState<UserType | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verified, setVerified] = useState<VerifiedUser | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Prefill from the landing links (?type=worker, ?phone=+234…).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("type");
    if (t === "worker" || t === "trader" || t === "employer") setType(t);
    const p = q.get("phone");
    if (p) setPhone(p);
  }, []);

  // Fast-forward returning users who already have a session.
  useEffect(() => {
    let active = true;
    resolveSessionRoute().then((route) => {
      if (!active) return;
      if (route) router.replace(route);
      else setBooting(false);
    });
    return () => { active = false; };
  }, [router]);

  // Resend countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const goto = useCallback((s: Step) => { setError(null); setStep(s); }, []);

  async function sendCode() {
    if (!isValidPhone(phone)) { setError(t("errors.invalidPhone")); return; }
    setLoading(true); setError(null);
    try {
      const { devCode } = await requestOtp(phone);
      setDevCode(devCode);
      setCode("");
      setResendIn(RESEND_SECONDS);
      goto("otp");
    } catch (e) { showError(e); }
    finally { setLoading(false); }
  }

  async function submitCode(value?: string) {
    const c = value ?? code;
    if (c.length !== OTP_LENGTH) { setError(t("errors.fullCode")); return; }
    setLoading(true); setError(null);
    try {
      const v = await verifyOtp(phone, c);
      setVerified(v);
      if (v.isNew) {
        setFullName(v.fullName ?? "");
        goto("profile");
      } else {
        goto("success");
        redirectSoon(routeForRoles(v.roles));
      }
    } catch (e) { showError(e); }
    finally { setLoading(false); }
  }

  function submitProfile() {
    if (fullName.trim().length < 2) { setError(t("errors.enterName")); return; }
    goto("type");
  }

  async function submitType() {
    if (!type || !verified) return;
    setLoading(true); setError(null);
    try {
      const route = await completeOnboarding(verified.userId, fullName, type);
      goto("success");
      redirectSoon(route);
    } catch (e) { showError(e); }
    finally { setLoading(false); }
  }

  const redirectRef = useRef<string | null>(null);
  function redirectSoon(route: string) {
    redirectRef.current = route;
    setTimeout(() => router.push(route), reduce ? 300 : 1100);
  }

  async function resend() {
    if (resendIn > 0) return;
    await sendCode();
  }

  if (booting) return <BootSkeleton />;

  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
      };

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={enter.initial}
          animate={enter.animate}
          exit={enter.exit}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {step === "phone" && (
            <StepShell
              title={mode === "signup" ? t("createAccount") : t("welcomeBack")}
              subtitle={t("phonePrompt")}
            >
              <Field
                icon={Phone}
                label={t("phoneLabel")}
                value={phone}
                onChange={setPhone}
                onEnter={sendCode}
                placeholder="+234 801 234 5678"
                inputMode="tel"
                autoFocus
              />
              <PrimaryButton onClick={sendCode} loading={loading}>
                {t("sendCode")} <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
              <SwitchMode mode={mode} />
            </StepShell>
          )}

          {step === "otp" && (
            <StepShell
              title={t("enterCode")}
              subtitle={t("codeSentTo", { length: OTP_LENGTH, phone })}
              onBack={() => goto("phone")}
            >
              {devCode && (
                <div className="rounded-xl bg-gold-50 px-3.5 py-2.5 text-sm text-gold-700 ring-1 ring-gold-200">
                  {t("devMode")} <strong className="tabular-nums tracking-widest">{devCode}</strong>
                </div>
              )}
              <OtpInput
                value={code}
                onChange={(v) => { setCode(v); if (error) setError(null); }}
                length={OTP_LENGTH}
                error={!!error}
                disabled={loading}
                onComplete={(v) => submitCode(v)}
              />
              <PrimaryButton onClick={() => submitCode()} loading={loading}>
                {t("verifyContinue")}
              </PrimaryButton>
              <button
                type="button"
                onClick={resend}
                disabled={resendIn > 0 || loading}
                className="mx-auto block text-sm font-medium text-brand-600 transition enabled:hover:text-brand-700 disabled:text-ink-muted"
              >
                {resendIn > 0 ? t("resendIn", { seconds: resendIn }) : t("resend")}
              </button>
            </StepShell>
          )}

          {step === "profile" && (
            <StepShell
              title={t("nameTitle")}
              subtitle={t("nameSubtitle")}
              onBack={() => goto("otp")}
            >
              <Field
                icon={User}
                label={t("nameLabel")}
                value={fullName}
                onChange={setFullName}
                onEnter={submitProfile}
                placeholder={t("namePlaceholder")}
                autoFocus
              />
              <PrimaryButton onClick={submitProfile} loading={false}>
                {t("continue")} <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </StepShell>
          )}

          {step === "type" && (
            <StepShell
              title={t("useTitle")}
              subtitle={t("useSubtitle")}
              onBack={() => goto("profile")}
            >
              <div className="space-y-3">
                {TYPES.map((ty) => {
                  const active = type === ty.value;
                  return (
                    <button
                      key={ty.value}
                      type="button"
                      onClick={() => { setType(ty.value); setError(null); }}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition
                        ${active
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                          : "border-line bg-surface hover:border-brand-200 hover:bg-canvas"}`}
                    >
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition
                        ${active ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600"}`}>
                        <ty.icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{t(`types.${ty.value}.label`)}</span>
                        <span className="block text-sm text-ink-soft">{t(`types.${ty.value}.desc`)}</span>
                      </span>
                      <span className={`grid h-5 w-5 place-items-center rounded-full border transition
                        ${active ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>
                        {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <PrimaryButton onClick={submitType} loading={loading} disabled={!type}>
                {t("createAccountBtn")}
              </PrimaryButton>
            </StepShell>
          )}

          {step === "success" && <SuccessState reduce={!!reduce} name={fullName || verified?.fullName || null} />}
        </motion.div>
      </AnimatePresence>

      {step !== "success" && error && (
        <motion.p
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-4 rounded-xl bg-error/5 px-3.5 py-2.5 text-sm text-error ring-1 ring-error/15"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ---------- presentational pieces ----------

function StepShell({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  const t = useTranslations("Auth");
  return (
    <div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1.5 text-ink-soft">{subtitle}</p>}
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  autoFocus,
  onEnter,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "tel" | "text" | "numeric";
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted transition group-focus-within:text-brand-500" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
          placeholder={placeholder}
          inputMode={inputMode}
          autoFocus={autoFocus}
          className="w-full rounded-2xl border border-line bg-surface py-3 pl-11 pr-4 text-[15px] text-ink outline-none transition
            placeholder:text-ink-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
      </div>
    </label>
  );
}

function PrimaryButton({
  children,
  onClick,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      whileTap={{ scale: 0.985 }}
      className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition
        hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`flex items-center gap-2 transition-opacity ${loading ? "opacity-0" : "opacity-100"}`}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}
    </motion.button>
  );
}

function SwitchMode({ mode }: { mode: "login" | "signup" }) {
  const t = useTranslations("Auth");
  return mode === "signup" ? (
    <p className="text-center text-sm text-ink-soft">
      {t("alreadyHave")}{" "}
      <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">{t("signIn")}</Link>
    </p>
  ) : (
    <p className="text-center text-sm text-ink-soft">
      {t("newToTally")}{" "}
      <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">{t("createAccountLink")}</Link>
    </p>
  );
}

function SuccessState({ reduce, name }: { reduce: boolean; name: string | null }) {
  const t = useTranslations("Auth");
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <motion.div
        initial={reduce ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30"
      >
        <motion.span
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 15 }}
        >
          <Check className="h-9 w-9" strokeWidth={3} />
        </motion.span>
      </motion.div>
      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 text-2xl font-semibold text-ink"
      >
        {name ? t("welcomeName", { name: name.split(" ")[0] }) : t("youreIn")}
      </motion.h1>
      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-1.5 flex items-center gap-2 text-ink-soft"
      >
        <Loader2 className="h-4 w-4 animate-spin" /> {t("redirecting")}
      </motion.p>
    </div>
  );
}

function BootSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-2/3 rounded-lg bg-line" />
      <div className="mt-3 h-4 w-full rounded bg-line/70" />
      <div className="mt-8 h-14 w-full rounded-2xl bg-line/70" />
      <div className="mt-4 h-12 w-full rounded-2xl bg-line" />
    </div>
  );
}
