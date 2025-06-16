"use client";

import React, { useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Line } from 'react-chartjs-2';
import {
  useGetTestDefinitionsQuery,
  useLazyGetCorrelationQuery,
  usePostRegressionMutation,
} from '../features/testAnalytics/testAnalyticsApi';

interface TestAnalyticsPanelProps { playerId: string; }
export function TestAnalyticsPanel({ playerId }: TestAnalyticsPanelProps) {
  // Redux Toolkit Query hooks
  const { data: definitions = [], isLoading: defLoading, isError: defError } = useGetTestDefinitionsQuery();
  const [triggerCorrelation, { data: corrData, isLoading: corrLoading, isError: corrError }] = useLazyGetCorrelationQuery();
  const [postRegression, { data: regData, isLoading: regLoading, isError: regError }] = usePostRegressionMutation();
  const [testX, setTestX] = useState<string>('');
  const [testY, setTestY] = useState<string>('');
  const [targetTest, setTargetTest] = useState<string>('');
  const [predictors, setPredictors] = useState<string[]>([]);

  const handleComputeCorrelation = () => {
    if (testX && testY) triggerCorrelation({ testX, testY, playerId });
  };

  const handleComputeRegression = () => {
    if (targetTest && predictors.length > 0) postRegression({ targetTest, predictors, playerId });
  };

  return (
    <div className="space-y-8">
      <section className="p-4 bg-white rounded-lg shadow space-y-4">
        <h2 className="text-lg font-medium">Correlation Analysis</h2>
        {defLoading ? (
          <div className="flex items-center space-x-2">
            <div className="border-4 border-gray-200 border-t-blue-500 rounded-full w-6 h-6 animate-spin" />
            <span>Loading tests...</span>
          </div>
        ) : defError ? (
          <p className="text-red-600">Error loading test definitions.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            <Select onValueChange={setTestX} value={testX}>
              <SelectTrigger>
                <SelectValue placeholder="Select Test X" />
              </SelectTrigger>
              <SelectContent>
                {definitions.map(def => (
                  <SelectItem key={def.id} value={def.id}>{def.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setTestY} value={testY}>
              <SelectTrigger>
                <SelectValue placeholder="Select Test Y" />
              </SelectTrigger>
              <SelectContent>
                {definitions.map(def => (
                  <SelectItem key={def.id} value={def.id}>{def.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              className={cn('px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700', corrLoading && 'opacity-50 cursor-not-allowed')}
              onClick={handleComputeCorrelation}
              disabled={corrLoading}
            >
              Compute Correlation
            </button>
          </div>
        )}
        {corrLoading && <p>Computing correlation...</p>}
        {corrError && <p className="text-red-600">Error computing correlation.</p>}
        {corrData && (
          <div className="space-y-2">
            <p>Pearson's r: {corrData.r.toFixed(3)}</p>
            <div className="h-64">
              <Line
                data={{ datasets: [{ label: 'Scatter', data: corrData.scatter, backgroundColor: 'rgba(59, 130, 246, 0.7)' }] }}
                options={{ scales: { x: { type: 'linear', position: 'bottom' } } }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="p-4 bg-white rounded-lg shadow space-y-4">
        <h2 className="text-lg font-medium">Regression Analysis (Single Predictor)</h2>
        {defLoading ? (
          <div className="flex items-center space-x-2">
            <div className="border-4 border-gray-200 border-t-green-500 rounded-full w-6 h-6 animate-spin" />
            <span>Loading tests...</span>
          </div>
        ) : defError ? (
          <p className="text-red-600">Error loading test definitions.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            <Select onValueChange={setTargetTest} value={targetTest}>
              <SelectTrigger>
                <SelectValue placeholder="Select Target Test" />
              </SelectTrigger>
              <SelectContent>
                {definitions.map(def => (
                  <SelectItem key={def.id} value={def.id}>{def.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={value => setPredictors([value])} value={predictors[0] || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select Predictor Test" />
              </SelectTrigger>
              <SelectContent>
                {definitions.map(def => (
                  <SelectItem key={def.id} value={def.id}>{def.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              className={cn('px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700', regLoading && 'opacity-50 cursor-not-allowed')}
              onClick={handleComputeRegression}
              disabled={regLoading}
            >
              Compute Regression
            </button>
          </div>
        )}
        {regLoading && <p>Computing regression...</p>}
        {regError && <p className="text-red-600">Error computing regression.</p>}
        {regData && (
          <div className="space-y-1">
            <p>Intercept: {regData.coefficients[0].toFixed(3)}</p>
            <p>Slope: {regData.coefficients[1].toFixed(3)}</p>
            <p>R²: {regData.r2.toFixed(3)}</p>
          </div>
        )}
        {regData && corrData && (
          <div className="h-64">
            <Line
              data={{
                datasets: [
                  {
                    label: 'Data',
                    data: corrData.scatter,
                    backgroundColor: 'rgba(16,185,129,0.5)',
                    pointRadius: 4,
                  },
                  {
                    label: 'Fit',
                    type: 'line',
                    data: corrData.scatter.map(p => ({
                      x: p.x,
                      y: regData.coefficients[0] + regData.coefficients[1] * p.x,
                    })),
                    borderColor: 'rgba(16,185,129,1)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                  },
                ],
              }}
              options={{ scales: { x: { type: 'linear', position: 'bottom' } } }}
            />
          </div>
        )}
      </section>
    </div>
  );
} 