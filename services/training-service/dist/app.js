"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middlewares/errorHandler"); // Placeholder
// import routes from './routes'; // Placeholder for importing routes
const exerciseRoutes_1 = __importDefault(require("./routes/exerciseRoutes")); // Import exercise routes
const physicalTemplateRoutes_1 = __importDefault(require("./routes/physicalTemplateRoutes")); // Import template routes
const trainingSessionRoutes_1 = __importDefault(require("./routes/trainingSessionRoutes"));
const app = (0, express_1.default)(); // Re-add app initialization
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).send('OK');
});
// Mount API routes (Placeholder)
// app.use('/api/v1', routes);
app.use('/api/v1', exerciseRoutes_1.default); // Mount exercise routes
app.use('/api/v1', physicalTemplateRoutes_1.default); // Mount template routes
app.use('/api/v1/training-sessions', trainingSessionRoutes_1.default);
// Global error handler - needs to be registered last
app.use(errorHandler_1.errorHandlerMiddleware);
exports.default = app;
