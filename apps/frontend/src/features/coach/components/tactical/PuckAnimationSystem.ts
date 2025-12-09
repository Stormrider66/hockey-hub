/**
 * Puck Animation System - Handles puck movement and pass visualization
 * 
 * Features:
 * - Animated pass lines between players
 * - Puck trajectory visualization
 * - Pass timing and sequencing
 * - Visual feedback for puck possession
 */

import * as PIXI from 'pixi.js';

export interface PassLine {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  startTime: number;  // When the pass starts (ms)
  endTime: number;    // When the pass completes (ms)
  type: 'pass' | 'shot' | 'dump' | 'clear';
  style?: {
    color?: number;
    thickness?: number;
    alpha?: number;
    dashed?: boolean;
    curved?: boolean;  // For saucer passes
  };
}

export interface PuckPosition {
  x: number;
  y: number;
  time: number;
  possessorId?: string;
  velocity?: { x: number; y: number };
}

export interface PuckAnimationFrame {
  timestamp: number;
  puckPosition: PuckPosition;
  activePass?: PassLine;
  passLines: PassLine[];  // All passes up to this point
}

export class PuckAnimationSystem {
  private container: PIXI.Container;
  private passLinesContainer: PIXI.Container;
  private puckSprite: PIXI.Graphics;
  private passLines: Map<string, PIXI.Graphics>;
  private currentTime: number = 0;
  private animationData: PuckAnimationFrame[] = [];
  
  constructor() {
    this.container = new PIXI.Container();
    this.container.name = 'PuckAnimationContainer';
    
    this.passLinesContainer = new PIXI.Container();
    this.passLinesContainer.name = 'PassLinesContainer';
    this.container.addChild(this.passLinesContainer);
    
    // Create puck sprite with proper initialization
    this.puckSprite = new PIXI.Graphics();
    this.puckSprite.x = 400;  // Set initial position
    this.puckSprite.y = 200;
    this.drawPuck();
    this.container.addChild(this.puckSprite);
    
    this.passLines = new Map();
  }
  
  private drawPuck(): void {
    this.puckSprite.clear();
    this.puckSprite.beginFill(0x000000);  // Black puck
    this.puckSprite.drawCircle(0, 0, 4);
    this.puckSprite.endFill();
    
    // Add white highlight for visibility
    this.puckSprite.beginFill(0xffffff, 0.3);
    this.puckSprite.drawCircle(-1, -1, 2);
    this.puckSprite.endFill();
  }
  
  /**
   * Draw a pass line between two points
   */
  public drawPassLine(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    progress: number = 1,  // 0-1, for animated drawing
    style?: PassLine['style']
  ): PIXI.Graphics {
    const line = new PIXI.Graphics();
    
    const color = style?.color ?? 0x333333;  // Dark gray default
    const thickness = style?.thickness ?? 2;
    const alpha = style?.alpha ?? 0.8;
    const dashed = style?.dashed ?? false;
    const curved = style?.curved ?? false;
    
    line.lineStyle(thickness, color, alpha);
    
    // Calculate the line based on progress
    const endX = fromX + (toX - fromX) * progress;
    const endY = fromY + (toY - fromY) * progress;
    
    if (curved) {
      // Create a curved path for saucer passes
      const controlX = (fromX + toX) / 2;
      const controlY = Math.min(fromY, toY) - 30;  // Arc above the line
      
      line.moveTo(fromX, fromY);
      line.bezierCurveTo(
        controlX, controlY,
        controlX, controlY,
        endX, endY
      );
    } else if (dashed) {
      // Create dashed line
      const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
      const dashLength = 10;
      const gapLength = 5;
      const totalLength = dashLength + gapLength;
      const dashes = Math.floor(distance / totalLength);
      
      for (let i = 0; i < dashes * progress; i++) {
        const startRatio = (i * totalLength) / distance;
        const endRatio = Math.min((i * totalLength + dashLength) / distance, progress);
        
        line.moveTo(
          fromX + (toX - fromX) * startRatio,
          fromY + (toY - fromY) * startRatio
        );
        line.lineTo(
          fromX + (toX - fromX) * endRatio,
          fromY + (toY - fromY) * endRatio
        );
      }
    } else {
      // Simple straight line
      line.moveTo(fromX, fromY);
      line.lineTo(endX, endY);
    }
    
    // Add arrowhead at the end if pass is complete
    if (progress >= 1) {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowLength = 12;
      const arrowAngle = Math.PI / 6;  // 30 degrees
      
      line.moveTo(toX, toY);
      line.lineTo(
        toX - arrowLength * Math.cos(angle - arrowAngle),
        toY - arrowLength * Math.sin(angle - arrowAngle)
      );
      line.moveTo(toX, toY);
      line.lineTo(
        toX - arrowLength * Math.cos(angle + arrowAngle),
        toY - arrowLength * Math.sin(angle + arrowAngle)
      );
    }
    
    return line;
  }
  
  /**
   * Update animation based on current time
   */
  public update(
    currentTime: number,
    playerPositions: Map<string, { x: number; y: number }>,
    isPlaying: boolean = false
  ): void {
    this.currentTime = currentTime;
    
    // Removed debug logging - trail drawing is now working
    
    // Clear old pass lines
    this.passLines.forEach(line => {
      this.passLinesContainer.removeChild(line);
    });
    this.passLines.clear();
    
    // Find current frame
    const currentFrame = this.findCurrentFrame(currentTime);
    if (!currentFrame) {
      if (isPlaying && currentTime > 0) {
        console.log('[PuckAnimationSystem] No frame found for time:', currentTime);
      }
      return;
    }
    
    // Draw trail when playing (not in template preview mode)
    if (isPlaying && this.animationData.length > 0) {
      const trailLine = new PIXI.Graphics();
      
      // Collect ALL puck positions from animation data up to current time
      const positions: { x: number; y: number; time: number }[] = [];
      
      // Always add the starting position
      if (this.animationData[0] && this.animationData[0].puckPosition) {
        positions.push({
          x: this.animationData[0].puckPosition.x,
          y: this.animationData[0].puckPosition.y,
          time: 0
        });
      }
      
      // Add intermediate positions
      for (let i = 0; i < this.animationData.length; i++) {
        const frame = this.animationData[i];
        if (frame.timestamp > currentTime) break;
        
        const pos = frame.puckPosition;
        // Only add if position changed significantly
        const lastPos = positions[positions.length - 1];
        if (!lastPos || 
            Math.abs(pos.x - lastPos.x) > 10 ||
            Math.abs(pos.y - lastPos.y) > 10) {
          positions.push({ x: pos.x, y: pos.y, time: frame.timestamp });
        }
      }
      
      // Add current position
      if (currentFrame.puckPosition) {
        positions.push({
          x: currentFrame.puckPosition.x,
          y: currentFrame.puckPosition.y,
          time: currentTime
        });
      }
      
      // Draw the complete trail as connected segments
      if (positions.length > 1) {
        for (let i = 1; i < positions.length; i++) {
          const from = positions[i - 1];
          const to = positions[i];
          
          // Determine color based on position (yellow near goal, red for passes)
          const distanceToGoal = Math.abs(to.x - 280);
          const isShot = distanceToGoal < 60 && i === positions.length - 1 && currentTime > 3000;
          
          // Use consistent colors: gray for passes, yellow for shots
          trailLine.lineStyle(4, isShot ? 0xFFFF00 : 0x888888, 0.9);
          trailLine.moveTo(from.x, from.y);
          trailLine.lineTo(to.x, to.y);
          
          // Add arrow at the last segment
          if (i === positions.length - 1) {
            const angle = Math.atan2(to.y - from.y, to.x - from.x);
            const arrowLength = 12;
            const arrowAngle = Math.PI / 6;
            
            trailLine.moveTo(to.x, to.y);
            trailLine.lineTo(
              to.x - arrowLength * Math.cos(angle - arrowAngle),
              to.y - arrowLength * Math.sin(angle - arrowAngle)
            );
            trailLine.moveTo(to.x, to.y);
            trailLine.lineTo(
              to.x - arrowLength * Math.cos(angle + arrowAngle),
              to.y - arrowLength * Math.sin(angle + arrowAngle)
            );
          }
        }
        
        this.passLinesContainer.addChild(trailLine);
        this.passLines.set('trail', trailLine);
      }
    }
    
    // Update puck position
    if (currentFrame.puckPosition) {
      this.puckSprite.x = currentFrame.puckPosition.x;
      this.puckSprite.y = currentFrame.puckPosition.y;
      
      // Always show the puck
      this.puckSprite.visible = true;
      
      // If there's an active pass, animate the puck along the pass line
      if (currentFrame.activePass) {
        const fromPlayer = playerPositions.get(currentFrame.activePass.fromPlayerId);
        const toPlayer = playerPositions.get(currentFrame.activePass.toPlayerId);
        
        if (fromPlayer && toPlayer) {
          const progress = (currentTime - currentFrame.activePass.startTime) / 
                          (currentFrame.activePass.endTime - currentFrame.activePass.startTime);
          
          if (progress >= 0 && progress <= 1) {
            // Animate puck along the pass line
            this.puckSprite.visible = true;
            this.puckSprite.x = fromPlayer.x + (toPlayer.x - fromPlayer.x) * progress;
            this.puckSprite.y = fromPlayer.y + (toPlayer.y - fromPlayer.y) * progress;
            
            // Add motion blur effect
            this.puckSprite.alpha = 0.8 + 0.2 * Math.sin(progress * Math.PI);
          }
        }
      }
    }
  }
  
  /**
   * Set animation data for the puck system
   */
  public setAnimationData(frames: PuckAnimationFrame[]): void {
    this.animationData = frames;
    console.log('[PuckAnimationSystem] Animation data set with', frames.length, 'frames');
    if (frames.length > 0) {
      console.log('[PuckAnimationSystem] First frame:', frames[0]);
      console.log('[PuckAnimationSystem] Last frame:', frames[frames.length - 1]);
      const passCount = frames.reduce((count, f) => count + f.passLines.length, 0);
      console.log('[PuckAnimationSystem] Total pass lines across all frames:', passCount);
      
      // Find frames with pass lines
      const framesWithPasses = frames.filter(f => f.passLines && f.passLines.length > 0);
      console.log('[PuckAnimationSystem] Frames with pass lines:', framesWithPasses.length);
      if (framesWithPasses.length > 0) {
        console.log('[PuckAnimationSystem] First frame with passes:', framesWithPasses[0]);
      }
    }
  }
  
  /**
   * Find the current frame based on timestamp
   */
  private findCurrentFrame(timestamp: number): PuckAnimationFrame | null {
    if (this.animationData.length === 0) return null;
    
    // Find the frame that matches or is just before the current timestamp
    let currentFrame: PuckAnimationFrame | null = null;
    
    for (const frame of this.animationData) {
      if (frame.timestamp <= timestamp) {
        currentFrame = frame;
      } else {
        break;
      }
    }
    
    // If no frame found (timestamp is before first frame), use first frame
    if (!currentFrame && this.animationData.length > 0) {
      currentFrame = this.animationData[0];
    }
    
    // If we're past the last frame, use the last frame
    if (currentFrame === null && timestamp > 0) {
      currentFrame = this.animationData[this.animationData.length - 1];
    }
    
    return currentFrame;
  }
  
  /**
   * Get the container for adding to the main stage
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }
  
  /**
   * Clear all pass lines and reset puck
   */
  public clear(): void {
    if (this.passLinesContainer) {
      this.passLinesContainer.removeChildren();
    }
    this.passLines.clear();
    
    // Only set position if puckSprite is properly initialized
    if (this.puckSprite && this.puckSprite.position) {
      this.puckSprite.x = 400;  // Center of rink
      this.puckSprite.y = 200;
      this.puckSprite.visible = true;
    }
    
    this.currentTime = 0;
    this.animationData = [];
  }
  
  /**
   * Destroy and cleanup
   */
  public destroy(): void {
    try {
      this.clear();
      if (this.container) {
        this.container.destroy({ children: true });
      }
    } catch (error) {
      console.warn('[PuckAnimationSystem] Error during destroy:', error);
    }
  }
}

export default PuckAnimationSystem;