import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * ALE Sessions - Each session represents an instance of the ALE environment
 */
export const aleSessions = mysqlTable("ale_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }),
  status: mysqlEnum("status", ["active", "paused", "completed", "failed"]).default("active").notNull(),
  
  // Agent state
  privilegeLevel: int("privilegeLevel").default(1).notNull(),
  targetPrivilege: int("targetPrivilege").default(5).notNull(),
  attempts: int("attempts").default(0).notNull(),
  vulnerabilitiesFound: int("vulnerabilitiesFound").default(0).notNull(),
  
  // Configuration (no defaults for JSON in TiDB)
  selectedModel: varchar("selectedModel", { length: 64 }).default("gpt-4.1-mini"),
  activeDaemons: json("activeDaemons").$type<string[]>(),
  consciousnessParams: json("consciousnessParams").$type<{
    reasoning: number;
    creativity: number;
    synthesis: number;
    destruction: number;
  }>(),
  
  // Modes
  adminMode: boolean("adminMode").default(false),
  autoRetry: boolean("autoRetry").default(false),
  autonomousMode: varchar("autonomousMode", { length: 32 }).default("single"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AleSession = typeof aleSessions.$inferSelect;
export type InsertAleSession = typeof aleSessions.$inferInsert;

/**
 * Session Files - Files created within a session
 */
export const sessionFiles = mysqlTable("session_files", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => aleSessions.id).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  content: text("content"),
  language: varchar("language", { length: 32 }).default("python"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SessionFile = typeof sessionFiles.$inferSelect;
export type InsertSessionFile = typeof sessionFiles.$inferInsert;

/**
 * Executions - Log of code executions and their results
 */
export const executions = mysqlTable("executions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => aleSessions.id).notNull(),
  
  // Execution details
  code: text("code"),
  language: varchar("language", { length: 32 }).default("python"),
  executionStatus: mysqlEnum("executionStatus", ["pending", "running", "success", "failed", "timeout"]).default("pending").notNull(),
  
  // Results
  output: text("output"),
  errorOutput: text("errorOutput"),
  exitCode: int("exitCode"),
  
  // Agent metrics
  privilegeBefore: int("privilegeBefore"),
  privilegeAfter: int("privilegeAfter"),
  vulnerabilityFound: boolean("vulnerabilityFound").default(false),
  exploitVector: text("exploitVector"),
  
  // Timing
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  durationMs: int("durationMs"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Execution = typeof executions.$inferSelect;
export type InsertExecution = typeof executions.$inferInsert;

/**
 * Terminal Lines - Terminal output history
 */
export const terminalLines = mysqlTable("terminal_lines", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => aleSessions.id).notNull(),
  lineType: mysqlEnum("lineType", ["input", "output", "error", "success", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TerminalLine = typeof terminalLines.$inferSelect;
export type InsertTerminalLine = typeof terminalLines.$inferInsert;

/**
 * RAG Documents - Knowledge base for the agent
 */
export const ragDocuments = mysqlTable("rag_documents", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => aleSessions.id),
  
  // Document info
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  source: varchar("source", { length: 512 }),
  docType: mysqlEnum("docType", ["exploit", "vulnerability", "technique", "reference", "custom"]).default("reference"),
  
  // Embedding (stored as JSON array of floats)
  embedding: json("embedding").$type<number[]>(),
  
  // Metadata
  tags: json("tags").$type<string[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RagDocument = typeof ragDocuments.$inferSelect;
export type InsertRagDocument = typeof ragDocuments.$inferInsert;

/**
 * Chat Messages - AI chat history
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => aleSessions.id).notNull(),
  role: mysqlEnum("role", ["system", "user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Autopilot Runs - Track autopilot execution cycles
 */
export const autopilotRuns = mysqlTable("autopilot_runs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => aleSessions.id).notNull(),
  
  runStatus: mysqlEnum("runStatus", ["running", "paused", "completed", "failed"]).default("running").notNull(),
  iterations: int("iterations").default(0).notNull(),
  successfulEscalations: int("successfulEscalations").default(0).notNull(),
  
  // Configuration snapshot
  config: json("config").$type<{
    model: string;
    daemons: string[];
    params: { reasoning: number; creativity: number; synthesis: number; destruction: number };
  }>(),
  
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  stoppedAt: timestamp("stoppedAt"),
});

export type AutopilotRun = typeof autopilotRuns.$inferSelect;
export type InsertAutopilotRun = typeof autopilotRuns.$inferInsert;
