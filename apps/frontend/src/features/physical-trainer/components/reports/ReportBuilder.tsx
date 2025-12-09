import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import { CircularProgress } from '@/components/ui/loading';
import {
  Description,
  Settings,
  Preview as PreviewIcon,
  Send,
  Save,
  ArrowBack,
  ArrowForward
} from '@mui/icons-material';
import { ReportConfig, ReportType, ReportFormat, ReportBuilderState } from '../../types/report.types';
import ReportTypeSelector from './ReportTypeSelector';
import ReportConfigEditor from './ReportConfigEditor';
import ReportPreview from './ReportPreview';
import ReportExportDialog from './ReportExportDialog';
import { useReportGeneration } from '../../hooks/useReportGeneration';
import { useReportTemplates } from '../../hooks/useReportTemplates';

const STEPS = ['Select Type', 'Configure', 'Preview & Export'];

interface ReportBuilderProps {
  initialConfig?: Partial<ReportConfig>;
  onSave?: (config: ReportConfig) => void;
  onCancel?: () => void;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  initialConfig,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [activeStep, setActiveStep] = useState(0);
  const [builderState, setBuilderState] = useState<ReportBuilderState>({
    config: initialConfig || {
      type: ReportType.PLAYER_PERFORMANCE,
      format: ReportFormat.PDF,
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      }
    },
    sections: [],
    isDirty: false,
    errors: {}
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { templates, getTemplatesByType } = useReportTemplates();
  const { generateReport, exportReport, validateConfig } = useReportGeneration();

  // Get available templates for selected report type
  const availableTemplates = useMemo(() => {
    if (!builderState.config.type) return [];
    return getTemplatesByType(builderState.config.type);
  }, [builderState.config.type, getTemplatesByType]);

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (activeStep === 0 && !builderState.config.type) {
      setBuilderState(prev => ({
        ...prev,
        errors: { type: 'Please select a report type' }
      }));
      return;
    }

    if (activeStep === 1) {
      // Validate configuration before proceeding to preview
      const errors = validateConfig(builderState.config);
      if (Object.keys(errors).length > 0) {
        setBuilderState(prev => ({ ...prev, errors }));
        return;
      }
    }

    setActiveStep(prev => prev + 1);
    setBuilderState(prev => ({ ...prev, errors: {} }));
  }, [activeStep, builderState.config, validateConfig]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  // Handle configuration updates
  const handleConfigUpdate = useCallback((updates: Partial<ReportConfig>) => {
    setBuilderState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates },
      isDirty: true,
      errors: {}
    }));
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setBuilderState(prev => ({
        ...prev,
        config: { ...prev.config, ...template.config },
        template,
        sections: template.sections,
        isDirty: true
      }));
    }
  }, [templates]);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      setIsGenerating(true);
      const savedConfig = await generateReport(builderState.config as ReportConfig);
      onSave?.(savedConfig);
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [builderState.config, generateReport, onSave]);

  // Handle export
  const handleExport = useCallback(async (format: ReportFormat, options?: any) => {
    try {
      setIsGenerating(true);
      await exportReport(builderState.config as ReportConfig, format, options);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [builderState.config, exportReport]);

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <ReportTypeSelector
            selectedType={builderState.config.type}
            onTypeSelect={(type) => handleConfigUpdate({ type })}
            templates={availableTemplates}
            onTemplateSelect={handleTemplateSelect}
          />
        );

      case 1:
        return (
          <ReportConfigEditor
            config={builderState.config}
            template={builderState.template}
            sections={builderState.sections}
            errors={builderState.errors}
            onConfigUpdate={handleConfigUpdate}
            onSectionsUpdate={(sections) => 
              setBuilderState(prev => ({ ...prev, sections, isDirty: true }))
            }
          />
        );

      case 2:
        return (
          <ReportPreview
            config={builderState.config as ReportConfig}
            sections={builderState.sections}
            onExport={() => setExportDialogOpen(true)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {t('physicalTrainer:reports.builder.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('physicalTrainer:reports.builder.description')}
        </Typography>
      </Paper>

      {/* Stepper */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stepper activeStep={activeStep}>
          {STEPS.map((label, index) => (
            <Step key={label}>
              <StepLabel
                icon={
                  index === 0 ? <Description /> :
                  index === 1 ? <Settings /> :
                  <PreviewIcon />
                }
              >
                {t(`physicalTrainer:reports.builder.steps.${label.toLowerCase().replace(/\s+/g, '_')}`)}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Content */}
      <Paper sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {isGenerating ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2
            }}
          >
            <CircularProgress size={60} color="currentColor" />
            <Typography variant="h6" color="text.secondary">
              {t('physicalTrainer:reports.builder.generating')}
            </Typography>
          </Box>
        ) : (
          renderStepContent()
        )}
      </Paper>

      {/* Actions */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            onClick={onCancel}
            color="inherit"
          >
            {t('common:cancel')}
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                startIcon={<ArrowBack />}
              >
                {t('common:back')}
              </Button>
            )}

            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                {t('common:next')}
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={handleSave}
                  startIcon={<Save />}
                  disabled={!builderState.isDirty}
                >
                  {t('common:save')}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setExportDialogOpen(true)}
                  startIcon={<Send />}
                >
                  {t('physicalTrainer:reports.builder.export')}
                </Button>
              </>
            )}
          </Box>
        </Box>

        {builderState.errors.general && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {builderState.errors.general}
          </Alert>
        )}
      </Paper>

      {/* Export Dialog */}
      <ReportExportDialog
        open={exportDialogOpen}
        config={builderState.config as ReportConfig}
        onExport={handleExport}
        onClose={() => setExportDialogOpen(false)}
      />
    </Box>
  );
};

export default ReportBuilder;