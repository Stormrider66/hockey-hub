export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly CLUB_ADMIN: "club_admin";
    readonly COACH: "coach";
    readonly PLAYER: "player";
    readonly PARENT: "parent";
    readonly MEDICAL_STAFF: "medical_staff";
    readonly EQUIPMENT_MANAGER: "equipment_manager";
    readonly PHYSICAL_TRAINER: "physical_trainer";
};
export declare const formatDate: (date: Date) => string;
export declare const parseJWT: (token: string) => any;
//# sourceMappingURL=index.d.ts.map