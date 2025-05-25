import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
import { TestResult } from '../entities/TestResult';
import { sampleCorrelation, linearRegression, linearRegressionLine, rSquared } from 'simple-statistics';

export const getCorrelation = async (req: Request, res: Response, next: NextFunction) => {
  // Expect testX, testY, and playerId as query parameters
  const { testX, testY, playerId } = req.query;
  if (typeof testX !== 'string' || typeof testY !== 'string' || typeof playerId !== 'string') {
    return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing query parameters testX, testY, playerId' });
  }

  try {
    const repo = AppDataSource.getRepository(TestResult);
    // Fetch results for each test
    const resultsX = await repo.find({ where: { test_definition_id: testX, player_id: playerId }, order: { timestamp: 'ASC' } });
    const resultsY = await repo.find({ where: { test_definition_id: testY, player_id: playerId }, order: { timestamp: 'ASC' } });

    // Ensure equal lengths and minimum 2 points
    const valuesX = resultsX.map(r => Number(r.value));
    const valuesY = resultsY.map(r => Number(r.value));
    if (valuesX.length < 2 || valuesY.length < 2 || valuesX.length !== valuesY.length) {
      return res.status(400).json({ error: true, code: 'INSUFFICIENT_DATA', message: 'Need at least two matching data points for both tests' });
    }

    const r = sampleCorrelation(valuesX, valuesY);
    const scatter = valuesX.map((x, idx) => ({ x, y: valuesY[idx] }));

    res.status(200).json({ success: true, count: valuesX.length, r, scatter });
  } catch (error) {
    next(error);
  }
};

// Handler for multi-linear regression analytics
export const postRegression = async (req: Request, res: Response, next: NextFunction) => {
  // Expect targetTest, predictors, and playerId in body
  const { targetTest, predictors, playerId } = req.body;
  if (
    typeof targetTest !== 'string' ||
    typeof playerId !== 'string' ||
    !Array.isArray(predictors) ||
    predictors.some((p: any) => typeof p !== 'string')
  ) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Missing or invalid body parameters: targetTest (string), predictors (string[]), playerId (string)',
    });
  }

  try {
    const repo = AppDataSource.getRepository(TestResult);
    // Fetch target test results
    const targetResults = await repo.find({ where: { test_definition_id: targetTest, player_id: playerId }, order: { timestamp: 'ASC' } });
    // Fetch predictor test results
    const predictorResultsArrays = await Promise.all(
      predictors.map((id: string) =>
        repo.find({ where: { test_definition_id: id, player_id: playerId }, order: { timestamp: 'ASC' } })
      )
    );

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
    const coefficients: number[] = [];
    let r2val: number;
    if (predictors.length === 1) {
      const xArr = Xs[0];
      // build [x,y] pairs for regression
      const pairs: [number, number][] = xArr.map((x, idx) => [x, y[idx]]);
      // fit linear regression model {m: slope, b: intercept}
      const model = linearRegression(pairs);
      const predictFn = linearRegressionLine(model);
      r2val = rSquared(pairs, predictFn);
      coefficients.push(model.b, model.m);
    } else {
      return res.status(501).json({
        error: true,
        code: 'NOT_IMPLEMENTED',
        message: 'Multiple predictors not yet supported',
      });
    }

    res.status(200).json({ success: true, count: n, coefficients, r2: r2val });
  } catch (error) {
    next(error);
  }
}; 