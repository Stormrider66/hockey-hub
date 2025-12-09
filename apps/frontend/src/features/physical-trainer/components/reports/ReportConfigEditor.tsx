import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  ExpandMore,
  Add,
  Delete,
  DragIndicator,
  Settings,
  Palette,
  TableChart,
  BarChart,
  TextFields,
  Image,
  Pageview
} from '@mui/icons-material';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';
import {
  ReportConfig,
  ReportTemplate,
  ReportSection,
  ReportFormat,
  ReportCustomization,
  ReportFilters
} from '../../types/report.types';
import PlayerTeamSelector from './PlayerTeamSelector';
import ChartEditor from './ChartEditor';
import TableEditor from './TableEditor';
import BrandingEditor from './BrandingEditor';

const SECTION_ICONS = {
  title: TextFields,
  summary: TextFields,
  chart: BarChart,
  table: TableChart,
  text: TextFields,
  image: Image,
  pageBreak: Pageview
};

interface ReportConfigEditorProps {
  config: Partial<ReportConfig>;
  template?: ReportTemplate;
  sections: ReportSection[];
  errors: Record<string, string>;
  onConfigUpdate: (updates: Partial<ReportConfig>) => void;
  onSectionsUpdate: (sections: ReportSection[]) => void;
}

const ReportConfigEditor: React.FC<ReportConfigEditorProps> = ({
  config,
  template,
  sections,
  errors,
  onConfigUpdate,
  onSectionsUpdate
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [expandedAccordion, setExpandedAccordion] = useState<string>('basic');
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Handle accordion expansion
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : '');
  };

  // Handle date range changes
  const handleDateChange = (field: 'start' | 'end') => (date: Date | null) => {
    if (date) {
      onConfigUpdate({
        dateRange: {
          ...config.dateRange!,
          [field]: date
        }
      });
    }
  };

  // Handle filter updates
  const handleFilterUpdate = (filterKey: string, value: any) => {
    onConfigUpdate({
      filters: {
        ...config.filters,
        [filterKey]: value
      }
    });
  };

  // Handle customization updates
  const handleCustomizationUpdate = (updates: Partial<ReportCustomization>) => {
    onConfigUpdate({
      customization: {
        ...config.customization,
        ...updates
      }
    });
  };

  // Handle section drag and drop
  const handleSectionDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const updatedSections = items.map((section, index) => ({
      ...section,
      order: index
    }));

    onSectionsUpdate(updatedSections);
  };

  // Add new section
  const handleAddSection = (type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      type,
      title: t(`physicalTrainer:reports.sections.${type}.defaultTitle`),
      order: sections.length,
      visible: true
    };

    onSectionsUpdate([...sections, newSection]);
    setEditingSection(newSection.id);
  };

  // Update section
  const handleUpdateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    onSectionsUpdate(updatedSections);
  };

  // Delete section
  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(section => section.id !== sectionId);
    onSectionsUpdate(updatedSections);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Basic Configuration */}
        <Accordion
          expanded={expandedAccordion === 'basic'}
          onChange={handleAccordionChange('basic')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('physicalTrainer:reports.config.basic.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Report Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('physicalTrainer:reports.config.basic.name')}
                  value={config.name || ''}
                  onChange={(e) => onConfigUpdate({ name: e.target.value })}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>

              {/* Report Format */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('physicalTrainer:reports.config.basic.format')}</InputLabel>
                  <Select
                    value={config.format || ReportFormat.PDF}
                    onChange={(e) => onConfigUpdate({ format: e.target.value as ReportFormat })}
                  >
                    <MenuItem value={ReportFormat.PDF}>
                      {t('physicalTrainer:reports.formats.pdf')}
                    </MenuItem>
                    <MenuItem value={ReportFormat.EXCEL}>
                      {t('physicalTrainer:reports.formats.excel')}
                    </MenuItem>
                    <MenuItem value={ReportFormat.CSV}>
                      {t('physicalTrainer:reports.formats.csv')}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label={t('physicalTrainer:reports.config.basic.startDate')}
                  value={config.dateRange?.start || null}
                  onChange={handleDateChange('start')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.startDate,
                      helperText: errors.startDate
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label={t('physicalTrainer:reports.config.basic.endDate')}
                  value={config.dateRange?.end || null}
                  onChange={handleDateChange('end')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.endDate,
                      helperText: errors.endDate
                    }
                  }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('physicalTrainer:reports.config.basic.description')}
                  value={config.description || ''}
                  onChange={(e) => onConfigUpdate({ description: e.target.value })}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Filters */}
        <Accordion
          expanded={expandedAccordion === 'filters'}
          onChange={handleAccordionChange('filters')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('physicalTrainer:reports.config.filters.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Player/Team Selection */}
              <Grid item xs={12}>
                <PlayerTeamSelector
                  selectedPlayers={config.filters?.players || []}
                  selectedTeams={config.filters?.teams || []}
                  onPlayersChange={(players) => handleFilterUpdate('players', players)}
                  onTeamsChange={(teams) => handleFilterUpdate('teams', teams)}
                />
              </Grid>

              {/* Workout Types */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('physicalTrainer:reports.config.filters.workoutTypes')}</InputLabel>
                  <Select
                    multiple
                    value={config.filters?.workoutTypes || []}
                    onChange={(e) => handleFilterUpdate('workoutTypes', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="strength">Strength</MenuItem>
                    <MenuItem value="conditioning">Conditioning</MenuItem>
                    <MenuItem value="hybrid">Hybrid</MenuItem>
                    <MenuItem value="agility">Agility</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Tags */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('physicalTrainer:reports.config.filters.tags')}
                  placeholder={t('physicalTrainer:reports.config.filters.tagsPlaceholder')}
                  value={(config.filters?.tags || []).join(', ')}
                  onChange={(e) => 
                    handleFilterUpdate('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))
                  }
                  helperText={t('physicalTrainer:reports.config.filters.tagsHelp')}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Content Sections */}
        <Accordion
          expanded={expandedAccordion === 'sections'}
          onChange={handleAccordionChange('sections')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('physicalTrainer:reports.config.sections.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {/* Section List */}
              <DragDropContext onDragEnd={handleSectionDragEnd}>
                <Droppable droppableId="sections">
                  {(provided) => (
                    <List {...provided.droppableProps} ref={provided.innerRef}>
                      {sections.map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided, snapshot) => (
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{
                                bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                                mb: 1,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                              }}
                            >
                              <Box
                                {...provided.dragHandleProps}
                                sx={{ mr: 1, color: 'text.secondary' }}
                              >
                                <DragIndicator />
                              </Box>

                              {React.createElement(SECTION_ICONS[section.type], {
                                sx: { mr: 1, color: 'text.secondary' }
                              })}

                              <ListItemText
                                primary={section.title || t(`physicalTrainer:reports.sections.${section.type}.defaultTitle`)}
                                secondary={t(`physicalTrainer:reports.sections.${section.type}.description`)}
                              />

                              <ListItemSecondaryAction>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={section.visible !== false}
                                      onChange={(e) => 
                                        handleUpdateSection(section.id, { visible: e.target.checked })
                                      }
                                    />
                                  }
                                  label={t('physicalTrainer:reports.config.sections.visible')}
                                />
                                <IconButton
                                  onClick={() => setEditingSection(section.id)}
                                  size="small"
                                >
                                  <Settings />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleDeleteSection(section.id)}
                                  size="small"
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </List>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Add Section Buttons */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                {t('physicalTrainer:reports.config.sections.add')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(SECTION_ICONS).map(([type, Icon]) => (
                  <Button
                    key={type}
                    variant="outlined"
                    size="small"
                    startIcon={<Icon />}
                    onClick={() => handleAddSection(type as ReportSection['type'])}
                  >
                    {t(`physicalTrainer:reports.sections.${type}.label`)}
                  </Button>
                ))}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Customization */}
        <Accordion
          expanded={expandedAccordion === 'customization'}
          onChange={handleAccordionChange('customization')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('physicalTrainer:reports.config.customization.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <BrandingEditor
              customization={config.customization || {}}
              onUpdate={handleCustomizationUpdate}
            />
          </AccordionDetails>
        </Accordion>

        {/* Template Info */}
        {template && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('physicalTrainer:reports.config.templateInfo', { name: template.name })}
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ReportConfigEditor;