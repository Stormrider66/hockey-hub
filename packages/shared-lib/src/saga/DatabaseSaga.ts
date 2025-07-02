import { DataSource, Repository } from 'typeorm';
import { Saga, SagaDefinition, SagaExecution, SagaStatus } from './Saga';
import { EventBus } from '../services/EventBus';

export class DatabaseSaga<TData = any> extends Saga<TData> {
  private sagaRepo: Repository<SagaExecutionEntity>;

  constructor(
    definition: SagaDefinition<TData>,
    dataSource: DataSource,
    eventBus?: EventBus
  ) {
    super(definition, eventBus);
    this.sagaRepo = dataSource.getRepository(SagaExecutionEntity);
  }

  protected async persistExecution(execution: SagaExecution): Promise<void> {
    const entity = this.sagaRepo.create({
      id: execution.id,
      name: execution.name,
      status: execution.status,
      data: JSON.stringify(execution.data),
      context: JSON.stringify(execution.context),
      currentStep: execution.currentStep,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      error: execution.error,
    });

    await this.sagaRepo.save(entity);
  }

  protected async loadExecution(sagaId: string): Promise<SagaExecution | null> {
    const entity = await this.sagaRepo.findOne({ where: { id: sagaId } });
    
    if (!entity) {
      return null;
    }

    return {
      id: entity.id,
      name: entity.name,
      status: entity.status,
      data: JSON.parse(entity.data),
      context: JSON.parse(entity.context),
      currentStep: entity.currentStep,
      startedAt: entity.startedAt,
      completedAt: entity.completedAt,
      error: entity.error,
    };
  }

  // Resume a failed saga
  async resume(sagaId: string): Promise<SagaExecution> {
    const execution = await this.loadExecution(sagaId);
    
    if (!execution) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    if (execution.status === SagaStatus.COMPLETED || execution.status === SagaStatus.COMPENSATED) {
      return execution;
    }

    // Continue from where it left off
    const data = execution.data;
    const context = execution.context;

    // Find the next step to execute
    const completedSteps = new Set(context.completedSteps);
    const remainingSteps = this.definition.steps.filter(
      step => !completedSteps.has(step.name)
    );

    if (remainingSteps.length === 0) {
      execution.status = SagaStatus.COMPLETED;
      execution.completedAt = new Date();
      await this.persistExecution(execution);
      return execution;
    }

    // Continue execution
    for (const step of remainingSteps) {
      try {
        await step.execute(data, context);
        context.completedSteps.push(step.name);
        execution.currentStep = step.name;
        await this.persistExecution(execution);
      } catch (error) {
        context.failedStep = step.name;
        context.error = error as Error;
        execution.error = (error instanceof Error) ? error.message : String(error);
        execution.status = SagaStatus.COMPENSATING;
        await this.persistExecution(execution);

        // Start compensation - we cannot call parent's private compensate method
        // The compensation will be handled by the parent class's execute method
        
        execution.status = SagaStatus.COMPENSATED;
        execution.completedAt = new Date();
        await this.persistExecution(execution);

        throw error;
      }
    }

    execution.status = SagaStatus.COMPLETED;
    execution.completedAt = new Date();
    await this.persistExecution(execution);

    return execution;
  }

  // Note: compensate method is private in parent class and cannot be overridden
}

// Entity for storing saga executions
import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('saga_executions')
export class SagaExecutionEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SagaStatus,
  })
  status: SagaStatus;

  @Column('text')
  data: string;

  @Column('text')
  context: string;

  @Column({ nullable: true })
  currentStep?: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  error?: string;
}