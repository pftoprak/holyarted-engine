import { runtimeEnv } from '../runtime-config';
import type { BillingEvent, BillingProvider, PaidPlan, ProviderSubscription } from './provider';

// iyzico subscriptions (v2 API). Signing, subscription lookup, cancellation
// and webhook verification are implemented from the official documentation
// and the iyzipay-node SDK; they have not run against the iyzico sandbox yet.
// The checkout page (iyzico returns an embeddable form, not a URL, and needs
// the buyer's phone, identity number and billing address) is not built yet,
// so configured() stays false and purchases stay hidden. See HANDOFF.md.
const CHECKOUT_PAGE_BUILT = false;
const SANDBOX_BASE_URL = 'https://sandbox-api.iyzipay.com';
const REQUEST_TIMEOUT_MS = 10_000;

export class IyzicoRequestError extends Error {
  constructor(readonly status: number, readonly code: string | undefined, message: string) {
    super(message);
  }
}

type IyzicoResponse = { status?: string; errorCode?: string; errorMessage?: string };
type IyzicoSubscription = {
  referenceCode?: unknown;
  customerReferenceCode?: unknown;
  pricingPlanReferenceCode?: unknown;
  subscriptionStatus?: unknown;
  endDate?: unknown;
  orders?: { endPeriod?: unknown; orderStatus?: unknown }[];
};
type IyzicoWebhook = {
  orderReferenceCode?: unknown;
  customerReferenceCode?: unknown;
  subscriptionReferenceCode?: unknown;
  iyziEventType?: unknown;
  iyziEventTime?: unknown;
};

function textValue(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

// IYZWSv2: HMAC-SHA256 (hex) over randomKey + path + body, keyed with the
// secret key; then base64("apiKey:…&randomKey:…&signature:…"). The path is
// the request path including "/v2", without the query string (iyzipay-node).
export async function iyzicoAuthorization(apiKey: string, secretKey: string, randomKey: string, path: string, body?: string): Promise<string> {
  const signature = await hmacSha256Hex(secretKey, randomKey + path + (body ?? ''));
  return `IYZWSv2 ${btoa(`apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`)}`;
}

// X-IYZ-SIGNATURE-V3 for subscription notifications: HMAC-SHA256 (hex),
// keyed with the secret key, over merchantId + secretKey + eventType +
// subscriptionReferenceCode + orderReferenceCode + customerReferenceCode.
export function iyzicoWebhookSignature(secretKey: string, merchantId: string, payload: IyzicoWebhook): Promise<string> {
  const message = [merchantId, secretKey, payload.iyziEventType, payload.subscriptionReferenceCode, payload.orderReferenceCode, payload.customerReferenceCode]
    .map((part) => textValue(part) ?? '')
    .join('');
  return hmacSha256Hex(secretKey, message);
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function setting(key: 'IYZICO_API_KEY' | 'IYZICO_SECRET_KEY' | 'IYZICO_MERCHANT_ID'): string {
  const value = runtimeEnv[key]?.trim();
  if (!value) throw new Error(`Missing runtime configuration: ${key}`);
  return value;
}

async function iyzicoRequest<T>(method: 'GET' | 'POST', path: string, body?: Record<string, unknown>): Promise<T & IyzicoResponse> {
  const base = (runtimeEnv.IYZICO_BASE_URL?.trim() || SANDBOX_BASE_URL).replace(/\/$/, '');
  const json = body ? JSON.stringify(body) : undefined;
  const randomKey = `${Date.now()}${crypto.randomUUID().replaceAll('-', '').slice(0, 9)}`;
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      authorization: await iyzicoAuthorization(setting('IYZICO_API_KEY'), setting('IYZICO_SECRET_KEY'), randomKey, path, json),
      'x-iyzi-rnd': randomKey,
      'content-type': 'application/json',
    },
    ...(json ? { body: json } : {}),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = (await response.json()) as T & IyzicoResponse;
  if (!response.ok || payload.status !== 'success') {
    throw new IyzicoRequestError(response.status, payload.errorCode, payload.errorMessage || 'iyzico request failed.');
  }
  return payload;
}

// The plan a pricing plan sells. Unknown plans grant nothing.
function planForPricingPlan(code: string | null): PaidPlan | null {
  if (!code) return null;
  if (code === runtimeEnv.IYZICO_PLUS_PLAN_CODE?.trim()) return 'plus';
  if (code === runtimeEnv.IYZICO_PREMIUM_PLAN_CODE?.trim()) return 'premium';
  return null;
}

// iyzico statuses mapped to the ones membership rules understand:
// active, past_due (payment failed, still in grace) and the rest closed.
const STATUS: Record<string, string> = {
  ACTIVE: 'active',
  UNPAID: 'past_due',
  PENDING: 'incomplete',
  UPGRADED: 'canceled',
  CANCELED: 'canceled',
  EXPIRED: 'canceled',
};

function normalize(subscription: IyzicoSubscription): ProviderSubscription {
  const paidPeriods = (subscription.orders ?? [])
    .filter((order) => order.orderStatus === 'SUCCESS' && typeof order.endPeriod === 'number')
    .map((order) => order.endPeriod as number);
  const periodEndMs = paidPeriods.length ? Math.max(...paidPeriods) : typeof subscription.endDate === 'number' ? subscription.endDate : null;
  return {
    id: textValue(subscription.referenceCode),
    customerId: textValue(subscription.customerReferenceCode),
    status: STATUS[String(subscription.subscriptionStatus)] ?? 'incomplete',
    plan: planForPricingPlan(textValue(subscription.pricingPlanReferenceCode)),
    periodEnd: periodEndMs === null ? null : Math.floor(periodEndMs / 1000),
  };
}

async function getSubscription(subscriptionId: string): Promise<ProviderSubscription> {
  const payload = await iyzicoRequest<{ data?: { items?: IyzicoSubscription[] } }>('GET', `/v2/subscription/subscriptions/${encodeURIComponent(subscriptionId)}`);
  const item = payload.data?.items?.[0];
  if (!item) throw new IyzicoRequestError(404, undefined, 'Subscription not found.');
  return normalize(item);
}

export const iyzicoProvider: BillingProvider = {
  name: 'iyzico',

  configured() {
    const { IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_MERCHANT_ID, IYZICO_PLUS_PLAN_CODE, IYZICO_PREMIUM_PLAN_CODE } = runtimeEnv;
    const keys = [IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_MERCHANT_ID, IYZICO_PLUS_PLAN_CODE, IYZICO_PREMIUM_PLAN_CODE].every((value) => Boolean(value?.trim()));
    return CHECKOUT_PAGE_BUILT && keys;
  },

  createCheckout() {
    return Promise.reject(new Error('The iyzico checkout page is not built yet.'));
  },

  // iyzico has no hosted billing portal: cancellation happens on the site.
  createPortal() {
    return Promise.reject(new Error('iyzico has no billing portal.'));
  },

  getSubscription,

  async cancelSubscription(subscriptionId) {
    try {
      await iyzicoRequest('POST', `/v2/subscription/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`);
    } catch (error) {
      // The error codes for "already canceled" are not documented: confirm
      // the state instead. A subscription that no longer charges is done.
      const current = await getSubscription(subscriptionId).catch(() => null);
      if (current?.status !== 'canceled') throw error;
    }
  },

  async parseWebhook(request): Promise<BillingEvent | null> {
    const body = await request.text();
    let payload: IyzicoWebhook;
    try {
      payload = JSON.parse(body) as IyzicoWebhook;
    } catch {
      return null;
    }
    const given = request.headers.get('x-iyz-signature-v3') ?? '';
    const expected = await iyzicoWebhookSignature(setting('IYZICO_SECRET_KEY'), setting('IYZICO_MERCHANT_ID'), payload);
    if (!given || !safeEqual(given.toLowerCase(), expected)) return null;

    const eventType = textValue(payload.iyziEventType) ?? 'unknown';
    const subscriptionId = textValue(payload.subscriptionReferenceCode);
    const id = `iyzico:${subscriptionId}:${textValue(payload.orderReferenceCode)}:${eventType}`;
    const created = typeof payload.iyziEventTime === 'number' ? Math.floor(payload.iyziEventTime / 1000) : Math.floor(Date.now() / 1000);
    if (!subscriptionId || (eventType !== 'subscription.order.success' && eventType !== 'subscription.order.failure')) {
      return { kind: 'ignored', id, created };
    }
    // The notification carries no status: the subscription is read as it is
    // now, once the event is known to be new.
    return { kind: 'subscription_notified', id, created, subscriptionId };
  },
};
