import { User } from './User';
import { Team } from './Team';
export type TeamMemberRoleEnum = 'player' | 'coach' | 'assistant_coach' | 'manager' | 'staff';
export declare class TeamMember {
    id: string;
    teamId: string;
    team: Promise<Team>;
    userId: string;
    user: Promise<User>;
    role: TeamMemberRoleEnum;
    position?: string;
    jerseyNumber?: string;
    startDate: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=TeamMember.d.ts.map