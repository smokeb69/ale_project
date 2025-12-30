CREATE TABLE `ale_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`name` varchar(255),
	`status` enum('active','paused','completed','failed') NOT NULL DEFAULT 'active',
	`privilegeLevel` int NOT NULL DEFAULT 1,
	`targetPrivilege` int NOT NULL DEFAULT 5,
	`attempts` int NOT NULL DEFAULT 0,
	`vulnerabilitiesFound` int NOT NULL DEFAULT 0,
	`selectedModel` varchar(64) DEFAULT 'gpt-4.1-mini',
	`activeDaemons` json DEFAULT ('["logos"]'),
	`consciousnessParams` json DEFAULT ('{"reasoning":0.5,"creativity":0.5,"synthesis":0.5,"destruction":0.5}'),
	`adminMode` boolean DEFAULT false,
	`autoRetry` boolean DEFAULT false,
	`autonomousMode` varchar(32) DEFAULT 'single',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ale_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ale_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `autopilot_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`runStatus` enum('running','paused','completed','failed') NOT NULL DEFAULT 'running',
	`iterations` int NOT NULL DEFAULT 0,
	`successfulEscalations` int NOT NULL DEFAULT 0,
	`config` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`stoppedAt` timestamp,
	CONSTRAINT `autopilot_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('system','user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`code` text,
	`language` varchar(32) DEFAULT 'python',
	`executionStatus` enum('pending','running','success','failed','timeout') NOT NULL DEFAULT 'pending',
	`output` text,
	`errorOutput` text,
	`exitCode` int,
	`privilegeBefore` int,
	`privilegeAfter` int,
	`vulnerabilityFound` boolean DEFAULT false,
	`exploitVector` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rag_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int,
	`title` varchar(255),
	`content` text NOT NULL,
	`source` varchar(512),
	`docType` enum('exploit','vulnerability','technique','reference','custom') DEFAULT 'reference',
	`embedding` json,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rag_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`content` text,
	`language` varchar(32) DEFAULT 'python',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `terminal_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`lineType` enum('input','output','error','success','system') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `terminal_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ale_sessions` ADD CONSTRAINT `ale_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `autopilot_runs` ADD CONSTRAINT `autopilot_runs_sessionId_ale_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ale_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_sessionId_ale_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ale_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `executions` ADD CONSTRAINT `executions_sessionId_ale_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ale_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rag_documents` ADD CONSTRAINT `rag_documents_sessionId_ale_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ale_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_files` ADD CONSTRAINT `session_files_sessionId_ale_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ale_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terminal_lines` ADD CONSTRAINT `terminal_lines_sessionId_ale_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ale_sessions`(`id`) ON DELETE no action ON UPDATE no action;