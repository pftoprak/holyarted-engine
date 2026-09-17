CREATE TABLE `memberships` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`plan` text DEFAULT 'basic' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`current_period_end` integer,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_stripe_customer_id_unique` ON `memberships` (`stripe_customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_stripe_subscription_id_unique` ON `memberships` (`stripe_subscription_id`);