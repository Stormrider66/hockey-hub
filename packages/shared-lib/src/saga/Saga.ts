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

export enum SagaStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPENSATING = 'compensating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATED = 'compensated'
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

export abstract class Saga<TData = any> {
  protected definition: SagaDefinition<TData>;
  protected eventBus?: EventBus;

  constructor(definition: SagaDefinition<TData>, eventBus?: EventBus) {
    this.definition = definition;
    this.eventBus = eventBus;
  }

  async execute(data: TData, initialContext?: Partial<SagaContext>): Promise<SagaExecution> {
    const context: SagaContext = {
      sagaId: this.generateSagaId(),
      correlationId: initialContext?.correlationId || this.generateCorrelationId(),
      userId: initialContext?.userId,
      organizationId: initialContext?.organizationId,
      metadata: initialContext?.metadata || {},
      completedSteps: [],
    };

    const execution: SagaExecution = {
      id: context.sagaId,
      name: this.definition.name,
      status: SagaStatus.PENDING,
      data,
      context,
      startedAt: new Date(),
    };

    try {
      await this.persistExecution(execution);
      execution.status = SagaStatus.RUNNING;

      // Execute each step
      for (const step of this.definition.steps) {
        execution.currentStep = step.name;
        await this.persistExecution(execution);

        try {
          await this.executeStep(step, data, context);
          context.completedSteps.push(step.name);
        } catch (error) {
          context.failedStep = step.name;
          context.error = error as Error;
          execution.error = (error instanceof Error) ? error.message : String(error);
          execution.status = SagaStatus.COMPENSATING;
          await this.persistExecution(execution);

          // Start compensation
          await this.compensate(data, context, error as Error);
          
          execution.status = SagaStatus.COMPENSATED;
          execution.completedAt = new Date();
          await this.persistExecution(execution);

          // Call onFailure callback
          if (this.definition.onFailure) {
            await this.definition.onFailure(data, context, error as Error);
          }

          throw error;
        }
      }

      // All steps completed successfully
      execution.status = SagaStatus.COMPLETED;
      execution.completedAt = new Date();
      await this.persistExecution(execution);

      // Call onSuccess callback
      if (this.definition.onSuccess) {
        await this.definition.onSuccess(data, context);
      }

      // Publish completion event
      if (this.eventBus) {
        await this.eventBus.publish(`saga.${this.definition.name}.completed`, {
          sagaId: context.sagaId,
          data,
          context,
        });
      }

      return execution;
    } catch (error) {
      execution.status = SagaStatus.FAILED;
      execution.error = (error instanceof Error) ? error.message : String(error);
      execution.completedAt = new Date();
      await this.persistExecution(execution);

      // Publish failure event
      if (this.eventBus) {
        await this.eventBus.publish(`saga.${this.definition.name}.failed`, {
          sagaId: context.sagaId,
          data,
          context,
          error: (error instanceof Error) ? error.message : String(error),
        });
      }

      throw error;
    }
  }

  private async executeStep(
    step: SagaStep<TData>,
    data: TData,
    context: SagaContext
  ): Promise<void> {
    let retries = 0;
    const maxRetries = step.retryable ? (step.maxRetries || 3) : 0;

    while (retries <= maxRetries) {
      try {
        // Execute with timeout if specified
        if (step.timeout) {
          await this.executeWithTimeout(
            () => step.execute(data, context),
            step.timeout
          );
        } else {
          await step.execute(data, context);
        }

        // Publish step completion event
        if (this.eventBus) {
          await this.eventBus.publish(`saga.${this.definition.name}.step.completed`, {
            sagaId: context.sagaId,
            step: step.name,
            data,
          });
        }

        return;
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, retries) * 1000);
      }
    }
  }

  private async compensate(
    data: TData,
    context: SagaContext,
    error: Error
  ): Promise<void> {
    // Compensate in reverse order
    const completedSteps = [...context.completedSteps].reverse();

    for (const stepName of completedSteps) {
      const step = this.definition.steps.find(s => s.name === stepName);
      if (!step) continue;

      try {
        await step.compensate(data, context, error);

        // Publish compensation event
        if (this.eventBus) {
          await this.eventBus.publish(`saga.${this.definition.name}.step.compensated`, {
            sagaId: context.sagaId,
            step: step.name,
            data,
          });
        }
      } catch (compensationError) {
        console.error(`Failed to compensate step ${stepName}:`, compensationError);
        // Continue with other compensations
      }
    }
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      ),
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateSagaId(): string {
    return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Abstract methods to be implemented by concrete saga implementations
  protected abstract persistExecution(execution: SagaExecution): Promise<void>;
  protected abstract loadExecution(sagaId: string): Promise<SagaExecution | null>;
}