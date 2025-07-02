// Business rule validations

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class BusinessRules {
  // User-related business rules
  static validateUserAge(dateOfBirth: Date, role: string): ValidationResult {
    const errors: string[] = [];
    const age = this.calculateAge(dateOfBirth);

    switch (role) {
      case 'player':
        if (age < 5) errors.push('Players must be at least 5 years old');
        if (age > 65) errors.push('Players over 65 require special approval');
        break;
      case 'coach':
      case 'assistant_coach':
        if (age < 18) errors.push('Coaches must be at least 18 years old');
        break;
      case 'parent':
        if (age < 21) errors.push('Parents must be at least 21 years old');
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateTeamComposition(
    teamType: string,
    ageGroup: string,
    players: any[]
  ): ValidationResult {
    const errors: string[] = [];

    // Validate age group matches team type
    if (teamType === 'youth' && !ageGroup?.startsWith('U')) {
      errors.push('Youth teams must have age groups starting with U (e.g., U16)');
    }

    // Validate player count
    const minPlayers = this.getMinPlayersForTeamType(teamType);
    const maxPlayers = this.getMaxPlayersForTeamType(teamType);

    if (players.length < minPlayers) {
      errors.push(`Team must have at least ${minPlayers} players`);
    }

    if (players.length > maxPlayers) {
      errors.push(`Team cannot have more than ${maxPlayers} players`);
    }

    // Validate player ages match team age group
    if (ageGroup && ageGroup.startsWith('U')) {
      const maxAge = parseInt(ageGroup.substring(1));
      const invalidPlayers = players.filter(player => {
        const age = this.calculateAge(new Date(player.dateOfBirth));
        return age > maxAge;
      });

      if (invalidPlayers.length > 0) {
        errors.push(`${invalidPlayers.length} players exceed age limit for ${ageGroup}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateJerseyNumber(
    jerseyNumber: number,
    _teamId: string,
    existingNumbers: number[]
  ): ValidationResult {
    const errors: string[] = [];

    if (jerseyNumber < 1 || jerseyNumber > 99) {
      errors.push('Jersey number must be between 1 and 99');
    }

    if (existingNumbers.includes(jerseyNumber)) {
      errors.push(`Jersey number ${jerseyNumber} is already taken on this team`);
    }

    // Goalie numbers traditionally 1, 30-35
    // This is informational, not enforced
    if ([1, 30, 31, 32, 33, 34, 35].includes(jerseyNumber)) {
      // Could add a warning here if player position is not goalie
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateOrganizationLimits(
    _organizationId: string,
    subscriptionTier: string,
    currentCounts: {
      teams: number;
      users: number;
      storage: number; // in GB
    }
  ): ValidationResult {
    const errors: string[] = [];
    const limits = this.getSubscriptionLimits(subscriptionTier);

    if (currentCounts.teams >= limits.maxTeams) {
      errors.push(`Organization has reached team limit (${limits.maxTeams}) for ${subscriptionTier} tier`);
    }

    if (currentCounts.users >= limits.maxUsers) {
      errors.push(`Organization has reached user limit (${limits.maxUsers}) for ${subscriptionTier} tier`);
    }

    if (currentCounts.storage >= limits.maxStorageGB) {
      errors.push(`Organization has reached storage limit (${limits.maxStorageGB}GB) for ${subscriptionTier} tier`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateScheduleConflict(
    newEvent: {
      startTime: Date;
      endTime: Date;
      locationId: string;
      teamId?: string;
    },
    existingEvents: Array<{
      startTime: Date;
      endTime: Date;
      locationId: string;
      teamId?: string;
    }>
  ): ValidationResult {
    const errors: string[] = [];

    for (const existing of existingEvents) {
      // Check time overlap
      const hasTimeOverlap = 
        (newEvent.startTime >= existing.startTime && newEvent.startTime < existing.endTime) ||
        (newEvent.endTime > existing.startTime && newEvent.endTime <= existing.endTime) ||
        (newEvent.startTime <= existing.startTime && newEvent.endTime >= existing.endTime);

      if (hasTimeOverlap) {
        // Same location conflict
        if (newEvent.locationId === existing.locationId) {
          errors.push('Location is already booked for this time slot');
        }

        // Same team conflict
        if (newEvent.teamId && newEvent.teamId === existing.teamId) {
          errors.push('Team already has an event scheduled for this time');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validatePasswordChange(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    passwordHistory: string[] = []
  ): ValidationResult {
    const errors: string[] = [];

    if (newPassword !== confirmPassword) {
      errors.push('New password and confirmation do not match');
    }

    if (currentPassword === newPassword) {
      errors.push('New password must be different from current password');
    }

    // Check password history (prevent reuse of last 5 passwords)
    if (passwordHistory.includes(newPassword)) {
      errors.push('Password has been used recently. Please choose a different password');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateMedicalClearance(
    _playerId: string,
    injuries: Array<{
      status: string;
      severity: string;
      returnDate?: Date;
    }>
  ): ValidationResult {
    const errors: string[] = [];

    const activeInjuries = injuries.filter(i => i.status === 'active');
    const severeInjuries = activeInjuries.filter(i => i.severity === 'severe');

    if (severeInjuries.length > 0) {
      errors.push('Player has severe injuries and cannot participate');
    }

    const pendingReturn = activeInjuries.filter(i => 
      i.returnDate && i.returnDate > new Date()
    );

    if (pendingReturn.length > 0) {
      errors.push(`Player has ${pendingReturn.length} injuries with pending return dates`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Helper methods
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private static getMinPlayersForTeamType(teamType: string): number {
    const minimums: Record<string, number> = {
      youth: 12,
      junior: 15,
      senior: 18,
      recreational: 10,
    };
    return minimums[teamType] || 15;
  }

  private static getMaxPlayersForTeamType(teamType: string): number {
    const maximums: Record<string, number> = {
      youth: 25,
      junior: 30,
      senior: 35,
      recreational: 40,
    };
    return maximums[teamType] || 30;
  }

  private static getSubscriptionLimits(tier: string): {
    maxTeams: number;
    maxUsers: number;
    maxStorageGB: number;
  } {
    const limits: Record<string, any> = {
      free: { maxTeams: 1, maxUsers: 20, maxStorageGB: 1 },
      basic: { maxTeams: 3, maxUsers: 100, maxStorageGB: 10 },
      premium: { maxTeams: 10, maxUsers: 500, maxStorageGB: 50 },
      enterprise: { maxTeams: 999, maxUsers: 9999, maxStorageGB: 999 },
    };
    return limits[tier] || limits.free;
  }
}