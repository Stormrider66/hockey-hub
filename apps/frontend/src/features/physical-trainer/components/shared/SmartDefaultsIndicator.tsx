import React, { useState } from 'react';
import { 
  Sparkles, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Brain,
  Clock,
  Calendar,
  Users,
  History,
  Settings,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DefaultReasoning } from '../../hooks/useSmartDefaults';
import { cn } from '@/lib/utils';

interface SmartDefaultsIndicatorProps {
  confidence: number;
  reasoning: DefaultReasoning[];
  isCalculating?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const SmartDefaultsIndicator: React.FC<SmartDefaultsIndicatorProps> = ({
  confidence,
  reasoning,
  isCalculating = false,
  onDismiss,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (conf >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (conf >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'calendar':
        return <Calendar className="h-3 w-3" />;
      case 'history':
        return <History className="h-3 w-3" />;
      case 'preferences':
        return <Settings className="h-3 w-3" />;
      case 'pattern':
        return <Brain className="h-3 w-3" />;
      case 'availability':
        return <Clock className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const topReasons = reasoning
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'relative rounded-lg border p-3 shadow-sm transition-all',
        getConfidenceColor(confidence),
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-5 w-5" />
            {isCalculating && (
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-5 w-5 opacity-50" />
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm">
              Smart Defaults Applied
            </span>
            
            <div className="flex items-center gap-1">
              <div className="text-xs font-medium">
                {confidence}% confidence
              </div>
              <div className="h-1.5 w-16 bg-white/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-current rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/50 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary (always visible) */}
      {!isExpanded && topReasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {topReasons.map((reason, index) => (
            <div
              key={index}
              className="flex items-center gap-1 text-xs bg-white/50 px-2 py-1 rounded-md"
            >
              {getSourceIcon(reason.source)}
              <span className="max-w-[200px] truncate">{reason.reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-current/20">
              <div className="space-y-2">
                {reasoning.map((reason, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {getSourceIcon(reason.source)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {reason.field.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-xs opacity-75">
                          ({reason.confidence}%)
                        </span>
                      </div>
                      <div className="text-xs opacity-75 mt-0.5">
                        {reason.reason}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Learning Note */}
              <div className="mt-3 pt-3 border-t border-current/20 text-xs opacity-75">
                <p className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Smart defaults learn from your patterns and preferences over time.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};