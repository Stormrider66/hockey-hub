import { User } from './User';
export declare class RefreshToken {
    id: string;
    userId: string;
    user: Promise<User>;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=RefreshToken.d.ts.map