'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

interface LearningSystemData {
  patterns: any;
  collective: any;
  knowledge: any;
  timestamp: string;
}

interface SearchResult {
  entry: any;
  relevanceScore: number;
  matchReason: string;
  suggestedApplication: string;
}

export default function LearningSystemDashboard() {
  const [data, setData] = useState<LearningSystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('content_creator_agent');

  useEffect(() => {
    fetchLearningData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchLearningData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLearningData = async () => {
    try {
      const response = await fetch('/api/agents/learning');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch('/api/agents/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search_knowledge',
          data: {
            query: {
              query: searchQuery,
              filters: { minConfidence: 0.6 },
              limit: 10
            }
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const getAgentReport = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/learning?type=learning_report&agentId=${agentId}`);
      const result = await response.json();
      
      if (result.success) {
        // Handle agent-specific report
        console.log('Agent report:', result.data);
      }
    } catch (error) {
      console.error('Failed to get agent report:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Learning Systems Dashboard</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading learning data...</p>
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
            <h1 className="text-3xl font-bold">Learning Systems Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor and analyze the collective intelligence and learning capabilities
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={fetchLearningData} variant="outline">
              Refresh Data
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="collective">Collective</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.patterns?.totalPatterns || 0}</div>
                  <p className="text-xs text-gray-600">
                    {data?.patterns?.highConfidencePatterns || 0} high confidence
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Knowledge Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.knowledge?.totalEntries || 0}</div>
                  <p className="text-xs text-gray-600">
                    {data?.knowledge?.recentAdditions || 0} added this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Collective Knowledge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.collective?.totalKnowledge || 0}</div>
                  <p className="text-xs text-gray-600">
                    {data?.collective?.activeSessions || 0} active sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Learning Velocity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.patterns?.recentPatterns || 0}</div>
                  <p className="text-xs text-gray-600">New patterns this week</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Top Learning Patterns</CardTitle>
                <CardDescription>Most impactful patterns discovered by the learning system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.patterns?.topPatterns?.slice(0, 5).map((pattern: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{pattern.description}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="secondary">{pattern.category}</Badge>
                          <span className="text-sm text-gray-600">
                            Confidence: {(pattern.confidence * 100).toFixed(1)}%
                          </span>
                          <span className="text-sm text-gray-600">
                            Predictive Power: {(pattern.predictivePower * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )) || <p className="text-gray-500">No patterns available</p>}
                </div>
              </CardContent>
            </Card>

            {/* Agent Learning Status */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Learning Status</CardTitle>
                <CardDescription>Learning progress for each autonomous agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: 'strategy_agent', name: 'Strategy Agent', patterns: 12, confidence: 85 },
                    { id: 'content_creator_agent', name: 'Content Creator', patterns: 28, confidence: 92 },
                    { id: 'engagement_agent', name: 'Engagement Agent', patterns: 15, confidence: 78 },
                    { id: 'analytics_agent', name: 'Analytics Agent', patterns: 22, confidence: 88 },
                    { id: 'orchestrator_agent', name: 'Orchestrator Agent', patterns: 8, confidence: 95 }
                  ].map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-medium">{agent.name}</h3>
                          <p className="text-sm text-gray-600">{agent.patterns} patterns learned</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{agent.confidence}% avg confidence</div>
                          <Progress value={agent.confidence} className="w-24 h-2 mt-1" />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => getAgentReport(agent.id)}
                        >
                          View Report
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pattern Recognition Analysis</CardTitle>
                <CardDescription>Detailed analysis of discovered behavioral and performance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-medium mb-3">Patterns by Type</h3>
                    <div className="space-y-2">
                      {Object.entries(data?.patterns?.patternsByType || {}).map(([type, count]) => (
                        <div key={type} className="flex justify-between">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Patterns by Category</h3>
                    <div className="space-y-2">
                      {Object.entries(data?.patterns?.patternsByCategory || {}).map(([category, count]) => (
                        <div key={category} className="flex justify-between">
                          <span className="capitalize">{category}</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Recent Anomalies Detected</h3>
                  {data?.patterns?.anomalies?.map((anomaly: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg bg-yellow-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-yellow-800">{anomaly.description}</h4>
                          <p className="text-sm text-yellow-600">
                            Detected: {new Date(anomaly.detectedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge 
                          variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'}
                        >
                          {anomaly.severity}
                        </Badge>
                      </div>
                    </div>
                  )) || <p className="text-gray-500">No recent anomalies detected</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Repository</CardTitle>
                <CardDescription>Centralized knowledge base with insights and learnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{data?.knowledge?.totalEntries || 0}</div>
                    <p className="text-sm text-gray-600">Total Knowledge Entries</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{data?.knowledge?.validationStatus?.validated || 0}</div>
                    <p className="text-sm text-gray-600">Validated Entries</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{data?.knowledge?.recentAdditions || 0}</div>
                    <p className="text-sm text-gray-600">Added This Week</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Top Performing Knowledge</h3>
                  {data?.knowledge?.topPerformers?.map((item: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{item.title}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge>{item.type}</Badge>
                        <span className="text-sm text-gray-600">
                          Confidence: {(item.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-600">
                          Impact: {item.impactScore?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )) || <p className="text-gray-500">No knowledge entries available</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collective" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Collective Intelligence</CardTitle>
                <CardDescription>Agent collaboration and knowledge sharing insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-medium mb-3">System Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Active Sessions</span>
                        <span className="font-medium">{data?.collective?.activeSessions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Requests</span>
                        <span className="font-medium">{data?.collective?.pendingRequests || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Knowledge</span>
                        <span className="font-medium">{data?.collective?.totalKnowledge || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Domain Distribution</h3>
                    {data?.collective?.domainDistribution?.map((domain: any) => (
                      <div key={domain.domain} className="mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{domain.domain}</span>
                          <span>{domain.count} entries</span>
                        </div>
                        <Progress value={(domain.avgConfidence * 100)} className="h-2 mt-1" />
                        <div className="text-xs text-gray-600 mt-1">
                          Avg Confidence: {(domain.avgConfidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    )) || <p className="text-gray-500">No domain data available</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Search</CardTitle>
                <CardDescription>Search and explore the collective knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Input
                    placeholder="Search knowledge base..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                    className="flex-1"
                  />
                  <Button onClick={performSearch} disabled={searchLoading}>
                    {searchLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{result.entry.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{result.entry.content}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <Badge>{result.entry.type}</Badge>
                            <Badge variant="outline">{result.entry.category}</Badge>
                            <span className="text-sm text-gray-600">
                              Relevance: {(result.relevanceScore * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-sm text-blue-600 mt-2">{result.suggestedApplication}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && searchQuery && !searchLoading && (
                    <p className="text-gray-500 text-center py-8">
                      No results found for "{searchQuery}"
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}