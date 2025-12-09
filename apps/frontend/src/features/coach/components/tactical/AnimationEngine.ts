/**
 * AnimationEngine - Advanced animation system for tactical play visualization
 * 
 * This utility handles all animation logic for ice hockey tactical features including:
 * - Timeline management with precise playback control
 * - Keyframe interpolation for smooth player/puck movements
 * - Performance-optimized rendering loop
 * - Event-driven state management
 * 
 * @module AnimationEngine
 * @version 1.0.0
 */

import { EventEmitter } from 'events';

/**
 * Represents a single animation keyframe with timestamp and state data
 */
export interface AnimationKeyframe {
  /** Timestamp in milliseconds from animation start */
  timestamp: number;
  /** Player positions at this keyframe */
  players: Record<string, {
    x: number;
    y: number;
    rotation: number;
    speed?: number;
    action?: 'skating' | 'shooting' | 'passing' | 'checking' | 'goalkeeping';
  }>;
  /** Puck position and state */
  puck: {
    x: number;
    y: number;
    velocity?: { x: number; y: number };
    possessor?: string; // player ID who has possession
  };
  /** Optional annotations or highlights */
  annotations?: Array<{
    type: 'arrow' | 'circle' | 'text' | 'highlight';
    data: any;
  }>;
}

/**
 * Defines a complete tactical play with animation keyframes
 */
export interface PlayAction {
  /** Unique identifier for this play */
  id: string;
  /** Human-readable name */
  name: string;
  /** Play description */
  description?: string;
  /** Duration in milliseconds */
  duration: number;
  /** Array of keyframes defining the animation */
  keyframes: AnimationKeyframe[];
  /** Metadata about the play */
  metadata?: {
    category?: 'power-play' | 'penalty-kill' | '5v5' | 'breakout' | 'forecheck';
    difficulty?: 'basic' | 'intermediate' | 'advanced';
    tags?: string[];
  };
}

/**
 * Enhanced play system with animation capabilities
 */
export interface AnimatedPlaySystem {
  /** Base play information */
  play: PlayAction;
  /** Current animation state */
  animationState: {
    isPlaying: boolean;
    isPaused: boolean;
    currentTime: number;
    playbackSpeed: number;
    loop: boolean;
  };
  /** Cached interpolated frames for performance */
  frameCache?: Map<number, AnimationKeyframe>;
}

/**
 * Animation playback states
 */
export enum AnimationState {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused',
  LOADING = 'loading',
  ERROR = 'error'
}

/**
 * Event types emitted by the animation engine
 */
export enum AnimationEvent {
  STATE_CHANGE = 'stateChange',
  TIME_UPDATE = 'timeUpdate',
  PLAY_START = 'playStart',
  PLAY_END = 'playEnd',
  KEYFRAME_HIT = 'keyframeHit',
  SPEED_CHANGE = 'speedChange',
  SEEK = 'seek',
  ERROR = 'error'
}

/**
 * Configuration options for the animation engine
 */
export interface AnimationEngineConfig {
  /** Target frames per second (default: 60) */
  fps?: number;
  /** Enable frame caching for better performance (default: true) */
  enableCaching?: boolean;
  /** Maximum cached frames (default: 1000) */
  maxCacheSize?: number;
  /** Interpolation method (default: 'cubic') */
  interpolationMethod?: 'linear' | 'cubic' | 'hermite';
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Advanced Animation Engine for Ice Hockey Tactical Plays
 * 
 * Provides smooth, high-performance animation of tactical plays with precise
 * timeline control, keyframe interpolation, and event-driven state management.
 * 
 * @example
 * ```typescript
 * const engine = new AnimationEngine({
 *   fps: 60,
 *   enableCaching: true
 * });
 * 
 * engine.loadPlay(tacticalPlay);
 * engine.on(AnimationEvent.TIME_UPDATE, (time) => {
 *   const frame = engine.getCurrentFrame();
 *   updateVisualization(frame);
 * });
 * 
 * engine.play();
 * ```
 */
export class AnimationEngine extends EventEmitter {
  private config: Required<AnimationEngineConfig>;
  private playSystem: AnimatedPlaySystem | null = null;
  private animationState: AnimationState = AnimationState.STOPPED;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private targetFrameTime: number;

  // Performance tracking
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  /**
   * Creates a new AnimationEngine instance
   * @param config Configuration options
   */
  constructor(config: AnimationEngineConfig = {}) {
    super();

    this.config = {
      fps: config.fps || 60,
      enableCaching: config.enableCaching !== false,
      maxCacheSize: config.maxCacheSize || 1000,
      interpolationMethod: config.interpolationMethod || 'cubic',
      debug: config.debug || false
    };

    this.targetFrameTime = 1000 / this.config.fps;
    
    if (this.config.debug) {
      console.log('[AnimationEngine] Initialized with config:', this.config);
    }
  }

  /**
   * Loads a tactical play for animation
   * @param play The play action to animate
   */
  public loadPlay(play: PlayAction): void {
    this.stop(); // Stop any current animation

    // Validate keyframes
    if (!play.keyframes || play.keyframes.length < 2) {
      this.handleError('Play must have at least 2 keyframes');
      return;
    }

    // Sort keyframes by timestamp
    const sortedKeyframes = [...play.keyframes].sort((a, b) => a.timestamp - b.timestamp);

    this.playSystem = {
      play: {
        ...play,
        keyframes: sortedKeyframes
      },
      animationState: {
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        playbackSpeed: 1,
        loop: false
      },
      frameCache: this.config.enableCaching ? new Map() : undefined
    };

    this.animationState = AnimationState.STOPPED;
    this.emit(AnimationEvent.STATE_CHANGE, this.animationState);

    if (this.config.debug) {
      console.log('[AnimationEngine] Loaded play:', play.name);
    }
  }

  /**
   * Starts or resumes animation playback
   */
  public play(): void {
    if (!this.playSystem) {
      console.warn('[AnimationEngine] No play loaded - cannot start playback');
      return;
    }

    if (this.animationState === AnimationState.PLAYING) {
      return; // Already playing
    }

    this.playSystem.animationState.isPlaying = true;
    this.playSystem.animationState.isPaused = false;
    this.animationState = AnimationState.PLAYING;

    this.startAnimationLoop();
    this.emit(AnimationEvent.STATE_CHANGE, this.animationState);
    this.emit(AnimationEvent.PLAY_START);

    if (this.config.debug) {
      console.log('[AnimationEngine] Started playback');
    }
  }

  /**
   * Pauses animation playback
   */
  public pause(): void {
    if (!this.playSystem || this.animationState !== AnimationState.PLAYING) {
      return;
    }

    this.playSystem.animationState.isPlaying = false;
    this.playSystem.animationState.isPaused = true;
    this.animationState = AnimationState.PAUSED;

    this.stopAnimationLoop();
    this.emit(AnimationEvent.STATE_CHANGE, this.animationState);

    if (this.config.debug) {
      console.log('[AnimationEngine] Paused playback');
    }
  }

  /**
   * Stops animation playback and resets to beginning
   */
  public stop(): void {
    if (!this.playSystem) {
      return;
    }

    this.playSystem.animationState.isPlaying = false;
    this.playSystem.animationState.isPaused = false;
    this.playSystem.animationState.currentTime = 0;
    this.animationState = AnimationState.STOPPED;

    this.stopAnimationLoop();
    this.emit(AnimationEvent.STATE_CHANGE, this.animationState);
    this.emit(AnimationEvent.PLAY_END);

    if (this.config.debug) {
      console.log('[AnimationEngine] Stopped playback');
    }
  }

  /**
   * Resets animation to the beginning without stopping
   */
  public reset(): void {
    if (!this.playSystem) {
      return;
    }

    const wasPlaying = this.playSystem.animationState.isPlaying;
    this.seekTo(0);

    if (wasPlaying) {
      this.play();
    }

    if (this.config.debug) {
      console.log('[AnimationEngine] Reset to beginning');
    }
  }

  /**
   * Seeks to a specific timestamp in the animation
   * @param timestamp Target timestamp in milliseconds
   */
  public seekTo(timestamp: number): void {
    if (!this.playSystem) {
      return;
    }

    const clampedTime = Math.max(0, Math.min(timestamp, this.playSystem.play.duration));
    this.playSystem.animationState.currentTime = clampedTime;

    this.emit(AnimationEvent.SEEK, clampedTime);
    this.emit(AnimationEvent.TIME_UPDATE, clampedTime);

    if (this.config.debug) {
      console.log('[AnimationEngine] Seeked to:', clampedTime);
    }
  }

  /**
   * Sets the playback speed multiplier
   * @param multiplier Speed multiplier (1.0 = normal speed)
   */
  public setSpeed(multiplier: number): void {
    if (!this.playSystem) {
      return;
    }

    const clampedSpeed = Math.max(0.1, Math.min(multiplier, 4.0));
    this.playSystem.animationState.playbackSpeed = clampedSpeed;

    this.emit(AnimationEvent.SPEED_CHANGE, clampedSpeed);

    if (this.config.debug) {
      console.log('[AnimationEngine] Speed changed to:', clampedSpeed);
    }
  }

  /**
   * Enables or disables looping
   * @param enabled Whether to loop the animation
   */
  public setLoop(enabled: boolean): void {
    if (!this.playSystem) {
      return;
    }

    this.playSystem.animationState.loop = enabled;

    if (this.config.debug) {
      console.log('[AnimationEngine] Loop', enabled ? 'enabled' : 'disabled');
    }
  }

  /**
   * Gets the current interpolated animation frame
   * @returns Current frame data or null if no play loaded
   */
  public getCurrentFrame(): AnimationKeyframe | null {
    if (!this.playSystem) {
      return null;
    }

    const currentTime = this.playSystem.animationState.currentTime;
    return this.getFrameAtTime(currentTime);
  }

  /**
   * Gets the animation progress as a percentage (0-1)
   * @returns Progress value between 0 and 1
   */
  public getProgress(): number {
    if (!this.playSystem) {
      return 0;
    }

    return this.playSystem.animationState.currentTime / this.playSystem.play.duration;
  }

  /**
   * Gets the current animation state
   * @returns Current animation state
   */
  public getState(): AnimationState {
    return this.animationState;
  }

  /**
   * Gets the current playback time
   * @returns Current time in milliseconds
   */
  public getCurrentTime(): number {
    return this.playSystem?.animationState.currentTime || 0;
  }

  /**
   * Gets the total duration of the loaded play
   * @returns Duration in milliseconds or 0 if no play loaded
   */
  public getDuration(): number {
    return this.playSystem?.play.duration || 0;
  }

  /**
   * Gets the current playback speed
   * @returns Speed multiplier
   */
  public getSpeed(): number {
    return this.playSystem?.animationState.playbackSpeed || 1;
  }

  /**
   * Gets the current FPS performance metric
   * @returns Current frames per second
   */
  public getCurrentFps(): number {
    return this.currentFps;
  }

  /**
   * Clears the frame cache to free memory
   */
  public clearCache(): void {
    if (this.playSystem?.frameCache) {
      this.playSystem.frameCache.clear();
      
      if (this.config.debug) {
        console.log('[AnimationEngine] Cache cleared');
      }
    }
  }

  /**
   * Destroys the animation engine and cleans up resources
   */
  public destroy(): void {
    this.stop();
    this.clearCache();
    this.removeAllListeners();
    this.playSystem = null;

    if (this.config.debug) {
      console.log('[AnimationEngine] Destroyed');
    }
  }

  // Private methods

  /**
   * Starts the requestAnimationFrame loop
   */
  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }

    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.animationLoop.bind(this));
  }

  /**
   * Stops the requestAnimationFrame loop
   */
  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main animation loop
   */
  private animationLoop(timestamp: number): void {
    if (!this.playSystem || !this.playSystem.animationState.isPlaying) {
      this.animationFrameId = null;
      return;
    }

    const deltaTime = timestamp - this.lastFrameTime;
    
    // Frame rate limiting
    if (deltaTime >= this.targetFrameTime) {
      this.updateAnimation(deltaTime);
      this.updateFpsCounter(timestamp);
      this.lastFrameTime = timestamp;
    }

    this.animationFrameId = requestAnimationFrame(this.animationLoop.bind(this));
  }

  /**
   * Updates animation state and emits events
   */
  private updateAnimation(deltaTime: number): void {
    if (!this.playSystem) {
      return;
    }

    const timeStep = deltaTime * this.playSystem.animationState.playbackSpeed;
    let newTime = this.playSystem.animationState.currentTime + timeStep;

    // Handle end of animation
    if (newTime >= this.playSystem.play.duration) {
      if (this.playSystem.animationState.loop) {
        newTime = 0; // Loop back to start
      } else {
        newTime = this.playSystem.play.duration;
        this.stop(); // Stop at end
        return;
      }
    }

    this.playSystem.animationState.currentTime = newTime;
    this.emit(AnimationEvent.TIME_UPDATE, newTime);

    // Check for keyframe hits
    this.checkKeyframeHits(newTime, timeStep);
  }

  /**
   * Checks if any keyframes were hit during this update
   */
  private checkKeyframeHits(currentTime: number, timeStep: number): void {
    if (!this.playSystem) {
      return;
    }

    const previousTime = currentTime - timeStep;
    
    for (const keyframe of this.playSystem.play.keyframes) {
      if (keyframe.timestamp > previousTime && keyframe.timestamp <= currentTime) {
        this.emit(AnimationEvent.KEYFRAME_HIT, keyframe);
      }
    }
  }

  /**
   * Updates FPS counter for performance monitoring
   */
  private updateFpsCounter(timestamp: number): void {
    this.frameCount++;
    
    if (timestamp - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;
    }
  }

  /**
   * Gets an interpolated frame at a specific time
   */
  private getFrameAtTime(time: number): AnimationKeyframe | null {
    if (!this.playSystem) {
      return null;
    }

    // Check cache first
    const cacheKey = Math.round(time);
    if (this.playSystem.frameCache?.has(cacheKey)) {
      return this.playSystem.frameCache.get(cacheKey)!;
    }

    const keyframes = this.playSystem.play.keyframes;
    
    // Find surrounding keyframes
    let beforeFrame: AnimationKeyframe | null = null;
    let afterFrame: AnimationKeyframe | null = null;

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].timestamp && time <= keyframes[i + 1].timestamp) {
        beforeFrame = keyframes[i];
        afterFrame = keyframes[i + 1];
        break;
      }
    }

    // Handle edge cases
    if (!beforeFrame && !afterFrame) {
      if (time <= keyframes[0].timestamp) {
        return keyframes[0];
      } else {
        return keyframes[keyframes.length - 1];
      }
    }

    if (!afterFrame) {
      return beforeFrame!;
    }

    // Interpolate between keyframes
    const interpolatedFrame = this.interpolateKeyframes(beforeFrame!, afterFrame, time);

    // Cache the result
    if (this.playSystem.frameCache && this.playSystem.frameCache.size < this.config.maxCacheSize) {
      this.playSystem.frameCache.set(cacheKey, interpolatedFrame);
    }

    return interpolatedFrame;
  }

  /**
   * Interpolates between two keyframes
   */
  private interpolateKeyframes(
    before: AnimationKeyframe,
    after: AnimationKeyframe,
    time: number
  ): AnimationKeyframe {
    const totalDuration = after.timestamp - before.timestamp;
    const elapsed = time - before.timestamp;
    const t = totalDuration > 0 ? elapsed / totalDuration : 0;

    // Interpolate player positions
    const interpolatedPlayers: Record<string, any> = {};
    
    // Get all unique player IDs from both frames
    const allPlayerIds = new Set([
      ...Object.keys(before.players),
      ...Object.keys(after.players)
    ]);
    
    for (const playerId of allPlayerIds) {
      const beforePlayer = before.players[playerId];
      const afterPlayer = after.players[playerId];
      
      if (beforePlayer && afterPlayer) {
        // Player exists in both frames - interpolate
        interpolatedPlayers[playerId] = {
          x: this.interpolateValue(beforePlayer.x, afterPlayer.x, t),
          y: this.interpolateValue(beforePlayer.y, afterPlayer.y, t),
          rotation: this.interpolateAngle(
            beforePlayer.rotation || 0,
            afterPlayer.rotation || 0,
            t
          ),
          speed: beforePlayer.speed,
          action: beforePlayer.action,
          team: beforePlayer.team || afterPlayer.team,
          // Preserve puck possession and shooting flags (use current frame's values)
          hasPuck: t < 0.5 ? (beforePlayer.hasPuck || false) : (afterPlayer.hasPuck || false),
          isShooter: t < 0.5 ? (beforePlayer.isShooter || false) : (afterPlayer.isShooter || false)
        };
      } else if (beforePlayer && !afterPlayer) {
        // Player exists in before but not after - preserve all properties
        interpolatedPlayers[playerId] = { 
          ...beforePlayer,
          hasPuck: beforePlayer.hasPuck || false,
          isShooter: beforePlayer.isShooter || false
        };
      } else if (!beforePlayer && afterPlayer) {
        // Player exists in after but not before - use after values
        interpolatedPlayers[playerId] = { 
          ...afterPlayer,
          hasPuck: afterPlayer.hasPuck || false,
          isShooter: afterPlayer.isShooter || false
        };
      }
    }

    // Interpolate puck position
    const interpolatedPuck = {
      x: this.interpolateValue(before.puck.x, after.puck.x, t),
      y: this.interpolateValue(before.puck.y, after.puck.y, t),
      velocity: after.puck.velocity,
      possessor: after.puck.possessor
    };

    return {
      timestamp: time,
      players: interpolatedPlayers,
      puck: interpolatedPuck,
      annotations: after.annotations || before.annotations
    };
  }

  /**
   * Interpolates between two numeric values
   */
  private interpolateValue(start: number, end: number, t: number): number {
    switch (this.config.interpolationMethod) {
      case 'linear':
        return start + (end - start) * t;
      
      case 'cubic':
        // Cubic easing for smoother motion
        const easedT = t * t * (3 - 2 * t);
        return start + (end - start) * easedT;
      
      case 'hermite':
        // Hermite interpolation for very smooth curves
        const t2 = t * t;
        const t3 = t2 * t;
        const h1 = 2 * t3 - 3 * t2 + 1;
        const h2 = -2 * t3 + 3 * t2;
        return start * h1 + end * h2;
      
      default:
        return start + (end - start) * t;
    }
  }

  /**
   * Interpolates between two angles (handling wraparound)
   */
  private interpolateAngle(start: number, end: number, t: number): number {
    // Normalize angles to [0, 2π]
    const normalizeAngle = (angle: number) => {
      while (angle < 0) angle += 2 * Math.PI;
      while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
      return angle;
    };

    start = normalizeAngle(start);
    end = normalizeAngle(end);

    // Find shortest path
    let diff = end - start;
    if (Math.abs(diff) > Math.PI) {
      if (diff > 0) {
        diff -= 2 * Math.PI;
      } else {
        diff += 2 * Math.PI;
      }
    }

    return normalizeAngle(start + diff * t);
  }

  /**
   * Handles errors and emits error events
   */
  private handleError(message: string): void {
    this.animationState = AnimationState.ERROR;
    this.emit(AnimationEvent.ERROR, new Error(message));
    
    if (this.config.debug) {
      console.error('[AnimationEngine] Error:', message);
    }
  }
}

/**
 * Utility function to create a basic play from positions
 * @param positions Array of position snapshots
 * @param duration Total animation duration
 * @returns PlayAction ready for animation
 */
export function createPlayFromPositions(
  positions: Array<{
    timestamp: number;
    players: Record<string, { x: number; y: number; rotation?: number }>;
    puck: { x: number; y: number; possessor?: string };
  }>,
  duration: number,
  metadata?: { name: string; description?: string; category?: string }
): PlayAction {
  const keyframes: AnimationKeyframe[] = positions.map(pos => ({
    timestamp: pos.timestamp,
    players: Object.entries(pos.players).reduce((acc, [id, player]) => {
      acc[id] = {
        x: player.x,
        y: player.y,
        rotation: player.rotation || 0,
        action: 'skating' as const
      };
      return acc;
    }, {} as Record<string, any>),
    puck: {
      x: pos.puck.x,
      y: pos.puck.y,
      possessor: pos.puck.possessor
    }
  }));

  return {
    id: `play-${Date.now()}`,
    name: metadata?.name || 'Unnamed Play',
    description: metadata?.description,
    duration,
    keyframes,
    metadata: {
      category: metadata?.category as any,
      difficulty: 'basic',
      tags: []
    }
  };
}

export default AnimationEngine;