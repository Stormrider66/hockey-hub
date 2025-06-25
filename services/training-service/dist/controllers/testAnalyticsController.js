"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRegression = exports.getCorrelation = void 0;
const data_source_1 = require("../data-source");
const TestResult_1 = require("../entities/TestResult");
const simple_statistics_1 = require("simple-statistics");
const getCorrelation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Expect testX, testY, and playerId as query parameters
    const { testX, testY, playerId } = req.query;
    if (typeof testX !== 'string' || typeof testY !== 'string' || typeof playerId !== 'string') {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing query parameters testX, testY, playerId' });
    }
    try {
        const repo = data_source_1.AppDataSource.getRepository(TestResult_1.TestResult);
        // Fetch results for each test
        const resultsX = yield repo.find({ where: { test_definition_id: testX, player_id: playerId }, order: { timestamp: 'ASC' } });
        const resultsY = yield repo.find({ where: { test_definition_id: testY, player_id: playerId }, order: { timestamp: 'ASC' } });
        // Ensure equal lengths and minimum 2 points
        const valuesX = resultsX.map(r => Number(r.value));
        const valuesY = resultsY.map(r => Number(r.value));
        if (valuesX.length < 2 || valuesY.length < 2 || valuesX.length !== valuesY.length) {
            return res.status(400).json({ error: true, code: 'INSUFFICIENT_DATA', message: 'Need at least two matching data points for both tests' });
        }
        const r = (0, simple_statistics_1.sampleCorrelation)(valuesX, valuesY);
        const scatter = valuesX.map((x, idx) => ({ x, y: valuesY[idx] }));
        res.status(200).json({ success: true, count: valuesX.length, r, scatter });
    }
    catch (error) {
        next(error);
    }
});
exports.getCorrelation = getCorrelation;
// Handler for multi-linear regression analytics
const postRegression = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Expect targetTest, predictors, and playerId in body
    const { targetTest, predictors, playerId } = req.body;
    if (typeof targetTest !== 'string' ||
        typeof playerId !== 'string' ||
        !Array.isArray(predictors) ||
        predictors.some((p) => typeof p !== 'string')) {
        return res.status(400).json({
            error: true,
            code: 'VALIDATION_ERROR',
            message: 'Missing or invalid body parameters: targetTest (string), predictors (string[]), playerId (string)',
        });
    }
    try {
        const repo = data_source_1.AppDataSource.getRepository(TestResult_1.TestResult);
        // Fetch target test results
        const targetResults = yield repo.find({ where: { test_definition_id: targetTest, player_id: playerId }, order: { timestamp: 'ASC' } });
        // Fetch predictor test results
        const predictorResultsArrays = yield Promise.all(predictors.map((id) => repo.find({ where: { test_definition_id: id, player_id: playerId }, order: { timestamp: 'ASC' } })));
        const y = targetResults.map((r) => Number(r.value));
        const Xs = predictorResultsArrays.map((arr) => arr.map((r) => Number(r.value)));
        const n = y.length;
        if (n < 2 || Xs.some((xArr) => xArr.length !== n)) {
            return res.status(400).json({
                error: true,
                code: 'INSUFFICIENT_DATA',
                message: 'Need at least two matching data points and equal lengths for all tests',
            });
        }
        // Support only single predictor for now
        const coefficients = [];
        let r2val;
        if (predictors.length === 1) {
            const xArr = Xs[0];
            // build [x,y] pairs for regression
            const pairs = xArr.map((x, idx) => [x, y[idx]]);
            // fit linear regression model {m: slope, b: intercept}
            const model = (0, simple_statistics_1.linearRegression)(pairs);
            const predictFn = (0, simple_statistics_1.linearRegressionLine)(model);
            r2val = (0, simple_statistics_1.rSquared)(pairs, predictFn);
            coefficients.push(model.b, model.m);
        }
        else {
            return res.status(501).json({
                error: true,
                code: 'NOT_IMPLEMENTED',
                message: 'Multiple predictors not yet supported',
            });
        }
        res.status(200).json({ success: true, count: n, coefficients, r2: r2val });
    }
    catch (error) {
        next(error);
    }
});
exports.postRegression = postRegression;
