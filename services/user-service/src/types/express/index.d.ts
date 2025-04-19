// This file augments the Express Request interface to include our custom properties

// Using a simplified approach to augment Express types
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      roles: string[];
      permissions: string[];
      organizationId: string;
      teamIds?: string[];
      lang: string;
    };
  }
}

export {}; 