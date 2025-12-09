# Technical Architecture - Hockey Tactical Intelligence Platform

## 🏗 System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        WEB[Next.js Web App]
        MOBILE[React Native Apps]
        VR[WebXR/VR Interface]
    end
    
    subgraph "API Gateway"
        GW[API Gateway/Load Balancer]
        AUTH[Auth Service]
    end
    
    subgraph "Core Services"
        TACTICAL[Tactical Engine]
        AI[AI Service]
        VIDEO[Video Processor]
        RT[Real-time Engine]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis)]
        S3[Object Storage]
    end
    
    WEB --> GW
    MOBILE --> GW
    VR --> GW
    GW --> AUTH
    GW --> TACTICAL
    GW --> AI
    GW --> VIDEO
    GW --> RT
    TACTICAL --> PG
    TACTICAL --> REDIS
    VIDEO --> S3
    AI --> PG
```

## 📦 Detailed Component Architecture

### 1. Frontend Architecture (Next.js 14)

```typescript
// app/layout.tsx - Root Layout
import { Providers } from '@/components/providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

// components/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { TacticalProvider } from '@/contexts/tactical'
import { ThreeProvider } from '@/contexts/three'
import { SocketProvider } from '@/contexts/socket'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SocketProvider>
          <ThreeProvider>
            <TacticalProvider>
              {children}
            </TacticalProvider>
          </ThreeProvider>
        </SocketProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
```

### 2. 3D Engine Architecture (Three.js)

```typescript
// lib/three/TacticalScene.ts
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class TacticalScene {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  rink: HockeyRink
  players: Map<string, Player3D>
  animations: AnimationController
  
  constructor(container: HTMLElement) {
    this.initScene()
    this.initLighting()
    this.initRink()
    this.initControls()
    this.initAnimations()
  }
  
  initScene() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
  
  addPlayer(position: Vector3, team: 'home' | 'away', number: number) {
    const player = new Player3D(team, number)
    player.position.copy(position)
    this.scene.add(player.mesh)
    this.players.set(`${team}-${number}`, player)
    return player
  }
  
  animatePlay(playSystem: PlaySystem) {
    const timeline = this.animations.createTimeline()
    
    playSystem.movements.forEach((movement) => {
      timeline.add({
        target: this.players.get(movement.playerId),
        duration: movement.duration,
        position: movement.targetPosition,
        ease: 'power2.inOut'
      })
    })
    
    return timeline.play()
  }
}

// lib/three/Player3D.ts
export class Player3D {
  mesh: THREE.Group
  team: 'home' | 'away'
  number: number
  trail: Trail3D
  
  constructor(team: 'home' | 'away', number: number) {
    this.team = team
    this.number = number
    this.createMesh()
    this.trail = new Trail3D()
  }
  
  createMesh() {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8)
    const material = new THREE.MeshPhongMaterial({
      color: this.team === 'home' ? 0x0066cc : 0xff0000
    })
    
    this.mesh = new THREE.Group()
    const body = new THREE.Mesh(geometry, material)
    this.mesh.add(body)
    
    // Add number sprite
    const sprite = this.createNumberSprite(this.number)
    sprite.position.y = 2
    this.mesh.add(sprite)
  }
  
  moveTo(position: Vector3, duration: number) {
    // GSAP animation
    gsap.to(this.mesh.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration,
      onUpdate: () => this.trail.update(this.mesh.position)
    })
  }
}
```

### 3. AI Integration Layer

```typescript
// lib/ai/TacticalAI.ts
import OpenAI from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'

export class TacticalAI {
  private openai: OpenAI
  private claude: Anthropic
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    this.claude = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    })
  }
  
  async analyzePlaySystem(playSystem: PlaySystem): Promise<Analysis> {
    // Use GPT-4 Vision for visual analysis
    const screenshot = await this.capturePlaySystemImage(playSystem)
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "Du är en expert på ishockeytaktik. Analysera detta spelsystem."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analysera styrkor, svagheter och förbättringsförslag för detta spelsystem."
            },
            {
              type: "image_url",
              image_url: {
                url: screenshot
              }
            }
          ]
        }
      ]
    })
    
    return this.parseAnalysis(response.choices[0].message.content)
  }
  
  async generateCounterPlay(opponentSystem: PlaySystem): Promise<PlaySystem> {
    const prompt = `
      Given this opponent play system:
      ${JSON.stringify(opponentSystem)}
      
      Generate an effective counter-play that:
      1. Exploits their weaknesses
      2. Uses our team's strengths
      3. Maintains defensive stability
      
      Return as JSON matching PlaySystem interface.
    `
    
    const response = await this.claude.messages.create({
      model: 'claude-3-opus-20240229',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000
    })
    
    return JSON.parse(response.content[0].text)
  }
  
  async generateTrainingDrill(playSystem: PlaySystem): Promise<Drill> {
    // Generate practice drill based on play system
    const prompt = `
      Create a 15-minute training drill to teach this play system:
      ${JSON.stringify(playSystem)}
      
      Include:
      - Warm-up progression
      - Step-by-step instruction
      - Common mistakes to avoid
      - Variation for different skill levels
    `
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an expert hockey coach." },
        { role: "user", content: prompt }
      ]
    })
    
    return this.parseDrill(response.choices[0].message.content)
  }
}

// lib/ai/VideoAnalyzer.ts
export class VideoAnalyzer {
  private visionAPI: GoogleVisionAPI
  private openCV: OpenCVProcessor
  
  async analyzeGameFootage(videoUrl: string): Promise<GameAnalysis> {
    // Extract frames
    const frames = await this.extractKeyFrames(videoUrl)
    
    // Detect players and positions
    const playerTracking = await this.trackPlayers(frames)
    
    // Identify play patterns
    const patterns = await this.identifyPatterns(playerTracking)
    
    // Generate insights
    return this.generateInsights(patterns)
  }
  
  async compareToIdeal(
    idealPlay: PlaySystem, 
    actualVideo: string
  ): Promise<Comparison> {
    const actualMovements = await this.extractMovements(actualVideo)
    
    return {
      accuracy: this.calculateAccuracy(idealPlay, actualMovements),
      deviations: this.findDeviations(idealPlay, actualMovements),
      suggestions: await this.generateSuggestions(idealPlay, actualMovements)
    }
  }
}
```

### 4. Real-time Collaboration Engine

```typescript
// lib/realtime/CollaborationEngine.ts
import { Server as SocketServer } from 'socket.io'
import { Redis } from 'ioredis'

export class CollaborationEngine {
  private io: SocketServer
  private redis: Redis
  private sessions: Map<string, TacticalSession>
  
  constructor(server: any) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
      }
    })
    
    this.redis = new Redis(process.env.REDIS_URL)
    this.sessions = new Map()
    
    this.initializeHandlers()
  }
  
  initializeHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('join-session', async (data) => {
        const { sessionId, userId, role } = data
        
        // Add to session
        let session = this.sessions.get(sessionId)
        if (!session) {
          session = await this.createSession(sessionId)
        }
        
        session.addParticipant(userId, socket.id, role)
        socket.join(sessionId)
        
        // Sync current state
        socket.emit('session-state', session.getState())
        
        // Notify others
        socket.to(sessionId).emit('user-joined', {
          userId,
          role
        })
      })
      
      socket.on('update-play', async (data) => {
        const { sessionId, playUpdate } = data
        const session = this.sessions.get(sessionId)
        
        // Validate permissions
        if (!session.canEdit(socket.id)) {
          return socket.emit('error', 'No edit permissions')
        }
        
        // Apply update
        session.applyUpdate(playUpdate)
        
        // Broadcast to all participants
        this.io.to(sessionId).emit('play-updated', playUpdate)
        
        // Persist to Redis
        await this.redis.set(
          `session:${sessionId}`,
          JSON.stringify(session.getState())
        )
      })
      
      socket.on('start-voice', (data) => {
        // WebRTC signaling for voice chat
        socket.to(data.sessionId).emit('voice-offer', {
          from: socket.id,
          offer: data.offer
        })
      })
    })
  }
}

// lib/realtime/TacticalSession.ts
export class TacticalSession {
  id: string
  participants: Map<string, Participant>
  playSystem: PlaySystem
  annotations: Annotation[]
  history: HistoryStack
  
  applyUpdate(update: PlayUpdate) {
    // Store in history for undo/redo
    this.history.push(this.playSystem)
    
    // Apply the update
    switch (update.type) {
      case 'MOVE_PLAYER':
        this.movePlayer(update.playerId, update.position)
        break
      case 'ADD_ANNOTATION':
        this.annotations.push(update.annotation)
        break
      case 'MODIFY_TIMING':
        this.updateTiming(update.step, update.duration)
        break
    }
  }
  
  canEdit(socketId: string): boolean {
    const participant = this.getParticipantBySocket(socketId)
    return participant?.role === 'coach' || participant?.role === 'assistant'
  }
}
```

### 5. Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Team {
  id           String       @id @default(cuid())
  name         String
  level        TeamLevel
  subscription Subscription
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  coaches      Coach[]
  players      Player[]
  playSystems  PlaySystem[]
  sessions     Session[]
}

model PlaySystem {
  id          String   @id @default(cuid())
  teamId      String
  name        String
  type        PlayType
  category    String
  description String?
  
  formations  Json     // Formation[]
  animations  Json     // Animation[]
  metadata    Json?
  
  team        Team     @relation(fields: [teamId], references: [id])
  videos      Video[]
  drills      Drill[]
  analytics   Analytics[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  version     Int      @default(1)
  
  @@index([teamId])
  @@index([type])
}

model Player {
  id         String   @id @default(cuid())
  teamId     String
  userId     String
  number     Int
  position   Position
  
  team       Team     @relation(fields: [teamId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
  progress   Progress[]
  stats      PlayerStats[]
  feedback   Feedback[]
  
  @@unique([teamId, number])
  @@index([teamId])
  @@index([userId])
}

model Session {
  id          String   @id @default(cuid())
  teamId      String
  playSystemId String
  type        SessionType
  
  startTime   DateTime
  endTime     DateTime?
  recording   String?
  
  team        Team     @relation(fields: [teamId], references: [id])
  playSystem  PlaySystem @relation(fields: [playSystemId], references: [id])
  participants Participant[]
  events      SessionEvent[]
  
  @@index([teamId])
  @@index([playSystemId])
}

model Progress {
  id         String   @id @default(cuid())
  playerId   String
  playSystemId String
  
  viewed     Boolean  @default(false)
  completed  Boolean  @default(false)
  score      Float?
  attempts   Int      @default(0)
  
  player     Player   @relation(fields: [playerId], references: [id])
  playSystem PlaySystem @relation(fields: [playSystemId], references: [id])
  
  viewedAt   DateTime?
  completedAt DateTime?
  
  @@unique([playerId, playSystemId])
  @@index([playerId])
  @@index([playSystemId])
}

enum TeamLevel {
  YOUTH
  JUNIOR
  SENIOR
  PROFESSIONAL
}

enum Subscription {
  BASIC
  PRO
  ELITE
}

enum PlayType {
  OFFENSIVE
  DEFENSIVE
  SPECIAL_TEAMS
  FACEOFF
  TRANSITION
}

enum Position {
  GOALIE
  CENTER
  LEFT_WING
  RIGHT_WING
  LEFT_DEFENSE
  RIGHT_DEFENSE
}

enum SessionType {
  PRACTICE
  GAME
  REVIEW
  TACTICAL
}
```

### 6. API Structure

```typescript
// app/api/plays/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { TacticalAI } from '@/lib/ai'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')
  
  const plays = await prisma.playSystem.findMany({
    where: { teamId },
    include: {
      videos: true,
      analytics: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })
  
  return NextResponse.json(plays)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  
  // Create play system
  const playSystem = await prisma.playSystem.create({
    data: {
      teamId: body.teamId,
      name: body.name,
      type: body.type,
      category: body.category,
      formations: body.formations,
      animations: body.animations,
      createdBy: session.user.id
    }
  })
  
  // Generate AI analysis
  const ai = new TacticalAI()
  const analysis = await ai.analyzePlaySystem(playSystem)
  
  // Store analysis
  await prisma.analytics.create({
    data: {
      playSystemId: playSystem.id,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      suggestions: analysis.suggestions
    }
  })
  
  return NextResponse.json(playSystem)
}

// app/api/ai/analyze/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { playSystemId, videoUrl } = await request.json()
  
  const ai = new TacticalAI()
  const videoAnalyzer = new VideoAnalyzer()
  
  // Get play system
  const playSystem = await prisma.playSystem.findUnique({
    where: { id: playSystemId }
  })
  
  // Analyze video vs ideal
  const comparison = await videoAnalyzer.compareToIdeal(
    playSystem,
    videoUrl
  )
  
  // Generate feedback
  const feedback = await ai.generateFeedback(comparison)
  
  // Store results
  await prisma.feedback.create({
    data: {
      playSystemId,
      videoUrl,
      accuracy: comparison.accuracy,
      feedback: feedback,
      createdAt: new Date()
    }
  })
  
  return NextResponse.json({
    comparison,
    feedback
  })
}
```

## 🔧 Development Environment Setup

```bash
# 1. Initialize project (med pnpm)
pnpx create-next-app@latest hockey-tactical --typescript --tailwind --app
cd hockey-tactical

# 2. Install core dependencies
pnpm add three @react-three/fiber @react-three/drei
pnpm add pixi.js @pixi/react
pnpm add framer-motion gsap
pnpm add socket.io-client socket.io
pnpm add @prisma/client prisma
pnpm add openai @anthropic-ai/sdk  # GPT-5 & Claude
pnpm add next-auth @auth/prisma-adapter
pnpm add zustand immer
pnpm add react-hook-form zod
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add recharts d3
pnpm add @tensorflow/tfjs

# 3. Install dev dependencies
pnpm add -D @types/three @types/d3
pnpm add -D eslint prettier
pnpm add -D vitest @testing-library/react
pnpm add -D @playwright/test

# 4. Setup Prisma
pnpx prisma init
# Update schema
pnpx prisma migrate dev --name init
pnpx prisma generate

# 5. Environment variables
cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hockey_tactical"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-secret-here"

# AI APIs (GPT-5 är senaste)
OPENAI_API_KEY="sk-..."  # För GPT-5
CLAUDE_API_KEY="sk-ant-..."  # För Claude (primär AI)
GOOGLE_VISION_API_KEY="..."

# Storage
S3_BUCKET="hockey-tactical"
S3_REGION="eu-north-1"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."

# Redis
REDIS_URL="redis://localhost:6379"

# Analytics
POSTHOG_KEY="..."
SENTRY_DSN="..."
EOF

# 6. Start development
pnpm dev
```

**VIKTIGT**: Använd **Claude Code** som primär utvecklings-AI för detta projekt!

## 🚀 Deployment Architecture

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - api
      
  api:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hockey_tactical
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - frontend
      - api

volumes:
  postgres_data:
```

---

**Nästa steg**: Läs `IMPLEMENTATION.md` för steg-för-steg implementation.