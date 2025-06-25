import { Response } from 'express';
/**
 * Sends a standardized success response
 *
 * @param res Express response object
 * @param data Data to include in the response
 * @param message Optional message to include
 * @param statusCode HTTP status code (defaults to 200)
 */
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response;
/**
 * Sends a success response with no data (204 No Content)
 *
 * @param res Express response object
 */
export declare const sendNoContent: (res: Response) => Response;
//# sourceMappingURL=response.utils.d.ts.map