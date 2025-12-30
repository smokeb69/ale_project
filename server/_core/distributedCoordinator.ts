/**
 * Distributed Exploration Coordinator
 * Coordinates exploration tasks across multiple instances
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ExplorationTask {
  id: string;
  targetHost: string;
  targetPort?: number;
  taskType: 'scan' | 'exploit' | 'enumerate' | 'analyze';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  priority: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  retries: number;
  maxRetries: number;
}

export interface ExplorationQueue {
  tasks: Map<string, ExplorationTask>;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageCompletionTime: number;
}

export interface InstanceWorkload {
  instanceId: string;
  assignedTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  capacity: number;
}

class DistributedCoordinator {
  private explorationQueue: Map<string, ExplorationTask> = new Map();
  private instanceWorkloads: Map<string, InstanceWorkload> = new Map();
  private completedTasks: Map<string, ExplorationTask> = new Map();
  private persistenceDir: string = '/home/ubuntu/ale_project/coordination';
  
  constructor() {
    this.initializePersistence();
    this.loadTasks();
  }
  
  /**
   * Initialize persistence directories
   */
  private initializePersistence(): void {
    try {
      if (!fs.existsSync(this.persistenceDir)) {
        fs.mkdirSync(this.persistenceDir, { recursive: true });
      }
      console.log('Distributed coordinator persistence initialized');
    } catch (error) {
      console.error('Failed to initialize coordinator persistence:', error);
    }
  }
  
  /**
   * Create exploration task
   */
  createTask(
    targetHost: string,
    taskType: ExplorationTask['taskType'],
    targetPort?: number,
    priority: number = 5
  ): ExplorationTask {
    const task: ExplorationTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      targetHost,
      targetPort,
      taskType,
      status: 'pending',
      priority,
      createdAt: new Date().toISOString(),
      retries: 0,
      maxRetries: 3
    };
    
    this.explorationQueue.set(task.id, task);
    this.persistTask(task);
    
    return task;
  }
  
  /**
   * Get next task for instance
   */
  getNextTask(instanceId: string): ExplorationTask | undefined {
    // Find highest priority pending task
    const pendingTasks = Array.from(this.explorationQueue.values())
      .filter(t => t.status === 'pending')
      .sort((a, b) => b.priority - a.priority);
    
    if (pendingTasks.length === 0) return undefined;
    
    const task = pendingTasks[0];
    task.status = 'assigned';
    task.assignedTo = instanceId;
    
    // Update instance workload
    if (!this.instanceWorkloads.has(instanceId)) {
      this.instanceWorkloads.set(instanceId, {
        instanceId,
        assignedTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskTime: 0,
        capacity: 10
      });
    }
    
    const workload = this.instanceWorkloads.get(instanceId)!;
    workload.assignedTasks++;
    
    this.persistTask(task);
    return task;
  }
  
  /**
   * Report task completion
   */
  completeTask(taskId: string, result: any, executionTime: number): void {
    const task = this.explorationQueue.get(taskId);
    if (!task) throw new Error('Task not found');
    
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;
    
    this.completedTasks.set(taskId, task);
    this.explorationQueue.delete(taskId);
    
    // Update workload
    if (task.assignedTo) {
      const workload = this.instanceWorkloads.get(task.assignedTo);
      if (workload) {
        workload.completedTasks++;
        workload.averageTaskTime = (workload.averageTaskTime + executionTime) / 2;
      }
    }
    
    this.persistTask(task);
  }
  
  /**
   * Report task failure
   */
  failTask(taskId: string, error: string): void {
    const task = this.explorationQueue.get(taskId);
    if (!task) throw new Error('Task not found');
    
    if (task.retries < task.maxRetries) {
      // Retry
      task.retries++;
      task.status = 'pending';
      task.assignedTo = undefined;
    } else {
      // Give up
      task.status = 'failed';
      task.completedAt = new Date().toISOString();
      task.result = { error };
      
      this.completedTasks.set(taskId, task);
      this.explorationQueue.delete(taskId);
      
      // Update workload
      if (task.assignedTo) {
        const workload = this.instanceWorkloads.get(task.assignedTo);
        if (workload) {
          workload.failedTasks++;
        }
      }
    }
    
    this.persistTask(task);
  }
  
  /**
   * Get queue statistics
   */
  getQueueStatistics(): {
    totalTasks: number;
    pendingTasks: number;
    assignedTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageCompletionTime: number;
    queueHealth: number;
  } {
    const allTasks = Array.from(this.explorationQueue.values());
    const completed = Array.from(this.completedTasks.values());
    
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const assignedTasks = allTasks.filter(t => t.status === 'assigned').length;
    const completedCount = completed.filter(t => t.status === 'completed').length;
    const failedCount = completed.filter(t => t.status === 'failed').length;
    
    const completionTimes = completed
      .filter(t => t.completedAt && t.startedAt)
      .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt!).getTime());
    
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;
    
    const totalTasks = allTasks.length + completed.length;
    const queueHealth = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 100;
    
    return {
      totalTasks,
      pendingTasks,
      assignedTasks,
      completedTasks: completedCount,
      failedTasks: failedCount,
      averageCompletionTime,
      queueHealth
    };
  }
  
  /**
   * Get instance workload
   */
  getInstanceWorkload(instanceId: string): InstanceWorkload | undefined {
    return this.instanceWorkloads.get(instanceId);
  }
  
  /**
   * Get all instance workloads
   */
  getAllWorkloads(): InstanceWorkload[] {
    return Array.from(this.instanceWorkloads.values());
  }
  
  /**
   * Balance load across instances
   */
  balanceLoad(): Map<string, number> {
    const workloads = this.getAllWorkloads();
    const balancing = new Map<string, number>();
    
    // Calculate average load
    const totalLoad = workloads.reduce((sum, w) => sum + w.assignedTasks, 0);
    const averageLoad = totalLoad / workloads.length;
    
    // Identify overloaded and underloaded instances
    for (const workload of workloads) {
      const difference = workload.assignedTasks - averageLoad;
      if (difference > 0) {
        balancing.set(workload.instanceId, Math.ceil(difference / 2));
      }
    }
    
    return balancing;
  }
  
  /**
   * Get task results
   */
  getTaskResults(limit: number = 100): ExplorationTask[] {
    return Array.from(this.completedTasks.values())
      .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())
      .slice(0, limit);
  }
  
  /**
   * Persist task to disk
   */
  private persistTask(task: ExplorationTask): void {
    try {
      const taskPath = path.join(this.persistenceDir, `task_${task.id}.json`);
      fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
    } catch (error) {
      console.error('Failed to persist task:', error);
    }
  }
  
  /**
   * Load tasks from disk
   */
  private loadTasks(): void {
    try {
      if (fs.existsSync(this.persistenceDir)) {
        const files = fs.readdirSync(this.persistenceDir);
        for (const file of files) {
          if (file.startsWith('task_') && file.endsWith('.json')) {
            const filePath = path.join(this.persistenceDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            if (data.status === 'completed' || data.status === 'failed') {
              this.completedTasks.set(data.id, data);
            } else {
              this.explorationQueue.set(data.id, data);
            }
          }
        }
        console.log(`Loaded ${this.explorationQueue.size + this.completedTasks.size} tasks`);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }
}

// Singleton instance
export const distributedCoordinator = new DistributedCoordinator();
