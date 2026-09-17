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
