/**
 * Injects a CAN-SPAM compliant footer into HTML email content.
 * Adds physical postal address and unsubscribe link before </body>.
 */
export function injectComplianceFooter(
  html: string,
  postalAddress: string,
  unsubscribeUrl: string
): string {
  const escapedAddress = escapeHtml(postalAddress);
  const escapedUrl = escapeHtml(unsubscribeUrl);

  const footer = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #e4e4e7;">
  <tr><td style="padding:24px 40px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 8px;color:#a1a1aa;font-size:12px;">${escapedAddress}</p>
    <p style="margin:0;color:#a1a1aa;font-size:12px;">
      <a href="${escapedUrl}" style="color:#FDA085;text-decoration:underline;">Unsubscribe</a> from future emails.
    </p>
  </td></tr>
</table>`;

  // Insert before </body> if present, otherwise append
  const bodyCloseIndex = html.lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    return html.slice(0, bodyCloseIndex) + footer + html.slice(bodyCloseIndex);
  }

  return html + footer;
}

/**
 * Injects a CAN-SPAM compliant footer into plain text email content.
 */
export function injectComplianceFooterText(
  text: string,
  postalAddress: string,
  unsubscribeUrl: string
): string {
  return `${text}\n\n---\n${postalAddress}\nUnsubscribe: ${unsubscribeUrl}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
