import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Check, X, Clock, Target, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgilityProgram, AgilityDrill, DrillExecution, AgilitySessionExecution, calculateAgilityMetrics } from '../../types/agility.types';
import { PatternVisualizer } from '../agility-builder/PatternVisualizer';
import { intervalTimerAudio } from '../../services/IntervalTimerAudioService';
import { useTranslation } from 'react-i18next';

interface AgilitySessionProps {
  sessionId: string;
  program: AgilityProgram;
  onComplete?: (execution: AgilitySessionExecution) => void;
  onCancel?: () => void;
}

type SessionPhase = 'warmup' | 'drills' | 'cooldown' | 'completed';
type DrillStatus = 'pending' | 'active' | 'completed';

interface DrillState {
  id: string;
  status: DrillStatus;
  currentRep: number;
  currentSet: number;
  executions: DrillExecution[];
}

export const AgilityDisplay: React.FC<AgilitySessionProps> = ({ 
  sessionId, 
  program, 
  onComplete, 
  onCancel 
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  
  // State management
  const [phase, setPhase] = useState<SessionPhase>('warmup');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [drillStates, setDrillStates] = useState<DrillState[]>([]);
  const [currentAttemptTime, setCurrentAttemptTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [attemptErrors, setAttemptErrors] = useState(0);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const attemptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<Date | null>(null);

  // Initialize drill states
  useEffect(() => {
    const states: DrillState[] = program.drills.map(drill => ({
      id: drill.id,
      status: 'pending',
      currentRep: 1,
      currentSet: 1,
      executions: []
    }));
    setDrillStates(states);
  }, [program]);

  // Main timer
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Attempt timer
  useEffect(() => {
    const currentDrill = program.drills[currentDrillIndex];
    const currentState = drillStates[currentDrillIndex];
    
    if (isRunning && !isPaused && phase === 'drills' && currentState?.status === 'active') {
      attemptTimerRef.current = setInterval(() => {
        setCurrentAttemptTime(prev => prev + 0.1);
      }, 100);
    } else {
      if (attemptTimerRef.current) {
        clearInterval(attemptTimerRef.current);
      }
    }
    return () => {
      if (attemptTimerRef.current) {
        clearInterval(attemptTimerRef.current);
      }
    };
  }, [isRunning, isPaused, phase, currentDrillIndex, drillStates]);

  // Phase management
  useEffect(() => {
    if (phase === 'warmup' && elapsedTime >= program.warmupDuration) {
      handlePhaseTransition('drills');
    } else if (phase === 'cooldown' && elapsedTime >= program.warmupDuration + getTotalDrillsTime() + program.cooldownDuration) {
      handleComplete();
    }
  }, [elapsedTime, phase]);

  const getTotalDrillsTime = () => {
    let total = 0;
    program.drills.forEach(drill => {
      const drillTime = drill.duration || drill.targetTime || 15;
      const totalReps = drill.reps * (drill.sets || 1);
      const restTime = drill.restBetweenReps * (totalReps - 1);
      const betweenSetsRest = drill.sets ? (drill.sets - 1) * 60 : 0;
      total += (drillTime * totalReps) + restTime + betweenSetsRest;
    });
    return total;
  };

  const handlePhaseTransition = (newPhase: SessionPhase) => {
    setPhase(newPhase);
    if (newPhase === 'drills') {
      updateDrillState(0, { status: 'active' });
      if (!isMuted) {
        intervalTimerAudio.playStart();
      }
    } else if (newPhase === 'cooldown') {
      if (!isMuted) {
        intervalTimerAudio.playComplete();
      }
    }
  };

  const updateDrillState = (index: number, updates: Partial<DrillState>) => {
    setDrillStates(prev => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], ...updates };
      return newStates;
    });
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    sessionStartTime.current = new Date();
    if (!isMuted) {
      intervalTimerAudio.playStart();
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isMuted) {
      intervalTimerAudio.playCountdown();
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setCurrentAttemptTime(0);
    setPhase('warmup');
    setCurrentDrillIndex(0);
    if (onCancel) {
      onCancel();
    }
  };

  const handleDrillComplete = () => {
    const currentDrill = program.drills[currentDrillIndex];
    const currentState = drillStates[currentDrillIndex];
    
    // Record execution
    const execution: DrillExecution = {
      drillId: currentDrill.id,
      playerId: 'current-player', // TODO: Get from context
      attemptNumber: (currentState.currentSet - 1) * currentDrill.reps + currentState.currentRep,
      completionTime: currentAttemptTime,
      errors: attemptErrors,
      notes: ''
    };
    
    const updatedExecutions = [...currentState.executions, execution];
    
    // Check if we need to move to next rep/set/drill
    if (currentState.currentRep < currentDrill.reps) {
      // Next rep
      updateDrillState(currentDrillIndex, {
        currentRep: currentState.currentRep + 1,
        executions: updatedExecutions
      });
      setCurrentAttemptTime(0);
      setAttemptErrors(0);
    } else if (currentState.currentSet < (currentDrill.sets || 1)) {
      // Next set
      updateDrillState(currentDrillIndex, {
        currentSet: currentState.currentSet + 1,
        currentRep: 1,
        executions: updatedExecutions
      });
      setCurrentAttemptTime(0);
      setAttemptErrors(0);
    } else {
      // Drill complete, move to next
      updateDrillState(currentDrillIndex, {
        status: 'completed',
        executions: updatedExecutions
      });
      
      if (currentDrillIndex < program.drills.length - 1) {
        setCurrentDrillIndex(currentDrillIndex + 1);
        updateDrillState(currentDrillIndex + 1, { status: 'active' });
        setCurrentAttemptTime(0);
        setAttemptErrors(0);
        setShowInstructions(true);
      } else {
        // All drills complete, move to cooldown
        handlePhaseTransition('cooldown');
      }
    }
    
    if (!isMuted) {
      intervalTimerAudio.playComplete();
    }
  };

  const handleComplete = () => {
    setPhase('completed');
    setIsRunning(false);
    
    // Compile all executions
    const allExecutions: DrillExecution[] = drillStates.flatMap(state => state.executions);
    
    const sessionExecution: AgilitySessionExecution = {
      id: `exec-${sessionId}-${Date.now()}`,
      sessionId,
      playerId: 'current-player', // TODO: Get from context
      startTime: sessionStartTime.current || new Date(),
      endTime: new Date(),
      status: 'completed',
      drillExecutions: allExecutions,
      overallMetrics: calculateAgilityMetrics(allExecutions),
      feedback: {
        perceivedDifficulty: 3 // TODO: Add feedback UI
      }
    };
    
    if (onComplete) {
      onComplete(sessionExecution);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAttemptTime = (seconds: number) => {
    return seconds.toFixed(1) + 's';
  };

  const getCurrentDrill = () => {
    return program.drills[currentDrillIndex];
  };

  const renderWarmup = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <h2 className="text-4xl font-bold mb-4">{t('physicalTrainer:agility.warmup')}</h2>
        <div className="text-6xl font-mono mb-6">
          {formatTime(Math.max(0, program.warmupDuration - elapsedTime))}
        </div>
        <p className="text-xl text-gray-600">{t('physicalTrainer:agility.prepareBody')}</p>
      </motion.div>
    </div>
  );

  const renderDrill = () => {
    const currentDrill = getCurrentDrill();
    const currentState = drillStates[currentDrillIndex];
    
    if (!currentDrill || !currentState) return null;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Pattern Visualization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">{currentDrill.name}</h3>
          {currentDrill.patternData ? (
            <div className="aspect-square">
              <PatternVisualizer
                pattern={currentDrill.patternData}
                isAnimated={currentState.status === 'active' && !isPaused}
                showPaths
                readOnly
              />
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">{t('physicalTrainer:agility.noPattern')}</p>
            </div>
          )}
        </div>
        
        {/* Drill Info & Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-medium">
                {t('physicalTrainer:agility.set')} {currentState.currentSet}/{currentDrill.sets || 1} - 
                {t('physicalTrainer:agility.rep')} {currentState.currentRep}/{currentDrill.reps}
              </h4>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showInstructions ? t('physicalTrainer:agility.hideInstructions') : t('physicalTrainer:agility.showInstructions')}
              </button>
            </div>
            
            {/* Timer Display */}
            <div className="text-center mb-6">
              <div className="text-5xl font-mono font-bold text-blue-600">
                {formatAttemptTime(currentAttemptTime)}
              </div>
              {currentDrill.targetTime && (
                <p className="text-sm text-gray-600 mt-1">
                  {t('physicalTrainer:agility.target')}: {currentDrill.targetTime}s
                </p>
              )}
            </div>
            
            {/* Instructions */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h5 className="font-medium mb-2">{t('physicalTrainer:agility.instructions')}:</h5>
                    <ul className="space-y-1">
                      {currentDrill.instructions.map((instruction, idx) => (
                        <li key={idx} className="flex items-start">
                          <ChevronRight className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-blue-600" />
                          <span className="text-sm">{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Error Tracking */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setAttemptErrors(prev => Math.max(0, prev - 1))}
                  className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={attemptErrors === 0}
                >
                  -
                </button>
                <div className="text-center">
                  <div className="text-2xl font-bold">{attemptErrors}</div>
                  <div className="text-sm text-gray-600">{t('physicalTrainer:agility.errors')}</div>
                </div>
                <button
                  onClick={() => setAttemptErrors(prev => prev + 1)}
                  className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={handleDrillComplete}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Check className="w-5 h-5 mr-2" />
                {t('physicalTrainer:agility.completeRep')}
              </button>
            </div>
            
            {/* Previous Attempts */}
            {currentState.executions.length > 0 && (
              <div className="border-t pt-4">
                <h5 className="font-medium mb-2">{t('physicalTrainer:agility.previousAttempts')}:</h5>
                <div className="grid grid-cols-3 gap-2">
                  {currentState.executions.slice(-3).map((exec, idx) => (
                    <div key={idx} className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-mono text-lg">{exec.completionTime.toFixed(1)}s</div>
                      <div className="text-xs text-gray-600">{exec.errors} {t('physicalTrainer:agility.errors')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCooldown = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <h2 className="text-4xl font-bold mb-4">{t('physicalTrainer:agility.cooldown')}</h2>
        <div className="text-6xl font-mono mb-6">
          {formatTime(Math.max(0, 
            program.warmupDuration + getTotalDrillsTime() + program.cooldownDuration - elapsedTime
          ))}
        </div>
        <p className="text-xl text-gray-600">{t('physicalTrainer:agility.stretchRecover')}</p>
      </motion.div>
    </div>
  );

  const renderCompleted = () => {
    const allExecutions = drillStates.flatMap(state => state.executions);
    const metrics = calculateAgilityMetrics(allExecutions);
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-2xl"
        >
          <Check className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-6">{t('physicalTrainer:agility.sessionComplete')}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{formatTime(metrics.totalTime)}</div>
              <div className="text-sm text-gray-600">{t('physicalTrainer:agility.totalTime')}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{metrics.avgCompletionTime.toFixed(1)}s</div>
              <div className="text-sm text-gray-600">{t('physicalTrainer:agility.avgTime')}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{metrics.bestTime.toFixed(1)}s</div>
              <div className="text-sm text-gray-600">{t('physicalTrainer:agility.bestTime')}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{metrics.successRate.toFixed(0)}%</div>
              <div className="text-sm text-gray-600">{t('physicalTrainer:agility.successRate')}</div>
            </div>
          </div>
          
          <button
            onClick={() => onComplete && window.history.back()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('physicalTrainer:agility.backToDashboard')}
          </button>
        </motion.div>
      </div>
    );
  };

  const renderContent = () => {
    switch (phase) {
      case 'warmup':
        return renderWarmup();
      case 'drills':
        return renderDrill();
      case 'cooldown':
        return renderCooldown();
      case 'completed':
        return renderCompleted();
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{program.name}</h1>
              <p className="text-gray-600">{program.description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className="text-xl font-mono">
                <Clock className="inline w-5 h-5 mr-2" />
                {formatTime(elapsedTime)}
              </div>
              
              {/* Audio Control */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded hover:bg-gray-100"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              {/* Phase Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded ${phase === 'warmup' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}>
                  {t('physicalTrainer:agility.warmup')}
                </div>
                <div className={`px-3 py-1 rounded ${phase === 'drills' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                  {t('physicalTrainer:agility.drills')}
                </div>
                <div className={`px-3 py-1 rounded ${phase === 'cooldown' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                  {t('physicalTrainer:agility.cooldown')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderContent()}
      </div>
      
      {/* Control Bar */}
      {phase !== 'completed' && (
        <div className="bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Drill Progress */}
              <div className="flex items-center space-x-2">
                {program.drills.map((drill, idx) => (
                  <div
                    key={drill.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${drillStates[idx]?.status === 'completed' ? 'bg-green-600 text-white' : 
                        drillStates[idx]?.status === 'active' ? 'bg-blue-600 text-white animate-pulse' : 
                        'bg-gray-300 text-gray-600'}`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center space-x-3">
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {t('physicalTrainer:agility.start')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handlePause}
                      className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
                    >
                      {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                      {isPaused ? t('physicalTrainer:agility.resume') : t('physicalTrainer:agility.pause')}
                    </button>
                    <button
                      onClick={handleStop}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      {t('physicalTrainer:agility.stop')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgilityDisplay;