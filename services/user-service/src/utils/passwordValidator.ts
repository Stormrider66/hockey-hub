export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-5, where 5 is strongest
}

export class PasswordValidator {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  
  // Common weak passwords
  private static readonly COMMON_PASSWORDS = [
    'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
    'iloveyou', 'sunshine', 'master', 'welcome', 'shadow', 'ashley',
    'football', 'jesus', 'michael', 'ninja', 'mustang', 'password1'
  ];

  static validate(password: string, userInfo?: { 
    email?: string; 
    firstName?: string; 
    lastName?: string;
  }): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Check length
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must be no more than ${this.MAX_LENGTH} characters long`);
    } else {
      score += 1;
      // Extra point for longer passwords
      if (password.length >= 12) score += 0.5;
      if (password.length >= 16) score += 0.5;
    }

    // Check for character types
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 0.5;
    }

    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 0.5;
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    } else {
      score += 0.5;
    }

    if (!hasSpecialChars) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Check for common passwords
    if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
      score = Math.max(0, score - 2);
    }

    // Check for user information in password
    if (userInfo) {
      const lowerPassword = password.toLowerCase();
      
      if (userInfo.email && lowerPassword.includes(userInfo.email.split('@')[0].toLowerCase())) {
        errors.push('Password should not contain your email address');
        score = Math.max(0, score - 1);
      }
      
      if (userInfo.firstName && lowerPassword.includes(userInfo.firstName.toLowerCase())) {
        errors.push('Password should not contain your first name');
        score = Math.max(0, score - 1);
      }
      
      if (userInfo.lastName && lowerPassword.includes(userInfo.lastName.toLowerCase())) {
        errors.push('Password should not contain your last name');
        score = Math.max(0, score - 1);
      }
    }

    // Check for repeated characters
    const hasRepeatedChars = /(.)\1{2,}/.test(password);
    if (hasRepeatedChars) {
      errors.push('Password should not contain repeated characters (e.g., "aaa", "111")');
      score = Math.max(0, score - 0.5);
    }

    // Check for sequential characters
    const hasSequential = this.hasSequentialChars(password);
    if (hasSequential) {
      errors.push('Password should not contain sequential characters (e.g., "abc", "123")');
      score = Math.max(0, score - 0.5);
    }

    // Additional scoring for password entropy
    const uniqueChars = new Set(password).size;
    if (uniqueChars < password.length * 0.6) {
      score = Math.max(0, score - 0.5);
    } else if (uniqueChars > password.length * 0.8) {
      score += 0.5;
    }

    // Cap score at 5
    score = Math.min(5, score);

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.round(score * 10) / 10 // Round to 1 decimal place
    };
  }

  private static hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    const lowerPassword = password.toLowerCase();
    
    for (const sequence of sequences) {
      for (let i = 0; i < lowerPassword.length - 2; i++) {
        const substr = lowerPassword.substring(i, i + 3);
        if (sequence.includes(substr)) {
          return true;
        }
      }
    }
    
    return false;
  }

  static getStrengthLabel(score: number): string {
    if (score < 2) return 'Weak';
    if (score < 3) return 'Fair';
    if (score < 4) return 'Good';
    if (score < 4.5) return 'Strong';
    return 'Very Strong';
  }

  static generateStrongPassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + specialChars;

    let password = '';
    
    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}