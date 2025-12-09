# Physical Trainer Dashboard Test Guide

## How to Test

1. Login as physical trainer:
   - Create account: `trainer@hockeyhub.com` / `demo123`
   - Or update the mock auth to include this role

2. Navigate to: http://localhost:3010/physicaltrainer

## Interactive Elements Test Checklist

### ✅ Working Elements:
- [ ] All 6 main tabs (Overview, Training Sessions, Exercise Library, Testing & Analytics, Player Status, Templates)
- [ ] Tab content changes when clicked
- [ ] All visual elements render (cards, badges, progress bars)

### ❌ Non-Working Buttons (Click to test):

#### Overview Tab:
- [ ] "New Session" button (top right)
- [ ] "Launch Training Session" buttons (blue/outline buttons in session list)
- [ ] "View All" link (player readiness section)

#### Training Sessions Tab:
- [ ] "Schedule" button
- [ ] "Create Session" button

#### Exercise Library Tab:
- [ ] "Add Exercise" button
- [ ] Search input field

#### Testing & Analytics Tab:
- [ ] All content is placeholder
- [ ] Form doesn't submit

#### Player Status Tab:
- [ ] "View Details" buttons (one for each player)

#### Templates Tab:
- [ ] "Create Template" button
- [ ] Template cards (clickable but no action)

## Expected Behavior vs Actual:

| Feature | Expected | Actual | Status |
|---------|----------|---------|---------|
| Launch Session | Opens training viewer | Nothing happens | ❌ Needs backend |
| New Session | Opens session creator | Nothing happens | ❌ Needs backend |
| Add Exercise | Opens exercise form | Nothing happens | ❌ Needs backend |
| View Details | Shows player details | Nothing happens | ❌ Needs backend |

## Backend Services Needed:
1. Training Service (port 3004) - for session management
2. Statistics Service (port 3007) - for analytics
3. User Service - for player data

## Mock Data Currently Used:
- Today's sessions (6 sessions)
- Player readiness (5 players)
- Exercise library stats
- Session templates (4 templates)