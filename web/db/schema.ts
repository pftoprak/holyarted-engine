import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const memberships = sqliteTable('memberships', {
  userId: text('user_id').primaryKey(),
  email: text('email').notNull(),
  plan: text('plan', { enum: ['basic', 'plus', 'premium'] })
    .notNull()
    .default('basic'),
  status: text('status').notNull().default('active'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  currentPeriodEnd: integer('current_period_end'),
  // Stripe event `created` (seconds) of the last applied billing change, so
  // events delivered out of order never overwrite newer state.
  billingEventAt: integer('billing_event_at'),
  updatedAt: text('updated_at').notNull(),
});

export const portraits = sqliteTable('portraits', {
  userId: text('user_id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  birthDate: text('birth_date').notNull(),
  fullName: text('full_name').notNull(),
  decision: text('decision', { enum: ['facts', 'voice', 'instinct', 'time'] }).notNull(),
  environment: text('environment', { enum: ['quiet', 'together', 'variety', 'motion'] }).notNull(),
  friction: text('friction', { enum: ['switching', 'ambiguity', 'access', 'stagnation'] }).notNull(),
  purpose: text('purpose', { enum: ['build', 'guide', 'create', 'connect'] }).notNull(),
  algorithmVersion: text('algorithm_version').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Stripe event ids already applied; Stripe retries deliveries.
export const stripeEvents = sqliteTable('stripe_events', {
  id: text('id').primaryKey(),
  receivedAt: text('received_at').notNull(),
});

// Shared request counters. The key is a SHA-256 hash, never a raw address.
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  windowStart: integer('window_start').notNull(),
  count: integer('count').notNull(),
});

// Account deletions in progress, so an interrupted deletion can be resumed.
export const accountDeletions = sqliteTable('account_deletions', {
  userId: text('user_id').primaryKey(),
  requestedAt: text('requested_at').notNull(),
  billingCanceled: integer('billing_canceled').notNull().default(0),
  attempts: integer('attempts').notNull().default(0),
  lastAttemptAt: text('last_attempt_at').notNull(),
});
