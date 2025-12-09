import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Snackbar,
} from '@mui/material';
import { CircularProgress } from '@/components/ui/loading';
import Grid from '@mui/material/Grid';
import {
  ContentCopy as CopyIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Event as EventIcon,
  Repeat as RepeatIcon,
  Group as GroupIcon,
  FitnessCenter as WorkoutIcon,
  SwapHoriz as SwapIcon,
  AutoFixHigh as AutoScheduleIcon,
  CalendarMonth as CalendarIcon,
  DragIndicator as DragIcon,
  Close as CloseIcon,
  TrendingUp as OptimizeIcon,
} from '@mui/icons-material';
import { Calendar, dateFnsLocalizer, Event as CalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, addWeeks, isSameDay } from 'date-fns';
import { WorkoutSession, ScheduleConflict, CalendarEvent as CustomEvent } from '../../types';
import { useScheduleConflicts } from '../../hooks/useScheduleConflicts';
import { useWorkoutScheduler } from '../../hooks/useWorkoutScheduler';
import { AISuggestionEngine } from '../../services/AISuggestionEngine';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface EnhancedCalendarIntegrationProps {
  workouts: WorkoutSession[];
  events: CustomEvent[];
  onScheduleWorkout: (workout: WorkoutSession, date: Date, options?: ScheduleOptions) => Promise<void>;
  onUpdateEvent: (event: CustomEvent, changes: Partial<CustomEvent>) => Promise<void>;
  onDuplicateWorkout: (workout: WorkoutSession, targetDate: Date) => Promise<void>;
  onSwapWorkouts: (event1: CustomEvent, event2: CustomEvent) => Promise<void>;
  onBatchSchedule: (workouts: WorkoutSession[], startDate: Date, pattern: SchedulePattern) => Promise<void>;
  teamId?: string;
  selectedPlayers?: string[];
}

interface ScheduleOptions {
  checkConflicts?: boolean;
  autoResolve?: boolean;
  notifyPlayers?: boolean;
  recurring?: RecurringOptions;
}

interface RecurringOptions {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  count?: number;
  until?: Date;
  daysOfWeek?: number[];
}

interface SchedulePattern {
  type: 'sequential' | 'alternating' | 'custom';
  interval: number;
  customPattern?: number[];
}

interface DraggedItem {
  type: 'workout' | 'event';
  data: WorkoutSession | CustomEvent;
  sourceDate?: Date;
}

export const EnhancedCalendarIntegration: React.FC<EnhancedCalendarIntegrationProps> = ({
  workouts,
  events,
  onScheduleWorkout,
  onUpdateEvent,
  onDuplicateWorkout,
  onSwapWorkouts,
  onBatchSchedule,
  teamId,
  selectedPlayers,
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [batchOptions, setBatchOptions] = useState<{
    selectedWorkouts: WorkoutSession[];
    pattern: SchedulePattern;
    startDate: Date;
  }>({
    selectedWorkouts: [],
    pattern: { type: 'sequential', interval: 1 },
    startDate: new Date(),
  });

  const { checkConflicts, resolveConflicts } = useScheduleConflicts();
  const { optimizeSchedule, suggestBestTimes } = useWorkoutScheduler();
  const aiEngine = useRef(new AISuggestionEngine());

  // Calendar event styling
  const eventStyleGetter = useCallback((event: CustomEvent) => {
    const baseStyle = {
      backgroundColor: event.color || '#3174ad',
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      display: 'block',
    };

    if (event.type === 'training') {
      baseStyle.backgroundColor = '#4caf50';
    } else if (event.type === 'testing') {
      baseStyle.backgroundColor = '#ff9800';
    } else if (event.type === 'recovery') {
      baseStyle.backgroundColor = '#2196f3';
    }

    return { style: baseStyle };
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((item: DraggedItem) => {
    setDraggedItem(item);
  }, []);

  // Handle drop on calendar
  const handleDrop = useCallback(async ({ start, end }: { start: Date; end: Date }) => {
    if (!draggedItem) return;

    setIsProcessing(true);
    try {
      if (draggedItem.type === 'workout') {
        // Check for conflicts
        const workout = draggedItem.data as WorkoutSession;
        const potentialConflicts = await checkConflicts(workout, start, selectedPlayers || []);

        if (potentialConflicts.length > 0) {
          setConflicts(potentialConflicts);
          setSelectedDate(start);
          setShowConflictDialog(true);
        } else {
          await onScheduleWorkout(workout, start);
          showSnackbar(t('calendar.workoutScheduled'), 'success');
        }
      } else if (draggedItem.type === 'event' && draggedItem.sourceDate) {
        // Moving existing event
        const event = draggedItem.data as CustomEvent;
        await onUpdateEvent(event, { start, end });
        showSnackbar(t('calendar.eventMoved'), 'success');
      }
    } catch (error) {
      showSnackbar(t('calendar.scheduleFailed'), 'error');
    } finally {
      setIsProcessing(false);
      setDraggedItem(null);
    }
  }, [draggedItem, checkConflicts, onScheduleWorkout, onUpdateEvent, selectedPlayers]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CustomEvent) => {
    setSelectedEvent(event);
  }, []);

  // Handle slot selection
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedDate(start);
    setShowScheduleDialog(true);
  }, []);

  // Quick duplicate with smart scheduling
  const handleQuickDuplicate = useCallback(async (event: CustomEvent) => {
    if (event.sessionId) {
      const workout = workouts.find(w => w.id.toString() === event.sessionId);
      if (workout) {
        // Find next available slot
        const nextSlot = await suggestBestTimes(workout, event.start as Date, 7);
        if (nextSlot.length > 0) {
          await onDuplicateWorkout(workout, nextSlot[0].date);
          showSnackbar(t('calendar.workoutDuplicated'), 'success');
        }
      }
    }
  }, [workouts, suggestBestTimes, onDuplicateWorkout]);

  // Handle workout swap
  const handleSwapWorkouts = useCallback(async (event1: CustomEvent, event2: CustomEvent) => {
    setIsProcessing(true);
    try {
      await onSwapWorkouts(event1, event2);
      showSnackbar(t('calendar.workoutsSwapped'), 'success');
    } catch (error) {
      showSnackbar(t('calendar.swapFailed'), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [onSwapWorkouts]);

  // Auto-schedule optimization
  const handleAutoSchedule = useCallback(async () => {
    setIsProcessing(true);
    try {
      const optimized = await optimizeSchedule(workouts, events, {
        teamId,
        playerIds: selectedPlayers,
        startDate: new Date(),
        endDate: addWeeks(new Date(), 4),
        constraints: {
          maxPerDay: 2,
          minRestBetween: 4, // hours
          preferredTimes: ['morning', 'afternoon'],
        }
      });

      // Show preview of optimized schedule
      console.log('Optimized schedule:', optimized);
      showSnackbar(t('calendar.scheduleOptimized'), 'success');
    } catch (error) {
      showSnackbar(t('calendar.optimizationFailed'), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [workouts, events, teamId, selectedPlayers, optimizeSchedule]);

  // Batch scheduling
  const handleBatchSchedule = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onBatchSchedule(
        batchOptions.selectedWorkouts,
        batchOptions.startDate,
        batchOptions.pattern
      );
      setShowBatchDialog(false);
      showSnackbar(t('calendar.batchScheduled'), 'success');
    } catch (error) {
      showSnackbar(t('calendar.batchScheduleFailed'), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [batchOptions, onBatchSchedule]);

  // Conflict resolution
  const handleResolveConflicts = useCallback(async (resolution: 'cancel' | 'override' | 'reschedule') => {
    if (!selectedDate || !draggedItem || draggedItem.type !== 'workout') return;

    const workout = draggedItem.data as WorkoutSession;
    
    switch (resolution) {
      case 'cancel':
        setShowConflictDialog(false);
        break;
      case 'override':
        await onScheduleWorkout(workout, selectedDate, { checkConflicts: false });
        setShowConflictDialog(false);
        showSnackbar(t('calendar.workoutScheduledWithConflicts'), 'success');
        break;
      case 'reschedule':
        const alternatives = await suggestBestTimes(workout, selectedDate, 7);
        // Show alternatives to user
        console.log('Alternative times:', alternatives);
        break;
    }
  }, [selectedDate, draggedItem, onScheduleWorkout, suggestBestTimes]);

  // Helper functions
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Custom toolbar
  const CustomToolbar = useCallback(({ date, onNavigate }: any) => (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Box display="flex" gap={1}>
        <Button onClick={() => onNavigate('PREV')}>{t('calendar.previous')}</Button>
        <Button onClick={() => onNavigate('TODAY')}>{t('calendar.today')}</Button>
        <Button onClick={() => onNavigate('NEXT')}>{t('calendar.next')}</Button>
      </Box>
      
      <Typography variant="h6">
        {format(date, 'MMMM yyyy')}
      </Typography>
      
      <Box display="flex" gap={1}>
        <Tooltip title={t('calendar.batchSchedule')}>
          <IconButton onClick={() => setShowBatchDialog(true)} color="primary">
            <Badge badgeContent={workouts.length} color="secondary">
              <CalendarIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        
        <Tooltip title={t('calendar.autoSchedule')}>
          <IconButton onClick={handleAutoSchedule} color="primary" disabled={isProcessing}>
            {isProcessing ? <CircularProgress size={24} color="currentColor" /> : <AutoScheduleIcon />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title={t('calendar.optimize')}>
          <IconButton onClick={handleAutoSchedule} color="primary">
            <OptimizeIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  ), [workouts.length, isProcessing, handleAutoSchedule]);

  // Render workout list for dragging
  const renderDraggableWorkouts = () => (
    <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        {t('calendar.availableWorkouts')}
      </Typography>
      <List dense>
        {workouts.map(workout => (
          <ListItem
            key={workout.id}
            draggable
            onDragStart={() => handleDragStart({ type: 'workout', data: workout })}
            sx={{
              cursor: 'move',
              '&:hover': { bgcolor: 'action.hover' },
              mb: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <ListItemIcon>
              <DragIcon />
            </ListItemIcon>
            <ListItemText
              primary={workout.title}
              secondary={`${workout.type} - ${workout.metadata?.duration || 60} min`}
            />
            <Chip
              label={workout.intensity}
              size="small"
              color={workout.intensity === 'high' ? 'error' : 'default'}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  // Event context menu
  const EventContextMenu = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    return (
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && Boolean(selectedEvent)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleQuickDuplicate(selectedEvent!)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.duplicate')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => console.log('Swap mode')}>
          <ListItemIcon>
            <SwapIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.swap')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => console.log('Delete')}>
          <ListItemIcon>
            <CloseIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('calendar.remove')}</ListItemText>
        </MenuItem>
      </Menu>
    );
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Draggable workouts sidebar */}
        <Grid item xs={12} md={3}>
          {renderDraggableWorkouts()}
          
          {/* Quick stats */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('calendar.weeklyOverview')}
            </Typography>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">{t('calendar.scheduledSessions')}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {events.filter(e => e.type === 'training').length}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">{t('calendar.totalDuration')}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {events.reduce((sum, e) => sum + (e.duration || 0), 0)} min
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">{t('calendar.conflicts')}</Typography>
                <Typography variant="body2" color="error" fontWeight="bold">
                  {conflicts.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Calendar */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              onDropFromOutside={handleDrop}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              resizable
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar,
              }}
              views={['month', 'week', 'day']}
              defaultView="week"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Conflict resolution dialog */}
      <Dialog open={showConflictDialog} onClose={() => setShowConflictDialog(false)}>
        <DialogTitle>{t('calendar.conflictsDetected')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>{t('calendar.conflictTitle')}</AlertTitle>
            {t('calendar.conflictMessage', { count: conflicts.length })}
          </Alert>
          
          <List>
            {conflicts.slice(0, 5).map((conflict, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={conflict.playerName}
                  secondary={`${conflict.eventTitle} - ${conflict.eventTime}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleResolveConflicts('cancel')}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => handleResolveConflicts('reschedule')} color="primary">
            {t('calendar.findAlternative')}
          </Button>
          <Button onClick={() => handleResolveConflicts('override')} color="warning">
            {t('calendar.scheduleAnyway')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch schedule dialog */}
      <Dialog 
        open={showBatchDialog} 
        onClose={() => setShowBatchDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('calendar.batchSchedule')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Workout selection */}
            <FormControl fullWidth>
              <InputLabel>{t('calendar.selectWorkouts')}</InputLabel>
              <Select
                multiple
                value={batchOptions.selectedWorkouts.map(w => w.id)}
                onChange={(e) => {
                  const ids = e.target.value as string[];
                  setBatchOptions(prev => ({
                    ...prev,
                    selectedWorkouts: workouts.filter(w => ids.includes(w.id.toString()))
                  }));
                }}
                renderValue={(selected) => (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {(selected as string[]).map(id => {
                      const workout = workouts.find(w => w.id.toString() === id);
                      return workout ? (
                        <Chip key={id} label={workout.title} size="small" />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {workouts.map(workout => (
                  <MenuItem key={workout.id} value={workout.id}>
                    <Checkbox checked={batchOptions.selectedWorkouts.some(w => w.id === workout.id)} />
                    <ListItemText primary={workout.title} secondary={workout.type} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Schedule pattern */}
            <FormControl fullWidth>
              <InputLabel>{t('calendar.schedulePattern')}</InputLabel>
              <Select
                value={batchOptions.pattern.type}
                onChange={(e) => setBatchOptions(prev => ({
                  ...prev,
                  pattern: { ...prev.pattern, type: e.target.value as any }
                }))}
              >
                <MenuItem value="sequential">{t('calendar.sequential')}</MenuItem>
                <MenuItem value="alternating">{t('calendar.alternating')}</MenuItem>
                <MenuItem value="custom">{t('calendar.custom')}</MenuItem>
              </Select>
            </FormControl>

            {/* Interval */}
            <TextField
              label={t('calendar.daysBetween')}
              type="number"
              value={batchOptions.pattern.interval}
              onChange={(e) => setBatchOptions(prev => ({
                ...prev,
                pattern: { ...prev.pattern, interval: parseInt(e.target.value) || 1 }
              }))}
              fullWidth
            />

            {/* Start date */}
            <TextField
              label={t('calendar.startDate')}
              type="date"
              value={format(batchOptions.startDate, 'yyyy-MM-dd')}
              onChange={(e) => setBatchOptions(prev => ({
                ...prev,
                startDate: new Date(e.target.value)
              }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBatchDialog(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleBatchSchedule} 
            variant="contained"
            disabled={batchOptions.selectedWorkouts.length === 0 || isProcessing}
            startIcon={isProcessing ? <CircularProgress size={16} color="currentColor" /> : null}
          >
            {t('calendar.schedule')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};