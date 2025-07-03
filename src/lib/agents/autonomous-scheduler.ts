import { AutonomousLoopController } from './autonomous-loops';
import { createClient } from '@/lib/supabase/server';

interface SchedulerConfig {
  startTime?: Date;
  autoStart: boolean;
  healthCheckInterval: number; // minutes
  emergencyThresholds: {
    failureRate: number;
    responseTime: number; // minutes
    resourceUsage: number; // percentage
  };
}

interface UserActivity {
  userId: string;
  lastSeen: Date;
  timezone: string;
  peakHours: number[];
  contentPreferences: {
    frequency: 'low' | 'medium' | 'high';
    platforms: string[];
    topics: string[];
  };
}

export class AutonomousScheduler {
  private controller: AutonomousLoopController;
  private config: SchedulerConfig;
  private userActivities: Map<string, UserActivity> = new Map();
  private isInitialized = false;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      autoStart: true,
      healthCheckInterval: 5,
      emergencyThresholds: {
        failureRate: 0.3,
        responseTime: 10,
        resourceUsage: 85
      },
      ...config
    };
    
    this.controller = new AutonomousLoopController();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔧 Initializing Autonomous Scheduler...');
    
    // Load user activity patterns
    await this.loadUserActivities();
    
    // Setup emergency monitoring
    this.setupEmergencyMonitoring();
    
    this.isInitialized = true;
    console.log('✅ Autonomous Scheduler initialized');

    if (this.config.autoStart) {
      await this.start();
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🚀 Starting autonomous operations...');
    await this.controller.start();
    
    // Schedule user activity updates
    setInterval(() => {
      this.updateUserActivities();
    }, 30 * 60 * 1000); // Every 30 minutes

    console.log('🎯 Autonomous scheduler is now operational');
  }

  private async loadUserActivities(): Promise<void> {
    const supabase = createClient();
    
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id,
          timezone,
          preferences,
          created_at,
          updated_at
        `);

      if (profiles) {
        profiles.forEach(profile => {
          this.userActivities.set(profile.id, {
            userId: profile.id,
            lastSeen: new Date(profile.updated_at),
            timezone: profile.timezone || 'UTC',
            peakHours: this.calculatePeakHours(profile),
            contentPreferences: {
              frequency: profile.preferences?.content_frequency || 'medium',
              platforms: profile.preferences?.platforms || ['linkedin'],
              topics: profile.preferences?.topics || []
            }
          });
        });
      }

      console.log(`📊 Loaded activity patterns for ${this.userActivities.size} users`);
    } catch (error) {
      console.error('Failed to load user activities:', error);
    }
  }

  private calculatePeakHours(profile: any): number[] {
    // Default peak hours based on timezone
    const timezone = profile.timezone || 'UTC';
    const defaultPeaks = [9, 12, 17, 20]; // 9am, 12pm, 5pm, 8pm local time
    
    // Could be enhanced with actual usage analytics
    return defaultPeaks;
  }

  private async updateUserActivities(): Promise<void> {
    console.log('🔄 Updating user activity patterns...');
    
    // This would integrate with actual user activity tracking
    // For now, we'll update the lastSeen times from the database
    await this.loadUserActivities();
  }

  private setupEmergencyMonitoring(): void {
    setInterval(() => {
      this.checkEmergencyConditions();
    }, this.config.healthCheckInterval * 60 * 1000);
  }

  private async checkEmergencyConditions(): Promise<void> {
    const health = this.controller.getSystemStatus();
    const thresholds = this.config.emergencyThresholds;

    // Check failure rate
    const totalLoops = health.loops.size;
    const failedLoops = Array.from(health.loops.values()).filter(
      loop => loop.status === 'failed'
    ).length;
    
    const failureRate = totalLoops > 0 ? failedLoops / totalLoops : 0;

    // Check resource usage
    const maxResourceUsage = Math.max(
      health.resources.cpu,
      health.resources.memory,
      health.resources.database
    );

    // Emergency conditions
    if (failureRate > thresholds.failureRate) {
      await this.handleEmergency('high_failure_rate', {
        current: failureRate,
        threshold: thresholds.failureRate
      });
    }

    if (maxResourceUsage > thresholds.resourceUsage) {
      await this.handleEmergency('resource_exhaustion', {
        current: maxResourceUsage,
        threshold: thresholds.resourceUsage
      });
    }

    if (health.overall === 'critical') {
      await this.handleEmergency('system_critical', { health });
    }
  }

  private async handleEmergency(type: string, data: any): Promise<void> {
    console.error(`🚨 EMERGENCY: ${type}`, data);

    switch (type) {
      case 'high_failure_rate':
        // Reduce loop frequency temporarily
        await this.temporarySlowdown();
        break;
        
      case 'resource_exhaustion':
        // Pause non-critical loops
        await this.pauseNonCriticalLoops();
        break;
        
      case 'system_critical':
        // Full system restart
        await this.emergencyRestart();
        break;
    }

    // Log emergency to database
    const supabase = createClient();
    await supabase.from('system_alerts').insert({
      type: 'emergency',
      severity: 'critical',
      message: `Emergency condition: ${type}`,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  private async temporarySlowdown(): Promise<void> {
    console.log('⚠️ Implementing temporary slowdown...');
    // Implementation would modify loop frequencies
  }

  private async pauseNonCriticalLoops(): Promise<void> {
    console.log('⏸️ Pausing non-critical loops...');
    // Implementation would pause lower priority loops
  }

  private async emergencyRestart(): Promise<void> {
    console.log('🔄 Performing emergency restart...');
    await this.controller.stop();
    
    // Wait 30 seconds before restart
    setTimeout(async () => {
      await this.controller.start();
      console.log('✅ Emergency restart completed');
    }, 30000);
  }

  async optimizeForUser(userId: string): Promise<void> {
    const activity = this.userActivities.get(userId);
    if (!activity) return;

    console.log(`🎯 Optimizing loops for user ${userId}`);
    
    // This would adjust loop timing based on user's peak hours
    // and content preferences
    
    // Example: Adjust content generation timing
    const peakTimes = activity.peakHours;
    const contentFrequency = activity.contentPreferences.frequency;
    
    // Implementation would modify the autonomous loops
    // to align with user's optimal engagement times
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      systemHealth: this.controller.getSystemStatus(),
      userCount: this.userActivities.size,
      config: this.config
    };
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping autonomous scheduler...');
    await this.controller.stop();
    this.isInitialized = false;
  }
}

// Export singleton for global access
export const globalScheduler = new AutonomousScheduler();