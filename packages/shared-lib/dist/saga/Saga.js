"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Saga = exports.SagaStatus = void 0;
var SagaStatus;
(function (SagaStatus) {
    SagaStatus["PENDING"] = "pending";
    SagaStatus["RUNNING"] = "running";
    SagaStatus["COMPENSATING"] = "compensating";
    SagaStatus["COMPLETED"] = "completed";
    SagaStatus["FAILED"] = "failed";
    SagaStatus["COMPENSATED"] = "compensated";
})(SagaStatus || (exports.SagaStatus = SagaStatus = {}));
class Saga {
    constructor(definition, eventBus) {
        this.definition = definition;
        this.eventBus = eventBus;
    }
    async execute(data, initialContext) {
        const context = {
            sagaId: this.generateSagaId(),
            correlationId: initialContext?.correlationId || this.generateCorrelationId(),
            userId: initialContext?.userId,
            organizationId: initialContext?.organizationId,
            metadata: initialContext?.metadata || {},
            completedSteps: [],
        };
        const execution = {
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
                }
                catch (error) {
                    context.failedStep = step.name;
                    context.error = error;
                    execution.error = (error instanceof Error) ? error.message : String(error);
                    execution.status = SagaStatus.COMPENSATING;
                    await this.persistExecution(execution);
                    // Start compensation
                    await this.compensate(data, context, error);
                    execution.status = SagaStatus.COMPENSATED;
                    execution.completedAt = new Date();
                    await this.persistExecution(execution);
                    // Call onFailure callback
                    if (this.definition.onFailure) {
                        await this.definition.onFailure(data, context, error);
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
        }
        catch (error) {
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
    async executeStep(step, data, context) {
        let retries = 0;
        const maxRetries = step.retryable ? (step.maxRetries || 3) : 0;
        while (retries <= maxRetries) {
            try {
                // Execute with timeout if specified
                if (step.timeout) {
                    await this.executeWithTimeout(() => step.execute(data, context), step.timeout);
                }
                else {
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
            }
            catch (error) {
                retries++;
                if (retries > maxRetries) {
                    throw error;
                }
                // Wait before retry (exponential backoff)
                await this.delay(Math.pow(2, retries) * 1000);
            }
        }
    }
    async compensate(data, context, error) {
        // Compensate in reverse order
        const completedSteps = [...context.completedSteps].reverse();
        for (const stepName of completedSteps) {
            const step = this.definition.steps.find(s => s.name === stepName);
            if (!step)
                continue;
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
            }
            catch (compensationError) {
                console.error(`Failed to compensate step ${stepName}:`, compensationError);
                // Continue with other compensations
            }
        }
    }
    async executeWithTimeout(fn, timeout) {
        return Promise.race([
            fn(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), timeout)),
        ]);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    generateSagaId() {
        return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateCorrelationId() {
        return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.Saga = Saga;
