import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../validations/authValidations';
import { ConflictError, UnauthorizedError } from '../errors/authErrors';
import logger from '../config/logger';

export const registerHandler = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await authService.register(req.body);
    // Exclude password hash before sending response
    const { passwordHash, ...userResponse } = user as any; 
    res.status(201).json({ success: true, data: userResponse });
  } catch (error) {
    if (error instanceof ConflictError) {
      return res.status(409).json({
        error: true,
        message: error.message,
        code: 'USER_ALREADY_EXISTS',
      });
    } 
    // Pass other errors to the generic error handler
    next(error);
  }
};

export const loginHandler = async (
  req: Request<{}, {}, LoginInput>,
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

    res.status(200).json({ 
      success: true, 
      data: { 
        accessToken, 
        refreshToken, // Sending refreshToken in body for now, review security implications 
        user 
      }
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        error: true,
        message: error.message,
        code: 'INVALID_CREDENTIALS',
      });
    }
    next(error);
  }
};

export const refreshTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract refresh token - could be from body or cookie
  const incomingRefreshToken = req.body.refreshToken; // || req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    return res.status(400).json({ 
      error: true, 
      message: 'Refresh token is required', 
      code: 'REFRESH_TOKEN_REQUIRED' 
    });
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(incomingRefreshToken);
    
    // Consider setting new refreshToken in an HttpOnly cookie
    // res.cookie('refreshToken', newRefreshToken, { ...cookie options });

    res.status(200).json({ 
      success: true, 
      data: { 
        accessToken, 
        refreshToken: newRefreshToken // Sending new token in body 
      }
    });
  } catch (error) {
     if (error instanceof UnauthorizedError) {
      // Clear potentially invalid cookie if using cookies
      // res.clearCookie('refreshToken'); 
      return res.status(401).json({
        error: true,
        message: error.message,
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
    next(error);
  }
};

export const logoutHandler = async (
  req: Request,
  res: Response
) => {
  const incomingRefreshToken = req.body.refreshToken; // || req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    // Even without a token, proceed to clear any potential cookie and return success
    // res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  try {
    await authService.logout(incomingRefreshToken);
    // Clear cookie if using cookies
    // res.clearCookie('refreshToken'); 
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    // Log error but don't fail the logout process for the client
    logger.error({ err: error }, 'Error during token revocation on logout');
    // Clear cookie anyway
    // res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out (token revocation may have failed)' }); 
    // Don't pass to next, logout should appear successful to client
  }
};

export const forgotPasswordHandler = async (
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response
) => {
  try {
    await authService.forgotPassword(req.body);
    // Always return success to prevent email enumeration
    res.status(200).json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    // Log the error but still return success to the client
    logger.error({ err: error, email: req.body.email }, 'Forgot password error');
    res.status(200).json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
    // Don't pass to next error handler to avoid revealing internal errors
  }
};

export const resetPasswordHandler = async (
  req: Request<{}, {}, ResetPasswordInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    await authService.resetPassword(req.body);
    res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
     if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        error: true,
        message: error.message,
        code: 'INVALID_RESET_TOKEN',
      });
    }
    next(error);
  }
}; 