import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Play, Save, Download, Eye } from 'lucide-react';

// A simple list of physical tests
const allTests = [
  { id: 'verticalJump', name: 'Vertical Jump', category: 'Power', isOnIce: false },
  { id: 'standingLongJump', name: 'Standing Long Jump', category: 'Power', isOnIce: false },
  { id: 'standing3StepJump', name: 'Standing 3-Step Jump', category: 'Power', isOnIce: false },
  { id: 'sprint30m', name: '30m Sprint', category: 'Speed', isOnIce: false },
  { id: 'sprint10m', name: '10m Sprint', category: 'Speed', isOnIce: false },
  { id: 'vo2max', name: 'VO2 Max Test', category: 'Aerobic', isOnIce: false },
  { id: 'beepTest', name: 'BEEP Test', category: 'Aerobic', isOnIce: false },
  { id: 'muscleCMJ', name: 'Muscle Lab CMJ', category: 'Power', isOnIce: false },
  { id: 'maxWeightPullUp', name: 'Max Weight Pull-Up', category: 'Strength', isOnIce: false },
  { id: 'gripStrength', name: 'Grip Strength', category: 'Strength', isOnIce: false },
  { id: 'sprintIce10m', name: '10m Sprint (Ice)', category: 'Speed', isOnIce: true },
  { id: 'sprintIce30m', name: '30m Sprint (Ice)', category: 'Speed', isOnIce: true },
  { id: 'flying10m', name: 'Flying 10m (Ice)', category: 'Speed', isOnIce: true }
];

// Saved correlation analyses
const savedAnalyses = [
  { 
    id: 'corr1', 
    name: 'Power vs Speed', 
    description: 'Vertical jump and on-ice speed',
    testX: 'verticalJump',
    testY: 'sprintIce30m',
    result: { r: -0.65 }
  },
  { 
    id: 'corr2', 
    name: '3-Step Jump Analysis', 
    description: '3-step jump and on-ice speed',
    testX: 'standing3StepJump',
    testY: 'sprintIce30m',
    result: { r: -0.61 }
  }
];

export default function CustomTestCorrelationTool() {
  const [activeTab, setActiveTab] = useState('create');
  const [testX, setTestX] = useState('verticalJump');
  const [testY, setTestY] = useState('sprintIce30m');
  const [showResults, setShowResults] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestCategory, setNewTestCategory] = useState('');
  const [newTestOnIce, setNewTestOnIce] = useState(false);
  
  // Filter tests by category
  const getTestsByCategory = (category) => {
    return allTests.filter(test => test.category === category);
  };
  
  // Get off-ice tests
  const getOffIceTests = () => {
    return allTests.filter(test => !test.isOnIce);
  };
  
  // Get on-ice tests
  const getOnIceTests = () => {
    return allTests.filter(test => test.isOnIce);
  };
  
  // Get test name by ID
  const getTestName = (testId) => {
    const test = allTests.find(t => t.id === testId);
    return test ? test.name : testId;
  };
  
  // Run analysis
  const runAnalysis = () => {
    setShowResults(true);
  };
  
  // Format correlation display
  const formatCorrelation = (r) => {
    // Format to 2 decimal places with sign
    return r > 0 ? `+${r.toFixed(2)}` : r.toFixed(2);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Custom Test Correlation Analysis</h1>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Analysis</TabsTrigger>
          <TabsTrigger value="saved">Saved Analyses</TabsTrigger>
          <TabsTrigger value="new-test">Add New Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Tests to Correlate</CardTitle>
              <CardDescription>Choose an off-ice test and an on-ice test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>X-Axis Test (Off-Ice)</Label>
                <Select value={testX} onValueChange={setTestX}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select off-ice test" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOffIceTests().map(test => (
                      <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Y-Axis Test (On-Ice)</Label>
                <Select value={testY} onValueChange={setTestY}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select on-ice test" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOnIceTests().map(test => (
                      <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4">
                <Button className="w-full" onClick={runAnalysis}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Correlation Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {showResults && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Correlation Results</CardTitle>
                  <Button variant="outline" size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Save Analysis
                  </Button>
                </div>
                <CardDescription>
                  {getTestName(testX)} vs. {getTestName(testY)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-100 rounded-md text-center">
                    <div className="text-sm text-muted-foreground mb-2">Correlation Coefficient (r)</div>
                    <div className="text-4xl font-bold">-0.65</div>
                    <Badge className="bg-green-100 text-green-800 mt-2">Strong</Badge>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Interpretation</h4>
                    <p className="text-sm text-blue-800">
                      There is a strong negative correlation between {getTestName(testX)} and {getTestName(testY)}. 
                      This suggests that higher values in {getTestName(testX)} are associated with lower (faster) 
                      times in {getTestName(testY)}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Correlation Analyses</CardTitle>
              <CardDescription>Previously run analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedAnalyses.map((analysis) => (
                  <div key={analysis.id} className="p-4 border rounded-md">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{analysis.name}</h3>
                      <div className="text-sm font-medium">r = {formatCorrelation(analysis.result.r)}</div>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.description}</p>
                    <div className="flex mt-2 space-x-2">
                      <Badge variant="outline">{getTestName(analysis.testX)}</Badge>
                      <span>vs.</span>
                      <Badge variant="outline">{getTestName(analysis.testY)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new-test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Test Definition</CardTitle>
              <CardDescription>Create a custom test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Name</Label>
                  <Input 
                    placeholder="e.g. 5-10-5 Pro Agility" 
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newTestCategory}
                    onValueChange={setNewTestCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Power">Power</SelectItem>
                      <SelectItem value="Speed">Speed</SelectItem>
                      <SelectItem value="Agility">Agility</SelectItem>
                      <SelectItem value="Strength">Strength</SelectItem>
                      <SelectItem value="Aerobic">Aerobic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="is-on-ice" 
                      checked={newTestOnIce}
                      onCheckedChange={setNewTestOnIce}
                    />
                    <Label htmlFor="is-on-ice">On-Ice Test</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Testing Protocol</Label>
                  <Textarea 
                    placeholder="Provide detailed instructions on how to perform this test"
                  />
                </div>
                
                <Button className="w-full">Add Test Definition</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}