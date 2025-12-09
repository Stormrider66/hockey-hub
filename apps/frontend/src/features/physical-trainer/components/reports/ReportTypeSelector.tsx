import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  alpha
} from '@mui/material';
import {
  Person,
  Groups,
  Warning,
  FitnessCenter,
  TrendingUp,
  Description,
  Preview,
  Star,
  StarBorder
} from '@mui/icons-material';
import { ReportType, ReportTemplate } from '../../types/report.types';

const REPORT_TYPE_CONFIG = {
  [ReportType.PLAYER_PERFORMANCE]: {
    icon: Person,
    color: '#2196F3',
    features: ['Individual metrics', 'Progress tracking', 'Attendance analysis', 'Recommendations']
  },
  [ReportType.TEAM_ANALYTICS]: {
    icon: Groups,
    color: '#4CAF50',
    features: ['Team overview', 'Player comparisons', 'Workload distribution', 'Trend analysis']
  },
  [ReportType.INJURY_RISK]: {
    icon: Warning,
    color: '#FF9800',
    features: ['Risk assessment', 'Prevention strategies', 'Load monitoring', 'Pattern analysis']
  },
  [ReportType.TRAINING_LOAD]: {
    icon: FitnessCenter,
    color: '#9C27B0',
    features: ['Load metrics', 'A:C ratios', 'Distribution analysis', 'Recommendations']
  },
  [ReportType.PROGRESS_COMPARISON]: {
    icon: TrendingUp,
    color: '#00BCD4',
    features: ['Before/after analysis', 'Metric comparison', 'Team progress', 'Individual rankings']
  }
};

interface ReportTypeSelectorProps {
  selectedType?: ReportType;
  onTypeSelect: (type: ReportType) => void;
  templates: ReportTemplate[];
  onTemplateSelect: (templateId: string) => void;
}

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  templates,
  onTemplateSelect
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [showTemplates, setShowTemplates] = React.useState(false);

  const handleTypeSelect = (type: ReportType) => {
    onTypeSelect(type);
    setShowTemplates(true);
  };

  return (
    <Box>
      {/* Report Types */}
      <Typography variant="h6" gutterBottom>
        {t('physicalTrainer:reports.types.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('physicalTrainer:reports.types.description')}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {Object.entries(ReportType).map(([key, type]) => {
          if (type === ReportType.CUSTOM) return null;
          
          const config = REPORT_TYPE_CONFIG[type];
          const Icon = config.icon;
          const isSelected = selectedType === type;

          return (
            <Grid item xs={12} sm={6} md={4} key={type}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: 2,
                  borderColor: isSelected ? config.color : 'transparent',
                  bgcolor: isSelected ? alpha(config.color, 0.05) : 'background.paper',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: alpha(config.color, 0.3),
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
                onClick={() => handleTypeSelect(type)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Icon
                      sx={{
                        fontSize: 40,
                        color: config.color,
                        mr: 2
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">
                        {t(`physicalTrainer:reports.types.${type}.name`)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(`physicalTrainer:reports.types.${type}.subtitle`)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t(`physicalTrainer:reports.types.${type}.description`)}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    {config.features.map((feature, index) => (
                      <Chip
                        key={index}
                        label={feature}
                        size="small"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          fontSize: '0.75rem',
                          height: 24
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>

                {isSelected && (
                  <Box
                    sx={{
                      bgcolor: config.color,
                      color: 'white',
                      px: 2,
                      py: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="caption" fontWeight="bold">
                      {t('physicalTrainer:reports.types.selected')}
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Templates Section */}
      {selectedType && showTemplates && templates.length > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h6" gutterBottom>
            {t('physicalTrainer:reports.templates.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('physicalTrainer:reports.templates.description')}
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                >
                  {template.thumbnail && (
                    <Box
                      sx={{
                        height: 120,
                        bgcolor: 'grey.100',
                        backgroundImage: `url(${template.thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Description sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {template.name}
                        </Typography>
                        {template.isDefault && (
                          <Chip
                            label={t('physicalTrainer:reports.templates.default')}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                      <Tooltip title={t('physicalTrainer:reports.templates.favorite')}>
                        <IconButton size="small">
                          <StarBorder fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {template.description}
                    </Typography>

                    {template.tags && template.tags.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {template.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Preview />}
                      sx={{ ml: 'auto' }}
                    >
                      {t('physicalTrainer:reports.templates.preview')}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onTemplateSelect(template.id)}
                    >
                      {t('physicalTrainer:reports.templates.use')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}

            {/* Custom Template Option */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '2px dashed',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => onTemplateSelect('custom')}
              >
                <CardContent
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                >
                  <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('physicalTrainer:reports.templates.custom.title')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('physicalTrainer:reports.templates.custom.description')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default ReportTypeSelector;