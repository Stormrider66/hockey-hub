# Bulk Parallel Sessions - User Flow Diagrams

**Status**: Frontend implementation complete (January 2025)  
**Note**: These diagrams reflect the implemented UI flow with temporary inline components for SessionSetupStep

## High-Level User Journey

```mermaid
flowchart TD
    A[Physical Trainer needs<br/>3 concurrent sessions] --> B{Choose Approach}
    B -->|Current Method| C[Create Session 1<br/>Rowing - 6 players]
    C --> D[Save & Duplicate]
    D --> E[Modify to Session 2<br/>Bike Erg - 6 players]
    E --> F[Save & Duplicate]
    F --> G[Modify to Session 3<br/>Ski Erg - 6 players]
    G --> H[Schedule all 3<br/>at same time]
    
    B -->|New Bulk Method| I[Open Bulk Creator]
    I --> J[Configure 3 sessions<br/>in one workflow]
    J --> K[Auto-assign players<br/>& equipment]
    K --> L[Create all sessions<br/>simultaneously]
    
    H --> M[Manage 3 separate<br/>sessions individually]
    L --> N[Manage as unified<br/>session bundle]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style N fill:#9f9,stroke:#333,stroke-width:2px
    style M fill:#ff9,stroke:#333,stroke-width:2px
```

## Detailed Wizard Flow

```mermaid
flowchart LR
    subgraph Step1[Step 1: Basic Config]
        A1[Number of Sessions: 3]
        A2[Date: Feb 15]
        A3[Time: 09:00]
        A4[Duration: 60 min]
        A5[Facility: Main Gym]
    end
    
    subgraph Step2[Step 2: Session Setup]
        B1[Session 1:<br/>Rowing, 6 players]
        B2[Session 2:<br/>Bike Erg, 6 players]
        B3[Session 3:<br/>Ski Erg, 6 players]
    end
    
    subgraph Step3[Step 3: Review]
        C1[Verify Equipment]
        C2[Check Conflicts]
        C3[Preview Schedule]
        C4[Save Template?]
    end
    
    Step1 --> Step2 --> Step3 --> D[Create Bundle]
    
    D --> E[3 Linked Sessions Created]
    D --> F[Equipment Reserved]
    D --> G[Calendar Updated]
    D --> H[Players Notified]
```

## Session Bundle Management View

```mermaid
flowchart TB
    subgraph Bundle[Team Conditioning Bundle - Active]
        subgraph Overview[Real-time Overview]
            S1[Rowing Group<br/>6/6 Active<br/>45% Complete]
            S2[Bike Group<br/>6/6 Active<br/>38% Complete]
            S3[Ski Group<br/>6/6 Active<br/>30% Complete]
        end
        
        subgraph Actions[Bundle Actions]
            A1[Bulk Edit]
            A2[Pause All]
            A3[Send Message]
            A4[Export Data]
        end
        
        subgraph Metrics[Live Metrics]
            M1[Avg HR: 142 bpm]
            M2[Total Calories: 1,250]
            M3[Completion: 38%]
        end
    end
    
    S1 --> D1[Detailed View<br/>Player Metrics]
    S2 --> D2[Detailed View<br/>Player Metrics]
    S3 --> D3[Detailed View<br/>Player Metrics]
```

## Equipment Allocation Logic

```mermaid
flowchart TD
    A[18 Players Selected] --> B{Equipment Check}
    B --> C[Rowing: 6/6 ✓]
    B --> D[Bike Erg: 6/6 ✓]
    B --> E[Ski Erg: 6/6 ✓]
    
    C --> F{Allocation Strategy}
    D --> F
    E --> F
    
    F -->|Manual| G[Trainer assigns<br/>players to groups]
    F -->|Automatic| H[System distributes<br/>based on criteria]
    F -->|Skill-based| I[Group by<br/>fitness level]
    
    G --> J[Confirm Assignments]
    H --> J
    I --> J
    
    J --> K[Create Sessions]
    
    K --> L[Session 1: Rowing]
    K --> M[Session 2: Bike]
    K --> N[Session 3: Ski]
```

## Database Relationships

```mermaid
erDiagram
    SessionBundle ||--o{ WorkoutSession : contains
    SessionBundle {
        uuid id PK
        string name
        date start_date
        time start_time
        int duration_minutes
        uuid trainer_id FK
        uuid facility_id FK
    }
    
    WorkoutSession {
        uuid id PK
        uuid bundle_id FK
        int bundle_order
        string name
        string equipment
        json workout_data
    }
    
    WorkoutSession ||--o{ PlayerAssignment : has
    PlayerAssignment {
        uuid session_id FK
        uuid player_id FK
        string status
    }
    
    WorkoutSession ||--o{ EquipmentReservation : reserves
    EquipmentReservation {
        uuid id PK
        uuid session_id FK
        string equipment_type
        int quantity
        datetime start_time
        datetime end_time
    }
    
    BundleTemplate ||--o{ SessionBundle : creates
    BundleTemplate {
        uuid id PK
        string name
        json config
        uuid created_by FK
    }
```

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Creating: Start Bulk Creation
    
    Creating --> ConfiguringBasics: Step 1
    ConfiguringBasics --> ConfiguringSessions: Next
    ConfiguringSessions --> Reviewing: Next
    
    Reviewing --> Validating: Create Bundle
    Validating --> CreatingBundle: Valid
    Validating --> ConfiguringSessions: Invalid
    
    CreatingBundle --> CreatingSessions: Bundle Created
    CreatingSessions --> ReservingEquipment: Sessions Created
    ReservingEquipment --> NotifyingPlayers: Equipment Reserved
    NotifyingPlayers --> Success: Complete
    
    Success --> Managing: View Bundle
    Managing --> Monitoring: Start Sessions
    Monitoring --> Completed: All Finished
    
    Completed --> [*]
    
    note right of Validating
        Check:
        - Equipment availability
        - Player conflicts
        - Time slot availability
        - Facility capacity
    end note
    
    note right of Managing
        Actions:
        - Edit individual sessions
        - Bulk update properties
        - Monitor real-time
        - Export data
    end note
```

## Component Architecture

```mermaid
flowchart TB
    subgraph UI[Frontend Components]
        W[BulkSessionWizard]
        W --> W1[BasicConfigStep]
        W --> W2[SessionSetupStep]
        W --> W3[ReviewStep]
        
        D[SessionBundleView]
        D --> D1[BundleOverview]
        D --> D2[SessionCards]
        D --> D3[BulkActions]
        D --> D4[LiveMetrics]
    end
    
    subgraph State[State Management]
        R1[bundleSlice]
        R2[sessionSlice]
        R3[equipmentSlice]
    end
    
    subgraph API[API Layer]
        A1[createBundleAPI]
        A2[updateBundleAPI]
        A3[getBundleStatusAPI]
    end
    
    subgraph WS[WebSocket]
        WS1[Bundle Events]
        WS2[Session Updates]
        WS3[Player Metrics]
    end
    
    W --> State --> API
    D --> State
    State --> WS --> D
```

---

These diagrams illustrate:
1. **User Journey**: Comparing current vs. new workflow
2. **Wizard Flow**: Step-by-step creation process
3. **Management View**: How bundles are monitored
4. **Equipment Logic**: Allocation decision tree
5. **Database Design**: Entity relationships
6. **State Flow**: Application state transitions
7. **Architecture**: Component organization

The visual flows complement the implementation plan and can be used for:
- Stakeholder presentations
- Developer reference
- UI/UX design discussions
- Documentation