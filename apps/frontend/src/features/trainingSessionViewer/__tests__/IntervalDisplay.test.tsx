import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import trainingSessionViewerReducer, { setIntervals } from '../trainingSessionViewerSlice';
import IntervalDisplay from '../IntervalDisplay';
import { axe } from 'jest-axe';

function renderWithStore(ui: React.ReactElement, preloadedState: any = {}) {
  const store = configureStore({
    reducer: { trainingSessionViewer: trainingSessionViewerReducer },
    preloadedState: {
      trainingSessionViewer: {
        displayMode: 'team-selection',
        metricType: 'heartRate',
        fullScreen: false,
        intervals: [] as any,
        ...preloadedState,
      },
    },
  });
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

describe('IntervalDisplay component', () => {
  it('renders initial work phase', async () => {
    // Render with predefined intervals
    const demoIntervals = [
      { phase: 'work', duration: 3 },
      { phase: 'rest', duration: 2 },
    ];
    renderWithStore(<IntervalDisplay socket={null} />, { intervals: demoIntervals });
    // Initial phase 'work' should appear
    const workElem = await screen.findByText('work');
    expect(workElem).toBeInTheDocument();
  });

  it(
    'is accessible',
    async () => {
      jest.useRealTimers();
      const { container } = renderWithStore(<IntervalDisplay socket={null} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
    10000
  );
}); 