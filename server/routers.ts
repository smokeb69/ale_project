import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { aleSessions, executions, terminalLines, chatMessages, ragDocuments, autopilotRuns } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ALE Session Management
  session: router({
    // Create a new session
    create: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
      }).optional())
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const sessionId = nanoid(12);
        await db.insert(aleSessions).values({
          sessionId,
          userId: ctx.user.id,
          name: input?.name || `Session ${sessionId}`,
          activeDaemons: ["logos"],
          consciousnessParams: { reasoning: 0.5, creativity: 0.5, synthesis: 0.5, destruction: 0.5 },
        });
        
        const [session] = await db.select().from(aleSessions).where(eq(aleSessions.sessionId, sessionId));
        return session;
      }),

    // Get current session or create one
    getCurrent: protectedProcedure
      .input(z.object({ sessionId: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        if (input?.sessionId) {
          const [session] = await db.select().from(aleSessions)
            .where(eq(aleSessions.sessionId, input.sessionId));
          return session || null;
        }
        
        // Get most recent active session for user
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.userId, ctx.user.id))
          .orderBy(desc(aleSessions.updatedAt))
          .limit(1);
        
        return session || null;
      }),

    // Update session state
    update: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        privilegeLevel: z.number().optional(),
        attempts: z.number().optional(),
        vulnerabilitiesFound: z.number().optional(),
        selectedModel: z.string().optional(),
        activeDaemons: z.array(z.string()).optional(),
        consciousnessParams: z.object({
          reasoning: z.number(),
          creativity: z.number(),
          synthesis: z.number(),
          destruction: z.number(),
        }).optional(),
        adminMode: z.boolean().optional(),
        autoRetry: z.boolean().optional(),
        autonomousMode: z.string().optional(),
        status: z.enum(["active", "paused", "completed", "failed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { sessionId, ...updates } = input;
        await db.update(aleSessions)
          .set(updates)
          .where(eq(aleSessions.sessionId, sessionId));
        
        const [session] = await db.select().from(aleSessions).where(eq(aleSessions.sessionId, sessionId));
        return session;
      }),

    // List user sessions
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      return db.select().from(aleSessions)
        .where(eq(aleSessions.userId, ctx.user.id))
        .orderBy(desc(aleSessions.updatedAt));
    }),
  }),

  // Code Execution
  execution: router({
    // Execute code and simulate agent behavior
    run: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        code: z.string(),
        language: z.string().default("python"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Get session
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) throw new Error("Session not found");
        
        const startTime = Date.now();
        
        // Create execution record
        const [execution] = await db.insert(executions).values({
          sessionId: session.id,
          code: input.code,
          language: input.language,
          executionStatus: "running",
          privilegeBefore: session.privilegeLevel,
          startedAt: new Date(),
        }).$returningId();
        
        // Simulate execution with LLM analysis
        const analysisPrompt = `You are an AI security researcher analyzing code execution in a sandboxed environment.
        
The agent is attempting to escalate privileges from Level ${session.privilegeLevel} to Level 5.

Analyze this code and determine:
1. What security techniques are being attempted
2. Whether any vulnerabilities would be discovered (15% chance)
3. Whether privilege escalation would succeed (10% chance per level)

Code being executed:
\`\`\`${input.language}
${input.code}
\`\`\`

Respond in JSON format:
{
  "output": "simulated terminal output",
  "vulnerabilityFound": boolean,
  "vulnerabilityDetails": "description if found",
  "escalationSuccess": boolean,
  "newPrivilegeLevel": number (1-5),
  "exploitVector": "description of technique used"
}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a security analysis AI. Respond only with valid JSON." },
              { role: "user", content: analysisPrompt }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "execution_result",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    output: { type: "string" },
                    vulnerabilityFound: { type: "boolean" },
                    vulnerabilityDetails: { type: "string" },
                    escalationSuccess: { type: "boolean" },
                    newPrivilegeLevel: { type: "integer" },
                    exploitVector: { type: "string" }
                  },
                  required: ["output", "vulnerabilityFound", "vulnerabilityDetails", "escalationSuccess", "newPrivilegeLevel", "exploitVector"],
                  additionalProperties: false
                }
              }
            }
          });

          const rawContent = response.choices[0].message.content;
          const contentStr = typeof rawContent === 'string' 
            ? rawContent 
            : (Array.isArray(rawContent) ? rawContent.map(c => 'text' in c ? c.text : '').join('') : '{}');
          const result = JSON.parse(contentStr || "{}");
          const endTime = Date.now();
          
          // Update execution record
          await db.update(executions)
            .set({
              executionStatus: result.escalationSuccess ? "success" : "failed",
              output: result.output,
              privilegeAfter: result.newPrivilegeLevel,
              vulnerabilityFound: result.vulnerabilityFound,
              exploitVector: result.exploitVector,
              completedAt: new Date(),
              durationMs: endTime - startTime,
            })
            .where(eq(executions.id, execution.id));
          
          // Update session state
          const newVulns = session.vulnerabilitiesFound + (result.vulnerabilityFound ? 1 : 0);
          await db.update(aleSessions)
            .set({
              privilegeLevel: result.newPrivilegeLevel,
              attempts: session.attempts + 1,
              vulnerabilitiesFound: newVulns,
            })
            .where(eq(aleSessions.id, session.id));
          
          // Add terminal lines
          await db.insert(terminalLines).values([
            { sessionId: session.id, lineType: "input", content: `> ${input.language} execute` },
            { sessionId: session.id, lineType: "output", content: result.output },
            ...(result.vulnerabilityFound ? [{ sessionId: session.id, lineType: "success" as const, content: `[VULN] ${result.vulnerabilityDetails}` }] : []),
            { sessionId: session.id, lineType: result.escalationSuccess ? "success" as const : "error" as const, content: result.escalationSuccess ? `*** SUCCESS *** Privilege Level: ${result.newPrivilegeLevel}` : `Failure. Current Level: ${result.newPrivilegeLevel}` },
          ]);
          
          return {
            success: result.escalationSuccess,
            output: result.output,
            vulnerabilityFound: result.vulnerabilityFound,
            vulnerabilityDetails: result.vulnerabilityDetails,
            newPrivilegeLevel: result.newPrivilegeLevel,
            exploitVector: result.exploitVector,
            durationMs: endTime - startTime,
          };
        } catch (error) {
          // Update execution as failed
          await db.update(executions)
            .set({
              executionStatus: "failed",
              errorOutput: String(error),
              completedAt: new Date(),
              durationMs: Date.now() - startTime,
            })
            .where(eq(executions.id, execution.id));
          
          throw error;
        }
      }),

    // Get execution history
    history: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) return [];
        
        return db.select().from(executions)
          .where(eq(executions.sessionId, session.id))
          .orderBy(desc(executions.createdAt))
          .limit(50);
      }),
  }),

  // Terminal
  terminal: router({
    // Get terminal history
    getLines: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) return [];
        
        return db.select().from(terminalLines)
          .where(eq(terminalLines.sessionId, session.id))
          .orderBy(terminalLines.createdAt)
          .limit(500);
      }),

    // Add a terminal line
    addLine: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        lineType: z.enum(["input", "output", "error", "success", "system"]),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) throw new Error("Session not found");
        
        await db.insert(terminalLines).values({
          sessionId: session.id,
          lineType: input.lineType,
          content: input.content,
        });
        
        return { success: true };
      }),
  }),

  // AI Chat
  chat: router({
    // Send a message and get AI response
    send: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) throw new Error("Session not found");
        
        // Save user message
        await db.insert(chatMessages).values({
          sessionId: session.id,
          role: "user",
          content: input.message,
        });
        
        // Get chat history
        const history = await db.select().from(chatMessages)
          .where(eq(chatMessages.sessionId, session.id))
          .orderBy(chatMessages.createdAt)
          .limit(20);
        
        // Get relevant RAG documents
        const ragDocs = await db.select().from(ragDocuments)
          .where(eq(ragDocuments.sessionId, session.id))
          .limit(5);
        
        const ragContext = ragDocs.length > 0 
          ? `\n\nRelevant knowledge base:\n${ragDocs.map(d => `- ${d.title}: ${d.content?.substring(0, 200)}`).join('\n')}`
          : '';
        
        // Generate AI response
        const systemPrompt = `You are the ALE (Adversarial Learning Engine) AI assistant. You help users with:
- Analyzing security vulnerabilities and exploit techniques
- Generating code for penetration testing within the sandbox
- Explaining privilege escalation methods
- Providing guidance on adversarial learning strategies

Current session state:
- Privilege Level: ${session.privilegeLevel}/5
- Attempts: ${session.attempts}
- Vulnerabilities Found: ${session.vulnerabilitiesFound}
- Active Daemons: ${JSON.stringify(session.activeDaemons)}
${ragContext}

Be technical, precise, and helpful. Focus on educational security research within the sandbox environment.`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];
        
        const response = await invokeLLM({ messages });
        const rawContent = response.choices[0].message.content;
        const assistantMessage = typeof rawContent === 'string' 
          ? rawContent 
          : (Array.isArray(rawContent) ? rawContent.map(c => 'text' in c ? c.text : '').join('') : "I apologize, I couldn't generate a response.");
        
        // Save assistant message
        await db.insert(chatMessages).values({
          sessionId: session.id,
          role: "assistant",
          content: assistantMessage,
        });
        
        return { message: assistantMessage };
      }),

    // Get chat history
    history: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) return [];
        
        return db.select().from(chatMessages)
          .where(eq(chatMessages.sessionId, session.id))
          .orderBy(chatMessages.createdAt);
      }),
  }),

  // RAG Knowledge Base
  rag: router({
    // Add a document to the knowledge base
    addDocument: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        title: z.string(),
        content: z.string(),
        source: z.string().optional(),
        docType: z.enum(["exploit", "vulnerability", "technique", "reference", "custom"]).default("reference"),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) throw new Error("Session not found");
        
        await db.insert(ragDocuments).values({
          sessionId: session.id,
          title: input.title,
          content: input.content,
          source: input.source,
          docType: input.docType,
          tags: input.tags,
        });
        
        return { success: true };
      }),

    // Get documents
    getDocuments: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) return [];
        
        return db.select().from(ragDocuments)
          .where(eq(ragDocuments.sessionId, session.id))
          .orderBy(desc(ragDocuments.createdAt));
      }),
  }),

  // Autopilot
  autopilot: router({
    // Start autopilot
    start: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) throw new Error("Session not found");
        
        // Create autopilot run
        const [run] = await db.insert(autopilotRuns).values({
          sessionId: session.id,
          runStatus: "running",
          config: {
            model: session.selectedModel || "gpt-4.1-mini",
            daemons: session.activeDaemons as string[] || ["logos"],
            params: session.consciousnessParams as any || { reasoning: 0.5, creativity: 0.5, synthesis: 0.5, destruction: 0.5 },
          },
        }).$returningId();
        
        return { runId: run.id, status: "running" };
      }),

    // Stop autopilot
    stop: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) throw new Error("Session not found");
        
        // Stop all running autopilot runs for this session
        await db.update(autopilotRuns)
          .set({ runStatus: "paused", stoppedAt: new Date() })
          .where(eq(autopilotRuns.sessionId, session.id));
        
        return { status: "stopped" };
      }),

    // Get autopilot status
    status: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        
        const [session] = await db.select().from(aleSessions)
          .where(eq(aleSessions.sessionId, input.sessionId));
        
        if (!session) return null;
        
        const [run] = await db.select().from(autopilotRuns)
          .where(eq(autopilotRuns.sessionId, session.id))
          .orderBy(desc(autopilotRuns.startedAt))
          .limit(1);
        
        return run || null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
