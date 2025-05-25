import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { User, TrendingUp, Share2, Clock, AlertCircle } from 'lucide-react';

// Mock data - In a real app, this would come from API
const mockTestData = [
  { date: '2024-01-15', verticalJump: 52, standingLongJump: 245, sprint30m: 4.2, sprintIce30m: 4.6 },
  { date: '2024-02-15', verticalJump: 54, standingLongJump: 250, sprint30m: 4.15, sprintIce30m: 4.55 },
  { date: '2024-03-15', verticalJump: 55, standingLongJump: 255, sprint30m: 4.12, sprintIce30m: 4.5 },
  { date: '2024-04-15', verticalJump: 57, standingLongJump: 258, sprint30m: 4.08, sprintIce30m: 4.45 },
];

const mockTeamData = [
  { id: 'player1', name: 'Erik Andersson', position: 'Forward', verticalJump: 57, standingLongJump: 258, sprint30m: 4.08, sprintIce30m: 4.45 },
  { id: 'player2', name: 'Johan Nilsson', position: 'Defense', verticalJump: 54, standingLongJump: 245, sprint30m: 4.13, sprintIce30m: 4.52 },
  { id: 'player3', name: 'Niklas Berg', position: 'Forward', verticalJump: 59, standingLongJump: 262, sprint30m: 4.05, sprintIce30m: 4.42 },
  { id: 'player4', name: 'Oskar Lind', position: 'Defense', verticalJump: 52, standingLongJump: 240, sprint30m: 4.18, sprintIce30m: 4.58 },
  { id: 'player5', name: 'Gustav Holm', position: 'Forward', verticalJump: 56, standingLongJump: 252, sprint30m: 4.10, sprintIce30m: 4.48 },
];

// Mock correlation data from the research
const mockCorrelationData = [
  { test: 'Vertical Jump (cm)', correlation: -0.65, significance: 'p < 0.01', explanation: 'Strong negative correlation indicating that higher jumps correlate with faster on-ice sprint times', recommendations: 'Focus on plyometric exercises to improve explosive leg power' },
  { test: 'Standing Long Jump (cm)', correlation: -0.53, significance: 'p < 0.01', explanation: 'Moderate negative correlation showing horizontal power relates to skating speed', recommendations: 'Include broad jumps and horizontal plyometrics in training program' },
  { test: '30m Sprint (s)', correlation: 0.71, significance: 'p < 0.01', explanation: 'Strong positive correlation between off-ice and on-ice sprint times', recommendations: 'Incorporate sprint training, focusing on acceleration technique' },
  { test: 'Slide Board (reps)', correlation: -0.62, significance: 'p < 0.01', explanation: 'Strong negative correlation showing slide board performance predicts skating speed', recommendations: 'Regular slide board training to develop skating-specific strength' },
  { test: 'Power Clean (kg/bw)', correlation: -0.56, significance: 'p < 0.05', explanation: 'Moderate negative correlation between relative power clean strength and skating speed', recommendations: 'Include Olympic lifting to develop explosive triple extension power' },
];

// Mock scatter plot data for correlation visualization
const mockScatterData = [
  { verticalJump: 48, sprintIce30m: 4.75 },
  { verticalJump: 50, sprintIce30m: 4.65 },
  { verticalJump: 52, sprintIce30m: 4.58 },
  { verticalJump: 53, sprintIce30m: 4.52 },
  { verticalJump: 55, sprintIce30m: 4.48 },
  { verticalJump: 56, sprintIce30m: 4.45 },
  { verticalJump: 58, sprintIce30m: 4.40 },
  { verticalJump: 59, sprintIce30m: 4.35 },
  { verticalJump: 61, sprintIce30m: 4.30 },
  { verticalJump: 63, sprintIce30m: 4.25 },
];

// Mock prediction data
const predictedValues = {
  current: { sprintIce30m: 4.45 },
  withImprovement: { sprintIce30m: 4.32 }
};

export default function PhysicalAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState('player');
  const [selectedTest, setSelectedTest] = useState('verticalJump');
  const [selectedPlayer, setSelectedPlayer] = useState('player1');
  
  const testOptions = {
    verticalJump: {
      label: 'Vertical Jump',
      unit: 'cm',
      higher_is_better: true,
      correlatesTo: 'on-ice acceleration'
    },
    standingLongJump: {
      label: 'Standing Long Jump',
      unit: 'cm',
      higher_is_better: true,
      correlatesTo: 'speed and agility'
    },
    sprint30m: {
      label: '30m Sprint',
      unit: 's',
      higher_is_better: false,
      correlatesTo: 'on-ice top speed'
    }
  };
  
  const getPlayerData = (playerId) => {
    return mockTeamData.find(p => p.id === playerId);
  };
  
  const currentPlayer = getPlayerData(selectedPlayer);
  
  const formatTestValue = (value, testKey) => {
    if (testOptions[testKey]) {
      return `${value} ${testOptions[testKey].unit}`;
    }
    return value;
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Physical Performance Analysis</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="player">Player Progress</TabsTrigger>
          <TabsTrigger value="correlations">Off-Ice to On-Ice Correlations</TabsTrigger>
          <TabsTrigger value="team">Team Comparison</TabsTrigger>
          <TabsTrigger value="predictions">Performance Predictions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="player" className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {mockTeamData.map(player => (
                  <SelectItem key={player.id} value={player.id}>{player.name} - {player.position}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {currentPlayer && (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{currentPlayer.name}</span>
                <Badge>{currentPlayer.position}</Badge>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vertical Jump</CardTitle>
                <div className="text-2xl font-bold">{currentPlayer?.verticalJump} cm</div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Team Average: 55.6 cm</div>
                <div className="h-4 mt-2">
                  <div className="h-1 bg-muted rounded-full">
                    <div 
                      className="h-1 bg-primary rounded-full" 
                      style={{ width: `${(currentPlayer?.verticalJump / 70) * 100}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Standing Long Jump</CardTitle>
                <div className="text-2xl font-bold">{currentPlayer?.standingLongJump} cm</div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Team Average: 251.4 cm</div>
                <div className="h-4 mt-2">
                  <div className="h-1 bg-muted rounded-full">
                    <div 
                      className="h-1 bg-primary rounded-full" 
                      style={{ width: `${(currentPlayer?.standingLongJump / 300) * 100}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">30m Sprint (Off-Ice)</CardTitle>
                <div className="text-2xl font-bold">{currentPlayer?.sprint30m} s</div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Team Average: 4.11 s</div>
                <div className="h-4 mt-2">
                  <div className="h-1 bg-muted rounded-full">
                    <div 
                      className="h-1 bg-primary rounded-full" 
                      style={{ width: `${(1 - ((currentPlayer?.sprint30m - 3.8) / 0.7)) * 100}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Progress Over Time</CardTitle>
              <CardDescription>Tracking physical test performance changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTestData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="verticalJump" name="Vertical Jump (cm)" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="sprintIce30m" name="30m On-Ice Sprint (s)" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="correlations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Off-Ice to On-Ice Performance Correlations</CardTitle>
              <CardDescription>Research-based findings on which off-ice tests predict on-ice speed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockCorrelationData.map((item, index) => (
                  <div key={index} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{item.test}</h4>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>Correlation: <strong>{item.correlation}</strong> ({item.significance})</span>
                        </div>
                      </div>
                      <Badge className={Math.abs(item.correlation) >= 0.6 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                        {Math.abs(item.correlation) >= 0.6 ? "Strong" : "Moderate"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm">{item.explanation}</p>
                    <div className="mt-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start">
                        <AlertCircle className="h-4 w-4 text-amber-600 mr-2 mt-0.5" />
                        <p className="text-sm text-amber-800">{item.recommendations}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Correlation Visualization</CardTitle>
              <CardDescription>Vertical Jump vs. 30m On-Ice Sprint Time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="verticalJump" name="Vertical Jump" unit="cm" />
                    <YAxis type="number" dataKey="sprintIce30m" name="30m On-Ice Sprint" unit="s" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Players" data={mockScatterData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-md text-sm">
                <p className="text-blue-800">
                  <strong>Interpretation:</strong> This scatter plot shows a clear negative correlation (r = -0.65) between vertical jump height and on-ice sprint time. 
                  Players with higher vertical jump values tend to have faster (lower) sprint times on ice, 
                  confirming that lower-body power is a strong predictor of skating speed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team" className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedTest} onValueChange={setSelectedTest}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verticalJump">Vertical Jump (cm)</SelectItem>
                <SelectItem value="standingLongJump">Standing Long Jump (cm)</SelectItem>
                <SelectItem value="sprint30m">30m Sprint (s)</SelectItem>
                <SelectItem value="sprintIce30m">30m On-Ice Sprint (s)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm">
              <span>Position Filter:</span>
              <Badge variant="outline" className="cursor-pointer">All</Badge>
              <Badge variant="outline" className="cursor-pointer">Forward</Badge>
              <Badge variant="outline" className="cursor-pointer">Defense</Badge>
              <Badge variant="outline" className="cursor-pointer">Goalie</Badge>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Team Comparison: {testOptions[selectedTest]?.label || selectedTest}</CardTitle>
              <CardDescription>Comparing performance across all team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={mockTeamData}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value) => [
                        formatTestValue(value, selectedTest), 
                        testOptions[selectedTest]?.label || selectedTest
                      ]}
                    />
                    <Bar 
                      dataKey={selectedTest} 
                      fill={testOptions[selectedTest]?.higher_is_better ? "#8884d8" : "#d88884"}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Team Average:</span> {
                  (mockTeamData.reduce((sum, player) => sum + player[selectedTest], 0) / mockTeamData.length).toFixed(2)
                } {testOptions[selectedTest]?.unit}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="predictions" className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {mockTeamData.map(player => (
                  <SelectItem key={player.id} value={player.id}>{player.name} - {player.position}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {currentPlayer && (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{currentPlayer.name}</span>
                <Badge>{currentPlayer.position}</Badge>
              </div>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Predicted On-Ice Performance</CardTitle>
              <CardDescription>Based on correlation analysis of off-ice test results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-medium mb-4">Current Prediction</h4>
                  <div className="space-y-6">
                    <div className="bg-slate-100 p-6 rounded-lg text-center">
                      <div className="text-sm font-medium text-muted-foreground mb-1">30m On-Ice Sprint</div>
                      <div className="text-4xl font-bold">{predictedValues.current.sprintIce30m}s</div>
                      <div className="text-xs text-muted-foreground mt-2">Based on current off-ice test results</div>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Contributing Factors</h5>
                      <div className="flex justify-between text-sm">
                        <span>Vertical Jump:</span>
                        <span className="font-medium">{currentPlayer?.verticalJump} cm</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>30m Sprint (Off-Ice):</span>
                        <span className="font-medium">{currentPlayer?.sprint30m} s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Standing Long Jump:</span>
                        <span className="font-medium">{currentPlayer?.standingLongJump} cm</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-4">Potential Improvement</h4>
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                      <div className="text-sm font-medium text-muted-foreground mb-1">30m On-Ice Sprint</div>
                      <div className="text-4xl font-bold text-green-700">{predictedValues.withImprovement.sprintIce30m}s</div>
                      <div className="text-xs text-muted-foreground mt-2">With 5% improvement in off-ice power tests</div>
                    </div>
                    
                    <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-md">
                      <h5 className="text-sm font-medium mb-2">Recommended Focus Areas</h5>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start">
                          <div className="h-5 w-5 text-amber-500 mr-2">•</div>
                          <span>Increase vertical jump through plyometric training (box jumps, depth jumps)</span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 text-amber-500 mr-2">•</div>
                          <span>Improve sprint acceleration with resisted sprints and explosive starts</span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 text-amber-500 mr-2">•</div>
                          <span>Add slide board training 2-3 times per week to develop skating-specific strength</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Model</CardTitle>
              <CardDescription>Multiple regression equation used for prediction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm mb-4 overflow-x-auto">
                <code>
                  On-Ice 30m Time = 7.21 - 0.023 × Vertical Jump + 0.532 × Off-Ice 30m Time - 0.006 × Standing Long Jump
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                This predictive model is based on multiple linear regression analysis of data from elite hockey players. 
                The model has a strong predictive power (R² = 0.74), indicating that 74% of the variation in on-ice sprint performance 
                can be explained by these three off-ice tests.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Export Model
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="mr-2 h-4 w-4" />
                  View Historical Accuracy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}