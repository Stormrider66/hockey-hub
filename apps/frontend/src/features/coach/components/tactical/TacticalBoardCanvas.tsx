'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as PIXI from 'pixi.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Circle,
  ArrowRight,
  Square,
  Trash2,
  Save,
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Layers,
  MousePointer,
  Move,
  Plus,
  RefreshCw,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Palette,
  X
} from '@/components/icons';
import { getDefaultPlayers } from '../../utils/defaultPlayers';
import { cn } from '@/lib/utils';
import AnimationEngine, {
  AnimationKeyframe,
  PlayAction,
  AnimatedPlaySystem,
  AnimationState,
  AnimationEvent,
  createPlayFromPositions
} from './AnimationEngine';
import TimelineControls, { TimelineKeyframe } from './TimelineControls';
import PuckAnimationSystem, { PassLine, PuckAnimationFrame } from './PuckAnimationSystem';

// IIHF/SHL regulation rink dimensions (scaled down for display)
const RINK_WIDTH = 800;  // 60m scaled
const RINK_HEIGHT = 400; // 30m scaled
const SCALE_FACTOR = 0.075;  // 1 pixel = 0.075 meters

interface Player {
  id: string;
  x: number;
  y: number;
  team: 'home' | 'away';
  number: number;
  position: 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G';
  rotation?: number;
  speed?: number;
}

interface TacticalBoardCanvasProps {
  initialPlayers?: Player[];
  onSave?: (data: any) => void;
  playSystem?: AnimatedPlaySystem;
  mode?: 'edit' | 'view' | 'animate';
  className?: string;
  onTimelineUpdate?: (keyframes: TimelineKeyframe[]) => void;
  showMedicalInfo?: boolean;
  playerMedicalStatus?: any[];
  playTemplate?: any; // Template data with keyframes
}

/**
 * Canvas-based tactical board using native PIXI.js without React reconciler
 * This avoids React 18 compatibility issues with @pixi/react
 */
export default function TacticalBoardCanvas({
  initialPlayers = [],
  onSave,
  playSystem,
  mode = 'edit',
  className = '',
  onTimelineUpdate,
  showMedicalInfo = false,
  playerMedicalStatus = [],
  playTemplate
}: TacticalBoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const stageRef = useRef<PIXI.Container | null>(null);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const isPlayingRef = useRef(false); // Use ref to avoid closure issues in event handlers
  const [animationEngine] = useState(() => new AnimationEngine());
  const puckAnimationRef = useRef<PuckAnimationSystem | null>(null);
  const [tool, setTool] = useState<'select' | 'move' | 'draw' | 'eraser'>('select');
  const toolRef = useRef<'select' | 'move' | 'draw' | 'eraser'>('select');
  const drawingRef = useRef<PIXI.Container | null>(null);  // Changed to Container
  const isDrawingRef = useRef(false);
  const draggedSpriteRef = useRef<any>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // New state for enhanced features
  const [drawColor, setDrawColor] = useState<number>(0xff0000); // Red by default
  const [lineThickness, setLineThickness] = useState<number>(3);
  const [showMedical, setShowMedical] = useState(showMedicalInfo);
  const [selectedFormation, setSelectedFormation] = useState<string>('default');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showPlayerEditor, setShowPlayerEditor] = useState<boolean>(false);
  const drawingHistoryRef = useRef<PIXI.Container[]>([]);
  const historyIndexRef = useRef<number>(-1);
  
  // Add refs for draw settings to ensure they're current in event handlers
  const drawColorRef = useRef<number>(drawColor);
  const lineThicknessRef = useRef<number>(lineThickness);
  
  // Update refs when state changes
  useEffect(() => {
    drawColorRef.current = drawColor;
  }, [drawColor]);
  
  useEffect(() => {
    lineThicknessRef.current = lineThickness;
  }, [lineThickness]);

  // Load template keyframes when in animate mode
  useEffect(() => {
    if (mode === 'animate' && playTemplate && animationEngine) {
      // Determine initial players based on template format
      let initialPlayers = playTemplate.players || playTemplate.initialPositions;
      
      // For animated templates, extract initial positions from first keyframe
      if (!initialPlayers && playTemplate.keyframes && playTemplate.keyframes.length > 0) {
        const firstKeyframe = playTemplate.keyframes[0];
        if (firstKeyframe.playerMovements) {
          // Create players from playerMovements in first keyframe
          const playerMap = new Map();
          
          // Add offensive players from movements
          firstKeyframe.playerMovements.forEach((movement: any) => {
            const playerId = movement.playerId;
            const startPos = movement.startPosition || { x: 400, y: 300 };
            playerMap.set(playerId, {
              id: playerId,
              name: `Player ${playerId}`,
              number: parseInt(playerId.replace(/\D/g, '')) || 1,
              team: playerId.startsWith('F') || playerId.startsWith('D') ? 'home' : 'away',
              position: playerId.startsWith('F') ? 'C' : playerId.startsWith('D') ? 'D' : 'W',
              x: startPos.x,
              y: startPos.y,
              rotation: 0,
              hasPuck: false
            });
          });
          
          // Add defensive team (away) players defending their goal (right side)
          // They need to defend, not mirror offensive movements
          const awayPlayers = [
            { id: 'a1', name: 'Away C', number: 21, position: 'C', x: 220, y: 150 },  // Center ice defensive position
            { id: 'a2', name: 'Away LW', number: 22, position: 'W', x: 200, y: 100 }, // Left wing defensive coverage
            { id: 'a3', name: 'Away RW', number: 23, position: 'W', x: 200, y: 200 }, // Right wing defensive coverage
            { id: 'a4', name: 'Away LD', number: 24, position: 'D', x: 260, y: 120 }, // Left defense protecting net
            { id: 'a5', name: 'Away RD', number: 25, position: 'D', x: 260, y: 180 }, // Right defense protecting net
            { id: 'a6', name: 'Away G', number: 30, position: 'G', x: 280, y: 150 }   // Goalie in net (right side)
          ];
          
          awayPlayers.forEach(p => {
            if (!playerMap.has(p.id)) {
              playerMap.set(p.id, {
                ...p,
                team: 'away',
                rotation: 180,
                hasPuck: false
              });
            }
          });
          
          initialPlayers = Array.from(playerMap.values());
        }
      }
      
      // If still no players, use defaults
      if (!initialPlayers) {
        initialPlayers = getDefaultPlayers();
      }
      
      setPlayers(initialPlayers);
      
      // Reset animation state when switching templates
      animationEngine.stop();
      setCurrentTime(0);
      setIsPlaying(false);
      
      // Clear puck animation system
      if (puckAnimationRef.current) {
        puckAnimationRef.current.clear();
      }
      
      // Only load animation if keyframes exist
      if (playTemplate.keyframes && playTemplate.keyframes.length > 0) {
        // Set initial speed and loop
        animationEngine.setSpeed(playbackSpeed);
        animationEngine.setLoop(isLooping);
        
        // Convert keyframe players array to object format expected by AnimationEngine
        const playAction = {
          id: playTemplate.id || 'template-play',
          name: playTemplate.name || 'Template Play',
          description: playTemplate.description,
          duration: playTemplate.duration || 8000,
          keyframes: playTemplate.keyframes.map((kf: any) => {
            // Check if we have AnimatedPlayTemplates structure (playerMovements)
            if (kf.playerMovements) {
              // New format from AnimatedPlayTemplates
              const playersObj: any = {};
              
              // Build players object from initial positions and movements
              initialPlayers.forEach(p => {
                playersObj[p.id] = {
                  x: p.x,
                  y: p.y,
                  rotation: p.rotation || 0,
                  team: p.team,
                  hasPuck: false
                };
              });
              
              // Apply movements from keyframe
              kf.playerMovements?.forEach((movement: any) => {
                const playerId = movement.playerId;
                if (!playersObj[playerId]) {
                  // Create player if doesn't exist
                  playersObj[playerId] = {
                    x: movement.startPosition?.x || movement.to?.x || 400,
                    y: movement.startPosition?.y || movement.to?.y || 300,
                    rotation: 0,
                    team: playerId.startsWith('h') ? 'home' : 'away',
                    hasPuck: false
                  };
                }
                if (movement.endPosition || movement.to) {
                  playersObj[playerId].x = movement.endPosition?.x || movement.to?.x || playersObj[playerId].x;
                  playersObj[playerId].y = movement.endPosition?.y || movement.to?.y || playersObj[playerId].y;
                }
              });
              
              // Add defensive player movements - they defend their net (right side)
              // Defensive players react to offensive threats
              if (kf.timestamp > 0) {
                // Defensive center tracks puck carrier
                const puckCarrier = Object.keys(playersObj).find(id => playersObj[id].hasPuck);
                if (puckCarrier && playersObj[puckCarrier]) {
                  playersObj['a1'] = playersObj['a1'] || { x: 220, y: 150, rotation: 180, team: 'away', hasPuck: false };
                  // Move towards puck carrier but stay defensive
                  const puckX = playersObj[puckCarrier].x;
                  const puckY = playersObj[puckCarrier].y;
                  playersObj['a1'].x = Math.max(puckX + 20, 220); // Stay between puck and net
                  playersObj['a1'].y = puckY;
                }
                
                // Defensive wingers collapse to protect slot
                playersObj['a2'] = playersObj['a2'] || { x: 200, y: 100, rotation: 180, team: 'away', hasPuck: false };
                playersObj['a3'] = playersObj['a3'] || { x: 200, y: 200, rotation: 180, team: 'away', hasPuck: false };
                
                // Box formation for penalty kill
                if (playTemplate.name && playTemplate.name.includes('Power Play')) {
                  // PK box formation
                  playersObj['a2'].x = 240;
                  playersObj['a2'].y = 130;
                  playersObj['a3'].x = 240;
                  playersObj['a3'].y = 170;
                }
                
                // Defensemen protect the net
                playersObj['a4'] = playersObj['a4'] || { x: 260, y: 120, rotation: 180, team: 'away', hasPuck: false };
                playersObj['a5'] = playersObj['a5'] || { x: 260, y: 180, rotation: 180, team: 'away', hasPuck: false };
              }
              
              // Set puck possession based on puckMovement
              let puckData = { x: 400, y: 200, velocity: { x: 0, y: 0 }, possessor: null };
              if (kf.puckMovement) {
                puckData.x = kf.puckMovement.endPosition?.x || kf.puckMovement.to?.x || 400;
                puckData.y = kf.puckMovement.endPosition?.y || kf.puckMovement.to?.y || 200;
                
                // Find the closest player to the puck
                let closestPlayer = null;
                let minDistance = 30; // threshold for possession
                
                Object.keys(playersObj).forEach(playerId => {
                  const player = playersObj[playerId];
                  const distance = Math.sqrt(
                    Math.pow(player.x - puckData.x, 2) + 
                    Math.pow(player.y - puckData.y, 2)
                  );
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestPlayer = playerId;
                  }
                });
                
                if (closestPlayer) {
                  playersObj[closestPlayer].hasPuck = true;
                  puckData.possessor = closestPlayer;
                }
              }
              
              return {
                timestamp: kf.timestamp,
                players: playersObj,
                puck: puckData,
                description: kf.annotation
              };
            } else if (kf.players) {
              // Old format - keep existing logic
              const playersObj: any = {};
              let puckHolder = null;
              let puckX = 400, puckY = 200;
              
              kf.players.forEach((p: any) => {
                playersObj[p.id] = {
                  x: p.x,
                  y: p.y,
                  rotation: p.rotation || 0,
                  team: p.team || (p.id.startsWith('h') ? 'home' : 'away'),
                  hasPuck: p.hasPuck || false,
                  isShooter: p.isShooter || false
                };
                
                // Track who has the puck
                if (p.hasPuck) {
                  puckHolder = p.id;
                  puckX = p.x;
                  puckY = p.y;
                }
              });
              
              return {
                timestamp: kf.time,
                players: playersObj,
                puck: { x: puckX, y: puckY, velocity: { x: 0, y: 0 }, possessor: puckHolder },
                description: kf.description
              };
            }
            
            // Fallback
            return {
              timestamp: kf.timestamp || kf.time || 0,
              players: {},
              puck: { x: 400, y: 200, velocity: { x: 0, y: 0 }, possessor: null },
              description: kf.annotation || kf.description || ''
            };
          })
        };
        
        try {
          animationEngine.loadPlay(playAction);
          
          // Create puck animation frames from actual template data
          if (puckAnimationRef.current && playAction.keyframes.length > 0) {
            const puckFrames: PuckAnimationFrame[] = [];
            const passLines: PassLine[] = [];
            
            // Get initial puck position from first keyframe or default
            let lastPuckPos = { x: 100, y: 150 };  // Default start position
            if (playAction.keyframes[0]?.puck) {
              lastPuckPos = { 
                x: playAction.keyframes[0].puck.x, 
                y: playAction.keyframes[0].puck.y 
              };
            }
            
            let passIndex = 0;
            
            // Process keyframes to detect passes and shots from puck movement
            console.log('[PUCK DATA] Processing', playAction.keyframes.length, 'keyframes');
            console.log('[PUCK DATA] Duration:', playAction.duration, 'First timestamp:', playAction.keyframes[0]?.timestamp);
            
            // Track all puck positions for drawing lines
            const puckPositions: { x: number; y: number; time: number; type?: string }[] = [];
            
            // First, convert puckMovement to puck position for each keyframe
            playAction.keyframes.forEach((kf: any, index: number) => {
              const currentTime = kf.timestamp;
              
              // Check for puckMovement in the original template data (from AnimatedPlayTemplates)
              if (kf.puckMovement) {
                // Store start position if not already stored
                if (puckPositions.length === 0 || 
                    puckPositions[puckPositions.length - 1].x !== kf.puckMovement.startPosition.x ||
                    puckPositions[puckPositions.length - 1].y !== kf.puckMovement.startPosition.y) {
                  puckPositions.push({
                    x: kf.puckMovement.startPosition.x,
                    y: kf.puckMovement.startPosition.y,
                    time: currentTime,
                    type: 'start'
                  });
                }
                
                // Store end position
                puckPositions.push({
                  x: kf.puckMovement.endPosition.x,
                  y: kf.puckMovement.endPosition.y,
                  time: currentTime + (kf.puckMovement.duration || 1000),
                  type: kf.puckMovement.type
                });
                
                const fromPos = kf.puckMovement.startPosition;
                const toPos = kf.puckMovement.endPosition;
                const distance = Math.sqrt(
                  Math.pow(toPos.x - fromPos.x, 2) + 
                  Math.pow(toPos.y - fromPos.y, 2)
                );
                
                // Create pass line for every puck movement
                if (distance > 5 && (kf.puckMovement.type === 'pass' || kf.puckMovement.type === 'shot')) {
                  const isShot = kf.puckMovement.type === 'shot';
                  
                  console.log(`[PUCK MOVEMENT] Frame ${index}:`, {
                    type: kf.puckMovement.type,
                    from: fromPos,
                    to: toPos,
                    distance: distance,
                    annotation: kf.annotation
                  });
                  
                  const passLine: PassLine = {
                    id: `pass-${passIndex++}`,
                    fromPlayerId: '',
                    toPlayerId: '',
                    startTime: currentTime,
                    endTime: currentTime + (kf.puckMovement.duration || 1000),
                    type: isShot ? 'shot' : 'pass',
                    style: {
                      color: isShot ? 0xFFFF00 : 0x666666,  // Yellow for shots, darker gray for passes
                      thickness: isShot ? 4 : 3,
                      alpha: 1
                    }
                  };
                  passLines.push(passLine);
                }
                
                lastPuckPos = toPos;
              }
              
              // Also check for puck property (from animation engine)
              if (kf.puck) {
                const newPuckPos = { x: kf.puck.x, y: kf.puck.y };
                const distance = Math.sqrt(
                  Math.pow(newPuckPos.x - lastPuckPos.x, 2) + 
                  Math.pow(newPuckPos.y - lastPuckPos.y, 2)
                );
                
                if (distance > 30 && index > 0) {
                  const isShot = kf.annotation && kf.annotation.toLowerCase().includes('shot');
                  console.log(`[PUCK POSITION] Frame ${index}: distance=${distance}, shot=${isShot}`);
                  lastPuckPos = newPuckPos;
                }
              }
              
              // Update puck position for this frame
              let currentPuckX = lastPuckPos.x;
              let currentPuckY = lastPuckPos.y;
              
              // If we have a puckMovement, interpolate the position based on time
              if (kf.puckMovement) {
                // For simplicity, just use the end position
                currentPuckX = kf.puckMovement.endPosition.x;
                currentPuckY = kf.puckMovement.endPosition.y;
                lastPuckPos = { x: currentPuckX, y: currentPuckY };
              } else if (kf.puck) {
                currentPuckX = kf.puck.x;
                currentPuckY = kf.puck.y;
                lastPuckPos = { x: currentPuckX, y: currentPuckY };
              }
              
              const puckFrame: PuckAnimationFrame = {
                timestamp: currentTime,
                puckPosition: {
                  x: currentPuckX,
                  y: currentPuckY,
                  time: currentTime,
                  possessorId: kf.puck?.possessor || ''
                },
                passLines: [...passLines],
                activePass: passLines.find(p => p.startTime <= currentTime && p.endTime >= currentTime)
              };
              
              puckFrames.push(puckFrame);
            });
            
            // Create pass lines from puck positions if we have them
            if (puckPositions.length > 1 && passLines.length === 0) {
              console.log('[FALLBACK] Creating pass lines from puck positions:', puckPositions.length);
              for (let i = 0; i < puckPositions.length - 1; i++) {
                const from = puckPositions[i];
                const to = puckPositions[i + 1];
                const distance = Math.sqrt(
                  Math.pow(to.x - from.x, 2) + 
                  Math.pow(to.y - from.y, 2)
                );
                
                if (distance > 20) {
                  const isShot = to.type === 'shot' || (i === puckPositions.length - 2);
                  const passLine: PassLine = {
                    id: `pass-${passIndex++}`,
                    fromPlayerId: '',
                    toPlayerId: '',
                    startTime: from.time,
                    endTime: to.time,
                    type: isShot ? 'shot' : 'pass',
                    style: {
                      color: isShot ? 0xFFFF00 : 0x666666,
                      thickness: isShot ? 4 : 3,
                      alpha: 1
                    }
                  };
                  passLines.push(passLine);
                  console.log(`[FALLBACK PASS] Created ${passLine.type} from (${from.x},${from.y}) to (${to.x},${to.y})`);
                }
              }
            }
            
            // Create frames with actual puck movement from keyframe data
            const interpolatedFrames: PuckAnimationFrame[] = [];
            const frameInterval = 50; // ms - more frequent for smoother animation
            const totalFrames = Math.ceil(playAction.duration / frameInterval);
            
            // Extract puck positions from all keyframes
            const keyframePuckPositions: { time: number; x: number; y: number }[] = [];
            playAction.keyframes.forEach((kf: any) => {
              if (kf.puck && kf.puck.x && kf.puck.y) {
                keyframePuckPositions.push({
                  time: kf.timestamp,
                  x: kf.puck.x,
                  y: kf.puck.y
                });
              }
            });
            
            // Add puck positions from puckMovement if available
            if (puckPositions.length > 0) {
              puckPositions.forEach(pos => {
                if (!keyframePuckPositions.find(p => p.time === pos.time)) {
                  keyframePuckPositions.push({
                    time: pos.time,
                    x: pos.x,
                    y: pos.y
                  });
                }
              });
            }
            
            // Sort by time
            keyframePuckPositions.sort((a, b) => a.time - b.time);
            
            // If we still don't have positions, create some test movement
            if (keyframePuckPositions.length === 0) {
              console.log('[PUCK] No puck data found, creating test movement');
              // Create test puck movement for debugging
              keyframePuckPositions.push(
                { time: 0, x: 100, y: 150 },
                { time: 2000, x: 150, y: 130 },
                { time: 4000, x: 200, y: 150 },
                { time: 6000, x: 180, y: 180 },
                { time: 8000, x: 250, y: 150 },
                { time: playAction.duration, x: 280, y: 150 }
              );
            }
            
            console.log(`[PUCK] Found ${keyframePuckPositions.length} puck positions`);
            
            // Create interpolated frames
            for (let i = 0; i <= totalFrames; i++) {
              const time = i * frameInterval;
              
              // Find surrounding keyframes for interpolation
              let puckX = lastPuckPos.x;
              let puckY = lastPuckPos.y;
              
              for (let j = 0; j < keyframePuckPositions.length - 1; j++) {
                const kf1 = keyframePuckPositions[j];
                const kf2 = keyframePuckPositions[j + 1];
                
                if (time >= kf1.time && time <= kf2.time) {
                  // Interpolate between keyframes
                  const progress = (time - kf1.time) / (kf2.time - kf1.time);
                  puckX = kf1.x + (kf2.x - kf1.x) * progress;
                  puckY = kf1.y + (kf2.y - kf1.y) * progress;
                  break;
                } else if (time < kf1.time) {
                  puckX = kf1.x;
                  puckY = kf1.y;
                  break;
                } else if (j === keyframePuckPositions.length - 2) {
                  puckX = kf2.x;
                  puckY = kf2.y;
                }
              }
              
              // Handle single position case
              if (keyframePuckPositions.length === 1) {
                puckX = keyframePuckPositions[0].x;
                puckY = keyframePuckPositions[0].y;
              }
              
              interpolatedFrames.push({
                timestamp: time,
                puckPosition: {
                  x: puckX,
                  y: puckY,
                  time: time,
                  possessorId: ''
                },
                passLines: passLines.filter(pl => pl.startTime <= time),
                activePass: passLines.find(p => p.startTime <= time && p.endTime >= time)
              });
            }
            
            // Debug: Log first few puck frames to see positions
            console.log('Generated:', {
              originalFrames: puckFrames.length,
              interpolatedFrames: interpolatedFrames.length,
              passLines: passLines.length,
              puckPositions: puckPositions.length,
              duration: playAction.duration
            });
            
            if (interpolatedFrames.length > 0) {
              console.log('[DEBUG] First 5 interpolated frames:');
              interpolatedFrames.slice(0, 5).forEach((frame, i) => {
                console.log(`  Frame ${i}: time=${frame.timestamp}, pos=(${frame.puckPosition.x.toFixed(0)}, ${frame.puckPosition.y.toFixed(0)}), passLines=${frame.passLines.length}`);
              });
              console.log('[DEBUG] Last frame:', interpolatedFrames[interpolatedFrames.length - 1]);
            }
            
            if (passLines.length > 0) {
              console.log('[DEBUG] Pass lines created:');
              passLines.forEach((pl, i) => {
                console.log(`  Pass ${i}: type=${pl.type}, time=${pl.startTime}-${pl.endTime}, color=0x${pl.style?.color?.toString(16)}`);
              });
            }
            
            puckAnimationRef.current.setAnimationData(interpolatedFrames);
          }
        } catch (error) {
          console.error('Failed to load play animation:', error);
          // Continue with static positions if animation fails
        }
      }
    }
  }, [mode, playTemplate, animationEngine, playbackSpeed, isLooping]); // Removed players from deps to prevent infinite loop

  // Listen to animation updates and update player positions
  useEffect(() => {
    if (!animationEngine) return;

    const handleTimeUpdate = (time: number) => {
      // Update the current time for the timeline
      setCurrentTime(time);
      
      // Get the current frame from the animation engine
      const frame = animationEngine.getCurrentFrame();
      if (frame && frame.players) {
        
        // Update player positions based on animation frame
        // First, collect all player IDs from the frame
        const framePlayerIds = Object.keys(frame.players);
        
        setPlayers(prevPlayers => {
          // Create a map of existing players
          const playerMap = new Map(prevPlayers.map(p => [p.id, p]));
          
          // Update or add players from the frame
          framePlayerIds.forEach(id => {
            const animatedPlayer = frame.players[id];
            if (playerMap.has(id)) {
              // Update existing player
              const existing = playerMap.get(id);
              const updated = {
                ...existing,
                x: animatedPlayer.x,
                y: animatedPlayer.y,
                rotation: animatedPlayer.rotation || 0,
                hasPuck: animatedPlayer.hasPuck || false,
                isShooter: animatedPlayer.isShooter || false
              };
              // Debug specific players
              if (id === 'h4' && animatedPlayer.hasPuck) {
                console.log(`Frame update for ${id}: hasPuck=${animatedPlayer.hasPuck}, isShooter=${animatedPlayer.isShooter}`);
              }
              playerMap.set(id, updated);
            } else {
              // Add new player (like defenders)
              playerMap.set(id, {
                id,
                name: id.startsWith('a') ? `Defender ${id}` : `Player ${id}`,
                number: parseInt(id.slice(1)) + 20, // Give defenders higher numbers
                team: animatedPlayer.team || (id.startsWith('h') ? 'home' : 'away'),
                position: id === 'a1' ? 'G' : 'C',
                x: animatedPlayer.x,
                y: animatedPlayer.y,
                rotation: animatedPlayer.rotation || 0,
                hasPuck: animatedPlayer.hasPuck || false,
                isShooter: animatedPlayer.isShooter || false
              });
            }
          });
          
          return Array.from(playerMap.values());
        });
        
        // Update puck animation system when we have valid frame data
        // Pass isPlaying to control trail rendering (only show trails during playback)
        if (puckAnimationRef.current && frame.players) {
          const playerPositions = new Map<string, { x: number; y: number }>();
          Object.keys(frame.players).forEach(id => {
            const player = frame.players[id];
            playerPositions.set(id, { x: player.x, y: player.y });
          });
          // Use ref to avoid closure issues - this ensures we always have the current playing state
          puckAnimationRef.current.update(time, playerPositions, isPlayingRef.current);
        }
      }
    };

    const handleStateChange = (state: any) => {
      // Update playing state when animation stops
      if (state === 'stopped' || state === 'paused') {
        setIsPlaying(false);
        isPlayingRef.current = false; // Update the ref too
        // Clear puck trail when animation stops
        if (state === 'stopped' && puckAnimationRef.current) {
          puckAnimationRef.current.clear();
        }
      } else if (state === 'playing') {
        setIsPlaying(true);
        isPlayingRef.current = true; // Update the ref too
      }
    };

    const handlePlayEnd = () => {
      // Only reset if not looping
      if (!isLooping) {
        setIsPlaying(false);
        isPlayingRef.current = false; // Update the ref too
        setCurrentTime(0);
      }
    };

    // Subscribe to animation events
    animationEngine.on('timeUpdate', handleTimeUpdate);
    animationEngine.on('stateChange', handleStateChange);
    animationEngine.on('playEnd', handlePlayEnd);

    return () => {
      animationEngine.removeListener('timeUpdate', handleTimeUpdate);
      animationEngine.removeListener('stateChange', handleStateChange);
      animationEngine.removeListener('playEnd', handlePlayEnd);
    };
  }, [animationEngine, isLooping, playTemplate, players, isPlaying]);
  
  // Clear all drawings - Define before using in effects
  const clearDrawing = useCallback(() => {
    if (drawingRef.current) {
      drawingRef.current.removeChildren();
      drawingHistoryRef.current = [];
      historyIndexRef.current = -1;
      console.log('Cleared all drawings');
    }
  }, []);

  // Save drawing state for undo/redo
  const saveDrawingState = useCallback(() => {
    if (!drawingRef.current) return;
    
    // Clone current drawing state
    const clone = new PIXI.Container();
    drawingRef.current.children.forEach(child => {
      // We can't directly clone Graphics, so we'll save the reference
      clone.addChild(child);
    });
    
    // Remove any history after current index
    drawingHistoryRef.current = drawingHistoryRef.current.slice(0, historyIndexRef.current + 1);
    
    // Add new state
    drawingHistoryRef.current.push(clone);
    historyIndexRef.current++;
    
    // Limit history to 50 states
    if (drawingHistoryRef.current.length > 50) {
      drawingHistoryRef.current.shift();
      historyIndexRef.current--;
    }
  }, []);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0 && drawingRef.current) {
      historyIndexRef.current--;
      // For now, we'll just clear and inform user
      // Full implementation would require storing drawing commands
      console.log('Undo to state', historyIndexRef.current);
    }
  }, []);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < drawingHistoryRef.current.length - 1 && drawingRef.current) {
      historyIndexRef.current++;
      console.log('Redo to state', historyIndexRef.current);
    }
  }, []);

  // Keep toolRef in sync with tool state and update cursor
  useEffect(() => {
    toolRef.current = tool;
    
    // Update cursor style for entire canvas
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        if (tool === 'draw') {
          canvas.style.cursor = 'crosshair';
        } else if (tool === 'eraser') {
          canvas.style.cursor = 'grab';
        } else if (tool === 'move') {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'pointer';
        }
      }
    }
  }, [tool]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'c') {
          e.preventDefault();
          clearDrawing();
        }
      } else if (e.key === 'd') {
        setTool('draw');
      } else if (e.key === 'e') {
        setTool('eraser');
      } else if (e.key === 'm') {
        setTool('move');
      } else if (e.key === 's') {
        setTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [clearDrawing, handleUndo, handleRedo]);

  // Update player position
  const updatePlayerPosition = useCallback((playerId: string, x: number, y: number) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, x, y } : p
    ));
  }, []);


  // Draw players on the ice - define before using in effects
  const drawPlayers = useCallback((stage: PIXI.Container, playerList: Player[]) => {
    // Find or create players container
    let playersContainer = stage.getChildByName('players') as PIXI.Container;
    
    if (!playersContainer) {
      playersContainer = new PIXI.Container();
      playersContainer.name = 'players';
      playersContainer.zIndex = 2;
      stage.addChild(playersContainer);
    } else {
      // Clear existing players
      playersContainer.removeChildren();
    }

    playerList.forEach(player => {
      const playerSprite = new PIXI.Container();
      playerSprite.name = player.id;
      
      // Player circle with puck possession indication
      const circle = new PIXI.Graphics();
      let color = player.team === 'home' ? 0x0066cc : 0xff6666;
      let alpha = 0.8;
      
      // Check if player has puck (from animation frame data)
      const hasPuck = (player as any).hasPuck;
      const isShooter = (player as any).isShooter;
      
      // Debug: Log players with puck
      if (player.id === 'h4' || player.id === 'h2' || player.id === 'h3') {
        console.log(`Player ${player.id}: hasPuck=${hasPuck}, isShooter=${isShooter}`);
      }
      
      
      if (hasPuck) {
        // Darker color and full opacity for puck carrier
        color = player.team === 'home' ? 0x003366 : 0xcc0000;
        alpha = 1.0;
        
        // Add puck indicator ring
        circle.lineStyle(3, 0x00ff00, 0.8);
        circle.drawCircle(0, 0, 18);
      }
      
      if (isShooter) {
        // Add shooting animation effect
        circle.lineStyle(4, 0xffff00, 0.9);
        circle.drawCircle(0, 0, 22);
        
        // Draw shot line towards goal
        const shotLine = new PIXI.Graphics();
        shotLine.lineStyle(3, 0xffff00, 0.6);
        shotLine.moveTo(0, 0);
        shotLine.lineTo(700 - player.x, 200 - player.y); // Line towards goal
        playerSprite.addChild(shotLine);
        
        // Add puck graphic
        const puck = new PIXI.Graphics();
        puck.beginFill(0x000000);
        puck.drawCircle(8, 8, 4);
        puck.endFill();
        playerSprite.addChild(puck);
      } else if (hasPuck) {
        // Just show puck for non-shooting puck carriers
        const puck = new PIXI.Graphics();
        puck.beginFill(0x000000);
        puck.drawCircle(10, 10, 3);
        puck.endFill();
        playerSprite.addChild(puck);
      }
      
      circle.beginFill(color, alpha);
      circle.drawCircle(0, 0, 15);
      circle.endFill();
      
      // Add selection highlight if player is selected
      if (selectedPlayer === player.id) {
        const highlight = new PIXI.Graphics();
        highlight.lineStyle(2, 0xffff00);
        highlight.drawCircle(0, 0, 20);
        playerSprite.addChild(highlight);
      }
      
      // Player number - needs to stay upright regardless of sprite rotation
      const text = new PIXI.Text(player.number.toString(), {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff,
        fontWeight: 'bold'
      });
      text.anchor.set(0.5);
      
      // Medical indicator if needed
      if (showMedical && playerMedicalStatus) {
        const medical = playerMedicalStatus.find(m => m.playerId === player.id);
        if (medical && medical.overallStatus !== 'available') {
          const statusIndicator = new PIXI.Graphics();
          const statusColor = medical.overallStatus === 'limited' ? 0xffaa00 : 0xff0000;
          statusIndicator.beginFill(statusColor);
          statusIndicator.drawCircle(10, -10, 4);
          statusIndicator.endFill();
          playerSprite.addChild(statusIndicator);
        }
      }
      
      playerSprite.addChild(circle);
      
      // Convert rotation from degrees to radians if needed
      // If rotation value is > 6.28 (2π), it's likely in degrees
      let spriteRotation = player.rotation || 0;
      if (Math.abs(spriteRotation) > 6.28) {
        // Convert degrees to radians
        spriteRotation = (spriteRotation * Math.PI) / 180;
      }
      
      // Set the player sprite rotation
      playerSprite.rotation = spriteRotation;
      
      // Counter-rotate the text to keep it upright
      // If sprite is rotated (flipped for away team), counter-rotate the text
      if (Math.abs(spriteRotation) > Math.PI / 2) {
        text.rotation = -spriteRotation;
      }
      
      playerSprite.addChild(text);
      playerSprite.position.set(player.x, player.y);
      
      // Make interactive in edit mode, but not when drawing
      if (mode === 'edit' && toolRef.current !== 'draw') {
        playerSprite.eventMode = 'static';
        playerSprite.interactive = true;
        playerSprite.buttonMode = true;
        playerSprite.cursor = toolRef.current === 'move' ? 'move' : 'pointer';
        
        // Store player data on the sprite
        (playerSprite as any).playerId = player.id;
        (playerSprite as any).playerData = player;
        
        playerSprite.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
          const currentTool = toolRef.current;
          console.log('Player clicked - tool:', currentTool, 'player:', player.id);
          
          if (currentTool === 'select') {
            setSelectedPlayer(player.id === selectedPlayer ? null : player.id);
            if (player.id !== selectedPlayer) {
              setShowPlayerEditor(true);
            } else {
              setShowPlayerEditor(false);
            }
          } else if (currentTool === 'move') {
            // Start dragging - store sprite globally
            const sprite = event.currentTarget as any;
            sprite.alpha = 0.5;
            draggedSpriteRef.current = sprite;
            console.log('Started dragging player:', player.id);
          }
          
          event.stopPropagation();
        });
        
      } else if (toolRef.current === 'draw') {
        // When draw tool is active, make players non-interactive
        playerSprite.eventMode = 'none';
        playerSprite.interactive = false;
      }
      
      playersContainer.addChild(playerSprite);
    });
  }, [mode, selectedPlayer, tool, showMedical, playerMedicalStatus]);

  // Initialize PIXI application
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up any existing app first
    if (appRef.current) {
      try {
        // Check if app is already destroyed
        if (!appRef.current.renderer.destroyed) {
          appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        }
      } catch (e) {
        console.warn('Error cleaning up PIXI app:', e);
      }
      appRef.current = null;
    }

    // Create PIXI application with touch support
    const app = new PIXI.Application({
      width: RINK_WIDTH,
      height: RINK_HEIGHT,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      eventMode: 'static',
      eventFeatures: {
        move: true,
        globalMove: true,
        click: true,
        wheel: false
      }
    });

    // Add to DOM
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // Create main stage container
    const stage = new PIXI.Container();
    app.stage.addChild(stage);
    stageRef.current = stage;

    // Draw rink
    drawRink(stage);
    
    // Create drawing layer (below players) - Use Container, not Graphics
    const drawingLayer = new PIXI.Container();
    drawingLayer.name = 'drawing';
    drawingLayer.eventMode = 'none'; // Don't block events to players
    drawingLayer.interactive = false; // Ensure it's not interactive
    drawingLayer.interactiveChildren = false; // Children also not interactive
    drawingLayer.zIndex = 1; // Lower z-index
    stage.addChild(drawingLayer);
    drawingRef.current = drawingLayer;
    
    // Add puck animation layer (between drawing and players)
    try {
      const puckAnimationSystem = new PuckAnimationSystem();
      const puckLayer = puckAnimationSystem.getContainer();
      puckLayer.name = 'puckAnimation';
      puckLayer.zIndex = 10; // High z-index to ensure visibility
      stage.addChild(puckLayer);
      
      // Enable z-index sorting for the stage
      stage.sortableChildren = true;
      
      puckAnimationRef.current = puckAnimationSystem;
      console.log('Puck animation system initialized');
    } catch (error) {
      console.warn('Failed to initialize puck animation system:', error);
      // Continue without puck animation
    }
    
    // Create players container (above drawing)
    const playersContainer = new PIXI.Container();
    playersContainer.name = 'players';
    playersContainer.zIndex = 2; // Higher z-index
    stage.addChild(playersContainer);
    
    // Enable sorting by zIndex
    stage.sortableChildren = true;
    
    // Setup stage interaction for drawing
    stage.eventMode = 'static';
    stage.interactive = true;
    stage.hitArea = new PIXI.Rectangle(0, 0, RINK_WIDTH, RINK_HEIGHT);
    

    // Initial draw of players will be handled by the useEffect

    // Cleanup
    return () => {
      try {
        if (puckAnimationRef.current) {
          puckAnimationRef.current.destroy();
          puckAnimationRef.current = null;
        }
      } catch (e) {
        console.warn('Error destroying puck animation:', e);
      }
      
      try {
        if (appRef.current && !appRef.current.renderer.destroyed) {
          appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        }
      } catch (e) {
        console.warn('Error destroying PIXI app:', e);
      }
      
      appRef.current = null;
      stageRef.current = null;
      drawingRef.current = null;
      
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Update players when they change or when interaction state changes
  useEffect(() => {
    if (!stageRef.current) return;
    
    // Redraw players with current interaction state
    drawPlayers(stageRef.current, players);
  }, [players, drawPlayers, selectedPlayer, tool, showMedical]);
  
  // Handle drawing and dragging using native browser events for better reliability
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    
    // Track if we're currently drawing
    let isCurrentlyDrawing = false;
    let lastPoint: { x: number; y: number } | null = null;
    
    // Get mouse position relative to canvas
    const getCanvasPosition = (e: MouseEvent | PointerEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = RINK_WIDTH / rect.width;
      const scaleY = RINK_HEIGHT / rect.height;
      
      // Handle touch events
      let clientX: number, clientY: number;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return null;
      }
      
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };
    
    const handleMouseDown = (e: MouseEvent | PointerEvent | TouchEvent) => {
      const pos = getCanvasPosition(e);
      if (!pos) {
        console.log('Failed to get canvas position');
        return;
      }
      
      console.log('Pointer down at:', pos.x, pos.y, 'Tool:', toolRef.current);
      
      if (toolRef.current === 'draw' || toolRef.current === 'eraser') {
        if (!drawingRef.current) {
          console.error('Drawing layer not initialized!');
          return;
        }
        
        // Start drawing or erasing
        isCurrentlyDrawing = true;
        lastPoint = pos;  // Store the starting point
        
        console.log('Started', toolRef.current, 'at:', pos.x, pos.y);
        
        // Prevent default to avoid any text selection or other browser behaviors
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    const handleMouseMove = (e: MouseEvent | PointerEvent | TouchEvent) => {
      const pos = getCanvasPosition(e);
      if (!pos) return;
      
      // Handle drawing
      if (toolRef.current === 'draw' && isCurrentlyDrawing && lastPoint && drawingRef.current) {
        // Create a new graphics object for this single line segment
        const lineSegment = new PIXI.Graphics();
        
        // Set the line style with current color and thickness (use refs for current values)
        lineSegment.lineStyle(lineThicknessRef.current, drawColorRef.current, 1);
        
        // Use beginFill with alpha 0 to start a new path without drawing from (0,0)
        lineSegment.beginFill(drawColorRef.current, 0);
        
        // Draw the line using drawPolygon which doesn't have the (0,0) issue
        // drawPolygon creates a closed shape, but with lineStyle and no fill it just draws lines
        lineSegment.drawPolygon([
          new PIXI.Point(lastPoint.x, lastPoint.y),
          new PIXI.Point(pos.x, pos.y)
        ]);
        
        // End the fill
        lineSegment.endFill();
        
        // Add this segment to the drawing layer
        drawingRef.current.addChild(lineSegment);
        
        console.log('Drew line segment from', lastPoint.x, lastPoint.y, 'to', pos.x, pos.y);
        
        // Update the last point for the next segment
        lastPoint = pos;
        
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Handle eraser
      if (toolRef.current === 'eraser' && isCurrentlyDrawing && drawingRef.current) {
        // Find and remove graphics objects near the cursor
        const children = [...drawingRef.current.children];
        children.forEach(child => {
          // Check if cursor is near this graphics object
          const bounds = child.getBounds();
          if (bounds.contains(pos.x, pos.y)) {
            drawingRef.current!.removeChild(child);
          }
        });
        
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Handle dragging
      if (toolRef.current === 'move' && draggedSpriteRef.current) {
        draggedSpriteRef.current.position.set(pos.x, pos.y);
        updatePlayerPosition(draggedSpriteRef.current.playerId, pos.x, pos.y);
      }
    };
    
    const handleMouseUp = (e: MouseEvent | PointerEvent | TouchEvent) => {
      console.log('Pointer up');
      
      if (isCurrentlyDrawing) {
        isCurrentlyDrawing = false;
        lastPoint = null;
      }
      
      if (draggedSpriteRef.current) {
        draggedSpriteRef.current.alpha = 1;
        draggedSpriteRef.current = null;
      }
      
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    // Use pointer events which work better with trackpads and touch devices
    canvas.addEventListener('pointerdown', handleMouseDown);
    canvas.addEventListener('pointermove', handleMouseMove);
    canvas.addEventListener('pointerup', handleMouseUp);
    canvas.addEventListener('pointercancel', handleMouseUp);
    canvas.addEventListener('pointerleave', handleMouseUp);
    
    // Also add touch events for better compatibility
    canvas.addEventListener('touchstart', handleMouseDown, { passive: false });
    canvas.addEventListener('touchmove', handleMouseMove, { passive: false });
    canvas.addEventListener('touchend', handleMouseUp, { passive: false });
    
    // Set canvas style to prevent default touch behaviors
    canvas.style.touchAction = 'none';
    
    return () => {
      canvas.removeEventListener('pointerdown', handleMouseDown);
      canvas.removeEventListener('pointermove', handleMouseMove);
      canvas.removeEventListener('pointerup', handleMouseUp);
      canvas.removeEventListener('pointercancel', handleMouseUp);
      canvas.removeEventListener('pointerleave', handleMouseUp);
      canvas.removeEventListener('touchstart', handleMouseDown);
      canvas.removeEventListener('touchmove', handleMouseMove);
      canvas.removeEventListener('touchend', handleMouseUp);
    };
  }, [updatePlayerPosition]);

  // Draw the hockey rink
  const drawRink = (stage: PIXI.Container) => {
    const rink = new PIXI.Graphics();
    
    // Ice surface (white with slight blue tint)
    rink.beginFill(0xf0f8ff);
    rink.drawRect(0, 0, RINK_WIDTH, RINK_HEIGHT);
    rink.endFill();

    // Boards
    rink.lineStyle(4, 0x333333);
    rink.drawRoundedRect(20, 20, RINK_WIDTH - 40, RINK_HEIGHT - 40, 40);

    // Center line
    rink.lineStyle(4, 0xff0000);
    rink.moveTo(RINK_WIDTH / 2, 20);
    rink.lineTo(RINK_WIDTH / 2, RINK_HEIGHT - 20);

    // Blue lines (offensive zones)
    rink.lineStyle(4, 0x0066cc);
    rink.moveTo(RINK_WIDTH * 0.35, 20);
    rink.lineTo(RINK_WIDTH * 0.35, RINK_HEIGHT - 20);
    rink.moveTo(RINK_WIDTH * 0.65, 20);
    rink.lineTo(RINK_WIDTH * 0.65, RINK_HEIGHT - 20);

    // Goal lines
    rink.lineStyle(2, 0xff0000);
    rink.moveTo(100, 20);
    rink.lineTo(100, RINK_HEIGHT - 20);
    rink.moveTo(RINK_WIDTH - 100, 20);
    rink.lineTo(RINK_WIDTH - 100, RINK_HEIGHT - 20);

    // Face-off circles
    const drawFaceoffCircle = (x: number, y: number, isCenter: boolean = false) => {
      rink.lineStyle(2, 0xff0000);
      rink.drawCircle(x, y, isCenter ? 30 : 25);
      rink.beginFill(0xff0000);
      rink.drawCircle(x, y, 3);
      rink.endFill();
    };

    // Center ice circle
    drawFaceoffCircle(RINK_WIDTH / 2, RINK_HEIGHT / 2, true);
    
    // Zone face-off circles
    drawFaceoffCircle(150, 120);
    drawFaceoffCircle(150, RINK_HEIGHT - 120);
    drawFaceoffCircle(RINK_WIDTH - 150, 120);
    drawFaceoffCircle(RINK_WIDTH - 150, RINK_HEIGHT - 120);

    // Goals
    const drawGoal = (x: number) => {
      rink.lineStyle(3, 0xff0000);
      rink.drawRect(x - 15, RINK_HEIGHT / 2 - 30, 30, 60);
    };
    drawGoal(70);
    drawGoal(RINK_WIDTH - 70);

    stage.addChild(rink);
  };

  // Handle animation controls
  const handlePlayPause = () => {
    if (isPlaying) {
      animationEngine.pause();
    } else {
      animationEngine.play();
    }
    setIsPlaying(!isPlaying);
    isPlayingRef.current = !isPlaying; // Update the ref too
  };

  const handleReset = () => {
    animationEngine.reset();
    setIsPlaying(false);
    isPlayingRef.current = false; // Update the ref too
    // Clear puck trail when resetting animation
    if (puckAnimationRef.current) {
      puckAnimationRef.current.clear();
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        players,
        keyframes: animationEngine.getKeyframes()
      });
    }
  };
  
  // Handle adding a new player
  const handleAddPlayer = () => {
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      x: 400, // Center of the rink
      y: 200,
      team: 'home',
      number: Math.floor(Math.random() * 99) + 1,
      position: 'C',
      rotation: 0,
      speed: 0
    };
    
    setPlayers(prev => [...prev, newPlayer]);
  };
  
  // Handle resetting to default formation
  const handleResetPlayers = () => {
    const defaultPlayers = getDefaultPlayers();
    setPlayers(defaultPlayers);
  };
  
  // Handle clearing all players
  const handleClearBoard = () => {
    setPlayers([]);
  };
  
  // Handle clearing drawing
  const handleClearDrawing = () => {
    clearDrawing();  // Use the clearDrawing function we already have
  };

  // Handle export to image
  const handleExport = () => {
    if (!appRef.current) return;
    
    // Export the canvas as an image
    const canvas = appRef.current.view as HTMLCanvasElement;
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tactical-board-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
    
    console.log('Exported tactical board as image');
  };

  // Save board configuration to JSON
  const handleSaveConfiguration = () => {
    const config = {
      players: players,
      formation: selectedFormation,
      drawColor: drawColor,
      lineThickness: lineThickness,
      timestamp: Date.now(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tactical-board-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('Saved tactical board configuration');
  };

  // Load board configuration from JSON
  const handleLoadConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        
        // Load players
        if (config.players) {
          setPlayers(config.players);
        }
        
        // Load formation
        if (config.formation) {
          setSelectedFormation(config.formation);
        }
        
        // Load drawing settings
        if (config.drawColor !== undefined) {
          setDrawColor(config.drawColor);
        }
        if (config.lineThickness !== undefined) {
          setLineThickness(config.lineThickness);
        }
        
        console.log('Loaded tactical board configuration');
      } catch (error) {
        console.error('Failed to load configuration:', error);
        alert('Failed to load configuration file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input value to allow loading the same file again
    event.target.value = '';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={tool === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('select')}
            >
              <MousePointer className="h-4 w-4 mr-2" />
              Select
            </Button>
            <Button
              variant={tool === 'move' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('move')}
            >
              <Move className="h-4 w-4 mr-2" />
              Move
            </Button>
            <Button
              variant={tool === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('draw')}
            >
              <Circle className="h-4 w-4 mr-2" />
              Draw
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('eraser')}
              title="Eraser (E)"
            >
              <X className="h-4 w-4 mr-2" />
              Eraser
            </Button>
            
            {/* Drawing Options */}
            {(tool === 'draw' || tool === 'eraser') && (
              <>
                {tool === 'draw' && (
                  <>
                    {/* Color Picker */}
                    <div className="relative inline-block">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowColorPicker(!showColorPicker);
                        }}
                        title="Select drawing color"
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        <div 
                          className="w-4 h-4 rounded border border-gray-300" 
                          style={{ backgroundColor: `#${drawColor.toString(16).padStart(6, '0')}` }}
                        />
                      </Button>
                      {showColorPicker && (
                        <>
                          {/* Invisible overlay to close picker when clicking outside */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowColorPicker(false)}
                          />
                          <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                            <div className="text-xs font-medium mb-2 text-gray-600">Select Color:</div>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                0xff0000, // Red
                                0x0000ff, // Blue
                                0x00ff00, // Green
                                0xffff00, // Yellow
                                0xff00ff, // Magenta
                                0x00ffff, // Cyan
                                0x000000, // Black
                                0xffffff, // White
                                0xffa500, // Orange
                                0x800080, // Purple
                                0x808080, // Gray
                                0x964b00, // Brown
                              ].map(color => (
                                <button
                                  key={color}
                                  className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                                  style={{ 
                                    backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
                                    borderColor: drawColor === color ? '#2563eb' : '#ccc',
                                    borderWidth: drawColor === color ? '3px' : '2px'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDrawColor(color);
                                    setShowColorPicker(false);
                                    console.log('Color selected:', color.toString(16));
                                  }}
                                  title={`Color: #${color.toString(16).padStart(6, '0')}`}
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Line Thickness */}
                    <div className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md bg-white">
                      <span className="text-xs text-gray-600">Thickness:</span>
                      <input
                        type="range"
                        value={lineThickness}
                        onChange={(e) => {
                          const newThickness = parseInt(e.target.value);
                          setLineThickness(newThickness);
                          console.log('Thickness changed:', newThickness);
                        }}
                        min={1}
                        max={10}
                        step={1}
                        className="w-20 accent-blue-500"
                        title={`Line thickness: ${lineThickness}px`}
                      />
                      <span className="font-bold text-sm min-w-[30px]">{lineThickness}px</span>
                      {/* Visual thickness preview */}
                      <div 
                        className="w-16 rounded-full bg-current" 
                        style={{ 
                          height: `${Math.max(2, lineThickness)}px`,
                          backgroundColor: `#${drawColor.toString(16).padStart(6, '0')}`
                        }}
                      />
                    </div>
                  </>
                )}
              </>
            )}
            
            <div className="w-px h-6 bg-border mx-2" />
            
            {/* Undo/Redo */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            {/* Formation Selector */}
            <select 
              className="w-32 h-9 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedFormation} 
              onChange={(e) => {
                const value = e.target.value;
                setSelectedFormation(value);
                if (value !== 'default') {
                  // Use the already imported getFormationPlayers
                  import('../../utils/defaultPlayers').then(module => {
                    const formationPlayers = module.getFormationPlayers(value, 'home')
                      .concat(module.getFormationPlayers(value, 'away'));
                    setPlayers(formationPlayers);
                  });
                } else {
                  handleResetPlayers();
                }
              }}
            >
              <option value="default">Default</option>
              <option value="2-1-2">2-1-2</option>
              <option value="1-2-2">1-2-2</option>
              <option value="2-3">2-3</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddPlayer}
              title="Add a new player to the board"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetPlayers}
              title="Reset to default formation"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Formation
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearBoard}
              title="Clear all players from the board"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            
            {tool === 'draw' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearDrawing}
                title="Clear drawings"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Drawing
              </Button>
            )}
          </div>
          
          {mode === 'animate' && (
            <div className="flex items-center gap-2">
              <Button onClick={handlePlayPause} size="sm">
                {isPlaying ? (
                  <><Pause className="h-4 w-4 mr-2" />Pause</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" />Play</>
                )}
              </Button>
              <Button onClick={handleReset} size="sm" variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {/* Medical Info Toggle */}
            <Button
              variant={showMedical ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMedical(!showMedical)}
              title="Toggle medical information"
            >
              {showMedical ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Medical
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <Button onClick={handleSave} size="sm" variant="default">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export PNG
            </Button>
            
            <Button size="sm" variant="outline" onClick={handleSaveConfiguration}>
              <Save className="h-4 w-4 mr-2" />
              Save Config
            </Button>
            
            <label htmlFor="load-config" className="inline-block">
              <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Load Config
              </span>
              <input
                id="load-config"
                type="file"
                accept=".json"
                onChange={handleLoadConfiguration}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Canvas container */}
      <Card className="overflow-hidden">
        <div 
          ref={containerRef}
          className="relative bg-white rounded-lg"
          style={{ width: RINK_WIDTH, height: RINK_HEIGHT }}
        />
      </Card>

      {/* Timeline controls for animation mode */}
      {mode === 'animate' && (
        <TimelineControls
          duration={playTemplate?.duration || animationEngine.getDuration() || 8000}
          currentTime={currentTime}
          keyframes={playTemplate?.keyframes?.map((kf: any) => ({
            time: kf.time,
            label: kf.description,
            type: 'marker' as const
          })) || []}
          isPlaying={isPlaying}
          speed={playbackSpeed}
          isLooping={isLooping}
          isMuted={false}
          volume={1}
              onPlay={() => {
                animationEngine.play();
                setIsPlaying(true);
              }}
              onPause={() => {
                animationEngine.pause();
                setIsPlaying(false);
              }}
              onStop={() => {
                animationEngine.stop();
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              onSeek={(time) => {
                animationEngine.seekTo(time);
                setCurrentTime(time);
              }}
              onSpeedChange={(speed) => {
                setPlaybackSpeed(speed);
                animationEngine.setSpeed(speed);
              }}
          onStepForward={() => {
            const newTime = Math.min(currentTime + 100, playTemplate?.duration || 8000);
            animationEngine.seekTo(newTime);
            setCurrentTime(newTime);
          }}
          onStepBackward={() => {
            const newTime = Math.max(currentTime - 100, 0);
            animationEngine.seekTo(newTime);
            setCurrentTime(newTime);
          }}
          onLoopToggle={() => {
            const newLooping = !isLooping;
            setIsLooping(newLooping);
            if (animationEngine) {
              animationEngine.setLoop(newLooping);
            }
          }}
        />
      )}

      
      {/* Player Editor Dialog */}
      {showPlayerEditor && selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowPlayerEditor(false)}>
          <div className="bg-white rounded-lg p-6 min-w-[400px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Edit Player</h3>
            {(() => {
              const player = players.find(p => p.id === selectedPlayer);
              if (!player) return null;
              
              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Player Number</label>
                    <input
                      type="number"
                      value={player.number}
                      onChange={(e) => {
                        const newNumber = parseInt(e.target.value) || 0;
                        setPlayers(prevPlayers => 
                          prevPlayers.map(p => 
                            p.id === selectedPlayer 
                              ? { ...p, number: newNumber }
                              : p
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="99"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Position</label>
                    <select
                      value={player.position}
                      onChange={(e) => {
                        const newPosition = e.target.value as any;
                        setPlayers(prevPlayers => 
                          prevPlayers.map(p => 
                            p.id === selectedPlayer 
                              ? { ...p, position: newPosition }
                              : p
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="C">Center (C)</option>
                      <option value="LW">Left Wing (LW)</option>
                      <option value="RW">Right Wing (RW)</option>
                      <option value="LD">Left Defense (LD)</option>
                      <option value="RD">Right Defense (RD)</option>
                      <option value="G">Goalie (G)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Team</label>
                    <select
                      value={player.team}
                      onChange={(e) => {
                        const newTeam = e.target.value as 'home' | 'away';
                        setPlayers(prevPlayers => 
                          prevPlayers.map(p => 
                            p.id === selectedPlayer 
                              ? { ...p, team: newTeam }
                              : p
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="home">Home</option>
                      <option value="away">Away</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPlayerEditor(false)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        console.log('Player updated:', player);
                        setShowPlayerEditor(false);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}