import { useState } from 'react';
import { useTestData } from '@/hooks/useTestData';
import { mockPlayerReadiness } from '../constants/mockData';
import { SessionTemplate, TestFormData } from '../types';

export function usePhysicalTrainerData() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use the real hook for test data
  const { players, testBatches, testResults, isLoading, error } = useTestData();
  
  // Navigation handlers
  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  const navigateToPlayerStatus = () => {
    setActiveTab('status');
  };

  const navigateToCalendar = () => {
    setActiveTab('calendar');
  };

  // Template handling
  const handleApplyTemplate = (template: SessionTemplate, date?: Date, time?: string) => {
    // Create a new session based on the template
    const sessionData = {
      name: template.name,
      type: template.type,
      duration: template.duration,
      description: template.description,
      exercises: template.exercises,
      date: date || new Date(),
      time: time || '09:00',
      targetPlayers: template.targetPlayers,
    };
    
    // Could pass this data to the create modal
    console.log('Applying template:', sessionData);
    
    // Return the session data for the parent component to use
    return sessionData;
  };

  // Test submission handlers
  const handleTestSubmit = (data: TestFormData) => {
    console.log('Test data submitted:', data);
    // In a real app, this would call an API
  };

  const handleTestSaveDraft = (data: TestFormData) => {
    console.log('Draft saved:', data);
    // In a real app, this would save to local storage or API
  };

  return {
    activeTab,
    setActiveTab,
    players,
    testBatches,
    testResults,
    isLoading,
    error,
    playerReadiness: mockPlayerReadiness,
    navigateToTab,
    navigateToPlayerStatus,
    navigateToCalendar,
    handleApplyTemplate,
    handleTestSubmit,
    handleTestSaveDraft
  };
}