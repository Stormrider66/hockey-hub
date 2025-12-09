import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  AlertTitle,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondary,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  Collapse,
  FormGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { CircularProgress } from '@/components/ui/loading';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon,
  FitnessCenter as FitnessIcon,
  CalendarMonth as CalendarIcon,
  Merge as MergeIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import { WorkoutSession, ScheduleConflict, ValidationError } from '../../types';
import { useWorkoutValidation } from '../../hooks/useWorkoutValidation';
import { useMedicalCompliance } from '../../hooks/useMedicalCompliance';
import { useScheduleConflicts } from '../../hooks/useScheduleConflicts';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

interface BulkEditManagerProps {
  open: boolean;
  onClose: () => void;
  selectedWorkouts: WorkoutSession[];
  onBulkUpdate: (updates: Partial<WorkoutSession>, workoutIds: string[]) => Promise<void>;
  onBulkDelete: (workoutIds: string[]) => Promise<void>;
  onBulkDuplicate: (workoutIds: string[], options: DuplicateOptions) => Promise<void>;
}

interface DuplicateOptions {
  offsetDays: number;
  duplicateAssignments: boolean;
  updateTitle: boolean;
}

interface BulkOperation {
  type: 'update' | 'delete' | 'duplicate' | 'merge' | 'compare';
  fields?: string[];
  values?: Record<string, any>;
  options?: any;
}

export const BulkEditManager: React.FC<BulkEditManagerProps> = ({
  open,
  onClose,
  selectedWorkouts,
  onBulkUpdate,
  onBulkDelete,
  onBulkDuplicate,
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [operation, setOperation] = useState<BulkOperation['type']>('update');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [duplicateOptions, setDuplicateOptions] = useState<DuplicateOptions>({
    offsetDays: 7,
    duplicateAssignments: true,
    updateTitle: true,
  });
  const [showConflicts, setShowConflicts] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const { validateBulkUpdate } = useWorkoutValidation();
  const { checkBulkCompliance } = useMedicalCompliance();
  const { checkBulkConflicts } = useScheduleConflicts();

  // Available fields for bulk editing
  const editableFields = [
    { id: 'location', label: t('bulk.fields.location'), icon: <LocationIcon /> },
    { id: 'intensity', label: t('bulk.fields.intensity'), icon: <FitnessIcon /> },
    { id: 'teamId', label: t('bulk.fields.team'), icon: <GroupIcon /> },
    { id: 'scheduledDate', label: t('bulk.fields.date'), icon: <CalendarIcon /> },
    { id: 'duration', label: t('bulk.fields.duration'), icon: <ScheduleIcon /> },
    { id: 'status', label: t('bulk.fields.status'), icon: <CheckCircleIcon /> },
  ];

  // Calculate conflicts for selected workouts
  const conflicts = useMemo(() => {
    if (operation === 'update' && fieldValues.scheduledDate) {
      return checkBulkConflicts(selectedWorkouts, fieldValues);
    }
    return [];
  }, [selectedWorkouts, fieldValues, operation]);

  // Medical compliance check
  const complianceIssues = useMemo(() => {
    return checkBulkCompliance(selectedWorkouts);
  }, [selectedWorkouts]);

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleExecute = async () => {
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const workoutIds = selectedWorkouts.map(w => w.id.toString());

      switch (operation) {
        case 'update':
          // Validate updates
          const validation = await validateBulkUpdate(selectedWorkouts, fieldValues);
          if (!validation.isValid) {
            setValidationErrors(validation.errors);
            setIsProcessing(false);
            return;
          }

          // Apply only selected fields
          const updates = selectedFields.reduce((acc, field) => {
            if (fieldValues[field] !== undefined) {
              acc[field] = fieldValues[field];
            }
            return acc;
          }, {} as Record<string, any>);

          await onBulkUpdate(updates, workoutIds);
          break;

        case 'delete':
          if (window.confirm(t('bulk.confirmDelete', { count: selectedWorkouts.length }))) {
            await onBulkDelete(workoutIds);
          }
          break;

        case 'duplicate':
          await onBulkDuplicate(workoutIds, duplicateOptions);
          break;

        case 'merge':
          // TODO: Implement merge functionality
          console.log('Merge operation not yet implemented');
          break;

        case 'compare':
          // This will open comparison view
          handleCompare();
          break;
      }

      onClose();
    } catch (error) {
      console.error('Bulk operation failed:', error);
      setValidationErrors([{
        field: 'general',
        message: t('bulk.error.operationFailed'),
        code: 'OPERATION_FAILED'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompare = () => {
    // Open comparison view in new window/modal
    const comparisonUrl = `/trainer/workouts/compare?ids=${selectedWorkouts.map(w => w.id).join(',')}`;
    window.open(comparisonUrl, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {t('bulk.title', { count: selectedWorkouts.length })}
          </Typography>
          <Box>
            {conflicts.length > 0 && (
              <Tooltip title={t('bulk.conflicts', { count: conflicts.length })}>
                <Badge badgeContent={conflicts.length} color="warning">
                  <IconButton size="small" onClick={() => setShowConflicts(!showConflicts)}>
                    <WarningIcon />
                  </IconButton>
                </Badge>
              </Tooltip>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Operation selector */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('bulk.operation')}</InputLabel>
          <Select
            value={operation}
            onChange={(e) => setOperation(e.target.value as BulkOperation['type'])}
            label={t('bulk.operation')}
          >
            <MenuItem value="update">
              <Box display="flex" alignItems="center" gap={1}>
                <EditIcon fontSize="small" />
                {t('bulk.operations.update')}
              </Box>
            </MenuItem>
            <MenuItem value="duplicate">
              <Box display="flex" alignItems="center" gap={1}>
                <CopyIcon fontSize="small" />
                {t('bulk.operations.duplicate')}
              </Box>
            </MenuItem>
            <MenuItem value="delete">
              <Box display="flex" alignItems="center" gap={1}>
                <DeleteIcon fontSize="small" />
                {t('bulk.operations.delete')}
              </Box>
            </MenuItem>
            <MenuItem value="compare">
              <Box display="flex" alignItems="center" gap={1}>
                <CompareIcon fontSize="small" />
                {t('bulk.operations.compare')}
              </Box>
            </MenuItem>
            <MenuItem value="merge" disabled>
              <Box display="flex" alignItems="center" gap={1}>
                <MergeIcon fontSize="small" />
                {t('bulk.operations.merge')} (Coming soon)
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>{t('bulk.validationErrors')}</AlertTitle>
            <List dense>
              {validationErrors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemText primary={error.message} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {/* Conflicts display */}
        <Collapse in={showConflicts && conflicts.length > 0}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>{t('bulk.schedulingConflicts')}</AlertTitle>
            <List dense>
              {conflicts.slice(0, 5).map((conflict, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={conflict.playerName}
                    secondary={`${conflict.eventTitle} at ${conflict.eventTime}`}
                  />
                </ListItem>
              ))}
              {conflicts.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  {t('bulk.moreConflicts', { count: conflicts.length - 5 })}
                </Typography>
              )}
            </List>
          </Alert>
        </Collapse>

        {/* Medical compliance warnings */}
        {complianceIssues.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>{t('bulk.medicalCompliance')}</AlertTitle>
            <Typography variant="body2">
              {t('bulk.complianceWarning', { count: complianceIssues.length })}
            </Typography>
          </Alert>
        )}

        {/* Operation-specific content */}
        {operation === 'update' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('bulk.selectFields')}
            </Typography>
            <List>
              {editableFields.map(field => (
                <ListItem key={field.id}>
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedFields.includes(field.id)}
                      onChange={() => handleFieldToggle(field.id)}
                    />
                  </ListItemIcon>
                  <ListItemIcon>{field.icon}</ListItemIcon>
                  <ListItemText primary={field.label} />
                  {selectedFields.includes(field.id) && (
                    <Box sx={{ minWidth: 200 }}>
                      {field.id === 'scheduledDate' ? (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DateTimePicker
                            label={field.label}
                            value={fieldValues[field.id] || null}
                            onChange={(value) => handleFieldChange(field.id, value)}
                            slotProps={{
                              textField: { size: 'small', fullWidth: true }
                            }}
                          />
                        </LocalizationProvider>
                      ) : field.id === 'intensity' ? (
                        <Select
                          size="small"
                          fullWidth
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        >
                          <MenuItem value="low">{t('intensity.low')}</MenuItem>
                          <MenuItem value="medium">{t('intensity.medium')}</MenuItem>
                          <MenuItem value="high">{t('intensity.high')}</MenuItem>
                          <MenuItem value="max">{t('intensity.max')}</MenuItem>
                        </Select>
                      ) : field.id === 'status' ? (
                        <Select
                          size="small"
                          fullWidth
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        >
                          <MenuItem value="scheduled">{t('status.scheduled')}</MenuItem>
                          <MenuItem value="cancelled">{t('status.cancelled')}</MenuItem>
                        </Select>
                      ) : (
                        <TextField
                          size="small"
                          fullWidth
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          type={field.id === 'duration' ? 'number' : 'text'}
                        />
                      )}
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {operation === 'duplicate' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('bulk.duplicateOptions')}
            </Typography>
            <Stack spacing={2}>
              <TextField
                label={t('bulk.offsetDays')}
                type="number"
                value={duplicateOptions.offsetDays}
                onChange={(e) => setDuplicateOptions(prev => ({
                  ...prev,
                  offsetDays: parseInt(e.target.value) || 0
                }))}
                helperText={t('bulk.offsetDaysHelp')}
              />
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={duplicateOptions.duplicateAssignments}
                      onChange={(e) => setDuplicateOptions(prev => ({
                        ...prev,
                        duplicateAssignments: e.target.checked
                      }))}
                    />
                  }
                  label={t('bulk.duplicateAssignments')}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={duplicateOptions.updateTitle}
                      onChange={(e) => setDuplicateOptions(prev => ({
                        ...prev,
                        updateTitle: e.target.checked
                      }))}
                    />
                  }
                  label={t('bulk.updateTitle')}
                />
              </FormGroup>
            </Stack>
          </Box>
        )}

        {operation === 'delete' && (
          <Alert severity="error">
            <AlertTitle>{t('bulk.deleteWarning.title')}</AlertTitle>
            <Typography variant="body2">
              {t('bulk.deleteWarning.message', { count: selectedWorkouts.length })}
            </Typography>
            <List dense sx={{ mt: 1 }}>
              {selectedWorkouts.slice(0, 5).map(workout => (
                <ListItem key={workout.id}>
                  <ListItemText
                    primary={workout.title}
                    secondary={new Date(workout.scheduledDate).toLocaleDateString()}
                  />
                </ListItem>
              ))}
              {selectedWorkouts.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  {t('bulk.moreWorkouts', { count: selectedWorkouts.length - 5 })}
                </Typography>
              )}
            </List>
          </Alert>
        )}

        {/* Selected workouts summary */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('bulk.selectedWorkouts')}
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedWorkouts.map(workout => (
              <Chip
                key={workout.id}
                label={workout.title}
                size="small"
                color={workout.type === 'conditioning' ? 'error' : 'primary'}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          onClick={handleExecute}
          variant="contained"
          color={operation === 'delete' ? 'error' : 'primary'}
          disabled={isProcessing || (operation === 'update' && selectedFields.length === 0)}
          startIcon={isProcessing ? <CircularProgress size={16} color="currentColor" /> : null}
        >
          {isProcessing ? t('bulk.processing') : t(`bulk.execute.${operation}`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};