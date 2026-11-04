import { billingProvider } from '@/lib/billing';
import { applyBillingEvent } from '@/lib/billing/apply-event';
import { accountsDisabledResponse } from '@/lib/features';
import { privateJson } from '@/lib/private-response';

export async function POST(request: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  try {
    const provider = billingProvider();
    const event = await provider.parseWebhook(request);
    if (!event) return privateJson({ error: 'Invalid signature.' }, 400);
    await applyBillingEvent(provider, event);
    return privateJson({ received: true });
  } catch {
    console.error('billing_webhook_failed');
    return privateJson({ error: 'Webhook processing failed.' }, 500);
  }
}
