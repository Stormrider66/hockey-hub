'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  FilePieChart,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

// Import our utilities
import { ReportExporter } from './ReportExporter';
import { DataMigrationModal } from './DataMigrationModal';
import { 
  exportExercises, 
  exportTemplates, 
  exportTestData,
  ExportOptions 
} from '../utils/dataExportImport';

// Mock data for demonstration
const mockExercises = [
  { id: 1, name: 'Squat', category: 'strength', sets: 3, reps: 10, weight: 100 },
  { id: 2, name: 'Deadlift', category: 'strength', sets: 3, reps: 8, weight: 120 },
  { id: 3, name: 'Bench Press', category: 'strength', sets: 3, reps: 10, weight: 80 },
];

const mockTemplates = [
  {
    id: '1',
    name: 'Strength Training - Upper Body',
    type: 'strength',
    duration: 60,
    targetPlayers: 'all',
    description: 'Complete upper body workout',
    exercises: [
      { name: 'Bench Press', duration: 15, intensity: 'high' },
      { name: 'Pull-ups', duration: 10, intensity: 'medium' },
      { name: 'Shoulder Press', duration: 15, intensity: 'high' },
    ],
    createdBy: 'John Doe',
    useCount: 25,
  },
  {
    id: '2',
    name: 'HIIT Cardio Circuit',
    type: 'cardio',
    duration: 45,
    targetPlayers: 'forwards',
    description: 'High-intensity interval training',
    exercises: [
      { name: 'Sprint Intervals', duration: 20, intensity: 'high' },
      { name: 'Box Jumps', duration: 10, intensity: 'high' },
      { name: 'Battle Ropes', duration: 15, intensity: 'high' },
    ],
    createdBy: 'Jane Smith',
    useCount: 18,
  },
];

const mockTestData = [
  { id: 1, player: 'Sidney Crosby', testType: 'VO2 Max', value: 58.5, date: '2025-01-15', team: 'Team A' },
  { id: 2, player: 'Connor McDavid', testType: 'Vertical Jump', value: 32.5, date: '2025-01-15', team: 'Team A' },
  { id: 3, player: 'Nathan MacKinnon', testType: 'Sprint Speed', value: 4.2, date: '2025-01-14', team: 'Team B' },
];

export const ExportImportExample: React.FC = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('exercises');

  const handleExport = async (options: ExportOptions) => {
    try {
      switch (activeTab) {
        case 'exercises':
          await exportExercises(mockExercises as any, options);
          break;
        case 'templates':
          await exportTemplates(mockTemplates as any, options);
          break;
        case 'testData':
          await exportTestData(mockTestData, { ...options, testType: 'all' });
          break;
      }
      toast.success(`${activeTab} exported successfully!`);
    } catch (error) {
      toast.error(`Failed to export ${activeTab}`);
    }
  };

  const handleImport = async (dataType: string, data: any[], options: any) => {
    // Simulate import process
    console.log('Importing:', { dataType, data, options });
    toast.success(`Successfully imported ${data.length} items`);
    setShowImportModal(false);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Export/Import Functionality</CardTitle>
          <CardDescription>
            Comprehensive tools for exporting and importing your Physical Trainer data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
              Export your data in multiple formats (JSON, CSV, Excel, PDF) and import data from other systems. 
              Perfect for data migration, backups, and sharing templates between organizations.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exercises">Exercise Library</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="testData">Test Data</TabsTrigger>
            </TabsList>

            <TabsContent value="exercises" className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Exercise Library Export/Import</h3>
                  <p className="text-sm text-muted-foreground">
                    Export your entire exercise database or import exercises from other systems
                  </p>
                </div>
                <div className="flex gap-2">
                  <ReportExporter
                    data={mockExercises}
                    dataType="test"
                    onExport={handleExport}
                  />
                  <Button variant="outline" onClick={() => setShowImportModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Export Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Export all or selected exercises</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Multiple format support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Include exercise parameters and notes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Filter by category before export</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Import Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Import from JSON, CSV, or Excel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Automatic duplicate detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Field mapping and validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Preview before import</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sample data preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sample Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockExercises.map((exercise) => (
                      <div key={exercise.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{exercise.name}</span>
                          <Badge variant="outline" className="ml-2">{exercise.category}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {exercise.sets}x{exercise.reps} @ {exercise.weight}lbs
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Template Export/Import</h3>
                  <p className="text-sm text-muted-foreground">
                    Share workout templates between trainers or organizations
                  </p>
                </div>
                <div className="flex gap-2">
                  <ReportExporter
                    data={mockTemplates}
                    dataType="test"
                    onExport={handleExport}
                  />
                  <Button variant="outline" onClick={() => setShowImportModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Template Sharing</AlertTitle>
                <AlertDescription>
                  Templates can be exported with all exercise configurations and shared with other 
                  Physical Trainers. Import maintains all workout parameters and structure.
                </AlertDescription>
              </Alert>

              {/* Sample templates */}
              <div className="grid gap-4">
                {mockTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription>
                            {template.duration} min • {template.exercises.length} exercises • Used {template.useCount} times
                          </CardDescription>
                        </div>
                        <Badge variant={template.type === 'strength' ? 'default' : 'secondary'}>
                          {template.type}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="testData" className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Test Data Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Export fitness test results for analysis and reporting
                  </p>
                </div>
                <ReportExporter
                  data={mockTestData}
                  dataType="test"
                  onExport={handleExport}
                  includeCharts={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Raw data format for system integration
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Multiple sheets with formatted data
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FilePieChart className="h-4 w-4" />
                      PDF Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Professional reports with charts
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sample test data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockTestData.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{test.player}</span>
                          <Badge variant="outline" className="ml-2">{test.testType}</Badge>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{test.value}</span>
                          <span className="text-muted-foreground ml-2">{test.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Data Migration Modal */}
      {showImportModal && (
        <DataMigrationModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
};