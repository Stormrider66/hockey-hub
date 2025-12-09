import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  useTheme,
} from '@mui/material';
import {
  CompareArrows as CompareIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  SwapHoriz as SwapIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  FitnessCenter as StrengthIcon,
  DirectionsRun as ConditioningIcon,
  SportsMartialArts as AgilityIcon,
  Merge as HybridIcon,
  CheckCircle as MatchIcon,
  Warning as DifferenceIcon,
  Info as UniqueIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as DurationIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { WorkoutSession, Exercise } from '../../types';
import { getWorkoutTypeColor, getWorkoutTypeIcon } from '../../utils/workoutHelpers';

interface WorkoutComparisonProps {
  workouts: WorkoutSession[];
  onClose?: () => void;
  onMerge?: (sourceIds: string[], targetId: string) => void;
  onExportComparison?: (data: ComparisonData) => void;
}

interface ComparisonData {
  workouts: WorkoutSession[];
  differences: DifferenceItem[];
  similarities: SimilarityItem[];
  metrics: ComparisonMetrics;
}

interface DifferenceItem {
  field: string;
  values: Record<string, any>;
  significance: 'low' | 'medium' | 'high';
}

interface SimilarityItem {
  field: string;
  value: any;
  matchPercentage: number;
}

interface ComparisonMetrics {
  totalExercises: number[];
  totalDuration: number[];
  playerCounts: number[];
  intensityDistribution: Record<string, number>[];
  exerciseOverlap: number;
  structuralSimilarity: number;
}

export const WorkoutComparison: React.FC<WorkoutComparisonProps> = ({
  workouts,
  onClose,
  onMerge,
  onExportComparison,
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    const differences: DifferenceItem[] = [];
    const similarities: SimilarityItem[] = [];
    const metrics: ComparisonMetrics = {
      totalExercises: workouts.map(w => w.exercises.length),
      totalDuration: workouts.map(w => w.metadata?.duration || 0),
      playerCounts: workouts.map(w => w.playerIds.length),
      intensityDistribution: workouts.map(w => {
        const dist: Record<string, number> = {};
        w.exercises.forEach(ex => {
          const intensity = ex.intensity || 'medium';
          dist[intensity] = (dist[intensity] || 0) + 1;
        });
        return dist;
      }),
      exerciseOverlap: calculateExerciseOverlap(workouts),
      structuralSimilarity: calculateStructuralSimilarity(workouts),
    };

    // Find differences
    const fields = ['type', 'intensity', 'location', 'teamId', 'scheduledDate'];
    fields.forEach(field => {
      const values = workouts.map(w => w[field]);
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length > 1) {
        differences.push({
          field,
          values: workouts.reduce((acc, w, i) => {
            acc[w.id.toString()] = w[field];
            return acc;
          }, {}),
          significance: getFieldSignificance(field),
        });
      } else {
        similarities.push({
          field,
          value: uniqueValues[0],
          matchPercentage: 100,
        });
      }
    });

    return { workouts, differences, similarities, metrics };
  }, [workouts]);

  // Helper functions
  function calculateExerciseOverlap(workouts: WorkoutSession[]): number {
    if (workouts.length < 2) return 100;
    
    const exerciseNames = workouts.map(w => new Set(w.exercises.map(e => e.name)));
    const intersection = exerciseNames.reduce((acc, set) => {
      return new Set([...acc].filter(x => set.has(x)));
    });
    
    const union = exerciseNames.reduce((acc, set) => {
      return new Set([...acc, ...set]);
    });
    
    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  function calculateStructuralSimilarity(workouts: WorkoutSession[]): number {
    if (workouts.length < 2) return 100;
    
    // Compare exercise order and structure
    let similarity = 0;
    const maxComparisons = workouts.length * (workouts.length - 1) / 2;
    
    for (let i = 0; i < workouts.length - 1; i++) {
      for (let j = i + 1; j < workouts.length; j++) {
        const w1 = workouts[i];
        const w2 = workouts[j];
        
        // Compare types
        if (w1.type === w2.type) similarity += 20;
        
        // Compare exercise count
        const countDiff = Math.abs(w1.exercises.length - w2.exercises.length);
        similarity += Math.max(0, 20 - countDiff * 2);
        
        // Compare intensity
        if (w1.intensity === w2.intensity) similarity += 20;
        
        // Compare duration
        const dur1 = w1.metadata?.duration || 0;
        const dur2 = w2.metadata?.duration || 0;
        const durDiff = Math.abs(dur1 - dur2) / Math.max(dur1, dur2, 1);
        similarity += (1 - durDiff) * 20;
        
        // Compare exercise categories
        const cats1 = new Set(w1.exercises.map(e => e.category));
        const cats2 = new Set(w2.exercises.map(e => e.category));
        const catOverlap = [...cats1].filter(c => cats2.has(c)).length / Math.max(cats1.size, cats2.size, 1);
        similarity += catOverlap * 20;
      }
    }
    
    return similarity / maxComparisons;
  }

  function getFieldSignificance(field: string): 'low' | 'medium' | 'high' {
    const highSignificance = ['type', 'intensity', 'scheduledDate'];
    const mediumSignificance = ['location', 'teamId'];
    
    if (highSignificance.includes(field)) return 'high';
    if (mediumSignificance.includes(field)) return 'medium';
    return 'low';
  }

  const handleExport = () => {
    if (onExportComparison) {
      onExportComparison(comparisonData);
    } else {
      // Default export to JSON
      const dataStr = JSON.stringify(comparisonData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `workout-comparison-${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSideBySideView = () => (
    <Grid container spacing={2}>
      {workouts.map((workout, index) => (
        <Grid item xs={12} md={6} lg={4} key={workout.id}>
          <Card variant="outlined">
            <CardContent>
              {/* Workout header */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  {getWorkoutTypeIcon(workout.type)}
                  <Typography variant="h6">{workout.title}</Typography>
                </Box>
                <Chip
                  label={workout.type}
                  size="small"
                  sx={{ bgcolor: getWorkoutTypeColor(workout.type), color: 'white' }}
                />
              </Box>

              {/* Key metrics */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <DurationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {workout.metadata?.duration || 0} min
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <GroupIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {workout.playerIds.length} players
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" noWrap>
                      {workout.location}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Chip
                    label={workout.intensity}
                    size="small"
                    color={
                      workout.intensity === 'high' ? 'error' :
                      workout.intensity === 'medium' ? 'warning' :
                      'success'
                    }
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Exercise list */}
              <Typography variant="subtitle2" gutterBottom>
                {t('comparison.exercises')} ({workout.exercises.length})
              </Typography>
              <List dense>
                {workout.exercises.slice(0, 5).map((exercise, exIndex) => (
                  <ListItem key={exIndex} sx={{ py: 0 }}>
                    <ListItemText
                      primary={exercise.name}
                      secondary={`${exercise.sets}×${exercise.reps} @ ${exercise.weight}kg`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
                {workout.exercises.length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                    +{workout.exercises.length - 5} more exercises
                  </Typography>
                )}
              </List>

              {/* Merge selection */}
              {onMerge && (
                <Box mt={2}>
                  <Button
                    size="small"
                    variant={selectedForMerge.includes(workout.id.toString()) ? 'contained' : 'outlined'}
                    onClick={() => {
                      setSelectedForMerge(prev =>
                        prev.includes(workout.id.toString())
                          ? prev.filter(id => id !== workout.id.toString())
                          : [...prev, workout.id.toString()]
                      );
                    }}
                  >
                    {selectedForMerge.includes(workout.id.toString()) ? 'Selected for merge' : 'Select for merge'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Comparison metrics */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('comparison.metrics')}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('comparison.exerciseOverlap')}
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress
                    variant="determinate"
                    value={comparisonData.metrics.exerciseOverlap}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2">
                    {comparisonData.metrics.exerciseOverlap.toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('comparison.structuralSimilarity')}
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress
                    variant="determinate"
                    value={comparisonData.metrics.structuralSimilarity}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    color={comparisonData.metrics.structuralSimilarity > 70 ? 'success' : 'warning'}
                  />
                  <Typography variant="body2">
                    {comparisonData.metrics.structuralSimilarity.toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Differences summary */}
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              {t('comparison.keyDifferences')}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {comparisonData.differences.map((diff, index) => (
                <Chip
                  key={index}
                  label={`${t(`fields.${diff.field}`)}: ${Object.keys(diff.values).length} variants`}
                  size="small"
                  color={diff.significance === 'high' ? 'error' : 'default'}
                  icon={<DifferenceIcon />}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderUnifiedView = () => (
    <Paper sx={{ p: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('comparison.field')}</TableCell>
            {workouts.map(workout => (
              <TableCell key={workout.id}>{workout.title}</TableCell>
            ))}
            <TableCell>{t('comparison.match')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Basic fields */}
          {['type', 'intensity', 'location', 'scheduledDate'].map(field => {
            const values = workouts.map(w => w[field]);
            const allMatch = values.every(v => v === values[0]);
            
            return (
              <TableRow key={field} sx={highlightDifferences && !allMatch ? { bgcolor: 'error.50' } : {}}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {t(`fields.${field}`)}
                  </Typography>
                </TableCell>
                {values.map((value, index) => (
                  <TableCell key={index}>
                    {field === 'scheduledDate' ? new Date(value).toLocaleDateString() : value}
                  </TableCell>
                ))}
                <TableCell>
                  {allMatch ? (
                    <MatchIcon color="success" fontSize="small" />
                  ) : (
                    <DifferenceIcon color="warning" fontSize="small" />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* Metrics */}
          <TableRow>
            <TableCell>
              <Typography variant="body2" fontWeight="medium">
                {t('comparison.totalExercises')}
              </Typography>
            </TableCell>
            {comparisonData.metrics.totalExercises.map((count, index) => (
              <TableCell key={index}>{count}</TableCell>
            ))}
            <TableCell>
              {comparisonData.metrics.totalExercises.every(c => c === comparisonData.metrics.totalExercises[0]) ? (
                <MatchIcon color="success" fontSize="small" />
              ) : (
                <DifferenceIcon color="warning" fontSize="small" />
              )}
            </TableCell>
          </TableRow>
          
          <TableRow>
            <TableCell>
              <Typography variant="body2" fontWeight="medium">
                {t('comparison.duration')}
              </Typography>
            </TableCell>
            {comparisonData.metrics.totalDuration.map((duration, index) => (
              <TableCell key={index}>{duration} min</TableCell>
            ))}
            <TableCell>
              {comparisonData.metrics.totalDuration.every(d => d === comparisonData.metrics.totalDuration[0]) ? (
                <MatchIcon color="success" fontSize="small" />
              ) : (
                <DifferenceIcon color="warning" fontSize="small" />
              )}
            </TableCell>
          </TableRow>
          
          <TableRow>
            <TableCell>
              <Typography variant="body2" fontWeight="medium">
                {t('comparison.players')}
              </Typography>
            </TableCell>
            {comparisonData.metrics.playerCounts.map((count, index) => (
              <TableCell key={index}>{count}</TableCell>
            ))}
            <TableCell>
              {comparisonData.metrics.playerCounts.every(c => c === comparisonData.metrics.playerCounts[0]) ? (
                <MatchIcon color="success" fontSize="small" />
              ) : (
                <DifferenceIcon color="warning" fontSize="small" />
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          {t('comparison.title')}
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="side-by-side">
              <GridIcon />
            </ToggleButton>
            <ToggleButton value="unified">
              <ListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            size="small"
          >
            {t('comparison.export')}
          </Button>
          
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            size="small"
          >
            {t('comparison.print')}
          </Button>
          
          {onClose && (
            <Button onClick={onClose} variant="outlined" size="small">
              {t('common.close')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Quick stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {workouts.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('comparison.workoutsCompared')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {comparisonData.similarities.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('comparison.similarities')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {comparisonData.differences.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('comparison.differences')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {comparisonData.metrics.exerciseOverlap.toFixed(0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('comparison.overlap')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main content */}
      {viewMode === 'side-by-side' ? renderSideBySideView() : renderUnifiedView()}

      {/* Merge action */}
      {onMerge && selectedForMerge.length >= 2 && (
        <Box position="sticky" bottom={16} display="flex" justifyContent="center" mt={3}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SwapIcon />}
            onClick={() => onMerge(selectedForMerge.slice(1), selectedForMerge[0])}
          >
            {t('comparison.mergeSelected', { count: selectedForMerge.length })}
          </Button>
        </Box>
      )}
    </Box>
  );
};