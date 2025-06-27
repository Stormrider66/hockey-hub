const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple password hashing (not for production!)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Mock JWT creation (simplified)
function createToken(payload, expiresIn) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + (expiresIn * 1000) })).toString('base64');
  const signature = crypto.createHmac('sha256', 'secret').update(`${header}.${body}`).digest('base64');
  return `${header}.${body}.${signature}`;
}

// In-memory user storage
const users = [
  {
    id: 1,
    email: 'player@hockeyhub.com',
    password: hashPassword('demo123'),
    firstName: 'Erik',
    lastName: 'Johansson',
    role: 'player',
    name: 'Erik Johansson'
  },
  {
    id: 2,
    email: 'coach@hockeyhub.com',
    password: hashPassword('demo123'),
    firstName: 'Lars',
    lastName: 'Andersson',
    role: 'coach',
    name: 'Lars Andersson'
  },
  {
    id: 3,
    email: 'parent@hockeyhub.com',
    password: hashPassword('demo123'),
    firstName: 'Anna',
    lastName: 'Nilsson',
    role: 'parent',
    name: 'Anna Nilsson'
  },
  {
    id: 4,
    email: 'medical@hockeyhub.com',
    password: hashPassword('demo123'),
    firstName: 'Dr.',
    lastName: 'Svensson',
    role: 'medical_staff',
    name: 'Dr. Svensson'
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service', port: PORT });
});

// Login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt for: ${email}`);
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const hashedInput = hashPassword(password);
    if (hashedInput !== user.password) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate tokens
    const access_token = createToken(
      { userId: user.id, email: user.email, role: user.role },
      900 // 15 minutes
    );
    
    const refresh_token = createToken(
      { userId: user.id },
      604800 // 7 days
    );
    
    console.log(`✅ Login successful for: ${email} (${user.role})`);
    
    // Return tokens and user info
    res.json({
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register endpoint (simplified)
app.post('/api/v1/auth/register', async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Create new user
  const hashedPassword = hashPassword(password);
  const newUser = {
    id: users.length + 1,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role: role || 'player',
    name: `${firstName} ${lastName}`
  };
  
  users.push(newUser);
  console.log(`✅ New user registered: ${email}`);
  
  // Return success
  res.json({ message: 'User registered successfully' });
});

// Get current user
app.get('/api/v1/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // For simplicity, just decode the token without verification
  const token = authHeader.replace('Bearer ', '');
  try {
    const [header, body, signature] = token.split('.');
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    
    const user = users.find(u => u.id === payload.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Logout endpoint
app.post('/api/v1/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Refresh token endpoint
app.post('/api/v1/auth/refresh', (req, res) => {
  const { refresh_token } = req.body;
  
  try {
    const [header, body, signature] = refresh_token.split('.');
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    
    const user = users.find(u => u.id === payload.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate new tokens
    const access_token = createToken(
      { userId: user.id, email: user.email, role: user.role },
      900
    );
    
    const new_refresh_token = createToken(
      { userId: user.id },
      604800
    );
    
    res.json({
      access_token,
      refresh_token: new_refresh_token
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Mock player endpoints
app.get('/api/v1/players/:id/overview', (req, res) => {
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
        type: "ice-training",
        mandatory: true
      }
    ],
    upcoming: [],
    training: [],
    developmentGoals: [],
    readiness: { score: 85, trend: 'up' },
    wellnessStats: {
      sleep: 8.2,
      energy: 7.5,
      mood: 8,
      soreness: 3,
      hrv: 55,
      latestSubmission: null,
      weeklyAverage: {
        sleep: 7.8,
        energy: 7.2,
        mood: 7.5,
        soreness: 3.5
      },
      trends: [],
      recommendations: []
    }
  });
});

app.post('/api/v1/players/:id/wellness', (req, res) => {
  console.log('Wellness submission received:', req.body);
  res.json({ success: true, message: 'Wellness data submitted successfully' });
});

app.get('/api/v1/players/:id/wellness', (req, res) => {
  res.json({
    success: true,
    data: {
      hasSubmittedToday: false,
      todaySubmission: null,
      allSubmissions: []
    }
  });
});

// Start server
console.log('Starting User Service (Simple)...');
app.listen(PORT, () => {
  console.log(`👤 User Service (Simple) running on port ${PORT}`);
  console.log('📧 Demo accounts ready:');
  console.log('   - player@hockeyhub.com / demo123');
  console.log('   - coach@hockeyhub.com / demo123');
  console.log('   - parent@hockeyhub.com / demo123');
  console.log('   - medical@hockeyhub.com / demo123');
  console.log('');
  console.log('🚀 Ready to accept authentication requests!');
});