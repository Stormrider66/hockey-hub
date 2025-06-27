"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.healthCheck = exports.logger = void 0;
// Logger utility
exports.logger = {
    info: function (message, meta) {
        console.log("[INFO] ".concat(message), meta || '');
    },
    error: function (message, meta) {
        console.error("[ERROR] ".concat(message), meta || '');
    },
    warn: function (message, meta) {
        console.warn("[WARN] ".concat(message), meta || '');
    },
    debug: function (message, meta) {
        console.debug("[DEBUG] ".concat(message), meta || '');
    }
};
// Health check middleware
var healthCheck = function (req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
exports.healthCheck = healthCheck;
// Error handler middleware
var errorHandler = function (err, req, res, next) {
    exports.logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(err.status || 500).json({
        success: false,
        error: {
            message: err.message || 'Internal server error',
            code: err.code || 'SERVER_ERROR'
        }
    });
};
exports.errorHandler = errorHandler;
