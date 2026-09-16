/**
 * Escape user-supplied text before interpolating it into an HTML email body.
 *
 * Without this, a name or message containing markup is delivered as live HTML
 * in the notification email — a link or script tag chosen by whoever filled in
 * the public form.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
