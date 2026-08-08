// Branded HTML wrapper for outbound emails. The Provira mark leads the message so
// it's recognisable in the inbox. Email clients are hostile to SVG and external
// assets, so the logomark is drawn with a table-cell badge + a Unicode check and
// a gold accent rule — pure inline CSS that renders across Gmail, Outlook, and
// Apple Mail without a hosted image.

const BRAND = "#2e2cdb";
const BRAND_DARK = "#2725b0";
const GOLD = "#f5b301";
const INK = "#0f172a";
const SOFT = "#475569";
const LINE = "#e2e8f0";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Turn the plain-text body (already rendered from the template) into simple
// paragraphs, preserving blank-line breaks.
function paragraphs(body: string): string {
  return body
    .trim()
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${SOFT};">${escapeHtml(
          block,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
}

export function renderBrandedEmail(opts: { title?: string | null; body: string }): string {
  const heading = opts.title
    ? `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${INK};font-weight:700;">${escapeHtml(
        opts.title,
      )}</h1>`
    : "";

  return `<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8fafc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${LINE};border-radius:16px;overflow:hidden;">
        <!-- Header: logomark + wordmark -->
        <tr><td style="padding:24px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:36px;height:36px;background:${BRAND};background:linear-gradient(135deg,${BRAND},${BRAND_DARK});border-radius:9px;text-align:center;vertical-align:middle;color:#ffffff;font-size:20px;font-weight:700;font-family:Arial,Helvetica,sans-serif;line-height:36px;">&#10003;</td>
              <td style="padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.3px;color:${INK};">Provira</td>
            </tr>
          </table>
          <div style="height:3px;width:44px;background:${GOLD};border-radius:2px;margin-top:14px;"></div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:20px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
          ${heading}
          ${paragraphs(opts.body)}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:8px 28px 26px;font-family:Arial,Helvetica,sans-serif;">
          <div style="border-top:1px solid ${LINE};padding-top:16px;font-size:12px;line-height:1.5;color:#94a3b8;">
            Provira — economic identity for the informal economy.<br/>
            You're receiving this because you have a Provira account.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
