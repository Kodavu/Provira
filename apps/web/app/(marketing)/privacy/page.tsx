import { LegalPage, CtaBand } from "@/components/marketing/page-shell";

export const metadata = {
  title: "Privacy Policy — Truvo",
  description: "How Truvo collects, uses, and protects your personal data, in line with Nigeria's Data Protection Regulation (NDPR).",
};

export default function PrivacyPage() {
  return (
    <>
      <LegalPage
        title="Privacy Policy"
        updated="3 August 2026"
        intro="Truvo Technologies (“Truvo”, “we”, “us”) is committed to protecting your privacy. This policy explains what we collect, why, and the choices you have. It is designed to align with the Nigeria Data Protection Regulation (NDPR)."
      >
        <p>
          This is a plain-language summary provided for transparency. It is not a substitute for legal advice, and the
          definitive terms of any engagement are the ones you accept when you create an account.
        </p>

        <h2>1. Information we collect</h2>
        <ul>
          <li><strong>Account details</strong> — your name, phone number, email, role (worker, employer, or trader), and password.</li>
          <li><strong>Identity verification</strong> — identifiers such as your NIN and bank account details, collected to verify you and to pay you. Sensitive identifiers are stored encrypted.</li>
          <li><strong>Work &amp; activity data</strong> — jobs, applications, attendance confirmations, sales you log, payouts, and the resulting Truvo Score.</li>
          <li><strong>Location</strong> — the state, LGA, and ward you set, used to match you to nearby jobs and workers.</li>
          <li><strong>Technical data</strong> — device, log, and usage information needed to run and secure the service.</li>
        </ul>

        <h2>2. How we use your information</h2>
        <ul>
          <li>To provide the service — matching, hiring, escrow, payouts, and the Truvo Score.</li>
          <li>To verify identity and prevent fraud, impersonation, and payout abuse.</li>
          <li>To calculate your score and, with your involvement, share verifiable records with lenders you choose to engage.</li>
          <li>To communicate with you about your account, jobs, and important updates.</li>
          <li>To meet legal, regulatory, and tax obligations.</li>
        </ul>

        <h2>3. Legal basis</h2>
        <p>
          We process your data on the basis of your consent, the performance of our contract with you, our legitimate
          interests in operating a safe marketplace, and compliance with applicable law.
        </p>

        <h2>4. Sharing your information</h2>
        <p>We do not sell your personal data. We share it only:</p>
        <ul>
          <li>With licensed partner banks and payment providers to hold escrow and process payouts.</li>
          <li>With the other party to a job (for example, an employer sees an applicant&apos;s relevant profile) to the extent necessary.</li>
          <li>With lenders <strong>only when you choose</strong> to use your score to seek credit.</li>
          <li>With service providers who process data on our behalf under strict confidentiality.</li>
          <li>Where required by law or to protect rights, safety, and the integrity of the platform.</li>
        </ul>

        <h2>5. Data retention</h2>
        <p>
          We keep your data for as long as your account is active and as long as needed to meet legal, accounting, and
          fraud-prevention obligations. You can ask us to delete data we are not required to keep.
        </p>

        <h2>6. Security</h2>
        <p>
          We use encryption in transit and at rest for sensitive identifiers, least-privilege access controls, and
          continuous monitoring. See our <a href="/security">Security page</a> for more.
        </p>

        <h2>7. Your rights</h2>
        <p>Under the NDPR you have the right to access, correct, delete, or restrict the processing of your data, to object to processing, and to data portability. To exercise these rights, contact us at <a href="mailto:privacy@truvo.com.ng">privacy@truvo.com.ng</a>.</p>

        <h2>8. Children</h2>
        <p>Truvo is not intended for anyone under 18, and we do not knowingly collect their data.</p>

        <h2>9. Changes to this policy</h2>
        <p>We may update this policy from time to time. Material changes will be communicated in the app or by email, and the &ldquo;last updated&rdquo; date above will change.</p>

        <h2>10. Contact us</h2>
        <p>
          Questions about privacy or your data? Email our team at <a href="mailto:privacy@truvo.com.ng">privacy@truvo.com.ng</a> or
          write to us in Lagos, Nigeria.
        </p>
      </LegalPage>
      <CtaBand />
    </>
  );
}
