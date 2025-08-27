export declare class TargetMetricDto {
    type: 'absolute' | 'percentage' | 'zone';
    value: number;
    reference?: 'max' | 'threshold' | 'resting' | 'ftp';
}
export declare class IntervalTargetMetricsDto {
    heartRate?: TargetMetricDto;
    watts?: TargetMetricDto;
    pace?: TargetMetricDto;
    rpm?: number;
    calories?: number;
}
export declare class IntervalSetDto {
    id: string;
    type: 'warmup' | 'work' | 'rest' | 'active_recovery' | 'cooldown';
    duration: number;
    equipment: string;
    targetMetrics: IntervalTargetMetricsDto;
    notes?: string;
}
export declare class IntervalProgramDto {
    name: string;
    equipment: string;
    totalDuration: number;
    estimatedCalories: number;
    intervals: IntervalSetDto[];
}
//# sourceMappingURL=interval-program.dto.d.ts.map