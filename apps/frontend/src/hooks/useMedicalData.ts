import { useState, useEffect } from 'react';
import { useGetTeamMedicalStatsQuery, useGetActiveInjuriesQuery } from '@/store/api/medicalApi';

export interface MedicalDashboardData {
  totalInjuries: number;
  activeInjuries: number;
  recoveredThisMonth: number;
  averageRecoveryTime: number;
  injuryTrend: number; // percentage change
  isLoading: boolean;
  error: any;
}

export function useMedicalData(): MedicalDashboardData {
  const { data: teamStats, isLoading: statsLoading, error: statsError } = useGetTeamMedicalStatsQuery();
  const { data: activeInjuries, isLoading: injuriesLoading, error: injuriesError } = useGetActiveInjuriesQuery();
  
  const [dashboardData, setDashboardData] = useState<MedicalDashboardData>({
    totalInjuries: 0,
    activeInjuries: 0,
    recoveredThisMonth: 0,
    averageRecoveryTime: 0,
    injuryTrend: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (teamStats && activeInjuries) {
      // Calculate recovered this month
      const currentMonth = new Date().getMonth();
      const recoveredThisMonth = activeInjuries.filter(injury => {
        if (injury.recovery_status === 'recovered' && injury.expected_return_date) {
          const recoveryDate = new Date(injury.expected_return_date);
          return recoveryDate.getMonth() === currentMonth;
        }
        return false;
      }).length;

      // Calculate injury trend (mock data for now)
      const lastMonthInjuries = teamStats.total_active_injuries * 0.8;
      const injuryTrend = ((teamStats.total_active_injuries - lastMonthInjuries) / lastMonthInjuries) * 100;

      setDashboardData({
        totalInjuries: teamStats.total_active_injuries,
        activeInjuries: activeInjuries.length,
        recoveredThisMonth,
        averageRecoveryTime: teamStats.average_recovery_time,
        injuryTrend,
        isLoading: false,
        error: null,
      });
    }
  }, [teamStats, activeInjuries]);

  return {
    ...dashboardData,
    isLoading: statsLoading || injuriesLoading,
    error: statsError || injuriesError,
  };
}