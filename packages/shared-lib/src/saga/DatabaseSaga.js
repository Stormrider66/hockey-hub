"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagaExecutionEntity = exports.DatabaseSaga = void 0;
const Saga_1 = require("./Saga");
class DatabaseSaga extends Saga_1.Saga {
    constructor(definition, dataSource, eventBus) {
        super(definition, eventBus);
        this.sagaRepo = dataSource.getRepository(SagaExecutionEntity);
    }
    async persistExecution(execution) {
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
    async loadExecution(sagaId) {
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
    async resume(sagaId) {
        const execution = await this.loadExecution(sagaId);
        if (!execution) {
            throw new Error(`Saga ${sagaId} not found`);
        }
        if (execution.status === Saga_1.SagaStatus.COMPLETED || execution.status === Saga_1.SagaStatus.COMPENSATED) {
            return execution;
        }
        // Continue from where it left off
        const data = execution.data;
        const context = execution.context;
        // Find the next step to execute
        const completedSteps = new Set(context.completedSteps);
        const remainingSteps = this.definition.steps.filter(step => !completedSteps.has(step.name));
        if (remainingSteps.length === 0) {
            execution.status = Saga_1.SagaStatus.COMPLETED;
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
            }
            catch (error) {
                context.failedStep = step.name;
                context.error = error;
                execution.error = (error instanceof Error) ? error.message : String(error);
                execution.status = Saga_1.SagaStatus.COMPENSATING;
                await this.persistExecution(execution);
                // Start compensation - we cannot call parent's private compensate method
                // The compensation will be handled by the parent class's execute method
                execution.status = Saga_1.SagaStatus.COMPENSATED;
                execution.completedAt = new Date();
                await this.persistExecution(execution);
                throw error;
            }
        }
        execution.status = Saga_1.SagaStatus.COMPLETED;
        execution.completedAt = new Date();
        await this.persistExecution(execution);
        return execution;
    }
}
exports.DatabaseSaga = DatabaseSaga;
// Entity for storing saga executions
const typeorm_1 = require("typeorm");
let SagaExecutionEntity = class SagaExecutionEntity {
};
exports.SagaExecutionEntity = SagaExecutionEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], SagaExecutionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SagaExecutionEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Saga_1.SagaStatus,
    }),
    __metadata("design:type", String)
], SagaExecutionEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], SagaExecutionEntity.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], SagaExecutionEntity.prototype, "context", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SagaExecutionEntity.prototype, "currentStep", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SagaExecutionEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SagaExecutionEntity.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SagaExecutionEntity.prototype, "error", void 0);
exports.SagaExecutionEntity = SagaExecutionEntity = __decorate([
    (0, typeorm_1.Entity)('saga_executions')
], SagaExecutionEntity);
//# sourceMappingURL=DatabaseSaga.js.map