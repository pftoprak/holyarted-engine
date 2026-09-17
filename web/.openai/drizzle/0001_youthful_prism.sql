CREATE TABLE `portraits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`birth_date` text NOT NULL,
	`full_name` text NOT NULL,
	`decision` text NOT NULL,
	`environment` text NOT NULL,
	`friction` text NOT NULL,
	`purpose` text NOT NULL,
	`algorithm_version` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
