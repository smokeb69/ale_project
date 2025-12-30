import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { cveDatabase } from './_core/cveDatabase';

export const cveRouter = router({
  // Search CVEs by query
  search: publicProcedure
    .input(z.object({
      query: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
      software: z.string().optional(),
      exploitType: z.string().optional(),
    }))
    .query(({ input }) => {
      const results = cveDatabase.searchCVEs(input.query, {
        severity: input.severity,
        software: input.software,
        exploitType: input.exploitType,
      });
      
      return {
        count: results.length,
        results: results.slice(0, 50).map(cve => ({
          cveId: cve.cveId,
          title: cve.title,
          severity: cve.severity,
          cvssScore: cve.cvssScore,
          affectedSoftware: cve.affectedSoftware,
          exploitType: cve.exploitType,
        })),
      };
    }),

  // Get detailed CVE information
  getCVE: publicProcedure
    .input(z.object({
      cveId: z.string(),
    }))
    .query(({ input }) => {
      const cve = cveDatabase.getCVE(input.cveId);
      
      if (!cve) {
        return { error: 'CVE not found' };
      }
      
      return {
        cveId: cve.cveId,
        title: cve.title,
        description: cve.description,
        severity: cve.severity,
        cvssScore: cve.cvssScore,
        affectedSoftware: cve.affectedSoftware,
        affectedVersions: cve.affectedVersions,
        publishedDate: cve.publishedDate,
        exploitType: cve.exploitType,
        exploitCommands: cve.exploitCommands,
        dependencies: cve.dependencies,
        installationSteps: cve.installationSteps,
        mitigations: cve.mitigations,
        references: cve.references,
        detectionSignatures: cve.detectionSignatures,
        assessmentNotes: cve.assessmentNotes,
      };
    }),

  // Get all CVEs for a software
  getBySoftware: publicProcedure
    .input(z.object({
      software: z.string(),
      limit: z.number().optional().default(50),
    }))
    .query(({ input }) => {
      const cves = cveDatabase.getCVEsBySoftware(input.software);
      
      return {
        software: input.software,
        count: cves.length,
        results: cves.slice(0, input.limit).map(cve => ({
          cveId: cve.cveId,
          title: cve.title,
          severity: cve.severity,
          cvssScore: cve.cvssScore,
          publishedDate: cve.publishedDate,
        })),
      };
    }),

  // Get critical vulnerabilities
  getCritical: publicProcedure
    .query(() => {
      const cves = cveDatabase.getCriticalVulnerabilities();
      
      return {
        count: cves.length,
        results: cves.slice(0, 100).map(cve => ({
          cveId: cve.cveId,
          title: cve.title,
          severity: cve.severity,
          cvssScore: cve.cvssScore,
          affectedSoftware: cve.affectedSoftware,
          exploitType: cve.exploitType,
        })),
      };
    }),

  // Analyze vulnerability patterns
  analyzePatterns: publicProcedure
    .input(z.object({
      software: z.string().optional(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    }))
    .query(({ input }) => {
      let cves = Array.from(cveDatabase['cveDatabase'].values());
      
      if (input.software) {
        cves = cves.filter(cve => 
          cve.affectedSoftware.some(s => s.toLowerCase().includes(input.software!.toLowerCase()))
        );
      }
      
      if (input.severity) {
        cves = cves.filter(cve => cve.severity === input.severity);
      }
      
      const analysis = cveDatabase.analyzePatterns(cves);
      
      return {
        queriedCVEs: cves.length,
        analysis,
      };
    }),

  // Get database statistics
  getStats: publicProcedure
    .query(() => {
      return cveDatabase.getStats();
    }),

  // Get exploitation commands for a CVE
  getExploitCommands: publicProcedure
    .input(z.object({
      cveId: z.string(),
    }))
    .query(({ input }) => {
      const cve = cveDatabase.getCVE(input.cveId);
      
      if (!cve) {
        return { error: 'CVE not found' };
      }
      
      return {
        cveId: cve.cveId,
        title: cve.title,
        exploitCommands: cve.exploitCommands,
        dependencies: cve.dependencies,
        installationSteps: cve.installationSteps,
        detectionSignatures: cve.detectionSignatures,
      };
    }),

  // Get mitigation strategies
  getMitigations: publicProcedure
    .input(z.object({
      cveId: z.string(),
    }))
    .query(({ input }) => {
      const cve = cveDatabase.getCVE(input.cveId);
      
      if (!cve) {
        return { error: 'CVE not found' };
      }
      
      return {
        cveId: cve.cveId,
        title: cve.title,
        mitigations: cve.mitigations,
        references: cve.references,
      };
    }),

  // Get detection signatures
  getDetectionSignatures: publicProcedure
    .input(z.object({
      cveId: z.string(),
    }))
    .query(({ input }) => {
      const cve = cveDatabase.getCVE(input.cveId);
      
      if (!cve) {
        return { error: 'CVE not found' };
      }
      
      return {
        cveId: cve.cveId,
        title: cve.title,
        detectionSignatures: cve.detectionSignatures,
        assessmentNotes: cve.assessmentNotes,
      };
    }),

  // Find similar vulnerabilities
  findSimilar: publicProcedure
    .input(z.object({
      cveId: z.string(),
      limit: z.number().optional().default(10),
    }))
    .query(({ input }) => {
      const cve = cveDatabase.getCVE(input.cveId);
      
      if (!cve) {
        return { error: 'CVE not found' };
      }
      
      // Find similar CVEs based on software and exploit type
      const allCVEs = Array.from(cveDatabase['cveDatabase'].values());
      const similar = allCVEs.filter(c => 
        c.cveId !== cve.cveId && (
          cve.affectedSoftware.some(s => c.affectedSoftware.includes(s)) ||
          cve.exploitType.some(t => c.exploitType.includes(t))
        )
      ).slice(0, input.limit);
      
      return {
        baseCVE: cve.cveId,
        similarCount: similar.length,
        results: similar.map(c => ({
          cveId: c.cveId,
          title: c.title,
          severity: c.severity,
          cvssScore: c.cvssScore,
          commonFactors: [
            ...cve.affectedSoftware.filter(s => c.affectedSoftware.includes(s)),
            ...cve.exploitType.filter(t => c.exploitType.includes(t)),
          ],
        })),
      };
    }),
});
