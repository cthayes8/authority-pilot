import Redis from 'ioredis';
import { AgentMessage, CommunicationProtocol } from './types';

interface MessageHandler {
  (message: AgentMessage): Promise<void>;
}

export class AgentCommunicationBus implements CommunicationProtocol {
  private redis: Redis;
  private subscribers: Map<string, MessageHandler[]> = new Map();
  private responseWaiters: Map<string, {
    resolve: (response: AgentMessage) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  constructor(redisConfig?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  }) {
    // Initialize Redis connection
    this.redis = new Redis({
      host: redisConfig?.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig?.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: redisConfig?.password || process.env.REDIS_PASSWORD,
      db: redisConfig?.db || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Connected to Redis for agent communication');
    });

    // Set up message listening
    this.setupMessageListening();
  }

  private async setupMessageListening(): Promise<void> {
    try {
      await this.redis.connect();
      
      // Subscribe to the general message channel
      await this.redis.subscribe('agent-messages');
      
      this.redis.on('message', async (channel: string, message: string) => {
        if (channel === 'agent-messages') {
          try {
            const agentMessage: AgentMessage = JSON.parse(message);
            await this.handleIncomingMessage(agentMessage);
          } catch (error) {
            console.error('Error parsing agent message:', error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to setup message listening:', error);
    }
  }

  private async handleIncomingMessage(message: AgentMessage): Promise<void> {
    // Handle response messages
    if (message.type === 'response' && message.relatedMessages) {
      for (const relatedId of message.relatedMessages) {
        const waiter = this.responseWaiters.get(relatedId);
        if (waiter) {
          clearTimeout(waiter.timeout);
          this.responseWaiters.delete(relatedId);
          waiter.resolve(message);
          return;
        }
      }
    }

    // Route message to appropriate handlers
    const targetHandlers = this.subscribers.get(message.to) || [];
    const allHandlers = this.subscribers.get('all') || [];
    
    const handlers = [...targetHandlers, ...allHandlers];
    
    // Execute handlers in parallel with error isolation
    await Promise.allSettled(
      handlers.map(async (handler) => {
        try {
          await handler(message);
        } catch (error) {
          console.error(`Error in message handler for agent ${message.to}:`, error);
        }
      })
    );

    // Store message in Redis for persistence (optional)
    await this.storeMessage(message);
  }

  public async sendMessage(message: AgentMessage): Promise<void> {
    try {
      // Validate message
      this.validateMessage(message);
      
      // Add metadata
      const enrichedMessage: AgentMessage = {
        ...message,
        timestamp: new Date()
      };

      // Publish to Redis
      await this.redis.publish('agent-messages', JSON.stringify(enrichedMessage));
      
      // Log message for debugging
      console.log(`Message sent from ${message.from} to ${message.to}: ${message.type}`);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  public async sendMessageWithResponse(
    message: AgentMessage,
    timeoutMs: number = 30000
  ): Promise<AgentMessage> {
    return new Promise((resolve, reject) => {
      // Set up response waiter
      const timeout = setTimeout(() => {
        this.responseWaiters.delete(message.id);
        reject(new Error(`Message response timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.responseWaiters.set(message.id, {
        resolve,
        reject,
        timeout
      });

      // Send the message
      this.sendMessage({
        ...message,
        requiresResponse: true
      }).catch(reject);
    });
  }

  public async receiveMessage(messageId: string): Promise<AgentMessage> {
    try {
      const messageData = await this.redis.get(`message:${messageId}`);
      if (!messageData) {
        throw new Error(`Message not found: ${messageId}`);
      }
      return JSON.parse(messageData);
    } catch (error) {
      throw new Error(`Failed to receive message: ${error}`);
    }
  }

  public async broadcast(
    content: any,
    priority: string,
    sender: string = 'system'
  ): Promise<void> {
    const broadcastMessage: AgentMessage = {
      id: this.generateMessageId(),
      from: sender,
      to: 'all',
      type: 'broadcast',
      priority: priority as AgentMessage['priority'],
      content,
      timestamp: new Date(),
      requiresResponse: false
    };

    await this.sendMessage(broadcastMessage);
  }

  public subscribe(target: string, handler: MessageHandler): void {
    if (!this.subscribers.has(target)) {
      this.subscribers.set(target, []);
    }
    this.subscribers.get(target)!.push(handler);
    
    console.log(`Subscribed handler for target: ${target}`);
  }

  public unsubscribe(target: string, handler: MessageHandler): void {
    const handlers = this.subscribers.get(target);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`Unsubscribed handler for target: ${target}`);
      }
    }
  }

  public async getMessageHistory(
    agentId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AgentMessage[]> {
    try {
      const messages = await this.redis.lrange(
        `messages:${agentId}`,
        offset,
        offset + limit - 1
      );
      
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      console.error('Failed to get message history:', error);
      return [];
    }
  }

  public async getSystemMetrics(): Promise<{
    totalMessages: number;
    activeSubscribers: number;
    pendingResponses: number;
    redisStatus: string;
  }> {
    try {
      const totalMessages = await this.redis.get('message-counter') || '0';
      const redisInfo = await this.redis.info();
      
      return {
        totalMessages: parseInt(totalMessages),
        activeSubscribers: this.subscribers.size,
        pendingResponses: this.responseWaiters.size,
        redisStatus: redisInfo.includes('connected_clients') ? 'connected' : 'disconnected'
      };
    } catch (error) {
      return {
        totalMessages: 0,
        activeSubscribers: this.subscribers.size,
        pendingResponses: this.responseWaiters.size,
        redisStatus: 'error'
      };
    }
  }

  // Priority queue implementation for message handling
  public async sendPriorityMessage(message: AgentMessage): Promise<void> {
    const priorityScore = this.getPriorityScore(message.priority);
    const queueKey = `priority-queue:${message.to}`;
    
    await this.redis.zadd(
      queueKey,
      priorityScore,
      JSON.stringify(message)
    );
    
    // Notify the agent of new priority message
    await this.redis.publish(`priority-${message.to}`, message.id);
  }

  public async processPriorityMessages(agentId: string): Promise<AgentMessage[]> {
    const queueKey = `priority-queue:${agentId}`;
    
    // Get highest priority messages
    const messages = await this.redis.zrevrange(queueKey, 0, 9, 'WITHSCORES');
    
    const priorityMessages: AgentMessage[] = [];
    for (let i = 0; i < messages.length; i += 2) {
      const messageData = messages[i];
      const score = messages[i + 1];
      
      try {
        const message = JSON.parse(messageData);
        priorityMessages.push(message);
        
        // Remove processed message from queue
        await this.redis.zrem(queueKey, messageData);
      } catch (error) {
        console.error('Error parsing priority message:', error);
      }
    }
    
    return priorityMessages;
  }

  // Utility methods
  private validateMessage(message: AgentMessage): void {
    if (!message.id || !message.from || !message.to || !message.type) {
      throw new Error('Invalid message: missing required fields');
    }
    
    if (message.deadline && message.deadline < new Date()) {
      throw new Error('Invalid message: deadline in the past');
    }
  }

  private async storeMessage(message: AgentMessage): Promise<void> {
    try {
      // Store individual message
      await this.redis.setex(
        `message:${message.id}`,
        3600, // 1 hour TTL
        JSON.stringify(message)
      );
      
      // Add to recipient's message list
      await this.redis.lpush(
        `messages:${message.to}`,
        JSON.stringify(message)
      );
      
      // Trim list to keep only recent messages (last 1000)
      await this.redis.ltrim(`messages:${message.to}`, 0, 999);
      
      // Increment message counter
      await this.redis.incr('message-counter');
      
    } catch (error) {
      console.error('Failed to store message:', error);
    }
  }

  private getPriorityScore(priority: AgentMessage['priority']): number {
    const scores = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };
    return scores[priority] || 1;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup methods
  public async cleanup(): Promise<void> {
    try {
      // Clear response waiters
      for (const [messageId, waiter] of this.responseWaiters.entries()) {
        clearTimeout(waiter.timeout);
        waiter.reject(new Error('Communication bus shutting down'));
      }
      this.responseWaiters.clear();
      
      // Clear subscribers
      this.subscribers.clear();
      
      // Close Redis connection
      await this.redis.disconnect();
      
      console.log('Agent communication bus cleaned up');
    } catch (error) {
      console.error('Error during communication bus cleanup:', error);
    }
  }

  // Health check
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // Test Redis connection
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      const metrics = await this.getSystemMetrics();
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (latency > 1000 || metrics.redisStatus === 'error') {
        status = 'unhealthy';
      } else if (latency > 500 || metrics.pendingResponses > 100) {
        status = 'degraded';
      }
      
      return {
        status,
        details: {
          redisLatency: latency,
          ...metrics,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }
}

// Singleton instance for global use
let globalCommunicationBus: AgentCommunicationBus | null = null;

export function getGlobalCommunicationBus(): AgentCommunicationBus {
  if (!globalCommunicationBus) {
    globalCommunicationBus = new AgentCommunicationBus();
  }
  return globalCommunicationBus;
}

export function setGlobalCommunicationBus(bus: AgentCommunicationBus): void {
  globalCommunicationBus = bus;
}