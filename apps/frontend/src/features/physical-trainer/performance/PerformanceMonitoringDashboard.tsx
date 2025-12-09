import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Api as ApiIcon,
  TouchApp as InteractionIcon,
  Palette as RenderIcon,
  Extension as ComponentIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { usePerformanceContext, exportPerformanceData } from './PerformanceContext';
import { PerformanceMetric } from './usePerformanceMonitor';

const CATEGORY_COLORS = {
  component: '#2196F3',
  api: '#4CAF50',
  interaction: '#FF9800',
  render: '#9C27B0',
  custom: '#607D8B'
};

const CATEGORY_ICONS = {
  component: ComponentIcon,
  api: ApiIcon,
  interaction: InteractionIcon,
  render: RenderIcon,
  custom: SpeedIcon
};

export function PerformanceMonitoringDashboard() {
  const {
    metrics,
    clearMetrics,
    exportMetrics,
    enableRecording,
    setEnableRecording
  } = usePerformanceContext();

  const [selectedCategory, setSelectedCategory] = useState<PerformanceMetric['category'] | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | 'all'>('5m');

  // Filter metrics based on time range
  const filteredMetrics = useMemo(() => {
    let filtered = metrics;

    // Time range filter
    if (timeRange !== 'all') {
      const minutes = parseInt(timeRange);
      const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      filtered = filtered.filter(m => m.timestamp > cutoff);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    return filtered;
  }, [metrics, selectedCategory, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const byCategory = filteredMetrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = {
          count: 0,
          totalDuration: 0,
          maxDuration: 0,
          minDuration: Infinity
        };
      }
      const cat = acc[metric.category];
      cat.count++;
      cat.totalDuration += metric.duration;
      cat.maxDuration = Math.max(cat.maxDuration, metric.duration);
      cat.minDuration = Math.min(cat.minDuration, metric.duration);
      return acc;
    }, {} as Record<string, any>);

    // Calculate chart data
    const timeSeriesData = filteredMetrics
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(metric => ({
        time: new Date(metric.timestamp).toLocaleTimeString(),
        duration: metric.duration,
        category: metric.category,
        name: metric.name
      }));

    const categoryData = Object.entries(byCategory).map(([category, data]) => ({
      category,
      count: data.count,
      avgDuration: data.totalDuration / data.count,
      maxDuration: data.maxDuration
    }));

    const slowestOps = [...filteredMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      byCategory,
      timeSeriesData,
      categoryData,
      slowestOps,
      totalCount: filteredMetrics.length,
      avgDuration: filteredMetrics.length > 0 
        ? filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / filteredMetrics.length 
        : 0
    };
  }, [filteredMetrics]);

  const handleExport = () => {
    const report = exportMetrics();
    exportPerformanceData(report, 'json');
  };

  const getHealthStatus = () => {
    if (stats.avgDuration > 1000) return { status: 'error', message: 'High average duration detected' };
    if (stats.avgDuration > 500) return { status: 'warning', message: 'Moderate performance impact' };
    return { status: 'success', message: 'Performance is optimal' };
  };

  const health = getHealthStatus();

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" gutterBottom>
            Performance Monitoring
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={enableRecording}
                  onChange={(e) => setEnableRecording(e.target.checked)}
                  color="primary"
                />
              }
              label="Recording"
            />
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              variant="outlined"
              size="small"
              disabled={metrics.length === 0}
            >
              Export
            </Button>
            <Button
              startIcon={<ClearIcon />}
              onClick={clearMetrics}
              variant="outlined"
              size="small"
              color="error"
              disabled={metrics.length === 0}
            >
              Clear
            </Button>
          </Box>
        </Box>

        {/* Health Status */}
        <Alert 
          severity={health.status as any} 
          icon={health.status === 'error' ? <WarningIcon /> : <TrendingUpIcon />}
          sx={{ mt: 2 }}
        >
          {health.message} - {stats.totalCount} metrics recorded (avg: {stats.avgDuration.toFixed(2)}ms)
        </Alert>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <Typography variant="subtitle2">Time Range:</Typography>
          {(['1m', '5m', '15m', 'all'] as const).map((range) => (
            <Chip
              key={range}
              label={range === 'all' ? 'All' : `Last ${range}`}
              onClick={() => setTimeRange(range)}
              color={timeRange === range ? 'primary' : 'default'}
              variant={timeRange === range ? 'filled' : 'outlined'}
            />
          ))}
          <Box sx={{ ml: 4 }} />
          <Typography variant="subtitle2">Category:</Typography>
          <Chip
            label="All"
            onClick={() => setSelectedCategory('all')}
            color={selectedCategory === 'all' ? 'primary' : 'default'}
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
          />
          {Object.keys(CATEGORY_COLORS).map((category) => {
            const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
            return (
              <Chip
                key={category}
                label={category}
                icon={<Icon />}
                onClick={() => setSelectedCategory(category as PerformanceMetric['category'])}
                color={selectedCategory === category ? 'primary' : 'default'}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                sx={{
                  '& .MuiChip-icon': {
                    color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                  }
                }}
              />
            );
          })}
        </Box>
      </Paper>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Time Series Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Performance Timeline
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={stats.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip 
                  formatter={(value: number) => `${value.toFixed(2)}ms`}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#2196F3" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count }) => `${category}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} 
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Average Duration by Category */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Average Duration by Category
            </Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)}ms`} />
                <Bar dataKey="avgDuration" fill="#2196F3">
                  {stats.categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} 
                    />
                  ))}
                </Bar>
                <Bar dataKey="maxDuration" fill="#FF5722" opacity={0.5} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Slowest Operations Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Slowest Operations
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Operation</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Duration (ms)</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.slowestOps.map((metric, index) => {
                const Icon = CATEGORY_ICONS[metric.category];
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {metric.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Icon />}
                        label={metric.category}
                        size="small"
                        sx={{
                          backgroundColor: CATEGORY_COLORS[metric.category] + '20',
                          '& .MuiChip-icon': {
                            color: CATEGORY_COLORS[metric.category]
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                        <Typography
                          variant="body2"
                          color={metric.duration > 1000 ? 'error' : metric.duration > 500 ? 'warning.main' : 'text.primary'}
                          fontWeight={metric.duration > 1000 ? 'bold' : 'normal'}
                        >
                          {metric.duration.toFixed(2)}
                        </Typography>
                        {metric.duration > 1000 && (
                          <Tooltip title="High duration detected">
                            <WarningIcon color="error" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {metric.metadata && (
                        <Tooltip title={JSON.stringify(metric.metadata, null, 2)}>
                          <IconButton size="small">
                            <SpeedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}