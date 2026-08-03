import { LegalPage, CtaBand } from "@/components/marketing/page-shell";

export const metadata = {
  title: "Terms of Service — Tally",
  description: "The terms that govern your use of Tally — accounts, jobs, escrow, payments, the Tally Score, and your responsibilities.",
};

export default function TermsPage() {
  return (
    <>
      <LegalPage
        title="Terms of Service"
        updated="3 August 2026"
        intro="These terms govern your access to and use of Tally. By creating an account or using the service, you agree to them. Please read them carefully."
      >
        <p>
          This is a plain-language summary provided for transparency. It is not legal advice. Specific agreements you accept
          in-app (for example, when funding a job) may add further terms.
        </p>

        <h2>1. Who we are</h2>
        <p>Tally is an economic-identity platform operated by Tally Technologies, based in Lagos, Nigeria. We connect workers, employers, and traders, hold job funds in escrow, facilitate payouts, and maintain the Tally Score.</p>

        <h2>2. Eligibility &amp; accounts</h2>
        <ul>
          <li>You must be at least 18 and able to form a binding contract.</li>
          <li>You must provide accurate information and keep your account secure. You are responsible for activity under your account.</li>
          <li>Identity verification may be required before you can post jobs, get paid, or access certain features.</li>
        </ul>

        <h2>3. Jobs, hiring &amp; escrow</h2>
        <ul>
          <li><strong>Employers</strong> post jobs and fund the agreed amount into escrow up front. Funds are released to workers only when attendance is confirmed with the employer&apos;s code.</li>
          <li><strong>Workers</strong> apply to or accept invitations for jobs and agree to perform them as described.</li>
          <li>Tally is a marketplace and is not the employer of workers. The working relationship is between employer and worker.</li>
          <li>Once a job is full, further applications and invitations are closed for that job.</li>
        </ul>

        <h2>4. Payments &amp; fees</h2>
        <ul>
          <li>Payouts are processed through licensed payment providers to the bank account you supply.</li>
          <li>Signing up, getting paid, and building your score are free for workers and traders. Employers pay a transparent fee per completed hire, shown before you confirm.</li>
          <li>You are responsible for any taxes arising from your use of the service.</li>
        </ul>

        <h2>5. The Tally Score</h2>
        <p>
          Your score reflects your activity — completed jobs, on-time arrival, logged sales, and repaid loans, less no-shows
          and disputes. We aim for accuracy but do not guarantee that any score will result in credit, which is decided by
          third-party lenders on their own terms.
        </p>

        <h2>6. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Provide false information, impersonate others, or manipulate your score or attendance.</li>
          <li>Use Tally for unlawful, fraudulent, or harmful purposes.</li>
          <li>Interfere with, disrupt, or attempt to gain unauthorised access to the service.</li>
          <li>Harass, discriminate against, or endanger other users.</li>
        </ul>

        <h2>7. Disputes</h2>
        <p>Disputes over attendance or pay are reviewed fairly, considering evidence from both sides, typically within our stated service window. We may hold escrowed funds until a dispute is resolved.</p>

        <h2>8. Suspension &amp; termination</h2>
        <p>We may suspend or close accounts that breach these terms or that we reasonably believe pose a risk to users or the platform. You may close your account at any time, subject to settling any open jobs.</p>

        <h2>9. Disclaimers &amp; liability</h2>
        <p>The service is provided &ldquo;as is&rdquo;. To the fullest extent permitted by law, Tally is not liable for indirect or consequential losses, and our total liability is limited as set out in the in-app agreements. Nothing limits liability that cannot be limited by law.</p>

        <h2>10. Governing law</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

        <h2>11. Changes</h2>
        <p>We may update these terms; material changes will be notified in the app or by email. Continued use after changes means you accept them.</p>

        <h2>12. Contact</h2>
        <p>Questions about these terms? Email <a href="mailto:legal@tally.ng">legal@tally.ng</a>.</p>
      </LegalPage>
      <CtaBand />
    </>
  );
}
