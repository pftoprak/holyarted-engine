import { runtimeEnv } from './runtime-config';

const REPEAT_AFTER_MS = 5 * 60_000;
const SEND_TIMEOUT_MS = 2_000;
const lastSent = new Map<string, number>();

// Logs a server failure and, when ERROR_REPORT_URL is set, posts it to that
// webhook (Slack and Discord both accept this body). Events are fixed names
// such as "billing_webhook_failed": never personal data or error details.
// The same event is sent at most once per five minutes per server instance,
// so an outage produces an alert, not a flood. Reporting never throws.
export async function reportError(event: string): Promise<void> {
  console.error(event);
  const url = runtimeEnv.ERROR_REPORT_URL?.trim();
  if (!url) return;
  const now = Date.now();
  if (now - (lastSent.get(event) ?? 0) < REPEAT_AFTER_MS) return;
  lastSent.set(event, now);
  const text = `[holyarted] ${event}`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, content: text, event, at: new Date(now).toISOString() }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch {
    console.error('error_report_failed');
  }
}
