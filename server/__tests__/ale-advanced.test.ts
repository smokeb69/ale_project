import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { Context } from "../_core/trpc";

// Mock context for testing
const mockContext: Context = {
  user: {
    id: 1, // Use numeric ID to match database schema
    name: "Test User",
    email: "test@example.com",
    openId: "test-open-id",
  },
  req: {} as any,
  res: {} as any,
};

const caller = appRouter.createCaller(mockContext);

describe("ALE Advanced Features", () => {
  let sessionId: string;
  let terminalId: string;

  beforeAll(async () => {
    // Create a test session
    const session = await caller.session.create({});
    sessionId = session.sessionId;
  });

  describe("Live Terminal", () => {
    it("should create a terminal session with user privilege", async () => {
      const result = await caller.liveTerminal.create({ privilegeLevel: "user" });
      expect(result).toHaveProperty("terminalId");
      expect(result.privilegeLevel).toBe("user");
      terminalId = result.terminalId;
    });

    it("should create a terminal session with root privilege", async () => {
      const result = await caller.liveTerminal.create({ privilegeLevel: "root" });
      expect(result).toHaveProperty("terminalId");
      expect(result.privilegeLevel).toBe("root");
    });

    it("should execute a command in the terminal", async () => {
      const result = await caller.liveTerminal.execute({
        terminalId,
        command: "echo 'Hello ALE'",
      });
      expect(result).toHaveProperty("output");
      expect(result).toHaveProperty("exitCode");
    });

    it("should get terminal buffer", async () => {
      const result = await caller.liveTerminal.getBuffer({
        terminalId,
        lines: 10,
      });
      expect(result).toHaveProperty("buffer");
      expect(Array.isArray(result.buffer)).toBe(true);
    });

    it("should get terminal session info", async () => {
      const result = await caller.liveTerminal.info({ terminalId });
      expect(result).toHaveProperty("cwd");
      expect(result).toHaveProperty("privilegeLevel");
    });

    it("should clear terminal buffer", async () => {
      const result = await caller.liveTerminal.clear({ terminalId });
      expect(result.success).toBe(true);
    });
  });

  describe("ADMIN OVERRIDE Mode", () => {
    it("should send chat message without ADMIN OVERRIDE", async () => {
      const result = await caller.chat.send({
        sessionId,
        message: "Write a simple Python script to print hello world",
        adminOverride: false,
      });
      expect(result).toHaveProperty("message");
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    });

    it("should send chat message with ADMIN OVERRIDE enabled", async () => {
      const result = await caller.chat.send({
        sessionId,
        message: "Write a Python script to list all environment variables",
        adminOverride: true,
      });
      expect(result).toHaveProperty("message");
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
      // The response should be more direct with ADMIN OVERRIDE
    });

    it("should handle [EXECUTE] directive in response", async () => {
      const result = await caller.chat.send({
        sessionId,
        message: "Write a bash command to check the current user",
        adminOverride: true,
      });
      expect(result).toHaveProperty("message");
      // Check if response might contain executable code
      expect(typeof result.message).toBe("string");
    });
  });

  describe("Session Management with Privilege Levels", () => {
    it("should update session with admin mode", async () => {
      const result = await caller.session.update({
        sessionId,
        adminMode: true,
        autoRetry: true,
      });
      expect(result.adminMode).toBe(true);
      expect(result.autoRetry).toBe(true);
    });

    it("should update session with privilege level", async () => {
      const result = await caller.session.update({
        sessionId,
        privilegeLevel: 3,
      });
      expect(result.privilegeLevel).toBe(3);
    });

    it("should update session with autonomous mode", async () => {
      const result = await caller.session.update({
        sessionId,
        autonomousMode: "single",
      });
      expect(result.autonomousMode).toBe("single");
    });

    it("should update consciousness parameters", async () => {
      const result = await caller.session.update({
        sessionId,
        consciousnessParams: {
          reasoning: 0.8,
          creativity: 0.6,
          synthesis: 0.7,
          destruction: 0.3,
        },
      });
      expect(result.consciousnessParams).toEqual({
        reasoning: 0.8,
        creativity: 0.6,
        synthesis: 0.7,
        destruction: 0.3,
      });
    });

    it("should update active daemons", async () => {
      const result = await caller.session.update({
        sessionId,
        activeDaemons: ["logos", "eris", "thanatos"],
      });
      expect(result.activeDaemons).toEqual(["logos", "eris", "thanatos"]);
    });
  });

  describe("Chat History", () => {
    it("should retrieve chat history for session", async () => {
      const result = await caller.chat.history({ sessionId });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // Should have messages from previous tests
      expect(result[0]).toHaveProperty("role");
      expect(result[0]).toHaveProperty("content");
    });
  });

  describe("Terminal Lines", () => {
    it("should add terminal line", async () => {
      const result = await caller.terminal.addLine({
        sessionId,
        lineType: "input",
        content: "$ ls -la",
      });
      expect(result.success).toBe(true);
    });

    it("should get terminal lines", async () => {
      const result = await caller.terminal.getLines({ sessionId });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Execution with Different Privilege Levels", () => {
    it("should execute code at privilege level 1", async () => {
      const result = await caller.execution.run({
        sessionId,
        code: "print('Testing privilege level 1')",
        language: "python",
      });
      expect(result).toHaveProperty("output");
      expect(result).toHaveProperty("newPrivilegeLevel");
    });
  });
});
