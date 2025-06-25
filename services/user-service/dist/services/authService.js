"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.login = exports.register = exports.resetPassword = exports.forgotPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const typeorm_1 = require("typeorm");
const data_source_1 = __importDefault(require("../data-source"));
const entities_1 = require("../entities");
const authErrors_1 = require("../errors/authErrors"); // Import Errors
const crypto_1 = __importDefault(require("crypto"));
const emailService_1 = require("./emailService"); // Import email service function
const logger_1 = __importDefault(require("../config/logger")); // Import logger
const permissionService_1 = require("./permissionService"); // Import permission derivation logic
const keyManager_1 = require("../utils/keyManager");
// --- Configuration --- //
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || crypto_1.default.randomBytes(32).toString('hex'); // still symmetric for refresh tokens
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
/**
 * Generate a secure random token and its hash for password reset
 */
const generateResetToken = () => {
    // Generate a random token
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    // Hash the token (we store the hash, send the original token to user)
    const hash = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    return { token: resetToken, hash };
};
/**
 * Request a password reset. Generates a token and sends the email.
 */
const forgotPassword = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const userRepository = data_source_1.default.getRepository(entities_1.User);
    // 1. Find user by email
    const user = yield userRepository.findOne({ where: { email: data.email } });
    if (!user) {
        // Don't reveal whether a user exists or not
        logger_1.default.debug(`Password reset requested for non-existent email: ${data.email}`); // Use logger.debug
        return;
    }
    // 2. Generate reset token and hash
    const { token, hash } = generateResetToken();
    // 3. Save the hashed token to the user record
    user.passwordResetToken = hash;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour expiry
    yield userRepository.save(user);
    // 4. Send the token via email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    try {
        yield (0, emailService_1.sendPasswordResetEmail)(user.email, resetUrl);
        logger_1.default.info(`Password reset email initiated for ${user.email}`);
    }
    catch (emailError) {
        logger_1.default.error({ err: emailError, userId: user === null || user === void 0 ? void 0 : user.id, email: user === null || user === void 0 ? void 0 : user.email }, `Failed to send password reset email`); // Use logger.error with context
    }
});
exports.forgotPassword = forgotPassword;
/**
 * Reset password using the token received via email
 */
const resetPassword = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const userRepository = data_source_1.default.getRepository(entities_1.User);
    // 1. Hash the provided token to compare with stored hash
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(data.token)
        .digest('hex');
    // 2. Find user with valid token
    const user = yield userRepository.findOne({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: (0, typeorm_1.MoreThan)(new Date())
        }
    });
    if (!user) {
        throw new authErrors_1.UnauthorizedError('Invalid or expired reset token');
    }
    // 3. Hash the new password
    const saltRounds = 10;
    const hashedPassword = yield bcryptjs_1.default.hash(data.newPassword, saltRounds);
    // 4. Update user's password and clear reset token fields
    user.passwordHash = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    yield userRepository.save(user);
    // 5. Optionally, invalidate all refresh tokens for this user
    const refreshTokenRepository = data_source_1.default.getRepository(entities_1.RefreshToken);
    yield refreshTokenRepository.delete({ userId: user.id });
});
exports.resetPassword = resetPassword;
const register = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    const userRepository = data_source_1.default.getRepository(entities_1.User);
    // 1. Check if user already exists
    const existingUser = yield userRepository.findOne({ where: { email: userData.email } });
    if (existingUser) {
        throw new authErrors_1.ConflictError('Email already in use'); // Use ConflictError
    }
    // 2. Hash password
    const saltRounds = 10;
    const hashedPassword = yield bcryptjs_1.default.hash(userData.password, saltRounds);
    // 3. Create new user entity
    const newUser = userRepository.create(Object.assign(Object.assign({}, userData), { passwordHash: hashedPassword, 
        // Default status is usually 'active' or 'pending' based on workflow
        status: 'active' }));
    // 4. Save user to database
    const savedUser = yield userRepository.save(newUser);
    // Remove sensitive info before returning
    delete savedUser.passwordHash;
    return savedUser;
});
exports.register = register;
const login = (credentials) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userRepository = data_source_1.default.getRepository(entities_1.User);
    logger_1.default.info(`Login attempt for email: ${credentials.email}`);
    // 1. Find user by email, including roles and team memberships
    const user = yield userRepository.findOne({
        where: { email: credentials.email },
        relations: ['roles'] // Only load roles for now, not team memberships
    });
    logger_1.default.info(`User found: ${user ? 'yes' : 'no'}`);
    if (!user) {
        throw new authErrors_1.UnauthorizedError('Invalid credentials'); // Use UnauthorizedError
    }
    // 2. Compare password
    const isPasswordValid = yield bcryptjs_1.default.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
        throw new authErrors_1.UnauthorizedError('Invalid credentials'); // Use UnauthorizedError
    }
    // 3. Check user status
    if (user.status !== 'active') {
        throw new authErrors_1.UnauthorizedError('User account is not active'); // Use UnauthorizedError
    }
    // 4. Prepare JWT Payload
    const userRoles = ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.map(role => role.name)) || [];
    const userPermissions = (0, permissionService_1.getRolePermissions)(userRoles); // Derive permissions from roles
    const userTeamIds = []; // Empty for now since we're not loading team memberships
    // Use the user's organizationId directly
    let userOrganizationId = user.organizationId || undefined;
    const tokenPayload = {
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
    yield saveRefreshToken(user.id, refreshToken);
    // 7. Update last login time (optional)
    user.lastLogin = new Date();
    yield userRepository.save(user);
    // 8. Return tokens and basic user info
    delete user.passwordHash;
    const returnUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        preferredLanguage: user.preferredLanguage,
        roles: user.roles, // Or just role names
        organizationId: user.organizationId
        // teamMemberships removed since we're not loading them
    };
    return { accessToken, refreshToken, user: returnUser };
});
exports.login = login;
const refreshToken = (incomingRefreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const refreshTokenRepository = data_source_1.default.getRepository(entities_1.RefreshToken);
    const userRepository = data_source_1.default.getRepository(entities_1.User); // Need user repo to fetch full user details
    try {
        // 1. Verify the incoming refresh token (only checks signature and expiry, payload has only userId)
        const decodedRefresh = jsonwebtoken_1.default.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);
        // 2. Find the token in the database and the associated user with roles/teams
        const storedToken = yield refreshTokenRepository.findOne({
            where: { token: incomingRefreshToken, userId: decodedRefresh.userId },
        });
        if (!storedToken) {
            throw new authErrors_1.UnauthorizedError('Invalid refresh token');
        }
        // Check expiry manually from DB record
        if (storedToken.expiresAt < new Date()) {
            yield revokeRefreshToken(storedToken.token); // Delete expired token
            throw new authErrors_1.UnauthorizedError('Refresh token expired');
        }
        // Fetch user details required for the new access token payload
        const user = yield userRepository.findOne({
            where: { id: storedToken.userId },
            relations: ['roles'] // Only load roles, not team memberships
        });
        if (!user) {
            yield revokeRefreshToken(storedToken.token); // Delete token if user not found
            throw new authErrors_1.UnauthorizedError('User associated with token not found');
        }
        // 4. Delete the old refresh token
        yield revokeRefreshToken(storedToken.token);
        // 5. Prepare new access token payload
        const userRoles = ((_b = user.roles) === null || _b === void 0 ? void 0 : _b.map(role => role.name)) || [];
        const userPermissions = (0, permissionService_1.getRolePermissions)(userRoles); // Derive permissions
        const userTeamIds = []; // Empty for now since we're not loading team memberships
        let userOrganizationId = user.organizationId || undefined;
        const newAccessTokenPayload = {
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
        yield saveRefreshToken(user.id, newRefreshToken);
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
    catch (error) {
        logger_1.default.error({ err: error, tokenAttempt: incomingRefreshToken }, "Refresh token error"); // Use logger.error with context
        // If it's already one of our specific errors, rethrow it
        if (error instanceof authErrors_1.UnauthorizedError || error instanceof authErrors_1.ConflictError) {
            throw error;
        }
        // Otherwise, wrap it or throw a generic unauthorized error
        throw new authErrors_1.UnauthorizedError('Invalid or expired refresh token'); // Use UnauthorizedError
    }
});
exports.refreshToken = refreshToken;
// Restore logout function
const logout = (incomingRefreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield revokeRefreshToken(incomingRefreshToken);
        logger_1.default.info('User logged out successfully (refresh token deleted).');
    }
    catch (error) {
        logger_1.default.error({ err: error }, "Error during token deletion on logout"); // Use logger.error with context
    }
});
exports.logout = logout;
// --- Helper Functions ---
const generateAccessToken = (payload) => {
    // Ensure all payload fields are included
    return jsonwebtoken_1.default.sign(payload, keyManager_1.jwtPrivateKey, {
        algorithm: 'RS256',
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
};
// Refresh token payload only contains userId for security
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};
const saveRefreshToken = (userId, token) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshTokenRepository = data_source_1.default.getRepository(entities_1.RefreshToken);
    // Decode expiry from the token itself
    const decoded = jsonwebtoken_1.default.decode(token);
    // If decode fails or exp is missing, handle appropriately (e.g., set default expiry)
    const expiresAt = (decoded === null || decoded === void 0 ? void 0 : decoded.exp)
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    const newRefreshToken = refreshTokenRepository.create({
        userId,
        token,
        expiresAt
    });
    yield refreshTokenRepository.save(newRefreshToken);
});
const revokeRefreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshTokenRepository = data_source_1.default.getRepository(entities_1.RefreshToken);
    // Add logging for revocation attempts
    logger_1.default.info(`Attempting to delete refresh token: ${token ? token.substring(0, 10) + '...' : 'undefined'}`);
    const result = yield refreshTokenRepository.delete({ token: token });
    if (result.affected === 0) {
        logger_1.default.warn(`Refresh token ${token ? token.substring(0, 10) + '...' : 'undefined'} not found.`);
    }
    else {
        logger_1.default.info(`Successfully deleted refresh token: ${token ? token.substring(0, 10) + '...' : 'undefined'}`);
    }
});
// TODO: Implement forgotPassword and resetPassword logic
// - Generate secure reset token
// - Store token with expiry associated with user
// - Send email with reset link (requires an email service)
// - Verify token and update password
//# sourceMappingURL=authService.js.map