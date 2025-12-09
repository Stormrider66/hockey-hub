# Step-by-Step Implementation Guide

## 📅 Week 1: Foundation & Core 3D Editor

### Day 1-2: Project Setup & Basic Structure

#### Step 1: Initialize Project
```bash
# Create Next.js project with all needed configs
pnpx create-next-app@latest hockey-tactical-platform \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd hockey-tactical-platform

# Initialize git with proper gitignore
git init
echo "node_modules/
.env.local
.next/
dist/
*.log
.DS_Store
pnpm-lock.yaml" > .gitignore

git add .
git commit -m "Initial commit"
```

#### Step 2: Install All Dependencies
```bash
# Core 3D and Animation
pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing
pnpm add gsap @gsap/react framer-motion
pnpm add leva  # For 3D controls in development

# 2D Fallback
pnpm add pixi.js @pixi/react

# State Management
pnpm add zustand immer

# UI Components
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs
pnpm add @radix-ui/react-tooltip @radix-ui/react-popover @radix-ui/react-select
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react

# Forms & Validation
pnpm add react-hook-form @hookform/resolvers zod

# Data Visualization
pnpm add recharts d3 @visx/visx

# Backend & Database
pnpm add @prisma/client prisma
pnpm add @supabase/supabase-js  # Alternative to custom backend

# Authentication
pnpm add next-auth @auth/prisma-adapter

# AI Integration (GPT-5 is latest)
pnpm add openai @anthropic-ai/sdk
pnpm add langchain  # For advanced AI chains

# Real-time
pnpm add socket.io-client pusher-js

# Video Processing
pnpm add @ffmpeg/ffmpeg @ffmpeg/util

# Dev Dependencies
pnpm add -D @types/three @types/d3 @types/node
pnpm add -D eslint-config-next prettier
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

#### Step 3: Project Structure Setup
```bash
# Create folder structure
mkdir -p src/{app,components,lib,hooks,contexts,types,utils}
mkdir -p src/app/{(auth),(dashboard),(team)}
mkdir -p src/components/{ui,tactical,3d,layout}
mkdir -p src/lib/{api,ai,three,db,auth}

# Create base files
touch src/lib/db.ts
touch src/lib/auth.ts
touch src/contexts/TacticalContext.tsx
touch src/types/index.ts
```

### Day 3-4: Core 3D Scene Setup

#### Step 4: Create Base 3D Hockey Rink
```typescript
// src/components/3d/HockeyRink.tsx
'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Box, Cylinder } from '@react-three/drei'
import * as THREE from 'three'

// Rink dimensions (NHL standard, scaled)
const RINK_LENGTH = 60  // 200 feet scaled
const RINK_WIDTH = 26   // 85 feet scaled
const CORNER_RADIUS = 8.5

export function HockeyRink() {
  return (
    <group>
      {/* Ice Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[RINK_LENGTH, RINK_WIDTH]} />
        <meshStandardMaterial color="#e8f4f8" roughness={0.1} />
      </mesh>
      
      {/* Boards */}
      <RinkBoards />
      
      {/* Lines and Markings */}
      <RinkLines />
      
      {/* Goals */}
      <Goal position={[RINK_LENGTH/2 - 3, 0, 0]} rotation={[0, -Math.PI/2, 0]} />
      <Goal position={[-RINK_LENGTH/2 + 3, 0, 0]} rotation={[0, Math.PI/2, 0]} />
      
      {/* Face-off Circles */}
      <FaceOffCircles />
    </group>
  )
}

function RinkBoards() {
  const boardsGeometry = useRef<THREE.Shape>()
  
  // Create rounded rectangle for boards
  const shape = new THREE.Shape()
  // ... implement rounded rectangle path
  
  return (
    <mesh>
      <extrudeGeometry args={[shape, { depth: 1.2, bevelEnabled: false }]} />
      <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
    </mesh>
  )
}

function RinkLines() {
  return (
    <group>
      {/* Center Line */}
      <Line 
        points={[[0, 0.01, -RINK_WIDTH/2], [0, 0.01, RINK_WIDTH/2]]} 
        color="red" 
        lineWidth={4}
      />
      
      {/* Blue Lines */}
      <Line 
        points={[[RINK_LENGTH/4, 0.01, -RINK_WIDTH/2], [RINK_LENGTH/4, 0.01, RINK_WIDTH/2]]} 
        color="blue" 
        lineWidth={3}
      />
      <Line 
        points={[[-RINK_LENGTH/4, 0.01, -RINK_WIDTH/2], [-RINK_LENGTH/4, 0.01, RINK_WIDTH/2]]} 
        color="blue" 
        lineWidth={3}
      />
      
      {/* Goal Lines */}
      <Line 
        points={[[RINK_LENGTH/2 - 3.5, 0.01, -RINK_WIDTH/2], [RINK_LENGTH/2 - 3.5, 0.01, RINK_WIDTH/2]]} 
        color="red" 
        lineWidth={2}
      />
      <Line 
        points={[[-RINK_LENGTH/2 + 3.5, 0.01, -RINK_WIDTH/2], [-RINK_LENGTH/2 + 3.5, 0.01, RINK_WIDTH/2]]} 
        color="red" 
        lineWidth={2}
      />
    </group>
  )
}

// src/components/3d/TacticalCanvas.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei'
import { HockeyRink } from './HockeyRink'
import { Players } from './Players'
import { useTacticalStore } from '@/stores/tactical'

export function TacticalCanvas() {
  const { players, selectedPlayer } = useTacticalStore()
  
  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={[0, 30, 30]} 
          fov={50}
        />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.5}
          minDistance={10}
          maxDistance={100}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1} 
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        {/* Scene */}
        <HockeyRink />
        <Players players={players} selectedPlayer={selectedPlayer} />
        
        {/* Dev Tools */}
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>
    </div>
  )
}
```

#### Step 5: Create Interactive Players
```typescript
// src/components/3d/Players.tsx
'use client'

import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Billboard, Cylinder, Sphere } from '@react-three/drei'
import { useDrag } from '@use-gesture/react'
import * as THREE from 'three'
import { animated, useSpring } from '@react-spring/three'

interface Player {
  id: string
  position: [number, number, number]
  team: 'home' | 'away'
  number: number
  role: 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G'
}

export function Player({ player, isSelected, onSelect, onMove }: {
  player: Player
  isSelected: boolean
  onSelect: (id: string) => void
  onMove: (id: string, position: [number, number, number]) => void
}) {
  const meshRef = useRef<THREE.Mesh>()
  const { camera, gl } = useThree()
  
  const [spring, api] = useSpring(() => ({
    position: player.position,
    scale: 1,
    config: { mass: 1, tension: 180, friction: 12 }
  }))
  
  const bind = useDrag(({ movement: [mx, my], pressed }) => {
    if (!meshRef.current) return
    
    // Convert screen coordinates to 3D world position
    const vec = new THREE.Vector3(
      (mx / gl.domElement.clientWidth) * 2 - 1,
      -(my / gl.domElement.clientHeight) * 2 + 1,
      0.5
    )
    
    vec.unproject(camera)
    vec.sub(camera.position).normalize()
    
    const distance = -camera.position.y / vec.y
    const pos = camera.position.clone().add(vec.multiplyScalar(distance))
    
    api.start({
      position: [pos.x, 0.5, pos.z],
      scale: pressed ? 1.2 : 1
    })
    
    if (!pressed) {
      onMove(player.id, [pos.x, 0.5, pos.z])
    }
  })
  
  const teamColor = player.team === 'home' ? '#0066cc' : '#ff0000'
  
  return (
    <animated.group 
      position={spring.position}
      scale={spring.scale}
      {...bind()}
      onClick={() => onSelect(player.id)}
    >
      {/* Player Body */}
      <Cylinder 
        ref={meshRef}
        args={[0.4, 0.4, 1.8]} 
        position={[0, 0.9, 0]}
      >
        <meshStandardMaterial 
          color={teamColor} 
          emissive={isSelected ? teamColor : 'black'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </Cylinder>
      
      {/* Player Head */}
      <Sphere args={[0.3]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#fdbcb4" />
      </Sphere>
      
      {/* Jersey Number */}
      <Billboard position={[0, 2.5, 0]}>
        <Text 
          fontSize={0.5} 
          color="white" 
          anchorX="center" 
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="black"
        >
          {player.number}
        </Text>
      </Billboard>
      
      {/* Position Indicator */}
      <Billboard position={[0, 3, 0]}>
        <Text 
          fontSize={0.3} 
          color="yellow" 
          anchorX="center" 
          anchorY="middle"
        >
          {player.role}
        </Text>
      </Billboard>
      
      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial color="yellow" opacity={0.5} transparent />
        </mesh>
      )}
    </animated.group>
  )
}
```

### Day 5-6: Animation System

#### Step 6: Create Timeline-based Animation Controller
```typescript
// src/lib/three/AnimationController.ts
import { gsap } from 'gsap'
import { EventEmitter } from 'events'

export interface AnimationStep {
  playerId: string
  startTime: number
  duration: number
  from: { x: number; y: number; z: number }
  to: { x: number; y: number; z: number }
  type: 'move' | 'pass' | 'shot'
  curve?: 'linear' | 'arc' | 'curve'
}

export class AnimationController extends EventEmitter {
  private timeline: gsap.core.Timeline
  private steps: AnimationStep[]
  private playerRefs: Map<string, any>
  
  constructor() {
    super()
    this.timeline = gsap.timeline({ paused: true })
    this.steps = []
    this.playerRefs = new Map()
  }
  
  addStep(step: AnimationStep) {
    this.steps.push(step)
    this.rebuildTimeline()
  }
  
  removeStep(index: number) {
    this.steps.splice(index, 1)
    this.rebuildTimeline()
  }
  
  rebuildTimeline() {
    this.timeline.clear()
    
    this.steps.forEach((step) => {
      const playerRef = this.playerRefs.get(step.playerId)
      if (!playerRef) return
      
      const tween = {
        x: step.to.x,
        y: step.to.y,
        z: step.to.z,
        duration: step.duration,
        ease: this.getEase(step.curve),
        onStart: () => this.emit('stepStart', step),
        onComplete: () => this.emit('stepComplete', step)
      }
      
      if (step.type === 'pass') {
        // Add puck animation
        this.animatePuck(step)
      }
      
      this.timeline.to(playerRef.position, tween, step.startTime)
    })
  }
  
  private getEase(curve?: string) {
    switch (curve) {
      case 'arc': return 'power2.inOut'
      case 'curve': return 'power3.inOut'
      default: return 'none'
    }
  }
  
  private animatePuck(step: AnimationStep) {
    // Create puck trail animation
    const puckAnimation = {
      // Implementation for puck movement
    }
    this.timeline.to(puckRef, puckAnimation, step.startTime)
  }
  
  play() {
    this.timeline.play()
    this.emit('play')
  }
  
  pause() {
    this.timeline.pause()
    this.emit('pause')
  }
  
  seek(time: number) {
    this.timeline.seek(time)
    this.emit('seek', time)
  }
  
  setSpeed(speed: number) {
    this.timeline.timeScale(speed)
  }
  
  export(): AnimationStep[] {
    return [...this.steps]
  }
  
  import(steps: AnimationStep[]) {
    this.steps = steps
    this.rebuildTimeline()
  }
}

// src/components/tactical/Timeline.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Plus } from 'lucide-react'
import { useTacticalStore } from '@/stores/tactical'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

export function Timeline() {
  const { 
    animationController, 
    currentTime, 
    duration, 
    isPlaying 
  } = useTacticalStore()
  
  const [speed, setSpeed] = useState(1)
  const timelineRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!animationController) return
    
    const handleTimeUpdate = (time: number) => {
      // Update timeline UI
    }
    
    animationController.on('timeUpdate', handleTimeUpdate)
    
    return () => {
      animationController.off('timeUpdate', handleTimeUpdate)
    }
  }, [animationController])
  
  const handlePlayPause = () => {
    if (isPlaying) {
      animationController?.pause()
    } else {
      animationController?.play()
    }
  }
  
  const handleSeek = (value: number[]) => {
    animationController?.seek(value[0])
  }
  
  const handleSpeedChange = (value: number[]) => {
    setSpeed(value[0])
    animationController?.setSpeed(value[0])
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => animationController?.seek(0)}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => animationController?.seek(duration)}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Speed:</span>
          <Slider
            value={[speed]}
            onValueChange={handleSpeedChange}
            min={0.25}
            max={2}
            step={0.25}
            className="w-24"
          />
          <span className="text-sm">{speed}x</span>
        </div>
      </div>
      
      <div className="relative" ref={timelineRef}>
        <Slider
          value={[currentTime]}
          onValueChange={handleSeek}
          min={0}
          max={duration}
          step={0.1}
          className="w-full"
        />
        
        {/* Timeline Steps Visualization */}
        <div className="mt-2 h-20 bg-gray-100 dark:bg-gray-700 rounded">
          {/* Render animation steps as blocks */}
        </div>
      </div>
      
      <div className="flex justify-between mt-2">
        <span className="text-sm text-gray-500">
          {formatTime(currentTime)}
        </span>
        <span className="text-sm text-gray-500">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

## 📅 Week 2: AI Integration & Smart Features

### Day 7-8: AI Service Setup

#### Step 7: Create AI Service Layer
```typescript
// src/lib/ai/AIService.ts
import OpenAI from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'

export class AIService {
  private openai: OpenAI
  private anthropic: Anthropic
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // For dev only
    })
    
    this.anthropic = new Anthropic({
      apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true // For dev only
    })
  }
  
  // PRIMÄRT: Använd Claude för nästan allt!
  async analyzePlaySystemWithClaude(playData: any) {
    const prompt = `
      Analyze this hockey play system:
      ${JSON.stringify(playData)}
      
      Provide:
      1. Tactical strengths
      2. Potential weaknesses
      3. Counter-strategies opponents might use
      4. Suggestions for improvement
      5. Similar NHL systems for reference
      
      Format as JSON.
    `
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 4000
    })
    
    return JSON.parse(response.content[0].text)
  }
  
  // SEKUNDÄRT: Använd GPT-5 endast för OpenAI-specifika features
  async generateWithGPT5(description: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-5', // Latest model
      messages: [
        {
          role: 'system',
          content: 'You are an expert hockey coach with deep tactical knowledge.'
        },
        {
          role: 'user',
          content: description
        }
      ],
      response_format: { type: 'json_object' }
    })
    
    return JSON.parse(response.choices[0].message.content)
  }
  
  // Använd Claude för huvudsaklig generering
  async generatePlayFromDescription(description: string) {
    const prompt = `
      Create a hockey play system based on this description:
      "${description}"
      
      Generate:
      1. Player starting positions (5 skaters + goalie)
      2. Movement sequences with timing
      3. Pass options
      4. Key decision points
      
      Format as structured JSON matching our PlaySystem interface.
    `
    
    // ALLTID använd Claude först!
    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 2000
    })
    
    return JSON.parse(response.content[0].text)
  }
  }
  
  async suggestDrills(playSystem: any) {
    // Generate practice drills based on play system
    const prompt = `
      Based on this play system:
      ${JSON.stringify(playSystem)}
      
      Create 3 progressive drills to teach this system:
      1. Basic positioning drill
      2. Movement pattern drill
      3. Full system with pressure
      
      Include setup, instructions, and coaching points.
    `
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an experienced hockey coach designing practice drills.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    
    return response.choices[0].message.content
  }
}

// src/components/tactical/AIAssistant.tsx
'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { AIService } from '@/lib/ai/AIService'
import { useTacticalStore } from '@/stores/tactical'

export function AIAssistant() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const { currentPlaySystem, updatePlaySystem } = useTacticalStore()
  
  const aiService = new AIService()
  
  const handleGeneratePlay = async () => {
    setLoading(true)
    try {
      const playSystem = await aiService.generatePlayFromDescription(input)
      updatePlaySystem(playSystem)
      setInput('')
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAnalyze = async () => {
    if (!currentPlaySystem) return
    
    setLoading(true)
    try {
      const analysis = await aiService.analyzePlaySystem(currentPlaySystem)
      setSuggestions(analysis)
    } catch (error) {
      console.error('AI analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-500" />
        <h3 className="font-semibold">AI Assistant</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <Textarea
            placeholder="Beskriv ett spelsystem du vill skapa..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleGeneratePlay}
            disabled={!input || loading}
            className="mt-2 w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generera Spelsystem
          </Button>
        </div>
        
        {currentPlaySystem && (
          <Button
            onClick={handleAnalyze}
            variant="outline"
            disabled={loading}
            className="w-full"
          >
            Analysera Nuvarande System
          </Button>
        )}
        
        {suggestions && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium mb-2">AI Analys</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Styrkor:</strong>
                <ul className="list-disc list-inside">
                  {suggestions.strengths?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Förbättringsförslag:</strong>
                <ul className="list-disc list-inside">
                  {suggestions.improvements?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
```

### Day 9-10: Video Integration

#### Step 8: Video Processing & Sync
```typescript
// src/lib/video/VideoProcessor.ts
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

export class VideoProcessor {
  private ffmpeg: FFmpeg
  private loaded = false
  
  async load() {
    if (this.loaded) return
    
    this.ffmpeg = new FFmpeg()
    await this.ffmpeg.load()
    this.loaded = true
  }
  
  async extractFrames(videoFile: File, timestamps: number[]) {
    await this.load()
    
    const frames: string[] = []
    
    // Write video to FFmpeg file system
    await this.ffmpeg.writeFile(
      'input.mp4',
      await fetchFile(videoFile)
    )
    
    // Extract frames at specific timestamps
    for (const timestamp of timestamps) {
      await this.ffmpeg.exec([
        '-i', 'input.mp4',
        '-ss', timestamp.toString(),
        '-frames:v', '1',
        `frame_${timestamp}.jpg`
      ])
      
      const data = await this.ffmpeg.readFile(`frame_${timestamp}.jpg`)
      const blob = new Blob([data.buffer], { type: 'image/jpeg' })
      frames.push(URL.createObjectURL(blob))
    }
    
    return frames
  }
  
  async createHighlight(videoFile: File, start: number, end: number) {
    await this.load()
    
    await this.ffmpeg.writeFile(
      'input.mp4',
      await fetchFile(videoFile)
    )
    
    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', start.toString(),
      '-to', end.toString(),
      '-c', 'copy',
      'highlight.mp4'
    ])
    
    const data = await this.ffmpeg.readFile('highlight.mp4')
    return new Blob([data.buffer], { type: 'video/mp4' })
  }
}

// src/components/tactical/VideoSync.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Link, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTacticalStore } from '@/stores/tactical'

export function VideoSync() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLinked, setIsLinked] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const { animationController, currentTime } = useTacticalStore()
  
  useEffect(() => {
    if (!isLinked || !videoRef.current) return
    
    // Sync video with animation timeline
    const handleTimeUpdate = (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time
      }
    }
    
    animationController?.on('timeUpdate', handleTimeUpdate)
    
    return () => {
      animationController?.off('timeUpdate', handleTimeUpdate)
    }
  }, [isLinked, animationController])
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      if (videoRef.current) {
        videoRef.current.src = url
      }
    }
  }
  
  const toggleLink = () => {
    setIsLinked(!isLinked)
    if (!isLinked && videoRef.current) {
      // Sync current positions
      videoRef.current.currentTime = currentTime
    }
  }
  
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Video Sync</h3>
          <Button
            variant={isLinked ? "default" : "outline"}
            size="sm"
            onClick={toggleLink}
          >
            {isLinked ? (
              <>
                <Link className="h-4 w-4 mr-2" />
                Länkad
              </>
            ) : (
              <>
                <Unlink className="h-4 w-4 mr-2" />
                Ej länkad
              </>
            )}
          </Button>
        </div>
        
        {!videoFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700"
            >
              Ladda upp matchvideo
            </label>
          </div>
        ) : (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              controls={!isLinked}
              className="w-full h-full"
            />
            
            {isLinked && (
              <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                Synkroniserad
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
```

## 📅 Week 3: Player Dashboard & Learning

### Day 11-12: Player Learning Interface

#### Step 9: Interactive Quiz System
```typescript
// src/components/player/InteractiveQuiz.tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Trophy } from 'lucide-react'
import { TacticalCanvas } from '@/components/3d/TacticalCanvas'

interface QuizQuestion {
  id: string
  type: 'multiple-choice' | 'position' | 'sequence'
  question: string
  scenario: any // 3D scene state
  options?: string[]
  correctAnswer: any
  explanation: string
  points: number
}

export function InteractiveQuiz({ playSystem }: { playSystem: any }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  
  const questions: QuizQuestion[] = generateQuestions(playSystem)
  
  const handleAnswer = (answer: any) => {
    const correct = answer === questions[currentQuestion].correctAnswer
    
    if (correct) {
      setScore(score + questions[currentQuestion].points)
    }
    
    setAnswers([...answers, { question: currentQuestion, answer, correct }])
    setShowFeedback(true)
    
    setTimeout(() => {
      setShowFeedback(false)
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      }
    }, 2000)
  }
  
  const progress = ((currentQuestion + 1) / questions.length) * 100
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Taktisk Quiz</h2>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">{score} poäng</span>
          </div>
        </div>
        
        <Progress value={progress} className="mb-6" />
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">
            Fråga {currentQuestion + 1} av {questions.length}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {questions[currentQuestion].question}
          </p>
        </div>
        
        {questions[currentQuestion].type === 'position' ? (
          <div className="h-96 mb-4">
            <TacticalCanvas 
              scenario={questions[currentQuestion].scenario}
              onPositionSelect={handleAnswer}
              interactive
            />
          </div>
        ) : (
          <div className="space-y-2">
            {questions[currentQuestion].options?.map((option, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAnswer(option)}
                disabled={showFeedback}
              >
                {option}
              </Button>
            ))}
          </div>
        )}
        
        {showFeedback && (
          <div className={`mt-4 p-4 rounded-lg ${
            answers[answers.length - 1]?.correct 
              ? 'bg-green-100 dark:bg-green-900/20' 
              : 'bg-red-100 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {answers[answers.length - 1]?.correct ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-600">Rätt!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-600">Fel</span>
                </>
              )}
            </div>
            <p className="text-sm">
              {questions[currentQuestion].explanation}
            </p>
          </div>
        )}
      </Card>
      
      {currentQuestion === questions.length - 1 && (
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <div className="text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Quiz Avklarat!</h2>
            <p className="text-xl">
              Din poäng: {score} / {questions.reduce((acc, q) => acc + q.points, 0)}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

function generateQuestions(playSystem: any): QuizQuestion[] {
  // AI-generated questions based on play system
  return [
    {
      id: '1',
      type: 'multiple-choice',
      question: 'Vad är det primära målet med detta uppspel?',
      options: [
        'Snabb kontring genom mitten',
        'Kontrollerat uppspel längs sargen',
        'Lång passning till forward',
        'D-till-D passning för att dra om'
      ],
      correctAnswer: 'Kontrollerat uppspel längs sargen',
      explanation: 'Detta system fokuserar på puckkontroll och säkra passningar längs sargen för att minimera turnovers.',
      points: 10,
      scenario: null
    },
    {
      id: '2',
      type: 'position',
      question: 'Var ska centern positionera sig när LW har pucken här?',
      scenario: {
        // 3D scene configuration
      },
      correctAnswer: { x: 0, y: 0, z: 5 },
      explanation: 'Centern ska erbjuda ett stödpassningsalternativ i mitten för att öppna upp spelet.',
      points: 15
    }
    // More questions...
  ]
}
```

### Day 13-14: Gamification System

#### Step 10: Achievement & Progress System
```typescript
// src/lib/gamification/AchievementSystem.ts
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  requirement: (stats: PlayerStats) => boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const achievements: Achievement[] = [
  {
    id: 'first_system',
    name: 'Första Steget',
    description: 'Slutför ditt första spelsystem',
    icon: '🎯',
    points: 10,
    requirement: (stats) => stats.completedSystems >= 1,
    rarity: 'common'
  },
  {
    id: 'perfect_quiz',
    name: 'Perfektionist',
    description: 'Få 100% på en quiz',
    icon: '💯',
    points: 25,
    requirement: (stats) => stats.perfectQuizzes >= 1,
    rarity: 'rare'
  },
  {
    id: 'team_player',
    name: 'Lagspelare',
    description: 'Hjälp 5 lagkamrater med taktiska frågor',
    icon: '🤝',
    points: 50,
    requirement: (stats) => stats.helpedTeammates >= 5,
    rarity: 'epic'
  },
  {
    id: 'tactical_master',
    name: 'Taktisk Mästare',
    description: 'Bemästra alla spelsystem för säsongen',
    icon: '🏆',
    points: 100,
    requirement: (stats) => stats.masteredSystems === stats.totalSystems,
    rarity: 'legendary'
  }
]

// src/components/player/PlayerDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Trophy, Target, TrendingUp, Users } from 'lucide-react'
import { PlayerStats } from './PlayerStats'
import { AchievementList } from './AchievementList'
import { TeamLeaderboard } from './TeamLeaderboard'
import { LearningPath } from './LearningPath'

export function PlayerDashboard() {
  const [playerData, setPlayerData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchPlayerData()
  }, [])
  
  const fetchPlayerData = async () => {
    // Fetch from API
    const response = await fetch('/api/player/dashboard')
    const data = await response.json()
    setPlayerData(data)
    setLoading(false)
  }
  
  if (loading) return <LoadingState />
  
  return (
    <div className="container mx-auto p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Total Poäng"
          value={playerData.totalPoints}
          change="+120 denna vecka"
          color="text-yellow-500"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Slutförda System"
          value={`${playerData.completedSystems}/${playerData.totalSystems}`}
          change="2 nya denna vecka"
          color="text-blue-500"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Taktisk IQ"
          value={playerData.tacticalIQ}
          change="+5% ökning"
          color="text-green-500"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Lagranking"
          value={`#${playerData.teamRank}`}
          change="Upp 2 platser"
          color="text-purple-500"
        />
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="systems">Spelsystem</TabsTrigger>
          <TabsTrigger value="achievements">Prestationer</TabsTrigger>
          <TabsTrigger value="team">Lag</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Din Utveckling</h3>
              <LearningPath 
                currentLevel={playerData.level}
                experience={playerData.experience}
                nextMilestone={playerData.nextMilestone}
              />
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Veckans Utmaning</h3>
              <WeeklyChallenge challenge={playerData.weeklyChallenge} />
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="systems">
          <PlaySystemGrid systems={playerData.playSystems} />
        </TabsContent>
        
        <TabsContent value="achievements">
          <AchievementList 
            achievements={playerData.achievements}
            unlockedIds={playerData.unlockedAchievements}
          />
        </TabsContent>
        
        <TabsContent value="team">
          <TeamLeaderboard 
            players={playerData.teamPlayers}
            currentPlayerId={playerData.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## 📅 Week 4: VR/AR Features

### Day 15-16: VR Implementation

#### Step 11: WebXR VR Mode
```typescript
// src/components/vr/VRMode.tsx
'use client'

import { VRButton, XR, Controllers, Hands } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import { HockeyRinkVR } from './HockeyRinkVR'
import { PlayerPerspective } from './PlayerPerspective'

export function VRMode({ playSystem, playerPosition }) {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <Controllers />
          <Hands />
          
          <PlayerPerspective 
            position={playerPosition}
            height={1.75} // Eye height in meters
          />
          
          <HockeyRinkVR />
          
          <PlaySystemVR 
            playSystem={playSystem}
            playerPosition={playerPosition}
          />
          
          {/* VR UI */}
          <VRInterface />
        </XR>
      </Canvas>
    </>
  )
}

// src/components/vr/PlayerPerspective.tsx
import { useXR, useController } from '@react-three/xr'
import { useFrame } from '@react-three/fiber'
import { useState, useRef } from 'react'

export function PlayerPerspective({ position, height }) {
  const { player, session } = useXR()
  const controller = useController('right')
  const [highlightedPlayer, setHighlightedPlayer] = useState(null)
  
  useFrame(() => {
    if (!player) return
    
    // Update player position based on VR headset
    player.position.set(...position)
    player.position.y = height
  })
  
  // Handle controller input
  useFrame(() => {
    if (!controller) return
    
    if (controller.inputSource.gamepad?.buttons[0].pressed) {
      // Trigger pressed - show pass option
      showPassingLanes()
    }
  })
  
  return (
    <>
      {/* Ghost player showing where to move */}
      <GhostPlayer position={getNextPosition()} />
      
      {/* Visual cues */}
      <PassingLanes visible={showLanes} />
      <PositionalArrows />
      
      {/* Spatial audio */}
      <CoachAudio position={[0, 2, -2]} />
    </>
  )
}
```

## 📊 Final Steps & Deployment

### Day 17-20: Testing, Optimization & Deploy

#### Step 12: Performance Optimization
```typescript
// src/hooks/useOptimizedScene.ts
import { useEffect, useMemo } from 'react'
import { LOD, Group } from 'three'

export function useOptimizedScene(players, quality: 'low' | 'medium' | 'high') {
  const lods = useMemo(() => {
    return players.map(player => {
      const lod = new LOD()
      
      // High quality mesh
      const highQuality = createHighQualityPlayer(player)
      lod.addLevel(highQuality, 0)
      
      // Medium quality
      const mediumQuality = createMediumQualityPlayer(player)
      lod.addLevel(mediumQuality, 50)
      
      // Low quality (billboard)
      const lowQuality = createBillboardPlayer(player)
      lod.addLevel(lowQuality, 100)
      
      return lod
    })
  }, [players])
  
  return lods
}

// Lazy loading components
const TacticalCanvas = lazy(() => import('@/components/3d/TacticalCanvas'))
const AIAssistant = lazy(() => import('@/components/tactical/AIAssistant'))
```

#### Step 13: Deploy to Production
```bash
# Build and deploy script
#!/bin/bash

# 1. Run tests
pnpm test
pnpm run test:e2e

# 2. Build optimization
pnpm run build

# 3. Deploy to Vercel
vercel --prod

# 4. Deploy backend to Railway
railway up

# 5. Run database migrations
railway run pnpx prisma migrate deploy

# 6. Invalidate CDN cache
curl -X POST https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

echo "Deployment complete!"
```

---

**VIKTIGT**: Använd **Claude Code** för 90% av all utveckling! Det är den överlägsna AI:n just nu.