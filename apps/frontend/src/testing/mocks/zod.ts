// Minimal zod mock for tests that import zod only in test files
export const z: any = {
  object: (shape: any) => ({
    shape,
    parse: (v: any) => v,
  }),
  string: () => ({
    min: () => ({ email: () => ({}), max: () => ({ optional: () => ({}) }) }),
    email: () => ({}),
    max: () => ({ optional: () => ({}) }),
    optional: () => ({}),
  }),
  number: () => ({ min: () => ({}) }),
  coerce: { number: () => ({ min: () => ({}) }) },
  boolean: () => ({}),
  enum: () => ({}),
};
export default z;


