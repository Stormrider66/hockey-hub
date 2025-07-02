import { DataSource } from 'typeorm';
import { Saga, SagaDefinition, SagaExecution, SagaStatus } from './Saga';
import { EventBus } from '../services/EventBus';
export declare class DatabaseSaga<TData = any> extends Saga<TData> {
    private sagaRepo;
    constructor(definition: SagaDefinition<TData>, dataSource: DataSource, eventBus?: EventBus);
    protected persistExecution(execution: SagaExecution): Promise<void>;
    protected loadExecution(sagaId: string): Promise<SagaExecution | null>;
    resume(sagaId: string): Promise<SagaExecution>;
}
export declare class SagaExecutionEntity {
    id: string;
    name: string;
    status: SagaStatus;
    data: string;
    context: string;
    currentStep?: string;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}
//# sourceMappingURL=DatabaseSaga.d.ts.map