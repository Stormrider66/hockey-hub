import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../validations/authValidations';
import { ConflictError, UnauthorizedError } from '../errors/authErrors';
import logger from '../config/logger';
import { sendSuccess } from '../utils/response.utils';
import { 
  TypedRequest, 
  ErrorResponse, 
  HttpException 
} from '../types';

export const registerHandler = async (
  req: TypedRequest<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await authService.register(req.body);
    // Exclude password hash before sending response
    const { passwordHash, ...userResponse } = user as any; 
    return sendSuccess(res, userResponse, 'User registered successfully', 201);
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new HttpException(
        409, 
        error.message, 
        'USER_ALREADY_EXISTS'
      );
    } 
    // Pass other errors to the generic error handler
    next(error);
  }
};

export const loginHandler = async (
  req: TypedRequest<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    
    // Consider setting refreshToken in an HttpOnly cookie for better security
    // res.cookie('refreshToken', refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict', 
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // });

    return sendSuccess(
      res, 
      { accessToken, refreshToken, user },
      'Login successful'
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new HttpException(
        401,
        error.message,
        'INVALID_CREDENTIALS'
      );
    }
    next(error);
  }
};

export const refreshTokenHandler = async (
  req: TypedRequest,
  res: Response,
  next: NextFunction
) => {
  // Extract refresh token - could be from body or cookie
  const incomingRefreshToken = req.body.refreshToken; // || req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    throw new HttpException(
      400,
      'Refresh token is required',
      'REFRESH_TOKEN_REQUIRED'
    );
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(incomingRefreshToken);
    
    // Consider setting new refreshToken in an HttpOnly cookie
    // res.cookie('refreshToken', newRefreshToken, { ...cookie options });

    return sendSuccess(
      res,
      { accessToken, refreshToken: newRefreshToken },
      'Token refreshed successfully'
    );
  } catch (error) {
     if (error instanceof UnauthorizedError) {
      // Clear potentially invalid cookie if using cookies
      // res.clearCookie('refreshToken'); 
      throw new HttpException(
        401,
        error.message,
        'INVALID_REFRESH_TOKEN'
      );
    }
    next(error);
  }
};

export const logoutHandler = async (
  req: TypedRequest,
  res: Response
) => {
  const incomingRefreshToken = req.body.refreshToken; // || req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    // Even without a token, proceed to clear any potential cookie and return success
    // res.clearCookie('refreshToken');
    return sendSuccess(res, null, 'Logged out successfully');
  }

  try {
    await authService.logout(incomingRefreshToken);
    // Clear cookie if using cookies
    // res.clearCookie('refreshToken'); 
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    // Log error but don't fail the logout process for the client
    logger.error({ err: error }, 'Error during token revocation on logout');
    // Clear cookie anyway
    // res.clearCookie('refreshToken');
    return sendSuccess(res, null, 'Logged out (token revocation may have failed)');
    // Don't pass to next, logout should appear successful to client
  }
};

export const forgotPasswordHandler = async (
  req: TypedRequest<{}, {}, ForgotPasswordInput>,
  res: Response
) => {
  try {
    await authService.forgotPassword(req.body);
    // Always return success to prevent email enumeration
    return sendSuccess(
      res, 
      null, 
      'If an account with that email exists, a password reset link has been sent.'
    );
  } catch (error) {
    // Log the error but still return success to the client
    logger.error({ err: error, email: req.body.email }, 'Forgot password error');
    return sendSuccess(
      res, 
      null, 
      'If an account with that email exists, a password reset link has been sent.'
    );
    // Don't pass to next error handler to avoid revealing internal errors
  }
};

export const resetPasswordHandler = async (
  req: TypedRequest<{}, {}, ResetPasswordInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    await authService.resetPassword(req.body);
    return sendSuccess(res, null, 'Password has been reset successfully.');
  } catch (error) {
     if (error instanceof UnauthorizedError) {
      throw new HttpException(
        401,
        error.message,
        'INVALID_RESET_TOKEN'
      );
    }
    next(error);
  }
};