'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from '@/components/icons';
import { performanceMonitor } from '../../utils/performanceMonitor';

interface TourStep {
  id: string;
  title: string;
  content: string;
  selector?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Physical Trainer Dashboard',
    content: 'This dashboard helps you manage workouts, track player performance, and optimize training programs.',
  },
  {
    id: 'tabs',
    title: 'Navigate with Tabs',
    content: 'Use the tabs to access different features like Sessions, Calendar, Player Status, and more.',
    selector: '[role="tablist"]',
  },
  {
    id: 'create',
    title: 'Create New Sessions',
    content: 'Click the Create Session button to build new workouts for your players.',
    selector: '[data-tour="create-session"]',
  },
];

export function TourGuide() {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    performanceMonitor.startMeasure('tour-guide-init');
    
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('physicalTrainer.tourCompleted');
    if (!hasSeenTour) {
      // Show tour after a short delay
      setTimeout(() => setShowTour(true), 2000);
    }
    
    performanceMonitor.endMeasure('tour-guide-init');
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    localStorage.setItem('physicalTrainer.tourCompleted', 'true');
    setShowTour(false);
  };

  if (!showTour) return null;

  const step = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={completeTour} />
      <Card className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 pointer-events-auto">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={completeTour}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-gray-600 mb-6">{step.content}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <Button onClick={handleNext} size="sm">
              {currentStep < tourSteps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                'Finish'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}