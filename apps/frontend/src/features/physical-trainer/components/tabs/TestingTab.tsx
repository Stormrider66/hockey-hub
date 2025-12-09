'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TestTube2, Download } from 'lucide-react';
import PhysicalAnalysisCharts from '../PhysicalAnalysisCharts';
import PhysicalTestingForm from '../PhysicalTestingForm';
import TestCollectionDashboard from './TestCollectionDashboard';
import { ReportExporter } from '../ReportExporter';
import { exportTestData, ExportOptions } from '../../utils/dataExportImport';
import { toast } from 'sonner';
import type { Player, TestFormData } from '../../types';

interface TestingTabProps {
  selectedTeamId: string | null;
  players: Player[];
  onSubmitTest: (data: TestFormData) => void;
  onSaveDraft: (data: TestFormData) => void;
}

export default function TestingTab({ selectedTeamId, players, onSubmitTest, onSaveDraft }: TestingTabProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [testData, setTestData] = useState<any[]>([]);

  const handleExportTestData = async (options: ExportOptions) => {
    try {
      // Get test data from API or current state
      // For now, using mock data
      const mockTestData = [
        {
          id: '1',
          player: 'Sidney Crosby',
          testType: 'VO2 Max',
          value: 58.5,
          date: new Date().toISOString(),
          team: 'Team A'
        },
        {
          id: '2',
          player: 'Connor McDavid',
          testType: 'Vertical Jump',
          value: 32.5,
          date: new Date().toISOString(),
          team: 'Team A'
        }
      ];

      await exportTestData(mockTestData, options);
      toast.success(t('physicalTrainer:testing.export.success'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('physicalTrainer:testing.export.error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('physicalTrainer:testing.title')}</h2>
          <p className="text-muted-foreground">{t('physicalTrainer:testing.subtitle')}</p>
        </div>
        <ReportExporter
          data={testData}
          dataType="test"
          onExport={handleExportTestData}
          includeCharts={true}
        />
      </div>

      <Tabs defaultValue="collection" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collection">{t('physicalTrainer:testing.tabs.collection')}</TabsTrigger>
          <TabsTrigger value="analysis">{t('physicalTrainer:testing.tabs.analysis')}</TabsTrigger>
          <TabsTrigger value="form">{t('physicalTrainer:testing.tabs.newTest')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="collection" className="mt-6">
          <TestCollectionDashboard players={players} />
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-6">
          <PhysicalAnalysisCharts />
        </TabsContent>
        
        <TabsContent value="form" className="mt-6">
          <PhysicalTestingForm 
            players={players}
            onSubmit={onSubmitTest}
            onSaveDraft={onSaveDraft}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}