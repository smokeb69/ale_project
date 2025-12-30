/**
 * Multi-Instance Federation System
 * Manages multiple ALE Forge instances with shared learning and coordination
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ALEInstance {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'learning' | 'exploring';
  createdAt: string;
  lastActive: string;
  learningProgress: number;
  exploitsDiscovered: number;
  vulnerabilitiesFound: number;
  successRate: number;
  metadata: Record<string, any>;
}

export interface InstanceRegistry {
  instances: Map<string, ALEInstance>;
  totalInstances: number;
  activeInstances: number;
  totalLearningProgress: number;
  sharedKnowledgeSize: number;
}

export interface KnowledgeShare {
  id: string;
  sourceInstanceId: string;
  targetInstanceId: string;
  knowledgeType: 'cve' | 'exploit' | 'pattern' | 'vulnerability';
  data: any;
  timestamp: string;
  applied: boolean;
}

class InstanceFederation {
  private instanceRegistry: Map<string, ALEInstance> = new Map();
  private knowledgeShares: Map<string, KnowledgeShare> = new Map();
  private persistenceDir: string = '/home/ubuntu/ale_project/federation';
  private sharedLearningDir: string = '/home/ubuntu/ale_project/shared_learning';
  
  constructor() {
    this.initializePersistence();
    this.loadInstanceRegistry();
  }
  
  /**
   * Initialize persistence directories
   */
  private initializePersistence(): void {
    try {
      if (!fs.existsSync(this.persistenceDir)) {
        fs.mkdirSync(this.persistenceDir, { recursive: true });
      }
      if (!fs.existsSync(this.sharedLearningDir)) {
        fs.mkdirSync(this.sharedLearningDir, { recursive: true });
      }
      console.log('Federation persistence directories initialized');
    } catch (error) {
      console.error('Failed to initialize persistence:', error);
    }
  }
  
  /**
   * Register a new ALE instance
   */
  registerInstance(instance: Omit<ALEInstance, 'id' | 'createdAt' | 'lastActive'>): ALEInstance {
    const newInstance: ALEInstance = {
      ...instance,
      id: `ale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    
    this.instanceRegistry.set(newInstance.id, newInstance);
    this.persistInstanceRegistry();
    
    return newInstance;
  }
  
  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): ALEInstance | undefined {
    return this.instanceRegistry.get(instanceId);
  }
  
  /**
   * Get all instances
   */
  getAllInstances(): ALEInstance[] {
    return Array.from(this.instanceRegistry.values());
  }
  
  /**
   * Update instance status
   */
  updateInstanceStatus(instanceId: string, status: ALEInstance['status']): void {
    const instance = this.instanceRegistry.get(instanceId);
    if (instance) {
      instance.status = status;
      instance.lastActive = new Date().toISOString();
      this.persistInstanceRegistry();
    }
  }
  
  /**
   * Update instance learning progress
   */
  updateLearningProgress(instanceId: string, progress: Partial<ALEInstance>): void {
    const instance = this.instanceRegistry.get(instanceId);
    if (instance) {
      Object.assign(instance, progress);
      instance.lastActive = new Date().toISOString();
      this.persistInstanceRegistry();
    }
  }
  
  /**
   * Share knowledge between instances
   */
  shareKnowledge(
    sourceInstanceId: string,
    targetInstanceId: string,
    knowledgeType: KnowledgeShare['knowledgeType'],
    data: any
  ): KnowledgeShare {
    const share: KnowledgeShare = {
      id: `share-${Date.now()}`,
      sourceInstanceId,
      targetInstanceId,
      knowledgeType,
      data,
      timestamp: new Date().toISOString(),
      applied: false
    };
    
    this.knowledgeShares.set(share.id, share);
    this.persistKnowledgeShare(share);
    
    return share;
  }
  
  /**
   * Broadcast knowledge to all instances
   */
  broadcastKnowledge(sourceInstanceId: string, knowledgeType: KnowledgeShare['knowledgeType'], data: any): KnowledgeShare[] {
    const shares: KnowledgeShare[] = [];
    
    for (const targetInstance of this.instanceRegistry.values()) {
      if (targetInstance.id !== sourceInstanceId) {
        const share = this.shareKnowledge(sourceInstanceId, targetInstance.id, knowledgeType, data);
        shares.push(share);
      }
    }
    
    return shares;
  }
  
  /**
   * Get pending knowledge shares for instance
   */
  getPendingKnowledge(instanceId: string): KnowledgeShare[] {
    return Array.from(this.knowledgeShares.values())
      .filter(share => share.targetInstanceId === instanceId && !share.applied);
  }
  
  /**
   * Mark knowledge as applied
   */
  applyKnowledge(shareId: string): void {
    const share = this.knowledgeShares.get(shareId);
    if (share) {
      share.applied = true;
      this.persistKnowledgeShare(share);
    }
  }
  
  /**
   * Get federation statistics
   */
  getStatistics(): {
    totalInstances: number;
    activeInstances: number;
    learningInstances: number;
    exploringInstances: number;
    totalExploitsDiscovered: number;
    totalVulnerabilitiesFound: number;
    averageSuccessRate: number;
    totalKnowledgeShares: number;
    appliedShares: number;
  } {
    const instances = Array.from(this.instanceRegistry.values());
    const shares = Array.from(this.knowledgeShares.values());
    
    const stats = {
      totalInstances: instances.length,
      activeInstances: instances.filter(i => i.status === 'active').length,
      learningInstances: instances.filter(i => i.status === 'learning').length,
      exploringInstances: instances.filter(i => i.status === 'exploring').length,
      totalExploitsDiscovered: instances.reduce((sum, i) => sum + i.exploitsDiscovered, 0),
      totalVulnerabilitiesFound: instances.reduce((sum, i) => sum + i.vulnerabilitiesFound, 0),
      averageSuccessRate: instances.length > 0 
        ? instances.reduce((sum, i) => sum + i.successRate, 0) / instances.length
        : 0,
      totalKnowledgeShares: shares.length,
      appliedShares: shares.filter(s => s.applied).length
    };
    
    return stats;
  }
  
  /**
   * Persist instance registry to disk
   */
  private persistInstanceRegistry(): void {
    try {
      const registryPath = path.join(this.persistenceDir, 'instance_registry.json');
      const data = Array.from(this.instanceRegistry.values());
      fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to persist instance registry:', error);
    }
  }
  
  /**
   * Load instance registry from disk
   */
  private loadInstanceRegistry(): void {
    try {
      const registryPath = path.join(this.persistenceDir, 'instance_registry.json');
      if (fs.existsSync(registryPath)) {
        const data = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
        for (const instance of data) {
          this.instanceRegistry.set(instance.id, instance);
        }
        console.log(`Loaded ${data.length} instances from registry`);
      }
    } catch (error) {
      console.error('Failed to load instance registry:', error);
    }
  }
  
  /**
   * Persist knowledge share to disk
   */
  private persistKnowledgeShare(share: KnowledgeShare): void {
    try {
      const sharePath = path.join(this.sharedLearningDir, `${share.id}.json`);
      fs.writeFileSync(sharePath, JSON.stringify(share, null, 2));
    } catch (error) {
      console.error('Failed to persist knowledge share:', error);
    }
  }
  
  /**
   * Load all knowledge shares from disk
   */
  loadKnowledgeShares(): void {
    try {
      if (fs.existsSync(this.sharedLearningDir)) {
        const files = fs.readdirSync(this.sharedLearningDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(this.sharedLearningDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.knowledgeShares.set(data.id, data);
          }
        }
        console.log(`Loaded ${files.length} knowledge shares`);
      }
    } catch (error) {
      console.error('Failed to load knowledge shares:', error);
    }
  }
  
  /**
   * Export instance data
   */
  exportInstanceData(instanceId: string): string {
    const instance = this.getInstance(instanceId);
    if (!instance) throw new Error('Instance not found');
    
    const exportPath = path.join(this.persistenceDir, `export_${instanceId}_${Date.now()}.json`);
    const exportData = {
      instance,
      knowledgeShares: Array.from(this.knowledgeShares.values())
        .filter(s => s.sourceInstanceId === instanceId || s.targetInstanceId === instanceId),
      exportedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    return exportPath;
  }
  
  /**
   * Clone instance
   */
  cloneInstance(sourceInstanceId: string, newName: string): ALEInstance {
    const source = this.getInstance(sourceInstanceId);
    if (!source) throw new Error('Source instance not found');
    
    const cloned = this.registerInstance({
      name: newName,
      url: source.url.replace(sourceInstanceId, ''),
      status: 'inactive',
      learningProgress: 0,
      exploitsDiscovered: 0,
      vulnerabilitiesFound: 0,
      successRate: 0,
      metadata: { ...source.metadata, clonedFrom: sourceInstanceId }
    });
    
    // Copy knowledge from source
    for (const share of this.knowledgeShares.values()) {
      if (share.sourceInstanceId === sourceInstanceId) {
        this.shareKnowledge(cloned.id, cloned.id, share.knowledgeType, share.data);
      }
    }
    
    return cloned;
  }
}

// Singleton instance
export const instanceFederation = new InstanceFederation();
