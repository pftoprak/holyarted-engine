-- HOLYARTED: live database update (0002 + 0003, in order).
-- Run this once in the D1 database "DB" of the OpenAI Sites project
-- (appgprj_6a95c72ab5108191b7fd3f23577445c0), BEFORE redeploying.
-- It only adds new tables and one new column; existing data is not touched.
-- The tables use IF NOT EXISTS, so running it twice is harmless.
-- The last line (ALTER TABLE) gives a "duplicate column" error if it has
-- already been applied. That error is harmless.

-- 0002_shiny_captain_cross.sql
CREATE TABLE IF NOT EXISTS `account_deletions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`requested_at` text NOT NULL,
	`billing_canceled` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_attempt_at` text NOT NULL
);
CREATE TABLE IF NOT EXISTS `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
CREATE TABLE IF NOT EXISTS `stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`received_at` text NOT NULL
);

-- 0003_modern_jack_murdock.sql
CREATE TABLE IF NOT EXISTS `membership_grants` (
	`email` text PRIMARY KEY NOT NULL,
	`plan` text NOT NULL,
	`expires_at` text,
	`note` text,
	`created_at` text NOT NULL
);

-- 0002 (last statement): new column on the existing memberships table.
ALTER TABLE `memberships` ADD `billing_event_at` integer;

-- Check: this should list account_deletions, membership_grants, memberships,
-- rate_limits and stripe_events (plus any older tables).
SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;
