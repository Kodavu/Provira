import { LegalPage, CtaBand } from "@/components/marketing/page-shell";

export const metadata = {
  title: "Cookie Policy — Truvo",
  description: "How and why Truvo uses cookies and similar technologies, and how you can control them.",
};

export default function CookiesPage() {
  return (
    <>
      <LegalPage
        title="Cookie Policy"
        updated="3 August 2026"
        intro="This policy explains how Truvo uses cookies and similar technologies, what they do, and the choices you have."
      >
        <h2>1. What cookies are</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help sites work, remember your
          preferences, and understand how they&apos;re used. We also use similar technologies such as local storage.
        </p>

        <h2>2. How we use them</h2>
        <ul>
          <li><strong>Strictly necessary</strong> — sign-in, security, and keeping the service working. These can&apos;t be switched off.</li>
          <li><strong>Preferences</strong> — remembering choices such as your language.</li>
          <li><strong>Analytics</strong> — understanding, in aggregate, how the service is used so we can improve it.</li>
        </ul>

        <h2>3. Types of cookies we set</h2>
        <ul>
          <li><strong>Session cookies</strong> — expire when you close your browser; used to keep you signed in securely.</li>
          <li><strong>Persistent cookies</strong> — remain until they expire or you delete them; used for preferences.</li>
          <li><strong>First-party</strong> — set by Truvo. We keep third-party cookies to a minimum.</li>
        </ul>

        <h2>4. Managing cookies</h2>
        <p>
          Most browsers let you refuse or delete cookies through their settings. Blocking strictly necessary cookies may
          stop parts of Truvo from working, including signing in. Where required, we&apos;ll ask for your consent to
          non-essential cookies and let you change your mind.
        </p>

        <h2>5. Changes</h2>
        <p>We may update this policy as our use of cookies changes. The &ldquo;last updated&rdquo; date above reflects the latest version.</p>

        <h2>6. Contact</h2>
        <p>Questions about cookies? Email <a href="mailto:privacy@truvo.com.ng">privacy@truvo.com.ng</a>. See also our <a href="/privacy">Privacy Policy</a>.</p>
      </LegalPage>
      <CtaBand />
    </>
  );
}
