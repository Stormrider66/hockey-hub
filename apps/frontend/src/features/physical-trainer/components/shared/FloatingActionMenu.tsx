import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Calendar,
  Activity,
  TestTube2,
  X,
  Dumbbell,
  Heart,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionMenuProps {
  onCreateWorkout: (type?: 'strength' | 'conditioning' | 'hybrid' | 'agility') => void;
  onScheduleSession: () => void;
  onViewActiveSessions: () => void;
  onQuickTest: () => void;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  onCreateWorkout,
  onScheduleSession,
  onViewActiveSessions,
  onQuickTest,
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const [showWorkoutSubmenu, setShowWorkoutSubmenu] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setShowWorkoutSubmenu(false);
    }
  };

  const handleCreateWorkout = () => {
    setShowWorkoutSubmenu(!showWorkoutSubmenu);
  };

  const selectWorkoutType = (type: 'strength' | 'conditioning' | 'hybrid' | 'agility') => {
    onCreateWorkout(type);
    setIsOpen(false);
    setShowWorkoutSubmenu(false);
  };

  const menuItems = [
    {
      icon: Dumbbell,
      label: t('physicalTrainer:fab.createWorkout'),
      action: handleCreateWorkout,
      hasSubmenu: true,
    },
    {
      icon: Calendar,
      label: t('physicalTrainer:fab.scheduleSession'),
      action: () => {
        onScheduleSession();
        setIsOpen(false);
      },
    },
    {
      icon: Activity,
      label: t('physicalTrainer:fab.viewActiveSessions'),
      action: () => {
        onViewActiveSessions();
        setIsOpen(false);
      },
    },
    {
      icon: TestTube2,
      label: t('physicalTrainer:fab.quickTest'),
      action: () => {
        onQuickTest();
        setIsOpen(false);
      },
    },
  ];

  const workoutTypes = [
    {
      type: 'strength' as const,
      icon: Dumbbell,
      label: t('physicalTrainer:workoutTypes.strength'),
      color: 'text-blue-500',
    },
    {
      type: 'conditioning' as const,
      icon: Heart,
      label: t('physicalTrainer:workoutTypes.conditioning'),
      color: 'text-red-500',
    },
    {
      type: 'hybrid' as const,
      icon: Zap,
      label: t('physicalTrainer:workoutTypes.hybrid'),
      color: 'text-purple-500',
    },
    {
      type: 'agility' as const,
      icon: Target,
      label: t('physicalTrainer:workoutTypes.agility'),
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black"
              onClick={toggleMenu}
            />

            {/* Menu Items */}
            <div className="absolute bottom-16 right-0 space-y-2">
              {menuItems.map((item, index) => (
                <motion.div
                  key={`fab-menu-${item.label}-${index}`}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8, 
                    y: 20,
                    transition: { delay: (menuItems.length - index - 1) * 0.05 }
                  }}
                  className="flex items-center justify-end gap-2"
                >
                  {/* Submenu for workout types */}
                  {item.hasSubmenu && showWorkoutSubmenu && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2 bg-background border rounded-lg p-2 mr-2 shadow-lg"
                    >
                      {workoutTypes.map((workout) => (
                        <Button
                          key={workout.type}
                          variant="ghost"
                          size="sm"
                          onClick={() => selectWorkoutType(workout.type)}
                          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
                        >
                          <workout.icon className={cn("h-5 w-5", workout.color)} />
                          <span className="text-xs">{workout.label}</span>
                        </Button>
                      ))}
                    </motion.div>
                  )}

                  {/* Label */}
                  <span className="bg-background text-foreground px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
                    {item.label}
                  </span>

                  {/* Action Button */}
                  <Button
                    variant="default"
                    size="icon"
                    onClick={item.action}
                    className="h-12 w-12 rounded-full shadow-lg"
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant={isOpen ? "destructive" : "default"}
          size="icon"
          onClick={toggleMenu}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </motion.div>

      {/* Tooltip for closed state */}
      {!isOpen && (
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {t('physicalTrainer:fab.quickActions')}
        </div>
      )}
    </div>
  );
};