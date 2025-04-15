import { AuthenticatedUser } from "./auth"; // Adjust path if needed

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

// Adding this empty export makes it a module, allowing global augmentation.
export {}; 