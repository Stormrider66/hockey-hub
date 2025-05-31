import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Chart component
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart" />,
}));
// Mock RTK Query hooks
jest.mock('../../features/testAnalytics/testAnalyticsApi', () => ({
  useGetTestDefinitionsQuery: () => ({ data: [{ id: 't1', name: 'Test 1' }, { id: 't2', name: 'Test 2' }] }),
  useLazyGetCorrelationQuery: () => [() => {}, { data: { success: true, count: 3, r: 0.5, scatter: [{ x: 1, y: 2 }] } }],
  usePostRegressionMutation: () => [() => {}, { data: { success: true, count: 2, coefficients: [1, 2], r2: 0.75 } }],
}));

import { TestAnalyticsPanel } from '../TestAnalyticsPanel';

describe('TestAnalyticsPanel', () => {
  it('renders correlation results when data is available', () => {
    render(<TestAnalyticsPanel playerId="player1" />);
    // Check Pearson's r text
    expect(screen.getByText(/Pearson's r: 0.500/)).toBeInTheDocument();
    // Check charts rendered (there should be multiple)
    const charts = screen.getAllByTestId('chart');
    expect(charts.length).toBeGreaterThan(0);
  });

  it('renders regression results when data is available', () => {
    render(<TestAnalyticsPanel playerId="player1" />);
    // Check intercept, slope and R² text
    expect(screen.getByText(/Intercept: 1.000/)).toBeInTheDocument();
    expect(screen.getByText(/Slope: 2.000/)).toBeInTheDocument();
    expect(screen.getByText(/R²: 0.750/)).toBeInTheDocument();
  });
}); 