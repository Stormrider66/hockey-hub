"use strict";
// Simplified monitoring package export for build testing
// This temporary file helps verify the package structure works
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = exports.ExternalServiceError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = exports.HealthCheckManager = exports.CircuitBreakerProtection = exports.TraceMethod = exports.Performance = exports.createErrorContext = exports.asyncHandler = exports.setupSimpleMonitoring = exports.setupMonitoring = void 0;
const setupMonitoring = () => {
    console.log('Monitoring setup - placeholder implementation');
    return {
        logger: console,
        healthCheckManager: {},
        performanceMonitor: {},
        circuitBreakerManager: {},
        metricsCollector: null,
        tracingManager: null,
        businessMetrics: null,
        shutdown: async () => { }
    };
};
exports.setupMonitoring = setupMonitoring;
exports.setupSimpleMonitoring = exports.setupMonitoring;
// Export placeholder functions
const asyncHandler = (fn) => fn;
exports.asyncHandler = asyncHandler;
const createErrorContext = () => ({});
exports.createErrorContext = createErrorContext;
const Performance = () => () => { };
exports.Performance = Performance;
const TraceMethod = () => () => { };
exports.TraceMethod = TraceMethod;
const CircuitBreakerProtection = () => () => { };
exports.CircuitBreakerProtection = CircuitBreakerProtection;
// Export placeholder classes
class HealthCheckManager {
}
exports.HealthCheckManager = HealthCheckManager;
HealthCheckManager.createDatabaseCheck = () => ({});
HealthCheckManager.createExternalServiceCheck = () => ({});
HealthCheckManager.createCustomCheck = () => ({});
// Export error classes
class AppError extends Error {
}
exports.AppError = AppError;
class ValidationError extends AppError {
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
}
exports.ConflictError = ConflictError;
class ExternalServiceError extends AppError {
}
exports.ExternalServiceError = ExternalServiceError;
class DatabaseError extends AppError {
}
exports.DatabaseError = DatabaseError;
// Export all from placeholder
__exportStar(require("./types"), exports);
