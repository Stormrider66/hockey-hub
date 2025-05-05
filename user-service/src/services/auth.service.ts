import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Need to install jsonwebtoken and @types/jsonwebtoken
import { User, UserStatus } from '../entities/user.entity';
import { RegisterUserDto } from '../dtos/register-user.dto'; // Uncommented
import { LoginUserDto } from '../dtos/login-user.dto'; // Will create later
import HttpException from '../errors/HttpException'; // Import HttpException
// import { JWT_SECRET, REFRESH_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../config'; // Need config setup

// --- Placeholder Config --- 
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-other-very-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
// --- End Placeholder --- 

export class AuthService {
  // Inject UserRepository via constructor
  private readonly userRepository: Repository<User>;

  constructor(userRepository: Repository<User>) {
    this.userRepository = userRepository;
  }

  // Updated registerUser method to accept DTO
  public async registerUser(userData: RegisterUserDto): Promise<Omit<User, 'passwordHash'>> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new HttpException(409, `User with email ${userData.email} already exists`, 'USER_ALREADY_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create new user entity
    const newUser = this.userRepository.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      preferredLanguage: userData.preferredLanguage || 'sv', // Use default if not provided
      passwordHash: hashedPassword,
      status: UserStatus.ACTIVE, // Or UserStatus.PENDING if email verification is needed
    });

    try {
      // Save user
      const savedUser: User = await this.userRepository.save(newUser);

      // Important: Don't return the password hash
      const { passwordHash, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (dbError) {
      // Handle potential database errors during save
      throw new HttpException(500, 'Failed to save new user', 'DATABASE_ERROR', { originalError: dbError });
    }
  }

  // Login User Method
  public async loginUser(credentials: LoginUserDto): Promise<{ accessToken: string, refreshToken: string, user: Omit<User, 'passwordHash'> }> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: credentials.email },
      relations: ['roles'], // Load roles for JWT payload
    });

    if (!user) {
      throw new HttpException(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check password
    const isPasswordMatching = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordMatching) {
      throw new HttpException(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new HttpException(403, 'Account is not active', 'ACCOUNT_INACTIVE');
    }

    // Generate Tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // TODO: Store refresh token securely (e.g., in RefreshToken entity)

    // Update last login
    try {
      user.lastLogin = new Date();
      await this.userRepository.save(user);
    } catch (dbError) {
      // Log the error but don't block login if lastLogin update fails
      console.error('Failed to update last login time', dbError); // TODO: Replace with logger
      // Optionally: throw new HttpException(500, 'Failed to update login time', 'DATABASE_ERROR', { originalError: dbError });
    }

    // Prepare user data to return (without password hash)
    const { passwordHash, ...userToReturn } = user;

    return {
      accessToken,
      refreshToken,
      user: userToReturn,
    };
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map(role => role.name) || [], // Ensure roles exist before mapping
      // Add other relevant claims like organizationId if needed
      // organizationId: user.organizationId, // Example: assuming user has organizationId - Property might not exist
      lang: user.preferredLanguage,
      // permissions: user.roles?.flatMap(role => role.permissions?.map(p => p.name) || []) || [], // Example: flat map permissions - Property might not exist
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      // Potentially add a token version or other security mechanism
    };
    // Note: Use a different secret for refresh tokens!
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  }

  // TODO: Implement refreshToken logic (verify, generate new pair, manage stored tokens)
} 