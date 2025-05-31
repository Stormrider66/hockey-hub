'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Save, AlertCircle, CheckCircle2, Info,
  Ruler, Zap, Timer, Dumbbell, Navigation, Wind, Flame, Target,
  ChevronRight, User, ClipboardList
} from 'lucide-react';

interface TestFormData {
  playerId: string;
  date: Date;
  testBatchId?: string;
  notes?: string;
  environmentalConditions?: {
    temperature?: number;
    humidity?: number;
    surface?: string;
  };
  [key: string]: any;
}

interface PhysicalTestingFormProps {
  players: Array<{ id: string; name: string; position: string; number: number }>;
  onSubmit: (data: TestFormData) => void;
  onSaveDraft?: (data: Partial<TestFormData>) => void;
  initialData?: Partial<TestFormData>;
}

export default function PhysicalTestingForm({ 
  players, 
  onSubmit, 
  onSaveDraft,
  initialData 
}: PhysicalTestingFormProps) {
  const [formData, setFormData] = useState<Partial<TestFormData>>(initialData || {});
  const [activeTab, setActiveTab] = useState('player-info');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [date, setDate] = useState<Date | undefined>(formData.date || new Date());

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.playerId) {
      newErrors.playerId = 'Please select a player';
    }
    if (!date) {
      newErrors.date = 'Please select a test date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setSaveStatus('saving');
      const submitData = { ...formData, date: date! } as TestFormData;
      
      // Simulate API call
      setTimeout(() => {
        onSubmit(submitData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }, 1000);
    }
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      setSaveStatus('saving');
      setTimeout(() => {
        onSaveDraft({ ...formData, date });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }, 500);
    }
  };

  const tabs = [
    { id: 'player-info', label: 'Player Info', icon: User },
    { id: 'anthropometric', label: 'Basic Measurements', icon: Ruler },
    { id: 'power', label: 'Power Tests', icon: Zap },
    { id: 'speed', label: 'Speed Tests', icon: Timer },
    { id: 'strength', label: 'Strength Tests', icon: Dumbbell },
    { id: 'agility', label: 'Agility Tests', icon: Navigation },
    { id: 'endurance', label: 'Endurance Tests', icon: Wind },
    { id: 'specific', label: 'Hockey Specific', icon: Target },
    { id: 'notes', label: 'Notes & Review', icon: ClipboardList }
  ];

  const getTabCompletionStatus = (tabId: string): 'complete' | 'partial' | 'empty' => {
    switch (tabId) {
      case 'player-info':
        return formData.playerId && date ? 'complete' : 'empty';
      case 'anthropometric':
        return formData.height && formData.weight ? 'complete' : formData.height || formData.weight ? 'partial' : 'empty';
      case 'power':
        return formData.verticalJump ? 'partial' : 'empty';
      default:
        return 'empty';
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Physical Testing Data Collection</CardTitle>
            <CardDescription>
              Enter test results for athletes. All data is automatically saved as you type.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {saveStatus === 'saved' && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
            {saveStatus === 'saving' && (
              <Badge variant="outline">
                <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Saving...
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-9 h-auto">
            {tabs.map((tab) => {
              const status = getTabCompletionStatus(tab.id);
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col gap-1 h-auto py-2 relative"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{tab.label}</span>
                  {status === 'complete' && (
                    <div className="absolute top-1 right-1 h-2 w-2 bg-green-500 rounded-full" />
                  )}
                  {status === 'partial' && (
                    <div className="absolute top-1 right-1 h-2 w-2 bg-amber-500 rounded-full" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Player Info Tab */}
          <TabsContent value="player-info" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="player">Select Player *</Label>
                <Select value={formData.playerId} onValueChange={(value) => updateField('playerId', value)}>
                  <SelectTrigger className={errors.playerId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose a player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map(player => (
                      <SelectItem key={player.id} value={player.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{player.number}</Badge>
                          <span>{player.name}</span>
                          <span className="text-muted-foreground">- {player.position}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.playerId && (
                  <p className="text-sm text-red-500">{errors.playerId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Test Date *</Label>
                <Input
                  type="date"
                  value={date ? date.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : undefined;
                    updateField('date', newDate);
                    setDate(newDate);
                  }}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testBatch">Test Batch (Optional)</Label>
              <Select value={formData.testBatchId} onValueChange={(value) => updateField('testBatchId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to a test batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batch1">Pre-Season Testing 2024</SelectItem>
                  <SelectItem value="batch2">Mid-Season Check</SelectItem>
                  <SelectItem value="batch3">Post-Season Evaluation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Environmental Conditions</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      placeholder="20"
                      value={formData.environmentalConditions?.temperature || ''}
                      onChange={(e) => updateField('environmentalConditions', {
                        ...formData.environmentalConditions,
                        temperature: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="humidity">Humidity (%)</Label>
                    <Input
                      id="humidity"
                      type="number"
                      placeholder="60"
                      value={formData.environmentalConditions?.humidity || ''}
                      onChange={(e) => updateField('environmentalConditions', {
                        ...formData.environmentalConditions,
                        humidity: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surface">Surface</Label>
                    <Select 
                      value={formData.environmentalConditions?.surface}
                      onValueChange={(value) => updateField('environmentalConditions', {
                        ...formData.environmentalConditions,
                        surface: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select surface" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                        <SelectItem value="ice">Ice</SelectItem>
                        <SelectItem value="turf">Turf</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Anthropometric Tab */}
          <TabsContent value="anthropometric" className="space-y-4 mt-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  placeholder="180.0"
                  value={formData.height || ''}
                  onChange={(e) => updateField('height', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="85.0"
                  value={formData.weight || ''}
                  onChange={(e) => updateField('weight', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat">Body Fat (%)</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  step="0.1"
                  placeholder="12.5"
                  value={formData.bodyFat || ''}
                  onChange={(e) => updateField('bodyFat', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="armSpan">Arm Span (cm)</Label>
                <Input
                  id="armSpan"
                  type="number"
                  step="0.1"
                  placeholder="185.0"
                  value={formData.armSpan || ''}
                  onChange={(e) => updateField('armSpan', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sittingHeight">Sitting Height (cm)</Label>
                <Input
                  id="sittingHeight"
                  type="number"
                  step="0.1"
                  placeholder="95.0"
                  value={formData.sittingHeight || ''}
                  onChange={(e) => updateField('sittingHeight', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ensure all measurements are taken following standardized protocols. 
                Height should be measured without shoes, weight in minimal clothing.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Power Tests Tab */}
          <TabsContent value="power" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vertical Jump Tests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verticalJump">Vertical Jump (CMJ) - cm</Label>
                    <Input
                      id="verticalJump"
                      type="number"
                      step="0.1"
                      placeholder="55.0"
                      value={formData.verticalJump || ''}
                      onChange={(e) => updateField('verticalJump', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verticalJumpNoArms">Vertical Jump (No Arms) - cm</Label>
                    <Input
                      id="verticalJumpNoArms"
                      type="number"
                      step="0.1"
                      placeholder="48.0"
                      value={formData.verticalJumpNoArms || ''}
                      onChange={(e) => updateField('verticalJumpNoArms', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="squatJump">Squat Jump - cm</Label>
                    <Input
                      id="squatJump"
                      type="number"
                      step="0.1"
                      placeholder="45.0"
                      value={formData.squatJump || ''}
                      onChange={(e) => updateField('squatJump', parseFloat(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Horizontal Jump Tests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="standingLongJump">Standing Long Jump - cm</Label>
                    <Input
                      id="standingLongJump"
                      type="number"
                      step="1"
                      placeholder="250"
                      value={formData.standingLongJump || ''}
                      onChange={(e) => updateField('standingLongJump', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threeStepJump">3-Step Jump - cm</Label>
                    <Input
                      id="threeStepJump"
                      type="number"
                      step="1"
                      placeholder="750"
                      value={formData.threeStepJump || ''}
                      onChange={(e) => updateField('threeStepJump', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicineballThrow">Medicine Ball Throw - cm</Label>
                    <Input
                      id="medicineballThrow"
                      type="number"
                      step="1"
                      placeholder="600"
                      value={formData.medicineballThrow || ''}
                      onChange={(e) => updateField('medicineballThrow', parseFloat(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Additional tabs would follow the same pattern... */}

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Test Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any observations, issues, or comments about the testing session..."
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="min-h-32"
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Review Before Submitting</AlertTitle>
                <AlertDescription className="mt-2">
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Ensure all required fields are completed</li>
                    <li>Double-check all measurements and values</li>
                    <li>Verify the correct player and date are selected</li>
                    <li>Add any relevant notes about test conditions or athlete status</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleSaveDraft}>
                  Save as Draft
                </Button>
                <Button onClick={handleSubmit}>
                  <Save className="mr-2 h-4 w-4" />
                  Submit Test Results
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 