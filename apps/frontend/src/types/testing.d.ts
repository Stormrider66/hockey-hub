declare module '@testing-library/react';
declare module 'jest-axe';

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveNoViolations(): R;
    }
  }
}

declare module 'jest-axe' {
  import { Element } from 'react';
  export function axe(container: HTMLElement): Promise<any>;
  export function toHaveNoViolations(): any;
}

declare module '@testing-library/react' {
  export * from '@testing-library/react/types/index';
}

export {}; 