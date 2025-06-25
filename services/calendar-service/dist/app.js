"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const resourceTypeRoutes_1 = __importDefault(require("./routes/resourceTypeRoutes"));
const resourceRoutes_1 = __importDefault(require("./routes/resourceRoutes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
// Health
app.get('/health', (_req, res) => res.status(200).json({ status: 'OK', service: 'Calendar Service' }));
// Routes
app.use('/api/v1/events', eventRoutes_1.default);
app.use('/api/v1/locations', locationRoutes_1.default);
app.use('/api/v1/resource-types', resourceTypeRoutes_1.default);
app.use('/api/v1/resources', resourceRoutes_1.default);
// Error handling
app.use((_req, _res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});
app.use((err, _req, res, _next) => {
    console.error(`[${err.status || 500}] ${err.message}`);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal Server Error',
        code: err.code || (err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
    });
});
exports.default = app;
