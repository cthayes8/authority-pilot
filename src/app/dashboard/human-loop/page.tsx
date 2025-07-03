'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface HumanLoopData {
  dashboard: any;
  pendingFeedback: HumanFeedback[];
  pendingTasks: ValidationTask[];
  recentFeedback: HumanFeedback[];
  recentTasks: ValidationTask[];
}

interface HumanFeedback {
  id: string;
  agentId: string;
  type: string;
  target: {
    type: string;
    description: string;
    currentValue: any;
    proposedValue?: any;
  };
  feedback: {
    question: string;
    options: Array<{
      id: string;
      label: string;
      value: any;
      description: string;
      consequences: string[];
    }>;
    freeformAllowed: boolean;
    context: string;
    rationale: string;
    impact: {
      scope: string;
      magnitude: string;
      areas: string[];
      reversibility: string;
    };
  };
  urgency: string;
  timestamp: string;
}

interface ValidationTask {
  id: string;
  type: string;
  title: string;
  description: string;
  requiredBy: string;
  estimatedTime: number;
  complexity: string;
  status: string;
}

export default function HumanInTheLoopDashboard() {
  const [data, setData] = useState<HumanLoopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingFeedback, setProcessingFeedback] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<HumanFeedback | null>(null);
  const [responseData, setResponseData] = useState<{
    selectedOption?: string;
    freeformInput?: string;
    confidence: number;
    reasoning?: string;
  }>({
    confidence: 80
  });

  // Mock user ID - in real app, this would come from auth
  const userId = 'user_123';

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/agents/human-loop?userId=${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch human-loop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (feedbackId: string) => {
    setProcessingFeedback(feedbackId);
    
    try {
      const response = await fetch('/api/agents/human-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_response',
          data: {
            feedbackId,
            userId,
            response: {
              ...responseData,
              confidence: responseData.confidence / 100 // Convert to 0-1 scale
            }
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchData(); // Refresh data
        setSelectedFeedback(null);
        setResponseData({ confidence: 80 });
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setProcessingFeedback(null);
    }
  };

  const bulkApprove = async (feedbackIds: string[]) => {
    try {
      const response = await fetch('/api/agents/human-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_approve',
          data: { feedbackIds, userId }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Bulk approve failed:', error);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (magnitude: string) => {
    switch (magnitude) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Human-in-the-Loop Dashboard</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading collaboration data...</p>
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
            <h1 className="text-3xl font-bold">Human-in-the-Loop Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Collaborate with AI agents and provide oversight for autonomous operations
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline">
              Refresh
            </Button>
            {data?.pendingFeedback && data.pendingFeedback.length > 0 && (
              <Button 
                onClick={() => bulkApprove(data.pendingFeedback.map(f => f.id))}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve All ({data.pendingFeedback.length})
              </Button>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data?.pendingFeedback?.length || 0}
              </div>
              <p className="text-xs text-gray-600">Requests awaiting your input</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Validation Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {data?.pendingTasks?.length || 0}
              </div>
              <p className="text-xs text-gray-600">Tasks requiring validation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {data?.dashboard?.activeSessions || 0}
              </div>
              <p className="text-xs text-gray-600">Collaborative sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data?.dashboard?.responseStats?.avgResponseTime || '5m'}
              </div>
              <p className="text-xs text-gray-600">Average response time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="feedback" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="feedback">Pending Feedback</TabsTrigger>
            <TabsTrigger value="tasks">Validation Tasks</TabsTrigger>
            <TabsTrigger value="history">Recent Activity</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Requests</CardTitle>
                <CardDescription>AI agents are requesting your input on these decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {data?.pendingFeedback?.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{feedback.feedback.question}</h3>
                            <Badge className={getUrgencyColor(feedback.urgency)}>
                              {feedback.urgency}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{feedback.feedback.context}</p>
                          <p className="text-sm text-blue-600">{feedback.feedback.rationale}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {new Date(feedback.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2">Current Value:</h4>
                            <div className="text-sm bg-white p-3 rounded border">
                              {typeof feedback.target.currentValue === 'string' 
                                ? feedback.target.currentValue 
                                : JSON.stringify(feedback.target.currentValue, null, 2)}
                            </div>
                          </div>
                          {feedback.target.proposedValue && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Proposed Value:</h4>
                              <div className="text-sm bg-white p-3 rounded border">
                                {typeof feedback.target.proposedValue === 'string' 
                                  ? feedback.target.proposedValue 
                                  : JSON.stringify(feedback.target.proposedValue, null, 2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Impact Assessment:</h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Scope: <span className="font-medium">{feedback.feedback.impact.scope}</span></span>
                          <span>Magnitude: <span className={`font-medium ${getImpactColor(feedback.feedback.impact.magnitude)}`}>
                            {feedback.feedback.impact.magnitude}
                          </span></span>
                          <span>Reversibility: <span className="font-medium">{feedback.feedback.impact.reversibility}</span></span>
                        </div>
                      </div>

                      {selectedFeedback?.id === feedback.id ? (
                        <div className="space-y-4 border-t pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="option">Choose Response</Label>
                              <Select 
                                value={responseData.selectedOption} 
                                onValueChange={(value) => setResponseData({...responseData, selectedOption: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {feedback.feedback.options.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="confidence">Confidence: {responseData.confidence}%</Label>
                              <Slider
                                value={[responseData.confidence]}
                                onValueChange={([value]) => setResponseData({...responseData, confidence: value})}
                                max={100}
                                min={0}
                                step={10}
                                className="mt-2"
                              />
                            </div>
                          </div>

                          {feedback.feedback.freeformAllowed && (
                            <div>
                              <Label htmlFor="freeform">Additional Comments/Modifications</Label>
                              <Textarea
                                value={responseData.freeformInput || ''}
                                onChange={(e) => setResponseData({...responseData, freeformInput: e.target.value})}
                                placeholder="Provide specific feedback, modifications, or reasoning..."
                                className="mt-1"
                                rows={3}
                              />
                            </div>
                          )}

                          <div>
                            <Label htmlFor="reasoning">Reasoning (Optional)</Label>
                            <Input
                              value={responseData.reasoning || ''}
                              onChange={(e) => setResponseData({...responseData, reasoning: e.target.value})}
                              placeholder="Explain your decision..."
                              className="mt-1"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={() => submitResponse(feedback.id)}
                              disabled={processingFeedback === feedback.id || !responseData.selectedOption}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {processingFeedback === feedback.id ? 'Processing...' : 'Submit Response'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setSelectedFeedback(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setSelectedFeedback(feedback)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Respond
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => submitResponse(feedback.id)}
                          >
                            Quick Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  )) || <p className="text-gray-500 text-center py-8">No pending feedback requests</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Tasks</CardTitle>
                <CardDescription>Tasks requiring your review and validation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.pendingTasks?.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <Badge variant="outline">{task.type}</Badge>
                            <span>Est. {task.estimatedTime} min</span>
                            <span className="capitalize">{task.complexity} complexity</span>
                            <span>Due: {new Date(task.requiredBy).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm">Review</Button>
                          <Button size="sm" variant="outline">Delegate</Button>
                        </div>
                      </div>
                    </div>
                  )) || <p className="text-gray-500 text-center py-8">No pending validation tasks</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent interactions with the AI system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...data?.recentFeedback || [], ...data?.recentTasks || []]
                    .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
                    .slice(0, 10)
                    .map((item: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">
                          {'question' in item ? item.feedback?.question : item.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {'question' in item ? 'Feedback Request' : 'Validation Task'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {new Date(item.timestamp || '').toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {(!data?.recentFeedback?.length && !data?.recentTasks?.length) && (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Collaboration Preferences</CardTitle>
                <CardDescription>Configure how and when AI agents should request your input</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Interruption Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Maximum interruptions per hour</Label>
                      <Slider defaultValue={[5]} max={20} min={1} step={1} className="mt-2" />
                    </div>
                    <div>
                      <Label>Minimum priority threshold</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Auto-Approval Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="auto-low-risk" />
                      <Label htmlFor="auto-low-risk">Auto-approve low-risk actions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="auto-trusted" />
                      <Label htmlFor="auto-trusted">Auto-approve actions in trusted domains</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Quiet Hours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="quiet-hours" />
                      <Label htmlFor="quiet-hours">Enable quiet hours</Label>
                    </div>
                    <div>
                      <Label>Start time</Label>
                      <Input type="time" defaultValue="22:00" className="mt-1" />
                    </div>
                    <div>
                      <Label>End time</Label>
                      <Input type="time" defaultValue="08:00" className="mt-1" />
                    </div>
                  </div>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}