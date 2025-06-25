import { User } from './User';
export declare class PasswordResetToken {
    id: string;
    userId: string;
    user: Promise<User>;
    token: string;
    expiresAt: Date;
    usedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=PasswordResetToken.d.ts.map