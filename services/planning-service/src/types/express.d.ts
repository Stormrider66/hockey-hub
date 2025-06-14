import { AuthenticatedUser } from "./auth"; // Assuming auth types are defined here or adjust path

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

// Adding this empty export makes it a module, allowing global augmentation.
export {}; 