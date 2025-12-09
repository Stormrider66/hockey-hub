const chain = () => {
  const api: any = (_req: any, _res: any, next: any) => next();
  api.isURL = jest.fn(() => api);
  api.isLength = jest.fn(() => api);
  api.isUUID = jest.fn(() => api);
  api.isArray = jest.fn(() => api);
  api.isObject = jest.fn(() => api);
  api.withMessage = jest.fn(() => api);
  api.optional = jest.fn(() => api);
  api.isIn = jest.fn(() => api);
  api.isBoolean = jest.fn(() => api);
  api.isInt = jest.fn(() => api);
  api.isISO8601 = jest.fn(() => api);
  api.isString = jest.fn(() => api);
  return api;
};

export const body = jest.fn(chain);
export const query = jest.fn(chain);
export const param = jest.fn(chain);
export const validationResult = jest.fn(() => ({ isEmpty: () => true, array: () => [] }));
export const matchedData = jest.fn(() => ({}));
export const oneOf = jest.fn(() => ((_req: any, _res: any, next: any) => next()));
export const check = jest.fn(() => ((_req: any, _res: any, next: any) => next()));
export default { body, query, param, validationResult, matchedData, oneOf, check } as any;


