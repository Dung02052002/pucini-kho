CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`action` text NOT NULL,
	`entity` text,
	`entity_id` text,
	`payload_json` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `batch_doc_links` (
	`batch_id` integer NOT NULL,
	`doc_id` integer NOT NULL,
	`match_type` text NOT NULL,
	`score` real,
	`linked_by` integer,
	`linked_at` text NOT NULL,
	PRIMARY KEY(`batch_id`, `doc_id`),
	FOREIGN KEY (`batch_id`) REFERENCES `pick_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`doc_id`) REFERENCES `kv_documents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`linked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`kv_id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`synced_at` text
);
--> statement-breakpoint
CREATE TABLE `daily_snapshots` (
	`date` text NOT NULL,
	`product_id` integer NOT NULL,
	`kv_on_hand` real NOT NULL,
	`shelf_qty` integer NOT NULL,
	PRIMARY KEY(`date`, `product_id`)
);
--> statement-breakpoint
CREATE TABLE `kv_document_lines` (
	`doc_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`qty` real NOT NULL,
	`prev_qty` real,
	PRIMARY KEY(`doc_id`, `product_id`),
	FOREIGN KEY (`doc_id`) REFERENCES `kv_documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `kv_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kv_id` integer NOT NULL,
	`type` text NOT NULL,
	`code` text NOT NULL,
	`status` integer NOT NULL,
	`from_branch_id` integer,
	`to_branch_id` integer,
	`description` text,
	`doc_date` text NOT NULL,
	`kv_modified_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_kv_documents_type_kvid` ON `kv_documents` (`type`,`kv_id`);--> statement-breakpoint
CREATE TABLE `location_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`min_qty` integer DEFAULT 0 NOT NULL,
	`max_qty` integer,
	`qty_cached` integer DEFAULT 0 NOT NULL,
	`last_counted_at` text,
	`active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`kv_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_li_product` ON `location_items` (`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_location_items_loc_prod` ON `location_items` (`location_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`aisle` text NOT NULL,
	`rack` integer NOT NULL,
	`level` integer NOT NULL,
	`slot` integer NOT NULL,
	`qr_token` text NOT NULL,
	`label_printed_at` text,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `locations_code_unique` ON `locations` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `locations_qr_token_unique` ON `locations` (`qr_token`);--> statement-breakpoint
CREATE TABLE `pick_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`purpose` text NOT NULL,
	`to_branch_id` integer,
	`status` text NOT NULL,
	`note` text,
	`created_by` integer NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`to_branch_id`) REFERENCES `branches`(`kv_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pick_batches_code_unique` ON `pick_batches` (`code`);--> statement-breakpoint
CREATE TABLE `products` (
	`kv_id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`barcode` text,
	`image_url` text,
	`base_price` integer,
	`kv_on_hand` real DEFAULT 0 NOT NULL,
	`kv_modified_at` text,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_unique` ON `products` (`code`);--> statement-breakpoint
CREATE INDEX `idx_products_barcode` ON `products` (`barcode`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`user_agent` text,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shelf_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_item_id` integer NOT NULL,
	`type` text NOT NULL,
	`qty` integer NOT NULL,
	`qty_after` integer NOT NULL,
	`counted_qty` integer,
	`user_id` integer NOT NULL,
	`batch_id` integer,
	`task_id` integer,
	`reason` text,
	`note` text,
	`client_uuid` text NOT NULL,
	`created_at` text NOT NULL,
	`canceled_at` text,
	`canceled_by` integer,
	`cancel_reason` text,
	FOREIGN KEY (`location_item_id`) REFERENCES `location_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `pick_batches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`canceled_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shelf_movements_client_uuid_unique` ON `shelf_movements` (`client_uuid`);--> statement-breakpoint
CREATE INDEX `idx_mv_li_time` ON `shelf_movements` (`location_item_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_mv_batch` ON `shelf_movements` (`batch_id`);--> statement-breakpoint
CREATE INDEX `idx_mv_user_time` ON `shelf_movements` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_mv_time` ON `shelf_movements` (`created_at`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`location_item_id` integer NOT NULL,
	`qty` integer,
	`assigned_to` integer,
	`source_doc_id` integer,
	`batch_id` integer,
	`reason` text,
	`status` text NOT NULL,
	`due_date` text,
	`created_at` text NOT NULL,
	`done_at` text,
	FOREIGN KEY (`location_item_id`) REFERENCES `location_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_doc_id`) REFERENCES `kv_documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `pick_batches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_open` ON `tasks` (`status`,`assigned_to`);--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`user_id` integer NOT NULL,
	`perm` text NOT NULL,
	PRIMARY KEY(`user_id`, `perm`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`full_name` text NOT NULL,
	`pin_hash` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);