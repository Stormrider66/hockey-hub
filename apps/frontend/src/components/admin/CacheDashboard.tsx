import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  AlertTitle,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
// Using Box grid layout instead of MUI Grid to avoid type/version issues
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  Memory as MemoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  getCacheAnalytics,
  getCacheSummary,
  cacheAnalytics,
  EndpointMetrics,
  TimelineEntry
} from '../../store/cache/cacheAnalytics';
import {
  getCacheEvents,
  clearCacheEvents,
  estimateCacheSize,
  checkCacheHealth,
  measureCachePerformance
} from '../../store/cache/cacheMiddleware';
import { startCacheWarming, getCacheWarmingStatus } from '../../store/cache/cacheWarming';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cache-tabpanel-${index}`}
      aria-labelledby={`cache-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const CacheDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(5000);
  const [analytics, setAnalytics] = useState(getCacheAnalytics());
  const [summary, setSummary] = useState(getCacheSummary());
  const [cacheSize, setCacheSize] = useState(0);
  const [cacheHealth, setCacheHealth] = useState(checkCacheHealth({ getState: () => ({}) }));
  const [warmingStatus, setWarmingStatus] = useState(getCacheWarmingStatus());
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | 'all'>('24h');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Auto-refresh
  useEffect(() => {
    const updateData = () => {
      setAnalytics(getCacheAnalytics());
      setSummary(getCacheSummary());
      setCacheSize(estimateCacheSize({ getState: () => ({}) }));
      setCacheHealth(checkCacheHealth({ getState: () => ({}) }));
      setWarmingStatus(getCacheWarmingStatus());
    };

    updateData();

    if (refreshInterval) {
      const interval = setInterval(updateData, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [refreshInterval]);

  // Enable performance monitoring
  useEffect(() => {
    measureCachePerformance(true);
    return () => measureCachePerformance(false);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExport = () => {
    const data = cacheAnalytics.exportAnalytics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-analytics-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cache analytics data?')) {
      cacheAnalytics.reset();
      clearCacheEvents();
      setAnalytics(getCacheAnalytics());
      setSummary(getCacheSummary());
    }
  };

  const handleStartWarming = () => {
    startCacheWarming(dispatch);
    setWarmingStatus(getCacheWarmingStatus());
  };

  // Process timeline data for charts
  const timelineData = useMemo(() => {
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };
    
    const startTime = timeRange === 'all' ? 0 : now - ranges[timeRange];
    const timeline = analytics.timeline.filter(entry => entry.timestamp >= startTime);

    // Group by time buckets
    const bucketSize = timeRange === '1h' ? 5 * 60 * 1000 : // 5 minutes
                      timeRange === '24h' ? 60 * 60 * 1000 : // 1 hour
                      timeRange === '7d' ? 6 * 60 * 60 * 1000 : // 6 hours
                      24 * 60 * 60 * 1000; // 1 day

    const buckets = new Map<number, { hits: number; misses: number; time: number }>();

    timeline.forEach(entry => {
      const bucket = Math.floor(entry.timestamp / bucketSize) * bucketSize;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { hits: 0, misses: 0, time: bucket });
      }
      const data = buckets.get(bucket)!;
      if (entry.event === 'hit') {
        data.hits++;
      } else if (entry.event === 'miss') {
        data.misses++;
      }
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.time - b.time)
      .map(data => ({
        ...data,
        hitRate: data.hits + data.misses > 0 ? (data.hits / (data.hits + data.misses)) * 100 : 0,
        timeLabel: format(new Date(data.time), timeRange === '1h' ? 'HH:mm' : 'MMM dd HH:mm')
      }));
  }, [analytics.timeline, timeRange]);

  // Pie chart data for cache distribution
  const pieData = useMemo(() => {
    return Object.entries(analytics.bySlice).map(([slice, metrics]) => ({
      name: slice,
      value: metrics.hits + metrics.misses,
      hits: metrics.hits,
      misses: metrics.misses
    }));
  }, [analytics.bySlice]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Cache Performance Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Auto-refresh</InputLabel>
            <Select
              value={refreshInterval || ''}
              onChange={(e) => setRefreshInterval(e.target.value ? Number(e.target.value) : null)}
              label="Auto-refresh"
            >
              <MenuItem value="">Off</MenuItem>
              <MenuItem value={5000}>5 seconds</MenuItem>
              <MenuItem value={10000}>10 seconds</MenuItem>
              <MenuItem value={30000}>30 seconds</MenuItem>
              <MenuItem value={60000}>1 minute</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              setAnalytics(getCacheAnalytics());
              setSummary(getCacheSummary());
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialogOpen(true)}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearCache}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Hit Rate
                  </Typography>
                  <Typography variant="h4">
                    {summary.overallHitRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {summary.totalHits.toLocaleString()} hits / {summary.totalMisses.toLocaleString()} misses
                  </Typography>
                </Box>
                <Box>
                  {summary.overallHitRate >= 70 ? (
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 40, color: 'error.main' }} />
                  )}
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={summary.overallHitRate}
                sx={{ mt: 2 }}
                color={summary.overallHitRate >= 70 ? 'success' : summary.overallHitRate >= 50 ? 'warning' : 'error'}
              />
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Time Saved
                  </Typography>
                  <Typography variant="h4">
                    {formatTime(summary.totalTimeSaved)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg: {formatTime(analytics.global.avgCacheTime)} per hit
                  </Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cache Size
                  </Typography>
                  <Typography variant="h4">
                    {formatBytes(cacheSize)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {Object.keys(analytics.byEndpoint).length} endpoints
                  </Typography>
                </Box>
                <StorageIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Health Status
                  </Typography>
                  <Typography variant="h4">
                    {cacheHealth.healthy ? 'Healthy' : 'Issues'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {cacheHealth.issues.length} issues found
                  </Typography>
                </Box>
                {cacheHealth.healthy ? (
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                ) : (
                  <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Health Alerts */}
      {!cacheHealth.healthy && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Cache Health Issues</AlertTitle>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {cacheHealth.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
          {cacheHealth.recommendations.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                Recommendations:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {cacheHealth.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </>
          )}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="cache dashboard tabs">
          <Tab label="Performance Overview" icon={<AnalyticsIcon />} iconPosition="start" />
          <Tab label="Endpoint Analysis" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Cache Distribution" icon={<MemoryIcon />} iconPosition="start" />
          <Tab label="Cache Warming" icon={<TrendingUpIcon />} iconPosition="start" />
        </Tabs>

        {/* Performance Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={(e, value) => value && setTimeRange(value)}
              size="small"
            >
              <ToggleButton value="1h">1 Hour</ToggleButton>
              <ToggleButton value="24h">24 Hours</ToggleButton>
              <ToggleButton value="7d">7 Days</ToggleButton>
              <ToggleButton value="all">All Time</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="chart">Chart</ToggleButton>
              <ToggleButton value="table">Table</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {viewMode === 'chart' ? (
            <>
              <Card sx={{ mb: 3 }}>
                <CardHeader title="Hit Rate Over Time" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeLabel" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="hitRate"
                        stroke="#8884d8"
                        name="Hit Rate %"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Hits vs Misses" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeLabel" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="hits"
                        stackId="1"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="Cache Hits"
                      />
                      <Area
                        type="monotone"
                        dataKey="misses"
                        stackId="1"
                        stroke="#ff7c7c"
                        fill="#ff7c7c"
                        name="Cache Misses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell align="right">Hits</TableCell>
                    <TableCell align="right">Misses</TableCell>
                    <TableCell align="right">Hit Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timelineData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.timeLabel}</TableCell>
                      <TableCell align="right">{row.hits}</TableCell>
                      <TableCell align="right">{row.misses}</TableCell>
                      <TableCell align="right">{row.hitRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Endpoint Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Card>
                <CardHeader title="Top Performing Endpoints" />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Endpoint</TableCell>
                          <TableCell align="right">Hit Rate</TableCell>
                          <TableCell align="right">Time Saved</TableCell>
                          <TableCell align="right">Size</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.topEndpoints.map((endpoint, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Tooltip title={`${endpoint.slice}:${endpoint.endpoint}`}>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                  {endpoint.endpoint}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${endpoint.hitRate.toFixed(1)}%`}
                                color="success"
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">{formatTime(endpoint.totalTimeSaved)}</TableCell>
                            <TableCell align="right">{formatBytes(endpoint.avgPayloadSize)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Card>
                <CardHeader title="Low Performing Endpoints" />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Endpoint</TableCell>
                          <TableCell align="right">Hit Rate</TableCell>
                          <TableCell align="right">Avg Response</TableCell>
                          <TableCell align="right">Requests</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.lowPerformingEndpoints.map((endpoint, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Tooltip title={`${endpoint.slice}:${endpoint.endpoint}`}>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                  {endpoint.endpoint}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${endpoint.hitRate.toFixed(1)}%`}
                                color="error"
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">{formatTime(endpoint.avgResponseTime)}</TableCell>
                            <TableCell align="right">{endpoint.hits + endpoint.misses}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Cache Distribution Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Card>
                <CardHeader title="Cache Distribution by API Slice" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Card>
                <CardHeader title="API Slice Performance" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pieData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Bar dataKey="hits" fill="#82ca9d" name="Hits" />
                      <Bar dataKey="misses" fill="#ff7c7c" name="Misses" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Cache Warming Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardHeader
              title="Cache Warming"
              action={
                <Button
                  variant="contained"
                  startIcon={<TrendingUpIcon />}
                  onClick={handleStartWarming}
                  disabled={warmingStatus.isRunning}
                >
                  {warmingStatus.isRunning ? 'Warming in Progress...' : 'Start Cache Warming'}
                </Button>
              }
            />
            <CardContent>
              {warmingStatus.isRunning && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Progress: {warmingStatus.completed} / {warmingStatus.total} endpoints
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(warmingStatus.completed / warmingStatus.total) * 100}
                  />
                </Box>
              )}

              <Typography variant="h6" gutterBottom>
                Cache Warming Configuration
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Cache warming preloads critical data to improve initial application performance.
                The following endpoints are configured for warming:
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Endpoint</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Last Warmed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warmingStatus.endpoints.map((endpoint, index) => (
                      <TableRow key={index}>
                        <TableCell>{endpoint.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={endpoint.priority}
                            color={endpoint.priority === 'high' ? 'error' : endpoint.priority === 'medium' ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {endpoint.completed ? (
                            <Chip label="Completed" color="success" size="small" />
                          ) : endpoint.error ? (
                            <Chip label="Failed" color="error" size="small" />
                          ) : (
                            <Chip label="Pending" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {endpoint.lastWarmed
                            ? format(new Date(endpoint.lastWarmed), 'MMM dd HH:mm')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Cache Analytics</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Export cache analytics data for further analysis or archiving.
          </Typography>
          <Alert severity="info">
            The export will include all cache metrics, endpoint performance data, and timeline events.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} variant="contained" startIcon={<DownloadIcon />}>
            Export JSON
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};