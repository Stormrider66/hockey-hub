"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Heart,
  Activity,
  Shield,
  ArrowUp,
  ArrowDown,
  Equal,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import OptimizedChart from '@/components/charts/OptimizedChart';
import { wellnessMetrics } from '../../constants';
import type { UsePlayerDashboardReturn } from '../../hooks/usePlayerDashboard';

interface WellnessTabProps {
  dashboard: UsePlayerDashboardReturn;
}

export function WellnessTab({ dashboard }: WellnessTabProps) {
  const {
    t,
    wellnessTimeRange,
    setWellnessTimeRange,
    wellnessForm,
    updateWellnessField,
    hrvData,
    wellnessInsights,
    calculateReadinessScore,
    chartData,
    wellnessTrendsChartRef,
    hrvChartRef,
    readinessChartRef,
    sleepChartRef,
    radarChartRef,
    isSubmitting,
    isSubmittingWellness,
    submissionError,
    wellnessSubmitSuccess,
    handleWellnessSubmit,
    wellnessStats,
    hasInsights,
  } = dashboard;

  return (
    <div className="space-y-6">
      {/* Wellness Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('player:wellness.metrics.readiness')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 tabular-nums">{calculateReadinessScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {calculateReadinessScore >= 85 ? 'Peak performance ready' : 'Good to train'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">7-Day Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{Math.round(wellnessInsights.averages.readinessScore)}%</div>
            <div className="flex items-center gap-1 mt-1">
              {wellnessInsights.trends.readinessScore > 0 ? (
                <ArrowUp className="h-3 w-3 text-green-600" />
              ) : wellnessInsights.trends.readinessScore < 0 ? (
                <ArrowDown className="h-3 w-3 text-red-600" />
              ) : (
                <Equal className="h-3 w-3 text-gray-600" />
              )}
              <span className={cn(
                "text-xs",
                wellnessInsights.trends.readinessScore > 0 && "text-green-600",
                wellnessInsights.trends.readinessScore < 0 && "text-red-600",
                wellnessInsights.trends.readinessScore === 0 && "text-gray-600"
              )}>
                {Math.abs(wellnessInsights.trends.readinessScore).toFixed(1)}% vs last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sleep Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{wellnessInsights.averages.sleepQuality.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground mt-1">Past 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recovery Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-lg font-semibold text-green-600">Optimal</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready for high intensity</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      {hasInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wellness Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wellnessStats.insights!.map((insight, index) => (
                <div key={index} className={cn(
                  "flex items-start gap-3 p-3 rounded-lg",
                  insight.type === 'positive' && "bg-green-50 border border-green-200",
                  insight.type === 'warning' && "bg-amber-50 border border-amber-200"
                )}>
                  {React.createElement(insight.icon, {
                    className: cn(
                      "h-5 w-5 mt-0.5",
                      insight.type === 'positive' && "text-green-600",
                      insight.type === 'warning' && "text-amber-600"
                    )
                  })}
                  <p className={cn(
                    "text-sm",
                    insight.type === 'positive' && "text-green-800",
                    insight.type === 'warning' && "text-amber-800"
                  )}>
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Wellness Form */}
        <Card id="wellness-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" aria-hidden="true" />
              {t('player:wellness.title')}
            </CardTitle>
            <CardDescription>
              {t('player:wellness.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* HRV Section */}
            <div className="p-4 bg-purple-50 rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-900">Heart Rate Variability (HRV)</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hrv-value">HRV (ms)</Label>
                  <Input
                    id="hrv-value"
                    type="number"
                    min="20"
                    max="100"
                    value={wellnessForm.hrv}
                    onChange={(e) => updateWellnessField('hrv', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Normal range: 40-70ms
                  </p>
                </div>
                <div>
                  <Label htmlFor="hrv-device">Measurement Device</Label>
                  <select
                    id="hrv-device"
                    value={wellnessForm.hrvDevice}
                    onChange={(e) => updateWellnessField('hrvDevice', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="whoop">WHOOP</option>
                    <option value="oura">Oura Ring</option>
                    <option value="garmin">Garmin</option>
                    <option value="polar">Polar</option>
                    <option value="manual">Manual Entry</option>
                  </select>
                </div>
              </div>

              {/* HRV Status Indicator */}
              <div className="flex items-center justify-between p-3 bg-white rounded-md">
                <div>
                  <p className="text-sm font-medium">HRV Status</p>
                  <p className="text-xs text-muted-foreground">
                    Compared to your baseline
                  </p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  wellnessForm.hrv >= 60 && "bg-green-100 text-green-800",
                  wellnessForm.hrv >= 45 && wellnessForm.hrv < 60 && "bg-yellow-100 text-yellow-800",
                  wellnessForm.hrv < 45 && "bg-red-100 text-red-800"
                )}>
                  {wellnessForm.hrv >= 60 ? 'Optimal' : 
                   wellnessForm.hrv >= 45 ? 'Normal' : 'Low'}
                </div>
              </div>
            </div>

            {/* Wellness Sliders */}
            <div className="space-y-6">
              {wellnessMetrics.map((metric) => (
                <div key={metric.key}>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      {React.createElement(metric.icon, { 
                        className: "h-4 w-4", 
                        style: { color: metric.color }
                      })}
                      {metric.label}
                    </Label>
                    <span className="text-sm font-medium">
                      {wellnessForm[metric.key as keyof typeof wellnessForm]}/10
                    </span>
                  </div>
                  <Slider
                    value={[wellnessForm[metric.key as keyof typeof wellnessForm] as number]}
                    onValueChange={(value: number[]) => updateWellnessField(metric.key, value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label={`${metric.label}: ${wellnessForm[metric.key as keyof typeof wellnessForm]} out of 10`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{metric.inverse ? 'High' : 'Low'}</span>
                    <span>{metric.inverse ? 'Low' : 'High'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sleep-hours">Sleep Hours</Label>
                <Input
                  id="sleep-hours"
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={wellnessForm.sleepHours}
                  onChange={(e) => updateWellnessField('sleepHours', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="body-weight">Body Weight (lbs)</Label>
                <Input
                  id="body-weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={wellnessForm.bodyWeight}
                  onChange={(e) => updateWellnessField('bodyWeight', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="resting-hr">Resting Heart Rate (bpm)</Label>
              <Input
                id="resting-hr"
                type="number"
                min="30"
                max="100"
                value={wellnessForm.restingHeartRate}
                onChange={(e) => updateWellnessField('restingHeartRate', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="wellness-notes">Additional Notes</Label>
              <Textarea
                id="wellness-notes"
                placeholder="Any symptoms, concerns, or other notes..."
                value={wellnessForm.notes}
                onChange={(e) => updateWellnessField('notes', e.target.value)}
                className="mt-1 resize-none"
                rows={3}
                style={{ minHeight: '80px' }}
              />
            </div>
            
            {/* Submission tip */}
            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>Daily wellness tracking helps optimize your training and recovery. Submit your data each morning for best results.</span>
              </p>
            </div>

            {/* Submit Button */}
            <Button 
              className="w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
              onClick={handleWellnessSubmit} 
              disabled={isSubmittingWellness || isSubmitting}
              aria-busy={isSubmittingWellness || isSubmitting}
            >
              {(isSubmittingWellness || isSubmitting) ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  {t('common:messages.processing')}...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('player:wellness.submit')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Wellness Trends Chart */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Wellness Trends</CardTitle>
                <CardDescription>Track your wellness metrics over time</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={wellnessTimeRange === 'week' ? 'default' : 'outline'}
                  onClick={() => setWellnessTimeRange('week')}
                >
                  Week
                </Button>
                <Button
                  size="sm"
                  variant={wellnessTimeRange === 'month' ? 'default' : 'outline'}
                  onClick={() => setWellnessTimeRange('month')}
                >
                  Month
                </Button>
                <Button
                  size="sm"
                  variant={wellnessTimeRange === 'quarter' ? 'default' : 'outline'}
                  onClick={() => setWellnessTimeRange('quarter')}
                >
                  Quarter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80" ref={wellnessTrendsChartRef}>
              <OptimizedChart
                data={chartData}
                type="line"
                xKey="date"
                yKeys={['sleepQuality', 'energyLevel', 'mood', 'soreness']}
                height={320}
                maxDataPoints={100}
                colors={['#6366f1', '#10b981', '#f59e0b', '#ef4444']}
                xAxisFormatter={(value) => {
                  const date = new Date(value);
                  return wellnessTimeRange === 'week' 
                    ? date.toLocaleDateString('en', { weekday: 'short' })
                    : date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
                }}
                yAxisFormatter={(value) => value.toFixed(1)}
                tooltipFormatter={(value) => `${value.toFixed(1)}/10`}
                onDataOptimized={(original, optimized) => {
                  if (original > 100) {
                    console.log(`Wellness chart optimized: ${original} → ${optimized} points`);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Success/Error Messages */}
      <div className="mt-6">
        {wellnessSubmitSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <span className="font-semibold">{t('player:wellness.submitted')}</span>
              <br />
              <span className="text-sm">Your wellness data has been recorded successfully. Keep up the great work on tracking your health!</span>
            </AlertDescription>
          </Alert>
        )}
        
        {submissionError && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <span className="font-semibold">Submission Error</span>
              <br />
              <span className="text-sm">{submissionError}</span>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* HRV Tracking Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            HRV Analysis
          </CardTitle>
          <CardDescription>Heart Rate Variability trends and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current HRV</p>
              <p className="text-2xl font-bold text-purple-600 tabular-nums">{hrvData.current}ms</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">7-Day Average</p>
              <p className="text-2xl font-bold text-blue-600 tabular-nums">{hrvData.sevenDayAvg}ms</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">30-Day Average</p>
              <p className="text-2xl font-bold text-green-600 tabular-nums">{hrvData.thirtyDayAvg}ms</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Trend</p>
              <div className="flex items-center justify-center gap-1">
                {hrvData.trend === 'up' && <ArrowUp className="h-5 w-5 text-green-600" />}
                {hrvData.trend === 'down' && <ArrowDown className="h-5 w-5 text-red-600" />}
                {hrvData.trend === 'stable' && <Equal className="h-5 w-5 text-gray-600" />}
                <p className="text-xl font-bold tabular-nums">
                  {hrvData.trendValue}%
                </p>
              </div>
            </div>
          </div>

          {/* HRV Chart */}
          <div className="h-64" ref={hrvChartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHRV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  interval={wellnessTimeRange === 'week' ? 0 : 'preserveStartEnd'}
                />
                <YAxis domain={[30, 80]} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="hrv" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorHRV)" 
                  name="HRV (ms)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* HRV Insights */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Understanding Your HRV</p>
                <p className="text-xs text-blue-700 mt-1">
                  Higher HRV generally indicates better recovery and readiness. Your current HRV of {hrvData.current}ms is 
                  {hrvData.current >= 60 ? ' excellent for training' : hrvData.current >= 45 ? ' within normal range' : ' below optimal - consider lighter training'}.
                </p>
              </div>
            </div>
            
            {hrvData.trend === 'down' && hrvData.trendValue > 10 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Declining HRV Trend</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Your HRV has decreased by {hrvData.trendValue}% over the past week. Consider additional recovery time or lighter training loads.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Wellness Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Readiness Score Trend</CardTitle>
            <CardDescription>Your overall readiness over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48" ref={readinessChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReadiness" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    interval={wellnessTimeRange === 'week' ? 1 : 'preserveStartEnd'}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="readinessScore" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorReadiness)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sleep Pattern</CardTitle>
            <CardDescription>Hours and quality tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48" ref={sleepChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayOfWeek" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={[0, 12]} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="sleepHours" fill="#6366f1" opacity={0.8} />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="sleepQuality" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Wellness Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Wellness Balance</CardTitle>
            <CardDescription>Today's metrics visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48" ref={radarChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  { metric: 'Sleep', value: wellnessForm.sleepQuality },
                  { metric: 'Energy', value: wellnessForm.energyLevel },
                  { metric: 'Mood', value: wellnessForm.mood },
                  { metric: 'Motivation', value: wellnessForm.motivation },
                  { metric: 'Recovery', value: 10 - wellnessForm.soreness },
                  { metric: 'Stress', value: 10 - wellnessForm.stressLevel },
                  { metric: 'HRV', value: Math.min(10, (wellnessForm.hrv - 30) / 7) },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Radar 
                    name="Current" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.5} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default WellnessTab;



