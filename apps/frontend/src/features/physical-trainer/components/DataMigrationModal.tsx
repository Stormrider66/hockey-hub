'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileUp, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  FileJson,
  FileSpreadsheet,
  Database,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { ImportResult } from '../utils/dataExportImport';

interface DataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (dataType: string, data: any[], options: ImportOptions) => Promise<void>;
}

interface ImportOptions {
  handleDuplicates: 'skip' | 'overwrite' | 'rename';
  validateData: boolean;
  mapFields?: Record<string, string>;
}

interface MigrationStep {
  id: number;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

export const DataMigrationModal: React.FC<DataMigrationModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<string>('exercises');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    handleDuplicates: 'skip',
    validateData: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult<any> | null>(null);

  const steps: MigrationStep[] = [
    { id: 0, title: t('physicalTrainer:dataMigration.steps.selectFile'), status: 'active' },
    { id: 1, title: t('physicalTrainer:dataMigration.steps.mapFields'), status: 'pending' },
    { id: 2, title: t('physicalTrainer:dataMigration.steps.configureOptions'), status: 'pending' },
    { id: 3, title: t('physicalTrainer:dataMigration.steps.review'), status: 'pending' },
    { id: 4, title: t('physicalTrainer:dataMigration.steps.import'), status: 'pending' }
  ];

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setErrors([]);

    try {
      // Parse file based on type
      let data: any[] = [];
      const fileType = file.name.split('.').pop()?.toLowerCase();

      if (fileType === 'json') {
        const text = await file.text();
        const parsed = JSON.parse(text);
        data = Array.isArray(parsed) ? parsed : parsed.data || [];
      } else if (fileType === 'csv') {
        // Simple CSV parsing (you might want to use a library like Papa Parse)
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          return obj;
        });
      }

      if (data.length > 0) {
        setPreviewData(data.slice(0, 5)); // Preview first 5 records
        
        // Auto-detect field mappings
        const sourceFields = Object.keys(data[0]);
        const mappings: FieldMapping[] = sourceFields.map(field => ({
          sourceField: field,
          targetField: field.toLowerCase().replace(/\s+/g, '_'),
          required: ['name', 'category', 'type'].includes(field.toLowerCase())
        }));
        setFieldMappings(mappings);
      }
    } catch (error) {
      setErrors([t('physicalTrainer:dataMigration.errors.parseError')]);
      toast.error(t('physicalTrainer:dataMigration.errors.parseError'));
    } finally {
      setIsProcessing(false);
    }
  }, [t]);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || previewData.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setErrors([]);

    try {
      // Map fields based on mappings
      const mappedData = previewData.map(item => {
        const mapped: any = {};
        fieldMappings.forEach(mapping => {
          if (mapping.targetField) {
            mapped[mapping.targetField] = item[mapping.sourceField];
          }
        });
        return mapped;
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onImport(dataType, mappedData, {
        ...importOptions,
        mapFields: fieldMappings.reduce((acc, m) => {
          acc[m.sourceField] = m.targetField;
          return acc;
        }, {} as Record<string, string>)
      });

      clearInterval(progressInterval);
      setProgress(100);

      setImportResult({
        success: true,
        data: mappedData,
        duplicates: []
      });

      toast.success(t('physicalTrainer:dataMigration.success.importComplete'));
    } catch (error) {
      setErrors([error instanceof Error ? error.message : t('physicalTrainer:dataMigration.errors.importFailed')]);
      toast.error(t('physicalTrainer:dataMigration.errors.importFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('physicalTrainer:dataMigration.dataType')}</Label>
              <RadioGroup value={dataType} onValueChange={setDataType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="exercises" id="exercises" />
                  <Label htmlFor="exercises">{t('physicalTrainer:dataMigration.types.exercises')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="templates" id="templates" />
                  <Label htmlFor="templates">{t('physicalTrainer:dataMigration.types.templates')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="testData" id="testData" />
                  <Label htmlFor="testData">{t('physicalTrainer:dataMigration.types.testData')}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">{t('physicalTrainer:dataMigration.selectFile')}</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : t('physicalTrainer:dataMigration.chooseFile')}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('physicalTrainer:dataMigration.supportedFormats')}
              </p>
            </div>

            {selectedFile && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    {selectedFile.name.endsWith('.json') && <FileJson className="h-4 w-4" />}
                    {(selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx')) && (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <CardDescription>
              {t('physicalTrainer:dataMigration.mapFieldsDescription')}
            </CardDescription>
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              <div className="space-y-3">
                {fieldMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-sm">{mapping.sourceField}</Label>
                      {mapping.required && (
                        <span className="text-xs text-destructive ml-1">*</span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={mapping.targetField}
                        onChange={(e) => {
                          const newMappings = [...fieldMappings];
                          newMappings[index].targetField = e.target.value;
                          setFieldMappings(newMappings);
                        }}
                        className="w-full px-3 py-1 text-sm border rounded-md"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('physicalTrainer:dataMigration.duplicateHandling')}</Label>
              <RadioGroup 
                value={importOptions.handleDuplicates} 
                onValueChange={(value) => setImportOptions({
                  ...importOptions,
                  handleDuplicates: value as 'skip' | 'overwrite' | 'rename'
                })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="skip" />
                  <Label htmlFor="skip">{t('physicalTrainer:dataMigration.duplicateOptions.skip')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overwrite" id="overwrite" />
                  <Label htmlFor="overwrite">{t('physicalTrainer:dataMigration.duplicateOptions.overwrite')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rename" id="rename" />
                  <Label htmlFor="rename">{t('physicalTrainer:dataMigration.duplicateOptions.rename')}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="validate"
                checked={importOptions.validateData}
                onCheckedChange={(checked) => setImportOptions({
                  ...importOptions,
                  validateData: checked as boolean
                })}
              />
              <Label htmlFor="validate">
                {t('physicalTrainer:dataMigration.validateData')}
              </Label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">{t('physicalTrainer:dataMigration.preview')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('physicalTrainer:dataMigration.dataType')}:</span>
                    <span className="font-medium">{dataType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('physicalTrainer:dataMigration.recordCount')}:</span>
                    <span className="font-medium">{previewData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('physicalTrainer:dataMigration.duplicateHandling')}:</span>
                    <span className="font-medium">{importOptions.handleDuplicates}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {previewData.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">{t('physicalTrainer:dataMigration.sampleData')}</h4>
                  <ScrollArea className="h-[200px]">
                    <pre className="text-xs">
                      {JSON.stringify(previewData[0], null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('physicalTrainer:dataMigration.importing')}</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {importResult && (
              <Card>
                <CardContent className="pt-4">
                  {importResult.success ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>{t('physicalTrainer:dataMigration.success.message')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <span>{t('physicalTrainer:dataMigration.errors.importFailed')}</span>
                    </div>
                  )}

                  {importResult.data && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {t('physicalTrainer:dataMigration.success.imported', { count: importResult.data.length })}
                    </p>
                  )}

                  {importResult.duplicates && importResult.duplicates.length > 0 && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('physicalTrainer:dataMigration.duplicatesFound', { count: importResult.duplicates.length })}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('physicalTrainer:dataMigration.title')}
            </div>
          </DialogTitle>
          <DialogDescription>
            {t('physicalTrainer:dataMigration.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    currentStep === index && "bg-primary text-primary-foreground",
                    currentStep > index && "bg-primary/20 text-primary",
                    currentStep < index && "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > index ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-2",
                      currentStep > index ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 0 || isProcessing}
          >
            {t('common:actions.previous')}
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNextStep}
              disabled={
                (currentStep === 0 && !selectedFile) ||
                (currentStep === 1 && fieldMappings.some(m => m.required && !m.targetField)) ||
                isProcessing
              }
            >
              {t('common:actions.next')}
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={isProcessing || importResult !== null}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('physicalTrainer:dataMigration.importing')}
                </>
              ) : (
                t('physicalTrainer:dataMigration.startImport')
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};