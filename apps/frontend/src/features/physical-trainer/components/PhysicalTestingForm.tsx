'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Save, Send, Plus, X, CheckCircle2, AlertCircle, 
  Activity, Zap, Heart, Timer, TrendingUp, User
} from 'lucide-react';
import { type Player } from '@/hooks/useTestData';
import { useCreateBulkTestsMutation, useCreateTestBatchMutation } from '@/store/api/trainingApi';
import type { TestFormData } from '../types';
import { toast } from 'react-hot-toast';

interface TestEntry {
  id: string;
  playerId: string;
  testType: string;
  value: string;
  unit: string;
  notes: string;
}

interface PhysicalTestingFormProps {
  players?: Player[];
  onSubmit?: (data: TestFormData) => void;
  onSaveDraft?: (data: TestFormData) => void;
}

const TEST_TYPES = [
  { name: 'Vertical Jump', unit: 'cm', category: 'Power', icon: Zap },
  { name: 'Broad Jump', unit: 'cm', category: 'Power', icon: Zap },
  { name: 'Bench Press 1RM', unit: 'kg', category: 'Strength', icon: Activity },
  { name: 'Squat 1RM', unit: 'kg', category: 'Strength', icon: Activity },
  { name: 'VO2 Max', unit: 'ml/kg/min', category: 'Endurance', icon: Heart },
  { name: '40m Sprint', unit: 'seconds', category: 'Speed', icon: Timer },
  { name: 'Agility T-Test', unit: 'seconds', category: 'Agility', icon: Timer },
  { name: 'Flexibility (Sit & Reach)', unit: 'cm', category: 'Flexibility', icon: TrendingUp },
  { name: 'Body Fat %', unit: '%', category: 'Body Composition', icon: User },
  { name: 'Grip Strength', unit: 'kg', category: 'Strength', icon: Activity }
];

export default function PhysicalTestingForm({ 
  players = [], 
  onSubmit, 
  onSaveDraft 
}: PhysicalTestingFormProps) {
  const [createBulkTests, { isLoading: isSubmitting }] = useCreateBulkTestsMutation();
  const [createTestBatch] = useCreateTestBatchMutation();
  const [testEntries, setTestEntries] = useState<TestEntry[]>([]);
  const [selectedTestType, setSelectedTestType] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [activeTab, setActiveTab] = useState('individual');
  const [bulkTestType, setBulkTestType] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  // Add a new test entry
  const addTestEntry = (playerId: string) => {
    if (!selectedTestType) return;
    
    const testTypeInfo = TEST_TYPES.find(t => t.name === selectedTestType);
    if (!testTypeInfo) return;

    const newEntry: TestEntry = {
      id: `${Date.now()}-${Math.random()}`,
      playerId,
      testType: selectedTestType,
      value: '',
      unit: testTypeInfo.unit,
      notes: ''
    };

    setTestEntries([...testEntries, newEntry]);
  };

  // Update a test entry
  const updateTestEntry = (id: string, field: keyof TestEntry, value: string) => {
    setTestEntries(entries => 
      entries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Remove a test entry
  const removeTestEntry = (id: string) => {
    setTestEntries(entries => entries.filter(entry => entry.id !== id));
  };

  // Validate entries
  const validateEntries = () => {
    return testEntries.every(entry => 
      entry.value && !isNaN(parseFloat(entry.value))
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateEntries()) {
      toast.error('Please fill in all test values with valid numbers');
      return;
    }

    try {
      // Create test batch first if we don't have one
      let batchId = currentBatchId;
      if (!batchId && batchName) {
        const batch = await createTestBatch({
          name: batchName,
          date: new Date().toISOString().split('T')[0],
          notes: batchNotes
        }).unwrap();
        batchId = batch.id;
        setCurrentBatchId(batchId);
      }

      // Format test entries for API
      const apiTests = testEntries.map(entry => ({
        playerId: entry.playerId,
        testBatchId: batchId || 'default',
        testType: entry.testType,
        value: parseFloat(entry.value),
        unit: entry.unit,
        notes: entry.notes
      }));

      // Submit tests to API
      await createBulkTests(apiTests).unwrap();

      if (onSubmit) {
        onSubmit(testEntries);
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast.success('Test results submitted successfully!');
      
      // Reset form
      setTestEntries([]);
      setBatchName('');
      setBatchNotes('');
      setCurrentBatchId(null);
    } catch (error) {
      console.error('Failed to submit tests:', error);
      toast.error('Failed to submit test results. Please try again.');
    }
  };

  // Handle draft save
  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(testEntries);
    }
  };

  // Add bulk entries for all players with selected test type
  const addBulkEntries = () => {
    if (!bulkTestType) return;
    
    const testTypeInfo = TEST_TYPES.find(t => t.name === bulkTestType);
    if (!testTypeInfo) return;

    const newEntries = players.map(player => ({
      id: `${Date.now()}-${player.id}-${Math.random()}`,
      playerId: player.id,
      testType: bulkTestType,
      value: '',
      unit: testTypeInfo.unit,
      notes: ''
    }));

    setTestEntries([...testEntries, ...newEntries]);
    setBulkTestType('');
  };

  // Group entries by player
  const entriesByPlayer = testEntries.reduce((acc, entry) => {
    if (!acc[entry.playerId]) {
      acc[entry.playerId] = [];
    }
    acc[entry.playerId].push(entry);
    return acc;
  }, {} as Record<string, TestEntry[]>);

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {showSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Test results submitted successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Batch Information */}
      <Card>
        <CardHeader>
          <CardTitle>Test Batch Information</CardTitle>
          <CardDescription>Create a new test batch or add to existing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="batch-name">Batch Name</Label>
            <Input
              id="batch-name"
              placeholder="e.g., Pre-Season 2024"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="batch-notes">Notes</Label>
            <Textarea
              id="batch-notes"
              placeholder="Additional notes about this test batch..."
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{testEntries.length} test entries added</span>
          </div>
        </CardContent>
      </Card>

      {/* Test Entry Methods */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Individual Tests</CardTitle>
              <CardDescription>Select a test type and add results for individual players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Test Type Selection */}
                <div>
                  <Label>Select Test Type</Label>
                  <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                    <SelectTrigger data-testid="test-type-select-trigger">
                      <SelectValue placeholder="Choose a test type" style={{ pointerEvents: 'auto' }} />
                    </SelectTrigger>
                    <SelectContent>
                      {TEST_TYPES.map(test => (
                        <SelectItem key={test.name} value={test.name}>
                          <div className="flex items-center gap-2">
                            <test.icon className="h-4 w-4" />
                            <span>{test.name}</span>
                            <Badge variant="outline" className="ml-auto">
                              {test.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Player Selection */}
                {selectedTestType && (
                  <div>
                    <Label>Add Test for Player</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {players.map(player => {
                        const hasEntry = testEntries.some(
                          e => e.playerId === player.id && e.testType === selectedTestType
                        );
                        return (
                          <Button
                            key={player.id}
                            variant={hasEntry ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => !hasEntry && addTestEntry(player.id)}
                            disabled={hasEntry}
                          >
                            <User className="h-4 w-4 mr-2" />
                            {player.name}
                            {hasEntry && <CheckCircle2 className="h-4 w-4 ml-2" />}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Test Entry</CardTitle>
              <CardDescription>Add the same test type for all players at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select Test Type for All Players</Label>
                  <Select value={bulkTestType} onValueChange={setBulkTestType}>
                    <SelectTrigger data-testid="bulk-test-type-select-trigger">
                      <SelectValue placeholder="Choose a test type" style={{ pointerEvents: 'auto' }} />
                    </SelectTrigger>
                    <SelectContent>
                      {TEST_TYPES.map(test => (
                        <SelectItem key={test.name} value={test.name}>
                          <div className="flex items-center gap-2">
                            <test.icon className="h-4 w-4" />
                            <span>{test.name}</span>
                            <Badge variant="outline" className="ml-auto">
                              {test.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={addBulkEntries} 
                  disabled={!bulkTestType}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {bulkTestType} for All {players.length} Players
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Entries */}
      {Object.keys(entriesByPlayer).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Entry</CardTitle>
            <CardDescription>Enter test values for each player</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(entriesByPlayer).map(([playerId, entries]) => {
                const player = players.find(p => p.id === playerId);
                if (!player) return null;

                return (
                  <div key={playerId} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {player.name}
                      <Badge variant="outline" className="ml-auto">
                        {player.position}
                      </Badge>
                    </h4>
                    <div className="space-y-3">
                      {entries.map(entry => {
                        const testInfo = TEST_TYPES.find(t => t.name === entry.testType);
                        return (
                          <div key={entry.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3 flex items-center gap-2">
                              {testInfo && <testInfo.icon className="h-4 w-4 text-muted-foreground" />}
                              <span className="text-sm font-medium">{entry.testType}</span>
                            </div>
                            <div className="col-span-3">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  placeholder="Value"
                                  value={entry.value}
                                  onChange={(e) => updateTestEntry(entry.id, 'value', e.target.value)}
                                  step="0.01"
                                />
                                <span className="text-sm text-muted-foreground">{entry.unit}</span>
                              </div>
                            </div>
                            <div className="col-span-5">
                              <Input
                                placeholder="Notes (optional)"
                                value={entry.notes}
                                onChange={(e) => updateTestEntry(entry.id, 'notes', e.target.value)}
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTestEntry(entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {testEntries.length > 0 && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={!validateEntries() || isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Results
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}