"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCorrelationHeaders = exports.getCorrelationIdFromRequest = exports.setCorrelationId = exports.getCorrelationId = exports.generateCorrelationId = void 0;
const uuid_1 = require("uuid");
const CORRELATION_ID_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';
/**
 * Generates a new correlation ID
 */
function generateCorrelationId() {
    return (0, uuid_1.v4)();
}
exports.generateCorrelationId = generateCorrelationId;
/**
 * Extracts correlation ID from request headers or generates a new one
 */
function getCorrelationId(req) {
    const correlationId = req.headers[CORRELATION_ID_HEADER];
    const requestId = req.headers[REQUEST_ID_HEADER];
    return correlationId || requestId || generateCorrelationId();
}
exports.getCorrelationId = getCorrelationId;
/**
 * Sets correlation ID on the request object
 */
function setCorrelationId(req, correlationId) {
    req.correlationId = correlationId;
}
exports.setCorrelationId = setCorrelationId;
/**
 * Gets correlation ID from request object
 */
function getCorrelationIdFromRequest(req) {
    return req.correlationId;
}
exports.getCorrelationIdFromRequest = getCorrelationIdFromRequest;
/**
 * Creates headers with correlation ID for outbound requests
 */
function createCorrelationHeaders(correlationId) {
    return {
        [CORRELATION_ID_HEADER]: correlationId,
        [REQUEST_ID_HEADER]: correlationId,
    };
}
exports.createCorrelationHeaders = createCorrelationHeaders;
