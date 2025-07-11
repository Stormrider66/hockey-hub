import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { configureStore } from '@reduxjs/toolkit';
import AgilityWorkoutBuilder from '../AgilityWorkoutBuilder';
import { trainingApi } from '@/store/api/trainingApi';
import i18n from '@/i18n';

// Mock the dnd-kit components
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  DragOverlay: ({ children }: any) => <div>{children}</div>,
  closestCenter: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: jest.fn(),
  arrayMove: jest.fn((arr: any[], from: number, to: number) => {
    const newArr = [...arr];
    const [removed] = newArr.splice(from, 1);
    newArr.splice(to, 0, removed);
    return newArr;
  }),
}));

const mockStore = configureStore({
  reducer: {
    [trainingApi.reducerPath]: trainingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(trainingApi.middleware),
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </Provider>
  );
};

describe('AgilityWorkoutBuilder', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component without crashing', () => {
    renderWithProviders(
      <AgilityWorkoutBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/agility.builder.title/i)).toBeInTheDocument();
  });

  it('displays all tabs', () => {
    renderWithProviders(
      <AgilityWorkoutBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/agility.tabs.build/i)).toBeInTheDocument();
    expect(screen.getByText(/agility.tabs.library/i)).toBeInTheDocument();
    expect(screen.getByText(/agility.tabs.templates/i)).toBeInTheDocument();
    expect(screen.getByText(/agility.tabs.equipment/i)).toBeInTheDocument();
  });

  it('shows initial duration badges', () => {
    renderWithProviders(
      <AgilityWorkoutBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Default warmup + cooldown = 10 minutes
    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByText('0 drills')).toBeInTheDocument();
  });

  it('loads initial program data when provided', () => {
    const initialProgram = {
      id: 'test-1',
      name: 'Test Agility Program',
      description: 'Test description',
      drills: [],
      warmupDuration: 600,
      cooldownDuration: 600,
      totalDuration: 1200,
      equipmentNeeded: [],
      difficulty: 'intermediate' as const,
      focusAreas: ['speed', 'change_of_direction'],
      tags: []
    };

    renderWithProviders(
      <AgilityWorkoutBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        initialProgram={initialProgram}
      />
    );

    expect(screen.getByDisplayValue('Test Agility Program')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByText('20 min')).toBeInTheDocument(); // Total duration
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithProviders(
      <AgilityWorkoutBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText(/cancel/i);
    cancelButton.click();

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables save button when program name is empty', () => {
    renderWithProviders(
      <AgilityWorkoutBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText(/save/i).closest('button');
    expect(saveButton).toBeDisabled();
  });
});