import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getRepository, MoreThan } from 'typeorm';
import { User, RefreshToken } from '../entities';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../dtos/auth.dto'; // Import DTOs
import { ConflictError, UnauthorizedError } from '../errors/authErrors'; // Import Errors
import crypto from 'crypto';
import { sendPasswordResetEmail } from './emailService'; // Import email service function
import logger from '../config/logger'; // Import logger
import { getRolePermissions } from './permissionService'; // Import permission derivation logic

// --- Configuration --- //
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '15m'; // Keep default for expiry
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'; // Keep default for expiry

// Validate essential configuration
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  logger.fatal('FATAL ERROR: JWT_SECRET and JWT_REFRESH_SECRET environment variables are required.'); // Use logger.fatal
  process.exit(1);
}

// TODO: Define interfaces for DTOs (RegisterDto, LoginDto, etc.)

// Update TokenPayload to include all necessary claims
interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[]; // Added permissions
  organizationId?: string; // Added organization ID (optional, depends on user context)
  teamIds?: string[]; // Added team IDs (optional)
  lang: string; // Added language preference
}

/**
 * Generate a secure random token and its hash for password reset
 */
const generateResetToken = (): { token: string; hash: string } => {
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token (we store the hash, send the original token to user)
  const hash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  return { token: resetToken, hash };
};

/**
 * Request a password reset. Generates a token and sends the email.
 */
export const forgotPassword = async (data: ForgotPasswordDto): Promise<void> => {
  const userRepository = getRepository(User);

  // 1. Find user by email
  const user = await userRepository.findOne({ where: { email: data.email } });
  if (!user) {
    // Don't reveal whether a user exists or not
    logger.debug(`Password reset requested for non-existent email: ${data.email}`); // Use logger.debug
    return;
  }

  // 2. Generate reset token and hash
  const { token, hash } = generateResetToken();

  // 3. Save the hashed token to the user record
  user.passwordResetToken = hash;
  user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour expiry
  await userRepository.save(user);

  // 4. Send the token via email
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  try {
    await sendPasswordResetEmail(user.email, resetUrl); 
    logger.info(`Password reset email initiated for ${user.email}`);
  } catch (emailError) {
    logger.error({ err: emailError, userId: user?.id, email: user?.email }, `Failed to send password reset email`); // Use logger.error with context
  }
};

/**
 * Reset password using the token received via email
 */
export const resetPassword = async (data: ResetPasswordDto): Promise<void> => {
  const userRepository = getRepository(User);

  // 1. Hash the provided token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(data.token)
    .digest('hex');

  // 2. Find user with valid token
  const user = await userRepository.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: MoreThan(new Date())
    }
  });

  if (!user) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }

  // 3. Hash the new password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(data.newPassword, saltRounds);

  // 4. Update user's password and clear reset token fields
  user.passwordHash = hashedPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await userRepository.save(user);

  // 5. Optionally, invalidate all refresh tokens for this user
  const refreshTokenRepository = getRepository(RefreshToken);
  await refreshTokenRepository.update(
    { userId: user.id, revoked: false },
    { revoked: true, revokedReason: 'Password changed' }
  );
};

export const register = async (userData: RegisterDto): Promise<User> => {
  const userRepository = getRepository(User);

  // 1. Check if user already exists
  const existingUser = await userRepository.findOne({ where: { email: userData.email } });
  if (existingUser) {
    throw new ConflictError('Email already in use'); // Use ConflictError
  }

  // 2. Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  // 3. Create new user entity
  const newUser = userRepository.create({
    ...userData,
    passwordHash: hashedPassword,
    // Default status is usually 'active' or 'pending' based on workflow
    status: 'active', // Or 'pending' if email verification is needed
  });

  // 4. Save user to database
  const savedUser = await userRepository.save(newUser);

  // Remove sensitive info before returning
  delete (savedUser as any).passwordHash;
  return savedUser;
};

export const login = async (credentials: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> => {
  const userRepository = getRepository(User);

  // 1. Find user by email, including roles and team memberships
  const user = await userRepository.findOne({
      where: { email: credentials.email },
      relations: ['roles', 'teamMemberships', 'teamMemberships.team'] // Include team memberships and team details
  });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials'); // Use UnauthorizedError
  }

  // 2. Compare password
  const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials'); // Use UnauthorizedError
  }

  // 3. Check user status
  if (user.status !== 'active') {
    throw new UnauthorizedError('User account is not active'); // Use UnauthorizedError
  }

  // 4. Prepare JWT Payload
  const userRoles = user.roles?.map(role => role.name) || [];
  const userPermissions = getRolePermissions(userRoles); // Derive permissions from roles
  const userTeamIds = user.teamMemberships?.map(tm => tm.teamId) || [];
  // Determine primary organization ID (e.g., from the first team or a dedicated field)
  // This logic might need refinement based on how organization association is defined.
  const userOrganizationId = user.teamMemberships?.[0]?.team?.organizationId;

  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    roles: userRoles,
    permissions: userPermissions,
    organizationId: userOrganizationId, // Add organization ID
    teamIds: userTeamIds, // Add team IDs
    lang: user.preferredLanguage || 'sv', // Add language, default to 'sv'
  };

  // 5. Generate tokens
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ userId: user.id }); // Refresh token only needs userId

  // 6. Save refresh token
  await saveRefreshToken(user.id, refreshToken);

  // 7. Update last login time (optional)
  user.lastLogin = new Date();
  await userRepository.save(user);

  // 8. Return tokens and basic user info
  delete (user as any).passwordHash;
  const returnUser: Partial<User> = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredLanguage: user.preferredLanguage,
      roles: user.roles, // Or just role names
      // teamMemberships might be too large, return only relevant parts if needed
  };

  return { accessToken, refreshToken, user: returnUser };
};

export const refreshToken = async (incomingRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const refreshTokenRepository = getRepository(RefreshToken);
  const userRepository = getRepository(User); // Need user repo to fetch full user details

  try {
    // 1. Verify the incoming refresh token (only checks signature and expiry, payload has only userId)
    const decodedRefresh = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET) as { userId: string };

    // 2. Find the token in the database and the associated user with roles/teams
    const storedToken = await refreshTokenRepository.findOne({
      where: { token: incomingRefreshToken, userId: decodedRefresh.userId, revoked: false },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    // Check expiry manually from DB record
    if (storedToken.expiresAt < new Date()) {
      await revokeRefreshToken(storedToken.token); // Revoke expired token
      throw new UnauthorizedError('Refresh token expired');
    }

    // Fetch user details required for the new access token payload
    const user = await userRepository.findOne({
        where: { id: storedToken.userId },
        relations: ['roles', 'teamMemberships', 'teamMemberships.team']
    });

    if (!user) {
        await revokeRefreshToken(storedToken.token); // Revoke token if user not found
        throw new UnauthorizedError('User associated with token not found');
    }

    // 4. Revoke the old refresh token
    await revokeRefreshToken(storedToken.token);

    // 5. Prepare new access token payload
    const userRoles = user.roles?.map(role => role.name) || [];
    const userPermissions = getRolePermissions(userRoles); // Derive permissions
    const userTeamIds = user.teamMemberships?.map(tm => tm.teamId) || [];
    const userOrganizationId = user.teamMemberships?.[0]?.team?.organizationId; // Determine org ID

    const newAccessTokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roles: userRoles,
      permissions: userPermissions,
      organizationId: userOrganizationId,
      teamIds: userTeamIds,
      lang: user.preferredLanguage || 'sv',
    };

    // 6. Generate new tokens
    const newAccessToken = generateAccessToken(newAccessTokenPayload);
    const newRefreshToken = generateRefreshToken({ userId: user.id }); // Refresh token only needs userId

    // 7. Save the new refresh token
    await saveRefreshToken(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };

  } catch (error) {
    logger.error({ err: error, tokenAttempt: incomingRefreshToken }, "Refresh token error"); // Use logger.error with context
    // If it's already one of our specific errors, rethrow it
    if (error instanceof UnauthorizedError || error instanceof ConflictError) {
        throw error;
    }
    // Otherwise, wrap it or throw a generic unauthorized error
    throw new UnauthorizedError('Invalid or expired refresh token'); // Use UnauthorizedError
  }
};

// Restore logout function
export const logout = async (incomingRefreshToken: string): Promise<void> => {
  try {
    await revokeRefreshToken(incomingRefreshToken);
    logger.info('User logged out successfully (refresh token revoked).')
  } catch (error) {
      logger.error({ err: error }, "Error during token revocation on logout"); // Use logger.error with context
  }
};


// --- Helper Functions ---

const generateAccessToken = (payload: TokenPayload): string => {
  // Ensure all payload fields are included
  return jwt.sign(
    payload,
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY as any }
  );
};

// Refresh token payload only contains userId for security
const generateRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(
    payload,
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY as any }
  );
};

const saveRefreshToken = async (userId: string, token: string): Promise<void> => {
  const refreshTokenRepository = getRepository(RefreshToken);

  // Decode expiry from the token itself
  const decoded = jwt.decode(token) as { exp?: number };
  // If decode fails or exp is missing, handle appropriately (e.g., set default expiry)
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

  const newRefreshToken = refreshTokenRepository.create({
    userId,
    token,
    expiresAt,
    revoked: false,
  });
  await refreshTokenRepository.save(newRefreshToken);
};

const revokeRefreshToken = async (token: string): Promise<void> => {
    const refreshTokenRepository = getRepository(RefreshToken);
    // Add logging for revocation attempts
    logger.info(`Attempting to revoke refresh token: ${token ? token.substring(0, 10) + '...' : 'undefined'}`);
    const result = await refreshTokenRepository.update({ token: token, revoked: false }, { revoked: true, revokedReason: 'Logout or Refresh' });
    if (result.affected === 0) {
        logger.warn(`Refresh token ${token ? token.substring(0, 10) + '...' : 'undefined'} not found or already revoked.`);
    } else {
        logger.info(`Successfully revoked refresh token: ${token ? token.substring(0, 10) + '...' : 'undefined'}`);
    }
};

// TODO: Implement forgotPassword and resetPassword logic
// - Generate secure reset token
// - Store token with expiry associated with user
// - Send email with reset link (requires an email service)
// - Verify token and update password