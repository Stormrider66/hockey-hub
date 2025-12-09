# AI Development Prompts Library

## 🤖 Claude Code as Primary Development Partner

### Why Claude Code First?
Claude Code är för närvarande den **överlägsna AI:n för kodutveckling** med:
- Djupare förståelse för arkitektur och systemdesign
- Bättre kodkvalitet och best practices
- Längre kontext-window för stora projekt
- Mer konsistent och pålitlig output
- Bättre på att följa instruktioner exakt

**Använd Claude Code för 90% av utvecklingen!**

## 🎯 Master Prompts for Claude Code

### Foundation Prompts

#### 1. Project Setup & Architecture
```markdown
You are an expert full-stack developer specializing in Next.js 14, Three.js, and sports technology.

Create a complete project setup for a hockey tactical training platform with:
1. Next.js 14 app router structure
2. TypeScript configuration for strict type safety
3. Tailwind CSS with custom hockey-themed design system
4. Prisma schema for teams, players, plays, and analytics
5. Authentication with NextAuth
6. Real-time capabilities with Socket.io
7. 3D rendering with Three.js and React Three Fiber

Include:
- Complete folder structure
- All necessary config files
- Base components with proper typing
- Error handling patterns
- Performance optimization setup
- Testing framework configuration

Prioritize:
- Developer experience
- Type safety
- Performance (60fps 3D rendering)
- Mobile responsiveness
- Accessibility
```

#### 2. 3D Hockey Rink Implementation
```markdown
You are a Three.js expert with deep knowledge of sports visualization.

Create a photorealistic 3D hockey rink component using React Three Fiber that includes:

Technical requirements:
- NHL regulation dimensions (200ft x 85ft scaled appropriately)
- Accurate line markings (center, blue lines, goal lines, face-off circles)
- Realistic ice texture with reflection
- Dynamic lighting that simulates arena lights
- Optimized geometry for 60fps on mobile devices
- LOD (Level of Detail) system for performance
- Clickable zones for tactical annotations

Visual features:
- Glass boards with transparency
- Goal nets with proper mesh
- Bench and penalty box areas
- Center ice logo customization
- Scoreboard (optional)

Interactivity:
- Orbit controls with restrictions (no going below ice)
- Zoom limits (min: see whole rink, max: close player view)
- Click to place players
- Drag to create movement paths
- Right-click context menu for tactics

Code should be modular, well-commented, and use React best practices.
```

### AI Integration Prompts

#### 3. Tactical Analysis Engine
```markdown
You are an AI specialist combining computer vision, sports analytics, and strategic analysis.

Design and implement a tactical analysis system that:

Core Analysis Features:
1. Accepts a play system as JSON with player positions and movements
2. Identifies tactical strengths and weaknesses
3. Suggests counter-strategies
4. Compares to known NHL systems
5. Generates training drill recommendations

Input format:
{
  formation: "1-2-2",
  players: [{id, position, movements}],
  objectives: ["zone_entry", "puck_possession"],
  duration: 30 // seconds
}

Output should include:
- Effectiveness score (0-100)
- Vulnerability heat map
- Top 3 strengths with explanations
- Top 3 weaknesses with solutions
- Similar pro team systems
- 3 progressive drills to master the system

Use OpenAI GPT-4 for analysis and return structured JSON.
Include error handling and fallback strategies.
```

#### 4. Natural Language Play Generation
```markdown
You are a hockey coach and AI developer creating an NLP system for tactical design.

Build a system that converts natural language descriptions into executable play systems.

Example inputs:
- "Create a 2-1-2 forecheck that pressures the weak side"
- "Design a powerplay that uses the bumper position"
- "Show me a breakout that uses the strong side D for outlet passes"

The system should:
1. Parse the tactical intent
2. Identify key formations and positions
3. Generate appropriate player movements
4. Add timing and synchronization
5. Include decision points
6. Validate against hockey rules/logic

Output a complete play system with:
- Starting positions for all 6 players
- Movement sequences with timing
- Pass options with probabilities
- Key reads and decisions
- Common adjustments

Implement using OpenAI function calling for structured output.
```

### Feature Development Prompts

#### 5. Interactive Quiz Generator
```markdown
You are an educational technology expert specializing in sports training.

Create an intelligent quiz generation system for hockey tactics that:

Question Types:
1. Multiple choice - tactical decisions
2. Position selection - click where player should go
3. Sequence ordering - arrange plays in correct order
4. Video analysis - identify errors in execution
5. Scenario-based - "what would you do?"

For each play system, generate:
- 5-10 questions of varying difficulty
- Role-specific questions (forward vs defense)
- Visual scenarios requiring 3D interaction
- Explanations that teach, not just correct
- Adaptive difficulty based on performance

Include:
- Spaced repetition algorithm
- Performance tracking
- Hint system
- Instant feedback with visualizations
- Connection to real game footage

The code should integrate with existing React/Three.js components.
```

#### 6. VR Mode Implementation
```markdown
You are a WebXR and Three.js expert creating immersive training experiences.

Implement a VR mode for first-person tactical training:

Core Features:
1. Player perspective from ice level (1.75m eye height)
2. Natural head tracking for looking around
3. Controller input for movement and actions
4. Spatial audio for coach instructions
5. Hand tracking for gesture commands

Training Elements:
- Ghost player showing ideal positioning
- Colored paths for movement routes
- Passing lane visualization
- Pressure/time indicators
- Score/feedback overlay

Technical Requirements:
- Support for Quest 2/3, PICO 4
- Fallback for mobile VR
- 72+ fps performance
- Minimal motion sickness
- Progressive enhancement

UI/UX in VR:
- Wrist menu for controls
- Voice commands
- Gaze-based selection
- Haptic feedback
- Comfort options

Provide complete WebXR implementation with React Three Fiber.
```

### Advanced AI Prompts

#### 7. Video Analysis with Computer Vision
```markdown
You are a computer vision expert specializing in sports analytics.

Create a video analysis system that:

Video Processing:
1. Accepts game footage (MP4, WebM)
2. Detects and tracks all players
3. Identifies team by jersey color
4. Tracks puck position
5. Recognizes play patterns

Analysis Features:
- Player movement paths
- Speed and acceleration data
- Formation recognition
- Pass completion rates
- Zone time statistics
- Scoring chance identification

Integration:
- Compare to drawn plays (ideal vs actual)
- Generate deviation reports
- Highlight successful executions
- Identify breakdown points
- Suggest improvements

Use:
- TensorFlow.js for client-side inference
- OpenCV.js for image processing
- Pre-trained models where available
- Fallback to cloud APIs if needed

Output synchronized data that overlays on tactical drawings.
```

#### 8. Predictive Opposition Analysis
```markdown
You are a data scientist specializing in sports prediction models.

Build an AI system that predicts opponent strategies:

Input Data:
- Last 10 games of opponent (video or stats)
- Their typical formations
- Key player tendencies
- Special teams patterns
- Coach historical preferences

Predictions:
1. Most likely forechecking system
2. Powerplay formation and entries
3. Defensive zone coverage
4. Breakout patterns
5. Overtime strategies

For each prediction provide:
- Confidence level (%)
- Key indicators to watch
- Recommended counter-strategy
- Players to key on
- Tactical adjustments

Implementation:
- Use transformer models for sequence prediction
- Ensemble multiple approaches
- Continuous learning from results
- Explainable AI for coaching insights

Integrate with the tactical drawing system to visualize predictions.
```

### Optimization & Scaling Prompts

#### 9. Performance Optimization System
```markdown
You are a performance engineer optimizing 3D web applications.

Optimize the hockey tactical platform for:

Targets:
- 60 FPS on mid-range phones
- < 2 second initial load
- Smooth animations with 20+ objects
- Real-time collaboration with 10+ users
- Work offline after first load

Implement:
1. Geometry instancing for multiple players
2. Texture atlasing for jerseys
3. LOD system based on camera distance
4. Frustum culling
5. Web Workers for heavy computation
6. WASM modules for physics
7. Efficient state management
8. WebGL shader optimizations
9. Asset lazy loading
10. Service Worker caching

Profiling:
- React DevTools Profiler integration
- Three.js stats monitoring
- Memory leak detection
- Network waterfall optimization

Provide specific code improvements with before/after metrics.
```

#### 10. Real-time Collaboration Engine
```markdown
You are a distributed systems expert building real-time collaborative tools.

Create a collaboration system supporting:

Features:
- 10+ simultaneous users editing tactics
- Cursor presence and labels
- Live voice chat
- Screen annotation
- Synchronized playback
- Conflict resolution
- Offline sync

Technical Stack:
- WebRTC for peer-to-peer
- WebSockets for low latency
- CRDTs for conflict-free editing
- Redis for session state
- PostgreSQL for persistence

Implementation:
1. Session creation and joining
2. State synchronization protocol
3. Optimistic updates with rollback
4. Delta compression
5. Automatic reconnection
6. Bandwidth optimization
7. Security and permissions

Provide production-ready code with error handling and tests.
```

### Prompt Engineering Tips

#### Best Practices for AI-Assisted Development

```markdown
1. CONTEXT SETTING
Always start with:
- Your role/expertise
- The project context
- Technology stack
- Performance requirements

2. SPECIFICITY
Be specific about:
- Input/output formats
- Error handling needs
- Edge cases to consider
- Integration points

3. ITERATIVE REFINEMENT
First prompt: Get the structure
Second prompt: Add error handling
Third prompt: Optimize performance
Fourth prompt: Add tests

4. CODE QUALITY REQUIREMENTS
Always request:
- TypeScript with strict typing
- Comprehensive comments
- Error boundaries
- Loading states
- Accessibility features

5. VALIDATION
Ask AI to:
- Self-review for bugs
- Suggest improvements
- Identify potential issues
- Provide test cases
```

### Multi-AI Workflow (Claude Code Primary)

#### AI Tool Specialization

```markdown
CLAUDE CODE (Anthropic) - PRIMARY TOOL (90% av utvecklingen):
- ALL systemarkitektur
- ALL huvudsaklig implementation
- Komplexa logikflöden
- Kodgranskning och refaktorering
- Dokumentation
- Best practices enforcement
- Debugging och problemlösning
- Testing strategier
- Performance optimering

GPT-5 (OpenAI) - SECONDARY TOOL (10% - endast för specifika integrationer):
- OpenAI API-integrationer
- DALL-E bildgenerering om behövs
- Specifika GPT-5 features
- Whisper för rösttranskribering

GEMINI (Google) - OPTIONAL:
- Google-specifika integrationer
- YouTube API om behövs
- Google Vision API

WORKFLOW EXEMPEL:
1. Claude Code: Designa och bygg HELA systemet
2. Claude Code: Implementera alla features
3. Claude Code: Optimera och refaktorera
4. GPT-5: ENDAST om du behöver OpenAI-specifika API:er
5. Claude Code: Review och förbättra eventuell GPT-5 kod
6. Claude Code: Generera tester och dokumentation
```

### Varför Claude Code för nästan allt?

```markdown
CLAUDE CODE FÖRDELAR:
1. Längre kontext - kan hålla hela projekt i minnet
2. Bättre kodkvalitet - följer best practices konsekvent
3. Djupare förståelse - förstår komplexa arkitekturer
4. Mer pålitlig - färre hallucinationer
5. Bättre på svenska - om du vill ha kommentarer på svenska

ANVÄND ENDAST ANDRA AI:s NÄR:
- Du behöver deras specifika API:er (OpenAI, Google)
- Claude Code explicit rekommenderar det
- Du testar olika lösningar för jämförelse
```

### Emergency Prompts

#### When Things Go Wrong

```markdown
DEBUG PROMPT (För Claude Code):
"I have this error: [ERROR MESSAGE]
In this code: [CODE]
The expected behavior is: [EXPECTATION]
It's failing when: [CONDITION]

Please:
1. Identify the root cause
2. Provide a fix with explanation
3. Suggest how to prevent this
4. Add error handling
5. Include a test case"

PERFORMANCE FIX (För Claude Code):
"This component is running at [X] FPS but needs 60 FPS.
[PASTE COMPONENT CODE]

Profile and optimize for:
1. Reduced re-renders
2. Memoization opportunities
3. Lazy loading potential
4. WebGL optimizations
5. State management improvements"

REFACTOR REQUEST (För Claude Code):
"This code works but is messy:
[PASTE CODE]

Please refactor for:
1. Better readability
2. Proper typing
3. Error handling
4. Performance
5. Testability
Keep the same functionality."
```

### 🚀 Optimerad Utvecklingsstrategi med Claude Code

#### Varför Claude Code för Hockey Tactical Platform?

```markdown
CLAUDE CODE ÄR ÖVERLÄGSEN FÖR DETTA PROJEKT:

1. ARKITEKTUR & SYSTEMDESIGN
   - Förstår komplexa 3D-visualiseringssystem
   - Kan hålla hela projektstrukturen i minnet
   - Ger konsistenta design patterns genom hela appen

2. THREE.JS & REACT THREE FIBER
   - Expert på 3D-rendering optimering
   - Förstår WebGL performance bottlenecks
   - Kan skapa komplexa animationssystem

3. REALTIDS-KOLLABORATION
   - Kan designa WebSocket/WebRTC arkitektur
   - Förstår state synchronization challenges
   - Implementerar CRDT:er korrekt

4. AI-INTEGRATION PARADOX
   - Claude kan bäst integrera ANDRA AI:er!
   - Förstår när GPT-5 ska användas
   - Kan optimera AI-API calls för kostnad/prestanda

ANVÄND GPT-5 ENDAST FÖR:
- OpenAI-specifika API:er (Whisper, DALL-E)
- När du behöver jämföra outputs
- Om Claude explicit föreslår det
```

#### Optimal Prompt-Strategi för Claude Code

```markdown
STEG 1 - INITIAL ARKITEKTUR (Claude Code):
"Design en komplett systemarkitektur för en hockey tactical platform med:
- 3D visualization (Three.js)
- Real-time collaboration
- AI-powered analysis
- VR/AR support
Ge mig en detaljerad teknisk specifikation och mappstruktur."

STEG 2 - IMPLEMENTATION (Claude Code):
"Baserat på arkitekturen, implementera [SPECIFIC FEATURE].
Inkludera:
- Full TypeScript typing
- Error handling
- Performance optimization
- Tests
- Documentation"

STEG 3 - INTEGRATION (Claude Code):
"Integrera denna feature med resten av systemet.
Säkerställ:
- Konsistent state management
- Proper event handling
- Backward compatibility
- Migration strategy if needed"

STEG 4 - OPTIMERING (Claude Code):
"Optimera denna kod för:
- 60 FPS på mobil
- Bundle size < 200KB
- Lazy loading
- Code splitting
Behåll all funktionalitet."
```

### Continuous Learning Prompts

#### Staying Updated

```markdown
WEEKLY LEARNING:
"What are the latest best practices for:
1. Three.js performance in 2024
2. Next.js 14 app router patterns
3. AI integration in web apps
4. WebXR developments
5. Real-time collaboration

Provide code examples for each."

ARCHITECTURE REVIEW:
"Review this architecture for a hockey tactical platform:
[PASTE ARCHITECTURE]

Suggest improvements considering:
1. Scalability to 10,000 users
2. Real-time performance
3. AI integration points
4. Cost optimization
5. Security concerns"
```

---

**Final Step**: Use these prompts with Claude Code to build your platform!