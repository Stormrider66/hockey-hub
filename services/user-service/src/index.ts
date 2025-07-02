import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import 'reflect-metadata';
import { AppDataSource } from './config/database';
import authRoutes from './routes/authRoutes';
import { initializeCache, closeCache } from '@hockey-hub/shared-lib';
// User service with real database authentication

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service', port: PORT });
});

// JWKS endpoint - must be public
app.get('/.well-known/jwks.json', async (req, res) => {
  try {
    const { jwtService } = await import('./services/jwtService');
    const jwks = await jwtService.getJWKS();
    res.json(jwks);
  } catch (error) {
    console.error('Error serving JWKS:', error);
    res.status(500).json({ error: 'Failed to retrieve JWKS' });
  }
});

// Auth routes
app.use('/api/v1/auth', authRoutes);

// Service authentication routes
import serviceAuthRoutes from './routes/serviceAuthRoutes';
app.use('/api/v1/service-auth', serviceAuthRoutes);

// User routes
import userRoutes from './routes/userRoutes';
app.use('/api/v1/users', userRoutes);

// Dashboard routes (optimized for all dashboards)
import dashboardRoutes from './routes/dashboardRoutes';
app.use('/api/dashboard', dashboardRoutes);

// Player routes (temporary mock for player endpoints)
app.get('/api/v1/players/:id/overview', (req, res) => {
  const playerId = parseInt(req.params.id);
  
  // Get latest wellness data for this player
  const playerWellnessData = wellnessData
    .filter(entry => entry.playerId === playerId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const latestWellness = playerWellnessData[0];
  // Mock response for player overview
  res.json({
    playerInfo: {
      name: 'Erik Johansson',
      number: 23,
      position: 'Center',
      team: 'Hockey Hub Elite',
      age: 22,
      height: "5'11\"",
      weight: "180 lbs"
    },
    schedule: [
      {
        time: "09:00",
        title: "Morning Practice",
        location: "Main Rink",
        type: "ice-training" as const,
        mandatory: true
      },
      {
        time: "14:00",
        title: "Video Analysis",
        location: "Meeting Room A",
        type: "meeting" as const,
        mandatory: true
      }
    ],
    upcoming: [
      {
        date: "2024-05-21",
        opponent: "Rivals HC",
        location: "Home",
        type: "league" as const,
        importance: "high" as const
      }
    ],
    training: [
      {
        title: "Speed & Agility",
        category: "Physical",
        duration: "45 min",
        completed: false,
        dueDate: "Today"
      },
      {
        title: "Shooting Drills",
        category: "Skills",
        duration: "30 min",
        completed: false,
        dueDate: "Today"
      }
    ],
    developmentGoals: [
      {
        category: "Physical",
        goals: ["Increase sprint speed by 5%", "Improve VO2 max to 65+"]
      },
      {
        category: "Technical",
        goals: ["Master backhand shot accuracy", "Enhance puck protection in corners"]
      }
    ],
    readiness: { 
      score: latestWellness ? 
        Math.round((latestWellness.sleepQuality + latestWellness.energyLevel + latestWellness.mood - latestWellness.soreness + 5) * 10) : 
        85, 
      trend: 'up' as const 
    },
    wellnessStats: {
      sleep: latestWellness?.sleepQuality || 8.2,
      energy: latestWellness?.energyLevel || 7.5,
      mood: latestWellness?.mood || 8,
      soreness: latestWellness?.soreness || 3,
      hrv: latestWellness?.hrv || 55,
      latestSubmission: latestWellness?.timestamp || null,
      weeklyAverage: {
        sleep: 7.8,
        energy: 7.2,
        mood: 7.5,
        soreness: 3.5
      },
      trends: [
        { metric: "Sleep Quality", direction: "up" as const, change: 5 },
        { metric: "Energy Level", direction: "stable" as const, change: 0 },
        { metric: "Mood", direction: "up" as const, change: 3 }
      ],
      recommendations: [
        "Great job maintaining consistent sleep schedule",
        "Consider adding more recovery time between intense sessions",
        "Your hydration levels are optimal - keep it up!"
      ]
    }
  });
});

// Define wellness entry interface
interface WellnessEntry {
  id: number;
  playerId: number;
  timestamp: string;
  date: string;
  sleepQuality: number;
  energyLevel: number;
  mood: number;
  soreness: number;
  hrv: number;
}

// Temporary in-memory storage for wellness data
const wellnessData: WellnessEntry[] = [];

app.post('/api/v1/players/:id/wellness', (req, res) => {
  const { id: playerId } = req.params;
  const wellnessEntry = req.body;
  
  // Add timestamp and player ID
  const entry = {
    id: Date.now(),
    playerId: parseInt(playerId),
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    ...wellnessEntry
  };
  
  // Store in memory (in production, this would go to a database)
  wellnessData.push(entry);
  
  // Log the submission
  console.log(`✅ Wellness submission for player ${playerId}:`, {
    hrv: entry.hrv,
    sleep: entry.sleepQuality,
    energy: entry.energyLevel,
    mood: entry.mood,
    soreness: entry.soreness
  });
  
  res.json({ 
    success: true, 
    message: 'Wellness data submitted successfully',
    data: entry
  });
});

// Get wellness submissions for a player
app.get('/api/v1/players/:id/wellness', (req, res) => {
  const playerId = parseInt(req.params.id);
  const today = new Date().toISOString().split('T')[0];
  
  const playerWellnessData = wellnessData
    .filter(entry => entry.playerId === playerId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const todaySubmission = playerWellnessData.find(entry => entry.date === today);
  
  res.json({
    success: true,
    data: {
      hasSubmittedToday: !!todaySubmission,
      todaySubmission: todaySubmission || null,
      allSubmissions: playerWellnessData
    }
  });
});

// Initialize database and cache, then start server
AppDataSource.initialize()
  .then(async () => {
    console.log('✅ Database connected');
    
    // Initialize cache
    try {
      await initializeCache();
      console.log('✅ Cache initialized');
    } catch (error) {
      console.warn('⚠️ Cache initialization failed, continuing without cache:', error);
    }
    
    // Create default demo users on first run
    createDemoUsers();
    
    app.listen(PORT, () => {
      console.log(`👤 User Service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    // Start server anyway for development
    app.listen(PORT, () => {
      console.log(`👤 User Service running on port ${PORT} (without database)`);
    });
  });

// Create demo users for testing
async function createDemoUsers() {
  try {
    const { AuthService } = await import('./services/authService');
    const { UserRole } = await import('./models/User');
    const authService = new AuthService();
    
    const demoUsers = [
      { email: 'player@hockeyhub.com', password: 'demo123', firstName: 'Erik', lastName: 'Johansson', role: UserRole.PLAYER },
      { email: 'coach@hockeyhub.com', password: 'demo123', firstName: 'Lars', lastName: 'Andersson', role: UserRole.COACH },
      { email: 'parent@hockeyhub.com', password: 'demo123', firstName: 'Anna', lastName: 'Nilsson', role: UserRole.PARENT },
      { email: 'medical@hockeyhub.com', password: 'demo123', firstName: 'Dr.', lastName: 'Svensson', role: UserRole.MEDICAL_STAFF },
    ];
    
    for (const user of demoUsers) {
      try {
        await authService.register(user);
        console.log(`✅ Created demo user: ${user.email}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('already exists')) {
          console.log(`ℹ️ Demo user already exists: ${user.email}`);
        } else {
          console.error(`❌ Failed to create demo user ${user.email}:`, errorMessage);
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to create demo users:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeCache();
  await AppDataSource.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeCache();
  await AppDataSource.destroy();
  process.exit(0);
});