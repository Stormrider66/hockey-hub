import { EventBus } from '../services/EventBus';
export interface SagaStep<TData = any> {
    name: string;
    execute: (data: TData, context: SagaContext) => Promise<void>;
    compensate: (data: TData, context: SagaContext, error?: Error) => Promise<void>;
    retryable?: boolean;
    maxRetries?: number;
    timeout?: number;
}
export interface SagaContext {
    sagaId: string;
    correlationId: string;
    userId?: string;
    organizationId?: string;
    metadata: Record<string, any>;
    completedSteps: string[];
    failedStep?: string;
    error?: Error;
}
export interface SagaDefinition<TData = any> {
    name: string;
    steps: SagaStep<TData>[];
    onSuccess?: (data: TData, context: SagaContext) => Promise<void>;
    onFailure?: (data: TData, context: SagaContext, error: Error) => Promise<void>;
}
export declare enum SagaStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPENSATING = "compensating",
    COMPLETED = "completed",
    FAILED = "failed",
    COMPENSATED = "compensated"
}
export interface SagaExecution {
    id: string;
    name: string;
    status: SagaStatus;
    data: any;
    context: SagaContext;
    currentStep?: string;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}
export declare abstract class Saga<TData = any> {
    protected definition: SagaDefinition<TData>;
    protected eventBus?: EventBus;
    constructor(definition: SagaDefinition<TData>, eventBus?: EventBus);
    execute(data: TData, initialContext?: Partial<SagaContext>): Promise<SagaExecution>;
    private executeStep;
    private compensate;
    private executeWithTimeout;
    private delay;
    private generateSagaId;
    private generateCorrelationId;
    protected abstract persistExecution(execution: SagaExecution): Promise<void>;
    protected abstract loadExecution(sagaId: string): Promise<SagaExecution | null>;
}
//# sourceMappingURL=Saga.d.ts.map