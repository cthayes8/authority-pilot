'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  loops: Map<string, any>;
  resources: {
    cpu: number;
    memory: number;
    database: number;
    api_quota: number;
  };
  alerts: any[];
}

interface AutonomousStatus {
  initialized: boolean;
  systemHealth: SystemHealth;
  userCount: number;
  config: any;
}

export default function AutonomousControlPanel() {
  const [status, setStatus] = useState<AutonomousStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/agents/autonomous');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/agents/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchStatus();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded': return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'critical': return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (!status) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Autonomous Operations Control Panel</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading system status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Autonomous Operations Control Panel</h1>
            <p className="text-gray-600 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => handleAction('initialize')}
              disabled={loading || status.initialized}
              variant="outline"
            >
              Initialize
            </Button>
            <Button 
              onClick={() => handleAction('start')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Operations
            </Button>
            <Button 
              onClick={() => handleAction('stop')}
              disabled={loading}
              variant="destructive"
            >
              Stop Operations
            </Button>
            <Button 
              onClick={fetchStatus}
              disabled={loading}
              variant="outline"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getHealthBadge(status.systemHealth.overall)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {status.initialized ? 'Initialized' : 'Not initialized'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.userCount}</div>
              <p className="text-xs text-gray-600">Users being managed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Loops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.systemHealth.loops?.size || 0}</div>
              <p className="text-xs text-gray-600">Autonomous agents running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {status.systemHealth.alerts?.length || 0}
              </div>
              <p className="text-xs text-gray-600">Active system alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Resource Usage */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
            <CardDescription>Real-time system resource monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>CPU Usage</span>
                  <span>{status.systemHealth.resources.cpu.toFixed(1)}%</span>
                </div>
                <Progress value={status.systemHealth.resources.cpu} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Memory Usage</span>
                  <span>{status.systemHealth.resources.memory.toFixed(1)}%</span>
                </div>
                <Progress value={status.systemHealth.resources.memory} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Database Load</span>
                  <span>{status.systemHealth.resources.database.toFixed(1)}%</span>
                </div>
                <Progress value={status.systemHealth.resources.database} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>API Quota</span>
                  <span>{status.systemHealth.resources.api_quota.toFixed(1)}%</span>
                </div>
                <Progress value={status.systemHealth.resources.api_quota} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Loops Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Autonomous Agent Loops</CardTitle>
            <CardDescription>Status of all autonomous agent operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock loop data - in real implementation, this would come from status.systemHealth.loops */}
              {[
                { id: 'strategy_loop', name: 'Strategy Review & Planning', status: 'idle', successRate: 95, lastRun: '2 hours ago' },
                { id: 'content_loop', name: 'Content Generation', status: 'running', successRate: 88, lastRun: '15 minutes ago' },
                { id: 'engagement_loop', name: 'Engagement Scanning', status: 'idle', successRate: 92, lastRun: '5 minutes ago' },
                { id: 'analytics_loop', name: 'Performance Analysis', status: 'idle', successRate: 97, lastRun: '1 hour ago' },
                { id: 'orchestration_loop', name: 'Agent Coordination', status: 'idle', successRate: 100, lastRun: '2 minutes ago' }
              ].map((loop) => (
                <div key={loop.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      loop.status === 'running' ? 'bg-green-500 animate-pulse' :
                      loop.status === 'idle' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <h3 className="font-medium">{loop.name}</h3>
                      <p className="text-sm text-gray-600">Last run: {loop.lastRun}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={loop.status === 'running' ? 'default' : 'secondary'}>
                      {loop.status}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">{loop.successRate}% success rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        {status.systemHealth.alerts && status.systemHealth.alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">System Alerts</CardTitle>
              <CardDescription>Active alerts requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {status.systemHealth.alerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium text-red-800">{alert.message}</p>
                      <p className="text-sm text-red-600">
                        {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}