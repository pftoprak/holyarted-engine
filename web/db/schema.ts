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
  updatedAt: text('updated_at').notNull(),
});
