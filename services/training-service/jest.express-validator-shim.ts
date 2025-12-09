// Chainable express-validator shim for unit tests
type ChainFn = ((req: any, res: any, next: any) => any) & {
  isString: () => ChainFn;
  isInt: (_opts?: any) => ChainFn;
  isUUID: () => ChainFn;
  isISO8601: () => ChainFn;
  isArray: () => ChainFn;
  isObject: () => ChainFn;
  optional: () => ChainFn;
  trim: () => ChainFn;
  notEmpty: () => ChainFn;
  withMessage: (_msg: string) => ChainFn;
  toInt: () => ChainFn;
};

const makeChain = (): ChainFn => {
  const fn: any = (_req: any, _res: any, next: any) => next();
  fn.isString = () => fn;
  fn.isInt = () => fn;
  fn.isUUID = () => fn;
  fn.isISO8601 = () => fn;
  fn.isArray = () => fn;
  fn.isObject = () => fn;
  fn.optional = () => fn;
  fn.trim = () => fn;
  fn.notEmpty = () => fn;
  fn.withMessage = () => fn;
  fn.toInt = () => fn;
  return fn as ChainFn;
};

export const body = (_field?: any) => makeChain();
export const param = (_field?: any) => makeChain();
export const query = (_field?: any) => makeChain();

// validateRequest middleware no-op
export const validationResult = () => ({ isEmpty: () => true, array: () => [] });

export default { body, param, query, validationResult } as any;


