import 'reflect-metadata'; // Required for TypeORM
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;

// --- Middleware ---
app.use(cors()); // Configure allowed origins properly in production
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Basic Routes ---
app.get('/', (_req, res) => {
  res.send('User Service is running!');
});

app.get('/health', (_req, res) => {
  // Add checks for database connection, etc.
  res.status(200).json({ status: 'UP' });
});

// --- TODO: Add API Routers (e.g., auth, users, teams) ---
// import authRouter from './routes/auth';
// app.use('/api/v1/auth', authRouter);

// --- Error Handling Middleware (Add later) ---

// --- Start Server ---
const startServer = async () => {
  try {
    // TODO: Initialize Database Connection (TypeORM)
    // await AppDataSource.initialize();
    // console.log("Data Source has been initialized!");

    app.listen(PORT, () => {
      console.log(`User Service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    process.exit(1);
  }
};

startServer(); 