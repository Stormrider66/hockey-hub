import { User } from './User';
export declare class EmailVerificationToken {
    id: string;
    userId: string;
    user: Promise<User>;
    token: string;
    expiresAt: Date;
    verifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=EmailVerificationToken.d.ts.map