import { Role } from './Role';
import { TeamMember } from './TeamMember';
import { PlayerParentLink } from './PlayerParentLink';
import { RefreshToken } from './RefreshToken';
import { Organization } from './Organization';
import { PasswordResetToken } from './PasswordResetToken';
import { EmailVerificationToken } from './EmailVerificationToken';
export type UserStatus = 'active' | 'inactive' | 'pending';
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    preferredLanguage: string;
    status: UserStatus;
    lastLogin?: Date;
    avatarUrl?: string;
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    roles: Role[];
    teamMemberships: TeamMember[];
    childLinks: PlayerParentLink[];
    parentLinks: PlayerParentLink[];
    organizationId?: string;
    organization?: Promise<Organization | null>;
    refreshTokens: RefreshToken[];
    passwordResetTokens: PasswordResetToken[];
    emailVerificationTokens: EmailVerificationToken[];
}
//# sourceMappingURL=User.d.ts.map