import { Response } from 'express';
import { SuccessResponse } from '@hockey-hub/types';

/**
 * Sends a standardized success response
 * 
 * @param res Express response object
 * @param data Data to include in the response
 * @param message Optional message to include
 * @param statusCode HTTP status code (defaults to 200)
 */
export const sendSuccess = <T>(
  res: Response, 
  data: T, 
  message?: string, 
  statusCode = 200
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Sends a success response with no data (204 No Content)
 * 
 * @param res Express response object
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).end();
};