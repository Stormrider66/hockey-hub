import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ZodEffects } from 'zod';

/**
 * Middleware to validate request body, params, and query against a Zod schema.
 * @param schema The Zod schema (ZodObject or ZodEffects) to validate against.
 */
export const validate = (schema: AnyZodObject | ZodEffects<AnyZodObject>) => 
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    } catch (error) {
        if (error instanceof ZodError) {
            // Format Zod errors for a cleaner response
            const formattedErrors = error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }));
            console.error('[Validation Error]', JSON.stringify(formattedErrors, null, 2));
            return res.status(400).json({
                error: true,
                code: 'VALIDATION_ERROR',
                message: 'Input validation failed',
                details: formattedErrors,
            });
        }
        // Pass other errors to the generic error handler
        console.error('[Middleware Error]', error);
        next(error);
    }
}; 