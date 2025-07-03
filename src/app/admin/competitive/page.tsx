'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompetitiveData {
  threats: CompetitiveThreat[];
  opportunities: CompetitiveOpportunity[];
  alerts: CompetitiveAlert[];
  summary: {
    totalThreats: number;
    criticalThreats: number;
    totalOpportunities: number;
    highValueOpportunities: number;
    activeAlerts: number;
  };
}

interface CompetitiveThreat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  probability: number;
  timeline: string;
  mitigationStrategies: string[];
}

interface CompetitiveOpportunity {
  id: string;
  type: string;
  value: 'low' | 'medium' | 'high' | 'transformational';
  description: string;
  probability: number;
  timeline: string;
  resourceRequirement: 'low' | 'medium' | 'high';
}

interface CompetitiveAlert {
  id: string;
  severity: 'info' | 'warning' | 'urgent';
  description: string;
  timestamp: string;
}

interface NewCompetitor {
  name: string;
  domain: string;
  industry: string;
  tier: 'direct' | 'indirect' | 'aspirational' | 'emerging';
}

export default function CompetitiveIntelligenceDashboard() {
  const [data, setData] = useState<CompetitiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState<CompetitiveThreat | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<CompetitiveOpportunity | null>(null);
  const [newCompetitor, setNewCompetitor] = useState<NewCompetitor>({
    name: '',
    domain: '',
    industry: '',
    tier: 'direct'
  });
  const [addingCompetitor, setAddingCompetitor] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/agents/competitive');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch competitive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = async () => {
    if (!newCompetitor.name || !newCompetitor.domain || !newCompetitor.industry) {
      alert('Please fill in all required fields');
      return;
    }

    setAddingCompetitor(true);
    try {
      const response = await fetch('/api/agents/competitive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_competitor',
          data: newCompetitor
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setNewCompetitor({ name: '', domain: '', industry: '', tier: 'direct' });
        await fetchData(); // Refresh data
      } else {
        alert(`Failed to add competitor: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to add competitor:', error);
      alert('Failed to add competitor');
    } finally {
      setAddingCompetitor(false);
    }
  };

  const analyzeIndustry = async (industry: string) => {
    try {
      const response = await fetch('/api/agents/competitive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_landscape',
          data: { industry }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('Industry analysis:', result.data);
        // Handle analysis results
      }
    } catch (error) {
      console.error('Industry analysis failed:', error);
    }
  };

  const generateReport = async (reportType: 'summary' | 'detailed' | 'strategic') => {
    try {
      const response = await fetch('/api/agents/competitive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_report',
          data: { reportType }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Download or display report
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `competitive-intelligence-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Report generation failed:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getValueColor = (value: string) => {
    switch (value) {
      case 'transformational': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'high': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-green-100 text-green-800 border-green-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Competitive Intelligence</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading competitive intelligence...</p>
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
            <h1 className="text-3xl font-bold">Competitive Intelligence</h1>
            <p className="text-gray-600 mt-1">
              Monitor competitors, identify threats and opportunities, and maintain strategic advantage
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline">
              Refresh
            </Button>
            <Button onClick={() => generateReport('detailed')} variant="outline">
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data?.summary?.totalThreats || 0}
              </div>
              <p className="text-xs text-gray-600">
                {data?.summary?.criticalThreats || 0} critical
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data?.summary?.totalOpportunities || 0}
              </div>
              <p className="text-xs text-gray-600">
                {data?.summary?.highValueOpportunities || 0} high value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {data?.summary?.activeAlerts || 0}
              </div>
              <p className="text-xs text-gray-600">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">24/7</div>
              <p className="text-xs text-gray-600">Continuous monitoring</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">Live</div>
              <p className="text-xs text-gray-600">Real-time intelligence</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">🚨 Active Alerts</h2>
            <div className="space-y-3">
              {data.alerts.map((alert) => (
                <Alert key={alert.id} className={getAlertColor(alert.severity)}>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{alert.description}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{alert.severity}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="threats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="threats">Threats</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="market">Market Intel</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="threats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitive Threats</CardTitle>
                <CardDescription>Identified threats from competitor analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.threats?.map((threat) => (
                    <div 
                      key={threat.id} 
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedThreat(selectedThreat?.id === threat.id ? null : threat)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{threat.description}</h3>
                            <Badge className={getSeverityColor(threat.severity)}>
                              {threat.severity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Type: {threat.type}</span>
                            <span>Probability: {(threat.probability * 100).toFixed(0)}%</span>
                            <span>Timeline: {threat.timeline}</span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedThreat?.id === threat.id && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Mitigation Strategies:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {threat.mitigationStrategies.map((strategy, index) => (
                              <li key={index}>{strategy}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )) || <p className="text-gray-500 text-center py-8">No threats detected</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitive Opportunities</CardTitle>
                <CardDescription>Market opportunities and competitive gaps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.opportunities?.map((opportunity) => (
                    <div 
                      key={opportunity.id} 
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedOpportunity(selectedOpportunity?.id === opportunity.id ? null : opportunity)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{opportunity.description}</h3>
                            <Badge className={getValueColor(opportunity.value)}>
                              {opportunity.value}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Type: {opportunity.type}</span>
                            <span>Probability: {(opportunity.probability * 100).toFixed(0)}%</span>
                            <span>Timeline: {opportunity.timeline}</span>
                            <span>Resources: {opportunity.resourceRequirement}</span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedOpportunity?.id === opportunity.id && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Potential Impact:</h4>
                              <p className="text-sm text-gray-600">
                                {opportunity.value} value opportunity with {opportunity.resourceRequirement} resource requirement
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Implementation:</h4>
                              <p className="text-sm text-gray-600">
                                Expected timeline: {opportunity.timeline}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )) || <p className="text-gray-500 text-center py-8">No opportunities identified</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitor Management</CardTitle>
                <CardDescription>Add and manage competitor monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Competitor Name</Label>
                    <Input
                      id="name"
                      value={newCompetitor.name}
                      onChange={(e) => setNewCompetitor({...newCompetitor, name: e.target.value})}
                      placeholder="e.g., Acme Corp"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={newCompetitor.domain}
                      onChange={(e) => setNewCompetitor({...newCompetitor, domain: e.target.value})}
                      placeholder="e.g., acme.com"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={newCompetitor.industry}
                      onChange={(e) => setNewCompetitor({...newCompetitor, industry: e.target.value})}
                      placeholder="e.g., SaaS, AI, FinTech"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tier">Competition Tier</Label>
                    <Select 
                      value={newCompetitor.tier} 
                      onValueChange={(value: any) => setNewCompetitor({...newCompetitor, tier: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct Competitor</SelectItem>
                        <SelectItem value="indirect">Indirect Competitor</SelectItem>
                        <SelectItem value="aspirational">Aspirational</SelectItem>
                        <SelectItem value="emerging">Emerging Threat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={addCompetitor} 
                  disabled={addingCompetitor}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {addingCompetitor ? 'Adding...' : 'Add Competitor'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Analyze industries and generate insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Industry to analyze (e.g., SaaS, AI)" className="flex-1" />
                  <Button onClick={() => analyzeIndustry('SaaS')} variant="outline">
                    Analyze Industry
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => generateReport('summary')} variant="outline">
                    Summary Report
                  </Button>
                  <Button onClick={() => generateReport('detailed')} variant="outline">
                    Detailed Report
                  </Button>
                  <Button onClick={() => generateReport('strategic')} variant="outline">
                    Strategic Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Intelligence</CardTitle>
                <CardDescription>Industry trends and market dynamics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500">Market intelligence data will be displayed here</p>
                  <Button onClick={() => analyzeIndustry('General')} className="mt-4">
                    Generate Market Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Intelligence Reports</CardTitle>
                <CardDescription>Generate and download comprehensive reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <h3 className="font-semibold mb-2">Summary Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      High-level overview of competitive landscape
                    </p>
                    <Button onClick={() => generateReport('summary')} variant="outline">
                      Generate
                    </Button>
                  </div>
                  
                  <div className="text-center p-6 border rounded-lg">
                    <h3 className="font-semibold mb-2">Detailed Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Comprehensive analysis with full data
                    </p>
                    <Button onClick={() => generateReport('detailed')} variant="outline">
                      Generate
                    </Button>
                  </div>
                  
                  <div className="text-center p-6 border rounded-lg">
                    <h3 className="font-semibold mb-2">Strategic Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Strategic recommendations and action plans
                    </p>
                    <Button onClick={() => generateReport('strategic')} variant="outline">
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}