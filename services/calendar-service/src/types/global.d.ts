// Augment Express Request with user object present after auth middleware
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      organizationId?: string;
      roles?: string[];
      teamIds?: string[];
      [key: string]: any;
    };
  }
} 