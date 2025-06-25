import 'reflect-metadata';
import { Application } from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}
declare const app: Application;
export { app };
//# sourceMappingURL=index.d.ts.map