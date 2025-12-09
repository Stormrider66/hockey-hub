/**
 * Tactical Prompts for Hockey AI Analysis
 * 
 * Hockey-specific prompts optimized for different AI providers
 * with structured output formatting and context awareness.
 */

import { TacticalPlay, AnalysisContext } from '../components/tactical/AIAnalysisEngine';

export interface PromptTemplate {
  system: string;
  analysis: (play: TacticalPlay, analysisType: string, context?: AnalysisContext) => string;
  followUp?: string;
}

export class TacticalPrompts {
  private readonly HOCKEY_RULES = `
HOCKEY FUNDAMENTALS:
- Ice dimensions: 200ft x 85ft (NHL standard)
- 3 zones: Defensive (0-75ft), Neutral (75-125ft), Offensive (125-200ft)
- Standard positions: C (Center), LW/RW (Wings), LD/RD (Defense), G (Goalie)
- Game situations: Even strength (5v5), Power play (5v4, 5v3), Penalty kill (4v5, 3v5), Empty net (6v5)
- Key principles: Support, spacing (4-6ft optimal), timing, communication, transition speed
`;

  private readonly TACTICAL_SYSTEMS = `
COMMON HOCKEY SYSTEMS:
1. 1-2-2 (Balanced): 1 forechecker, 2 defensemen, 2 wingers - good overall coverage
2. 2-1-2 (Aggressive): 2 forecheckers, 1 defenseman, 2 wingers - high offensive pressure
3. 1-3-1 (Trap): 1 forechecker, 3 middle layer, 1 deep - excellent defensive structure
4. 2-2-1 (Diamond): 2 forwards, 2 defensemen, 1 center - strong neutral zone control

POWER PLAY FORMATIONS:
- 1-3-1 Umbrella: 1 point, 3 middle, 1 net front
- 2-1-2 Overload: Overload one side with 4 players
- 1-2-2 Spread: Spread formation for quick puck movement

PENALTY KILL:
- Box Formation: 4 players in defensive box
- Diamond: 1 high, 2 middle, 1 low pressure
- Aggressive: 2 forecheckers, 2 back
`;

  private readonly ANALYSIS_CRITERIA = `
ANALYSIS SCORING CRITERIA (0-100 scale):

SPACING (25% weight):
- 90-100: Optimal 4-6ft spacing, no clustering, excellent zone coverage
- 75-89: Good spacing with minor clustering issues
- 60-74: Acceptable spacing but some crowding problems
- 40-59: Poor spacing with significant clustering
- 0-39: Dangerous clustering, ineffective positioning

TIMING (20% weight):
- 90-100: Perfect synchronization, seamless transitions
- 75-89: Good timing with minor coordination issues
- 60-74: Acceptable timing but some delays
- 40-59: Poor timing affecting play effectiveness
- 0-39: Significant timing problems disrupting flow

FORMATION (25% weight):
- 90-100: Textbook formation execution, excellent coverage
- 75-89: Good formation with minor structural issues
- 60-74: Acceptable formation but some weaknesses
- 40-59: Poor formation with exploitable gaps
- 0-39: Fundamentally flawed formation structure

EFFECTIVENESS (20% weight):
- Success probability, goal scoring chance, possession retention
- Based on situation, opponent strength, and execution quality

TACTICAL (10% weight):
- Adherence to hockey principles, creativity, adaptability
- Modern vs traditional approach effectiveness
`;

  private readonly OUTPUT_FORMAT = `
REQUIRED OUTPUT FORMAT:
Provide analysis in this exact structure:

## OVERALL ASSESSMENT
Overall Score: [0-100]
Confidence Level: [0-100]%

## DETAILED BREAKDOWN

### Spacing Analysis (Score: X/100)
- Average player spacing: X meters
- Clustering issues: [Yes/No with details]
- Zone coverage quality: [Assessment]
- Recommendations: [Bullet points]

### Timing Analysis (Score: X/100)
- Movement synchronization: X/100
- Sequence optimization: [Assessment]
- Phase transitions: [Quality assessment]
- Recommendations: [Bullet points]

### Formation Analysis (Score: X/100)
- Detected formation: [Formation name]
- Formation effectiveness: X/100
- Structural strengths: [List]
- Vulnerabilities: [List with severity]
- Alternative suggestions: [Better formations with scores]

### Effectiveness Analysis
- Success probability: X%
- Goal scoring chance: X%
- Possession retention: X%
- Counter-attack vulnerability: X%
- Energy efficiency: X%

### Tactical Analysis (Score: X/100)
- Play type: [Classification]
- Strategic adherence: X/100
- Creativity level: X/100
- Predictability: X/100 (lower better)
- Adaptability: X/100

## IMPROVEMENT SUGGESTIONS
Priority recommendations with implementation details:
1. [High priority suggestion with expected improvement %]
2. [Medium priority suggestion with expected improvement %]
3. [Low priority suggestion with expected improvement %]

## RISK ASSESSMENT
- Primary risks: [List with probability %]
- Mitigation strategies: [Specific actions]
- Affected zones: [Areas of concern]

## PATTERN RECOGNITION
- Similar plays: [References if known]
- Common mistakes: [Typical errors for this play type]
- Tactical trends: [Modern hockey considerations]
`;

  /**
   * Get system prompt for specific AI provider
   */
  getSystemPrompt(provider: 'openai' | 'claude' = 'openai'): string {
    const basePrompt = `You are an expert hockey tactical analyst with 20+ years of coaching experience at professional levels including NHL, KHL, and international competitions.

${this.HOCKEY_RULES}

${this.TACTICAL_SYSTEMS}

${this.ANALYSIS_CRITERIA}

Your analysis must be:
- Tactically sound and based on modern hockey principles
- Specific with actionable recommendations
- Risk-aware considering player safety
- Focused on practical implementation
- Scored numerically for objective comparison

${this.OUTPUT_FORMAT}`;

    if (provider === 'claude') {
      return `${basePrompt}

Focus on providing detailed, analytical responses that coaches can implement immediately. Consider both offensive and defensive implications of every tactical decision.`;
    }

    return `${basePrompt}

Always maintain professional coaching perspective and provide constructive feedback that helps teams improve their tactical execution.`;
  }

  /**
   * Generate analysis prompt for specific play and context
   */
  getAnalysisPrompt(
    play: TacticalPlay, 
    analysisType: string = 'detailed', 
    context?: AnalysisContext
  ): string {
    const playDescription = this.describePlay(play);
    const contextDescription = this.describeContext(context);
    const analysisTypeDetails = this.getAnalysisTypeDetails(analysisType);

    return `
TACTICAL PLAY ANALYSIS REQUEST

${analysisTypeDetails}

## PLAY DETAILS
${playDescription}

## GAME CONTEXT
${contextDescription}

## SPECIFIC ANALYSIS REQUIREMENTS

Based on the play details and context above, provide a comprehensive tactical analysis focusing on:

1. **Formation Assessment**: Evaluate the chosen formation's effectiveness for this situation
2. **Player Positioning**: Analyze spacing, support angles, and zone coverage
3. **Movement Timing**: Assess coordination and synchronization of player movements
4. **Tactical Soundness**: Evaluate adherence to fundamental hockey principles
5. **Situational Appropriateness**: Consider if the play fits the game context
6. **Risk vs Reward**: Balance offensive potential against defensive vulnerabilities
7. **Implementation Difficulty**: Consider realistic execution by players
8. **Opponent Counter-measures**: Anticipate how opponents might respond

## CONTEXT CONSIDERATIONS
- Game phase: ${context?.gamePhase || 'even-strength'}
- Zone: ${context?.situation || 'offensive-zone'}
- Score state: ${context?.scoreState || 'tied'}
- Time remaining: ${this.formatTime(context?.timeRemaining || 1200)}
- Player fatigue levels: ${this.describeFatigue(context?.playerTiredness)}

Provide your analysis in the exact format specified in the system prompt, with numerical scores and specific recommendations for improvement.
`.trim();
  }

  /**
   * Get comparative analysis prompt
   */
  getComparativePrompt(
    currentPlay: TacticalPlay,
    comparisonPlays: TacticalPlay[],
    context?: AnalysisContext
  ): string {
    return `
COMPARATIVE TACTICAL ANALYSIS

## PRIMARY PLAY
${this.describePlay(currentPlay)}

## COMPARISON PLAYS
${comparisonPlays.map((play, index) => 
  `### Alternative ${index + 1}:\n${this.describePlay(play)}`
).join('\n\n')}

## ANALYSIS REQUIREMENTS

Compare these tactical approaches and provide:

1. **Relative Effectiveness**: Score each play (0-100) for current situation
2. **Situational Fit**: Which play best matches the game context
3. **Risk Assessment**: Compare risk levels and potential downsides
4. **Implementation Complexity**: Rank by difficulty to execute
5. **Counter-Play Vulnerability**: Which is most/least predictable
6. **Recommendation**: Select best option with detailed justification

Focus on practical coaching decisions and provide clear reasoning for your recommendations.
`;
  }

  /**
   * Get opponent analysis prompt
   */
  getOpponentPerspectivePrompt(
    play: TacticalPlay,
    opponentStrengths: string[],
    context?: AnalysisContext
  ): string {
    return `
OPPONENT PERSPECTIVE ANALYSIS

## OUR TACTICAL PLAY
${this.describePlay(play)}

## OPPONENT CHARACTERISTICS
Strengths: ${opponentStrengths.join(', ')}
Context: ${this.describeContext(context)}

## ANALYSIS FROM OPPONENT'S VIEWPOINT

As the opposing coach, analyze this play and provide:

1. **Exploitation Opportunities**: How would you counter this play?
2. **Defensive Adjustments**: What changes would you make?
3. **Vulnerability Assessment**: Where is this play most vulnerable?
4. **Counter-Strategy**: Specific tactical responses
5. **Success Probability**: Likelihood of shutting down this play
6. **Recommendations**: How to improve the play against this opponent

Think like an opposing coach trying to neutralize this tactical approach.
`;
  }

  /**
   * Get learning/educational prompt
   */
  getLearningPrompt(
    play: TacticalPlay,
    playerLevel: 'youth' | 'junior' | 'senior' | 'professional' = 'senior'
  ): string {
    const levelDetails = {
      youth: 'Focus on fundamental concepts and simple execution',
      junior: 'Intermediate concepts with attention to development',
      senior: 'Advanced tactics with competitive considerations',
      professional: 'Elite-level analysis with fine tactical details'
    };

    return `
EDUCATIONAL TACTICAL ANALYSIS

## PLAYER LEVEL
${playerLevel.toUpperCase()}: ${levelDetails[playerLevel]}

## TACTICAL PLAY
${this.describePlay(play)}

## LEARNING OBJECTIVES

Provide educational analysis suitable for ${playerLevel} level players:

1. **Key Concepts**: Main tactical principles demonstrated
2. **Learning Points**: What players should understand
3. **Common Mistakes**: Typical errors and how to avoid them
4. **Progressive Development**: Steps to master this play
5. **Practice Drills**: Specific exercises to improve execution
6. **Visual Cues**: What players should look for during execution
7. **Decision Points**: Critical moments requiring player judgment

Make the analysis appropriate for the specified skill level while maintaining tactical accuracy.
`;
  }

  // Helper methods

  private describePlay(play: TacticalPlay): string {
    const formation = play.formation;
    const players = formation.players || [];
    const movements = play.movements || [];
    const objectives = play.objectives || [];

    return `
**Formation**: ${formation.name || 'Custom Formation'}
**Players**: ${players.length} players positioned as follows:
${players.map(p => `  - ${p.role} at coordinates (${p.position.x}, ${p.position.y})`).join('\n')}

**Movements**: ${movements.length} coordinated movements:
${movements.map((m, i) => `  ${i + 1}. Player ${m.playerId}: ${m.type} (${m.startTime}s - ${m.endTime}s)`).join('\n')}

**Objectives**: 
${objectives.map(obj => `  - ${obj}`).join('\n')}

**Play Complexity**: ${this.assessComplexity(play)}
**Estimated Duration**: ${this.estimatePlayDuration(play)} seconds
`.trim();
  }

  private describeContext(context?: AnalysisContext): string {
    if (!context) {
      return `
**Game Phase**: Even strength (5v5)
**Situation**: General play
**Time Remaining**: Full period
**Score State**: Tied game
**Player Condition**: Normal energy levels
`.trim();
    }

    return `
**Game Phase**: ${context.gamePhase}
**Zone/Situation**: ${context.situation}
**Time Remaining**: ${this.formatTime(context.timeRemaining)}
**Score State**: ${context.scoreState}
**Player Fatigue**: ${this.describeFatigue(context.playerTiredness)}
`.trim();
  }

  private getAnalysisTypeDetails(analysisType: string): string {
    const types: { [key: string]: string } = {
      quick: `## QUICK ANALYSIS
Focus on immediate tactical assessment with core recommendations. Prioritize spacing, timing, and obvious improvements. Target completion in 5-10 seconds.`,
      
      detailed: `## DETAILED ANALYSIS
Comprehensive tactical evaluation including all aspects: formation, spacing, timing, effectiveness, risks, and detailed recommendations. Consider both offensive and defensive implications.`,
      
      comparative: `## COMPARATIVE ANALYSIS
Compare this play against alternative tactical approaches, historical data, and situational effectiveness. Focus on relative strengths and weaknesses.`,
      
      'opponent-perspective': `## OPPONENT PERSPECTIVE ANALYSIS
Analyze from the opposing team's viewpoint. How would they counter this play? What vulnerabilities can they exploit? Focus on defensive responses.`,
      
      learning: `## EDUCATIONAL ANALYSIS
Provide analysis suitable for player development and learning. Focus on teachable moments, common mistakes, and progressive skill building.`
    };

    return types[analysisType] || types['detailed'];
  }

  private assessComplexity(play: TacticalPlay): string {
    const movements = play.movements?.length || 0;
    const players = play.formation.players?.length || 0;
    const objectives = play.objectives?.length || 0;

    const complexity = movements + (players * 0.5) + (objectives * 0.3);

    if (complexity < 5) return 'Simple';
    if (complexity < 10) return 'Moderate';
    if (complexity < 15) return 'Complex';
    return 'Advanced';
  }

  private estimatePlayDuration(play: TacticalPlay): number {
    const movements = play.movements || [];
    if (movements.length === 0) return 5;

    const lastMovement = movements[movements.length - 1];
    return lastMovement.endTime || (movements.length * 2);
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private describeFatigue(playerTiredness?: { [playerId: string]: number }): string {
    if (!playerTiredness || Object.keys(playerTiredness).length === 0) {
      return 'Normal energy levels';
    }

    const fatigueValues = Object.values(playerTiredness);
    const avgFatigue = fatigueValues.reduce((sum, val) => sum + val, 0) / fatigueValues.length;

    if (avgFatigue < 30) return 'Fresh players, high energy';
    if (avgFatigue < 50) return 'Moderate energy levels';
    if (avgFatigue < 70) return 'Some fatigue, reduced intensity';
    return 'High fatigue, limited complex plays';
  }

  /**
   * Get prompt for specific hockey situations
   */
  getSituationalPrompt(situation: string, play: TacticalPlay, context?: AnalysisContext): string {
    const situationPrompts: { [key: string]: string } = {
      'power-play': `
## POWER PLAY ANALYSIS
Special focus on:
- Player advantage exploitation (5v4 or 5v3)
- Puck movement and spacing optimization
- Shooting lane creation and net-front presence
- Penalty kill counter-measures
- Clock management and possession maintenance`,

      'penalty-kill': `
## PENALTY KILL ANALYSIS  
Special focus on:
- Defensive structure and gap control
- Aggressive vs passive pressure decisions
- Clear and exit strategies
- Goalie support and screening prevention
- Counter-attack opportunities`,

      'even-strength': `
## EVEN STRENGTH ANALYSIS
Standard 5v5 tactical evaluation focusing on:
- Balanced offensive/defensive principles
- Transition game effectiveness
- Zone control and possession
- Support and coverage responsibilities`,

      'empty-net': `
## EMPTY NET SITUATION
Critical analysis for:
- 6v5 formation optimization
- Defensive pressure and time management
- Shot blocking and passing lanes
- Risk vs reward assessment
- Goalie pull timing considerations`,

      'overtime': `
## OVERTIME ANALYSIS
3v3 specific considerations:
- Open ice exploitation
- Speed and space advantages
- Change timing and fatigue management
- Defensive responsibility balance
- Quick strike opportunities`
    };

    const basePrompt = situationPrompts[situation] || situationPrompts['even-strength'];
    
    return `${basePrompt}

## PLAY TO ANALYZE
${this.describePlay(play)}

## CONTEXT
${this.describeContext(context)}

Provide situation-specific tactical analysis with emphasis on the special circumstances and requirements of this game situation.`;
  }

  /**
   * Get template for specific analysis focus
   */
  getFocusedAnalysisPrompt(
    focus: 'offensive' | 'defensive' | 'transition' | 'neutral-zone',
    play: TacticalPlay,
    context?: AnalysisContext
  ): string {
    const focusDescriptions = {
      offensive: 'Analyze from attacking perspective: goal scoring chances, pressure creation, possession maintenance',
      defensive: 'Analyze from defending perspective: coverage, pressure, transition defense, risk mitigation',
      transition: 'Focus on transition game: speed of play, support positioning, momentum shifts',
      'neutral-zone': 'Neutral zone specific: forechecking, backchecking, zone entries/exits, puck battles'
    };

    return `
## ${focus.toUpperCase().replace('-', ' ')} FOCUSED ANALYSIS

**Analysis Focus**: ${focusDescriptions[focus]}

## TACTICAL PLAY
${this.describePlay(play)}

## CONTEXT  
${this.describeContext(context)}

Provide analysis specifically focused on ${focus} aspects of this tactical play. Consider how this play supports or hinders the ${focus} game objectives.`;
  }
}

// Export singleton instance and convenience functions
export const tacticalPrompts = new TacticalPrompts();

export function getTacticalPrompts(): TacticalPrompts {
  return tacticalPrompts;
}

export default TacticalPrompts;