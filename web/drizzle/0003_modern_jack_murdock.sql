CREATE TABLE `membership_grants` (
	`email` text PRIMARY KEY NOT NULL,
	`plan` text NOT NULL,
	`expires_at` text,
	`note` text,
	`created_at` text NOT NULL
);
