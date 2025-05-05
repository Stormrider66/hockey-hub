/**
 * Custom HTTP Exception class for standardized error responses
 */
class HttpException extends Error {
  status: number;
  message: string;
  code: string;
  details?: any;

  constructor(
    status: number,
    message: string,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: any
  ) {
    super(message);
    this.status = status;
    this.message = message;
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export default HttpException; 