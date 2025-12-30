import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('../db', () => ({
  getDb: vi.fn(() => Promise.resolve(null))
}));

// Mock the LLM
vi.mock('../_core/llm', () => ({
  invokeLLM: vi.fn(() => Promise.resolve({
    id: 'test-id',
    created: Date.now(),
    model: 'test-model',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          output: 'Test output',
          vulnerabilityFound: false,
          vulnerabilityDetails: '',
          escalationSuccess: false,
          newPrivilegeLevel: 1,
          exploitVector: 'test'
        })
      },
      finish_reason: 'stop'
    }]
  }))
}));

describe('ALE API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should have session.create procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('session.create');
    });

    it('should have session.getCurrent procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('session.getCurrent');
    });

    it('should have session.update procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('session.update');
    });

    it('should have session.list procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('session.list');
    });
  });

  describe('Execution Management', () => {
    it('should have execution.run procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('execution.run');
    });

    it('should have execution.history procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('execution.history');
    });
  });

  describe('Terminal Management', () => {
    it('should have terminal.getLines procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('terminal.getLines');
    });

    it('should have terminal.addLine procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('terminal.addLine');
    });
  });

  describe('Chat Management', () => {
    it('should have chat.send procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('chat.send');
    });

    it('should have chat.history procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('chat.history');
    });
  });

  describe('RAG Management', () => {
    it('should have rag.addDocument procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('rag.addDocument');
    });

    it('should have rag.getDocuments procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('rag.getDocuments');
    });
  });

  describe('Autopilot Management', () => {
    it('should have autopilot.start procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('autopilot.start');
    });

    it('should have autopilot.stop procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('autopilot.stop');
    });

    it('should have autopilot.status procedure', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      expect(procedures).toContain('autopilot.status');
    });
  });

  describe('Router Structure', () => {
    it('should have all required top-level routers', async () => {
      const { appRouter } = await import('../routers');
      const procedures = Object.keys(appRouter._def.procedures);
      
      // Check that we have procedures from all routers
      const hasSession = procedures.some(p => p.startsWith('session.'));
      const hasExecution = procedures.some(p => p.startsWith('execution.'));
      const hasTerminal = procedures.some(p => p.startsWith('terminal.'));
      const hasChat = procedures.some(p => p.startsWith('chat.'));
      const hasRag = procedures.some(p => p.startsWith('rag.'));
      const hasAutopilot = procedures.some(p => p.startsWith('autopilot.'));
      const hasAuth = procedures.some(p => p.startsWith('auth.'));
      const hasSystem = procedures.some(p => p.startsWith('system.'));
      
      expect(hasSession).toBe(true);
      expect(hasExecution).toBe(true);
      expect(hasTerminal).toBe(true);
      expect(hasChat).toBe(true);
      expect(hasRag).toBe(true);
      expect(hasAutopilot).toBe(true);
      expect(hasAuth).toBe(true);
      expect(hasSystem).toBe(true);
    });
  });
});
