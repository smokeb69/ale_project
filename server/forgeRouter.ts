/**
 * Forge Router - tRPC endpoints for cross-platform security testing
 */

import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { targetConfiguration } from './_core/targetConfiguration';
import { forgeOrchestrator } from './_core/forgeOrchestrator';
import { crossPlatformTerminal } from './_core/crossPlatformTerminal';

export const forgeRouter = router({
  // Target Management
  registerTarget: publicProcedure
    .input(z.object({
      name: z.string(),
      host: z.string(),
      port: z.number().optional(),
      os: z.enum(['windows', 'linux', 'macos', 'unknown']),
      authorized: z.boolean(),
      authorizationDocument: z.string().optional(),
      authorizationDate: z.string().optional(),
      authorizedBy: z.string().optional(),
      scope: z.array(z.string()),
      outOfScope: z.array(z.string()),
      notes: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const target = targetConfiguration.registerTarget(input);
        return {
          success: true,
          target,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  listTargets: publicProcedure
    .query(async () => {
      const targets = targetConfiguration.getAllTargets();
      return { targets };
    }),

  getTarget: publicProcedure
    .input(z.object({ targetId: z.string() }))
    .query(async ({ input }) => {
      const target = targetConfiguration.getTarget(input.targetId);
      if (!target) {
        throw new Error('Target not found');
      }
      return { target };
    }),

  validateTarget: publicProcedure
    .input(z.object({ host: z.string() }))
    .query(async ({ input }) => {
      const validation = targetConfiguration.validateTarget(input.host);
      return { validation };
    }),

  deleteTarget: publicProcedure
    .input(z.object({ targetId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        targetConfiguration.deleteTarget(input.targetId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  generateAuthTemplate: publicProcedure
    .input(z.object({
      targetHost: z.string(),
      targetName: z.string(),
    }))
    .query(async ({ input }) => {
      const template = targetConfiguration.generateAuthorizationTemplate(
        input.targetHost,
        input.targetName
      );
      return { template };
    }),

  getSelfIdentifiers: publicProcedure
    .query(async () => {
      const identifiers = targetConfiguration.getSelfIdentifiers();
      return { identifiers };
    }),

  // Forge Session Management
  startSession: publicProcedure
    .input(z.object({
      targetId: z.string(),
      phases: z.array(z.string()).optional().default(['recon', 'scan']),
      maxTerminals: z.number().optional().default(5),
      timeout: z.number().optional().default(60000),
      autoExploit: z.boolean().optional().default(false),
      safeMode: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input }) => {
      try {
        const session = await forgeOrchestrator.startSession({
          targetId: input.targetId,
          phases: input.phases,
          maxTerminals: input.maxTerminals,
          timeout: input.timeout,
          autoExploit: input.autoExploit,
          safeMode: input.safeMode,
        });
        return {
          success: true,
          session,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  getSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = forgeOrchestrator.getSession(input.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      return { session };
    }),

  listSessions: publicProcedure
    .query(async () => {
      const sessions = forgeOrchestrator.listSessions();
      return { sessions };
    }),

  abortSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      forgeOrchestrator.abortSession(input.sessionId);
      return { success: true };
    }),

  generateReport: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const report = forgeOrchestrator.generateReport(input.sessionId);
      return { report };
    }),

  // Terminal Management
  createTerminal: publicProcedure
    .input(z.object({
      targetHost: z.string().optional(),
      customShell: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const sessionId = crossPlatformTerminal.createSession(
        input.targetHost,
        input.customShell
      );
      return { sessionId };
    }),

  executeCommand: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      command: z.string(),
      timeout: z.number().optional(),
      maxBuffer: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await crossPlatformTerminal.executeCommand(
          input.sessionId,
          input.command,
          {
            timeout: input.timeout,
            maxBuffer: input.maxBuffer,
          }
        );
        return {
          success: true,
          result,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  executeParallel: publicProcedure
    .input(z.object({
      commands: z.array(z.object({
        command: z.string(),
        targetHost: z.string().optional(),
      })),
      timeout: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const results = await crossPlatformTerminal.executeParallel(
          input.commands,
          { timeout: input.timeout }
        );
        return {
          success: true,
          results,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  getTerminalHistory: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const history = crossPlatformTerminal.getHistory(
        input.sessionId,
        input.limit
      );
      return { history };
    }),

  listTerminals: publicProcedure
    .query(async () => {
      const terminals = crossPlatformTerminal.listSessions();
      return { terminals };
    }),

  closeTerminal: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      crossPlatformTerminal.closeSession(input.sessionId);
      return { success: true };
    }),

  getPlatformInfo: publicProcedure
    .query(async () => {
      const info = crossPlatformTerminal.getPlatformInfo();
      return { info };
    }),

  getPlatformCommands: publicProcedure
    .query(async () => {
      const commands = crossPlatformTerminal.getPlatformCommands();
      return { commands };
    }),
});

export type ForgeRouter = typeof forgeRouter;
