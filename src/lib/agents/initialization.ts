// Autonomous Agent System Initialization
import { globalScheduler } from './autonomous-scheduler';
import { getGlobalCommunicationBus } from './communication';

export async function initializeAutonomousSystem() {
  console.log('🚀 Initializing Autonomous Agent System...');
  
  try {
    // 1. Initialize communication bus
    const commBus = getGlobalCommunicationBus();
    await commBus.initialize();
    console.log('✅ Communication bus initialized');

    // 2. Initialize autonomous scheduler
    await globalScheduler.initialize();
    console.log('✅ Autonomous scheduler initialized');

    // 3. Start autonomous operations
    await globalScheduler.start();
    console.log('✅ Autonomous operations started');

    console.log('🎯 Autonomous Agent System is now fully operational!');
    
    return {
      success: true,
      message: 'Autonomous system initialized successfully',
      status: globalScheduler.getStatus()
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize autonomous system:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to initialize autonomous system'
    };
  }
}

// Auto-initialize on server startup (if in production)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Delay initialization to allow other services to start
  setTimeout(() => {
    initializeAutonomousSystem().then(result => {
      if (result.success) {
        console.log('🎯 Production autonomous system auto-started');
      } else {
        console.error('❌ Production auto-start failed:', result.error);
      }
    });
  }, 10000); // 10 second delay
}