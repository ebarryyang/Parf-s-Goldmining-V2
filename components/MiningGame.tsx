
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Hammer, Volume2, VolumeX, Star, Zap, ArrowUp } from 'lucide-react';
import { UserStats, GameProgress, Pet } from '../types';
import { LEVELS, COINS_TO_PASS_LEVEL, MAMMALS, POP_CULTURE, TREASURES, COINS_PER_DIG, MAX_DAILY_STAMINA } from '../constants';

interface MiningGameProps {
  stats: UserStats;
  progress: GameProgress;
  onClose: () => void;
  onUpdateStats: (newStats: UserStats) => void;
  onUpdateProgress: (newProgress: GameProgress) => void;
  onFindPet: (pet: Pet) => void;
}

// Physics Constants
const GRAVITY = 0.6;
const SPEED = 5;
const JUMP_FORCE = -14;
const TILE_SIZE = 40;

// Particle Interface
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 0 to 1
}

interface Cloud {
    x: number;
    y: number;
    w: number;
    speed: number;
}

interface RewardInfo {
    name: string;
    icon: string;
    rarity: number;
    type: 'GOLD' | 'PET' | 'ITEM';
}

const MiningGame: React.FC<MiningGameProps> = ({ 
  stats, 
  progress, 
  onClose, 
  onUpdateStats, 
  onUpdateProgress,
  onFindPet
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cheerRef = useRef<HTMLAudioElement>(null);

  const [gameState, setGameState] = useState<'PLAYING' | 'MSG' | 'REWARD' | 'DIGGING'>('PLAYING');
  const [message, setMessage] = useState('');
  const [msgColor, setMsgColor] = useState('white');
  const [rewardItem, setRewardItem] = useState<RewardInfo | null>(null);
  const [localCoins, setLocalCoins] = useState(progress.levelCoinsFound); // Current level accumulator
  const [localShovels, setLocalShovels] = useState(stats.shovels);
  const [localStamina, setLocalStamina] = useState(stats.stamina || 0); // Local Stamina State
  const [isMuted, setIsMuted] = useState(false);
  
  // Track pressed state for visual feedback on virtual buttons
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  // Game Engine State
  const playerRef = useRef({ 
    x: 100, y: 100, vx: 0, vy: 0, 
    width: 32, height: 44, 
    grounded: false, facingRight: true,
    animFrame: 0,
    action: 'IDLE' as 'IDLE' | 'RUN' | 'JUMP' | 'DIG',
    digTimer: 0 // 0 to 30 frames
  });
  
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const levelMapRef = useRef<{x: number, y: number, w: number, h: number, type: 'ground' | 'platform' | 'obstacle' | 'wall' | 'npc', npcType?: string, animOffset?: number, decoration?: string}[]>([]);
  const cameraRef = useRef({ x: 0 });
  const gameLoopRef = useRef<number>(0);
  const globalTimeRef = useRef(0);
  
  const currentLevelData = LEVELS[progress.currentLevelIndex];

  // Toggle Music
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    }
  };

  // Start Music on mount
  useEffect(() => {
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => setIsMuted(true)); 
    }
  }, []);

  // Reset local coins when level index changes (Next Level)
  useEffect(() => {
      setLocalCoins(progress.levelCoinsFound);
      generateLevel();
  }, [progress.currentLevelIndex]);

  // Generate Clouds
  useEffect(() => {
      const isSpace = currentLevelData.theme === 'space' || currentLevelData.theme === 'mars';
      if (!isSpace) {
          const clouds: Cloud[] = [];
          for(let i=0; i<10; i++) {
              clouds.push({
                  x: Math.random() * 2000,
                  y: Math.random() * 300,
                  w: 60 + Math.random() * 80,
                  speed: 0.2 + Math.random() * 0.3
              });
          }
          cloudsRef.current = clouds;
      } else {
          cloudsRef.current = [];
      }
  }, [currentLevelData]);

  // Helper to spawn particles
  const spawnParticles = (x: number, y: number, count: number, colors: string[]) => {
      for(let i=0; i<count; i++) {
          particlesRef.current.push({
              x, 
              y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 1) * 8 - 2,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: Math.random() * 4 + 2,
              life: 1.0
          });
      }
  };

  // Helper to get NPC type based on theme
  const getThemeNPC = (theme: string) => {
      const rand = Math.random();
      if (theme === 'desert' || theme === 'egypt') {
          if (rand < 0.3) return 'pharaoh';
          if (rand < 0.6) return 'resident';
          return 'camel';
      }
      if (theme === 'space' || theme === 'mars') {
          if (rand < 0.5) return 'alien';
          return 'spaceship';
      }
      if (theme === 'city') return rand < 0.5 ? 'car' : 'resident';
      if (theme === 'snow') return 'penguin';
      if (theme === 'jungle') return 'snake';
      if (theme === 'coast' || theme === 'beach' || theme === 'island') return 'crab';
      
      return 'slime'; // Generic
  };

  // Helper to get Plants/Decoration type based on theme
  const getThemePlant = (theme: string) => {
      const rand = Math.random();
      if (theme === 'desert' || theme === 'egypt' || theme === 'canyon' || theme === 'ancient') return rand < 0.5 ? 'cactus' : 'dry_bush';
      if (theme === 'snow') return 'pine_tree';
      if (theme === 'beach' || theme === 'island' || theme === 'coast') return 'palm_tree';
      if (theme === 'field') return 'lavender';
      if (theme === 'jungle' || theme === 'forest' || theme === 'grassland') return rand < 0.3 ? 'flower' : (rand < 0.6 ? 'grass' : 'bush');
      if (theme === 'city') return rand < 0.5 ? 'trash_can' : 'hydrant'; // Urban "plants"
      return null;
  };

  // Procedural Level Generation - ENDLESS STYLE
  const generateLevel = useCallback(() => {
    const map: typeof levelMapRef.current = [];
    const groundY = 500;
    // Make level massive so player can keep walking until 800 coins
    const levelLength = 50000; 
    const theme = currentLevelData.theme || 'grassland';

    // 1. Continuous Floor with Decorations
    for (let x = -500; x < levelLength + 500; x += TILE_SIZE) {
        const block: any = { x, y: groundY, w: TILE_SIZE, h: TILE_SIZE, type: 'ground' };
        
        // Add random decoration (plant) on top of ground blocks
        // Space/Mars usually has rocks instead of plants, but handled via getThemePlant returning null or specific
        if (Math.random() < 0.25) {
            const plantType = getThemePlant(theme);
            if (plantType) {
                block.decoration = plantType;
            } else if (theme === 'space' || theme === 'mars') {
                 if (Math.random() < 0.1) block.decoration = 'rock';
            }
        }
        map.push(block);
    }

    // 2. Platforms & Obstacles / NPCs
    let x = 600;
    while(x < levelLength - 400) {
        const gap = 200 + Math.random() * 300;
        x += gap;

        // Platform Chance
        if (Math.random() < 0.6) {
             const h = Math.random() > 0.5 ? 120 : 220;
             const w = TILE_SIZE * (3 + Math.floor(Math.random() * 3));
             map.push({ x, y: groundY - h, w, h: 20, type: 'platform' });
             
             // Item on platform
             if (Math.random() < 0.3) {
                 const npcType = getThemeNPC(theme);
                 map.push({ x: x + w/2 - 20, y: groundY - h - 40, w: 40, h: 40, type: 'npc', npcType, animOffset: Math.random() * 100 });
             }
        } else {
             // Ground NPC/Obstacle
             const npcType = getThemeNPC(theme);
             let w = 40, h = 40;
             if (npcType === 'camel') { w = 60; h = 50; }
             if (npcType === 'car') { w = 70; h = 35; }
             if (npcType === 'spaceship') { w = 60; h = 40; }

             map.push({ x, y: groundY - h, w, h, type: 'npc', npcType, animOffset: Math.random() * 100 });
        }
    }
    
    // Walls at very ends
    map.push({ x: -40, y: -1000, w: 40, h: 2000, type: 'wall' });
    map.push({ x: levelLength, y: -1000, w: 40, h: 2000, type: 'wall' });

    levelMapRef.current = map;
    playerRef.current = { ...playerRef.current, x: 100, y: 300, vx: 0, vy: 0, action: 'IDLE' };
    cameraRef.current.x = 0;
  }, [currentLevelData]);

  // Start Dig Animation
  const startDig = () => {
      if (playerRef.current.action === 'DIG' || gameState === 'REWARD' || gameState === 'MSG') return;
      
      if (!playerRef.current.grounded) {
          showMessage("只能在地面挖掘!", '#FF8888');
          return;
      }

      // Check Stamina
      if (localStamina <= 0) {
          showMessage("今日体力已耗尽!", '#FF4500');
          return;
      }
      
      playerRef.current.action = 'DIG';
      playerRef.current.digTimer = 0;
      setGameState('DIGGING');
  };

  // Resolve Dig Result (Called after animation)
  const resolveDig = () => {
      // Consume 1 Stamina per attempt
      const newStamina = Math.max(0, localStamina - 1);
      setLocalStamina(newStamina);

      const rand = Math.random() * 100;
      let resultType: 'GOLD' | 'ITEM' | 'PET' | 'NOTHING' = 'NOTHING';
      
      // Probability Distribution
      if (rand < 40) resultType = 'GOLD';
      else if (rand < 60) resultType = 'ITEM';
      else if (rand < 70) resultType = 'PET';
      else resultType = 'NOTHING';
      
      let newTotalCoins = stats.coins;
      const p = playerRef.current;
      
      // Particles
      if (resultType === 'GOLD') {
           spawnParticles(p.x + (p.facingRight ? 32 : 0), p.y + 32, 10, ['#FFD700', '#FFA500', '#FFFFFF']);
      } else if (resultType === 'NOTHING') {
           spawnParticles(p.x + (p.facingRight ? 32 : 0), p.y + 32, 5, ['#8B4513', '#A0522D']);
      } else {
           spawnParticles(p.x + (p.facingRight ? 32 : 0), p.y + 32, 12, ['#FF69B4', '#00BFFF', '#7FFF00']);
      }

      // Logic Handling based on result
      if (resultType === 'GOLD') {
          // Requirement: Stamina AND Shovel needed for Gold
          if (localShovels > 0) {
              const newShovels = localShovels - 1;
              const newCoins = localCoins + COINS_PER_DIG; 
              setLocalShovels(newShovels);
              setLocalCoins(newCoins);
              newTotalCoins += COINS_PER_DIG;
              
              onUpdateStats({ shovels: newShovels, coins: newTotalCoins, stamina: newStamina });
              
              // Only update progress if we haven't passed level yet
              if (newCoins < COINS_TO_PASS_LEVEL) {
                  onUpdateProgress({ ...progress, levelCoinsFound: newCoins });
                  showReward({ name: `${COINS_PER_DIG} 金币`, icon: '💰', rarity: 1, type: 'GOLD' });
              } else {
                  // LEVEL COMPLETE TRIGGER
                  onUpdateProgress({ currentLevelIndex: (progress.currentLevelIndex + 1) % LEVELS.length, levelCoinsFound: 0 });
                  setLocalCoins(800); // Visual clamp
                  showReward({ name: "LEVEL CLEARED!", icon: '🏁', rarity: 5, type: 'GOLD' });
                  setTimeout(() => {
                    showMessage("进入下一关!", "#00FF00");
                  }, 1500);
              }

          } else {
              // Found gold but no shovel
              onUpdateStats({ ...stats, stamina: newStamina }); // Still sync stamina
              showMessage("发现金币但没有铲子!", '#FFD700');
          }
      } else if (resultType === 'PET' || resultType === 'ITEM') {
          // Pet/Item only require stamina (which is already checked and consumed)
          onUpdateStats({ ...stats, stamina: newStamina });

          let list: any[] = [];
          let category: any = 'MAMMAL';
          
          if (resultType === 'PET') {
              list = MAMMALS;
              category = 'MAMMAL';
          } else {
              const subRand = Math.random();
              if (subRand < 0.5) {
                  list = POP_CULTURE;
                  category = 'POP_CULTURE';
              } else {
                  list = TREASURES;
                  category = 'TREASURE';
              }
          }

          const item = list[Math.floor(Math.random() * list.length)];
          const rarity = (item as any).rarity || 1; 
          
          const newPet: Pet = {
              id: Date.now().toString(),
              name: item.name,
              icon: item.icon,
              category,
              rarity,
              description: category === 'MAMMAL' ? item.region : "稀有收藏",
              obtainedAt: Date.now()
          };

          onFindPet(newPet);
          showReward({ name: item.name, icon: item.icon, rarity, type: resultType });
      } else {
          // Nothing found
          onUpdateStats({ ...stats, stamina: newStamina });
          showMessage("这里空空如也...", '#AAAAAA');
      }

      playerRef.current.action = 'IDLE';
      setGameState(prev => prev === 'REWARD' ? 'REWARD' : 'PLAYING');
  };

  const showReward = (item: RewardInfo) => {
      setRewardItem(item);
      setGameState('REWARD');
      
      // Play sound
      if (!isMuted && cheerRef.current) {
          cheerRef.current.currentTime = 0;
          cheerRef.current.volume = 0.6;
          cheerRef.current.play().catch(e => console.log(e));
      }
      
      // Display time
      setTimeout(() => {
          setGameState('PLAYING');
          setRewardItem(null);
      }, 3000);
  };

  const showMessage = (msg: string, color: string) => {
      setMessage(msg);
      setMsgColor(color);
      if (gameState === 'PLAYING') {
        setGameState('MSG');
        setTimeout(() => {
            setGameState(prev => prev === 'MSG' ? 'PLAYING' : prev);
            setMessage('');
        }, 1200);
      }
  };

  const update = () => {
      globalTimeRef.current += 1;
      
      // Update Particles
      particlesRef.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.4; // Gravity
          p.vx *= 0.95; // Friction
          p.life -= 0.03;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Update Clouds
      cloudsRef.current.forEach(c => {
          c.x -= c.speed;
          if (c.x + c.w < cameraRef.current.x - 100) {
              c.x = cameraRef.current.x + 900; // Reset ahead of camera
          }
      });

      // Don't update player physics while showing reward modal
      if (gameState === 'REWARD') return;

      const p = playerRef.current;
      
      // Handle Digging Animation State
      if (p.action === 'DIG') {
          p.digTimer += 1;
          // Spawn dust particles during middle of animation
          if (p.digTimer === 15) {
              spawnParticles(p.x + (p.facingRight ? 24 : 0), p.y + 40, 5, ['#8B4513', '#CD853F']);
          }
          if (p.digTimer > 30) {
              resolveDig();
          }
          return; // Skip movement physics during dig
      }

      const keys = keysRef.current;

      // INSTANT STOP LOGIC: If no key pressed, set vx to 0 immediately
      // This relies on keysRef being accurately updated by touch/mouse events
      if (keys['ArrowRight']) { 
          p.vx = SPEED; 
          p.facingRight = true; 
          p.action = 'RUN'; 
      }
      else if (keys['ArrowLeft']) { 
          p.vx = -SPEED; 
          p.facingRight = false; 
          p.action = 'RUN'; 
      }
      else { 
          p.vx = 0; // Immediate Stop
          if (p.grounded && p.action !== 'DIG') p.action = 'IDLE';
      }

      // Jump Logic
      if (keys['Space'] && p.grounded) {
          p.vy = JUMP_FORCE;
          p.grounded = false;
          p.action = 'JUMP';
      }

      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.grounded = false;

      // Update Animation Frame
      if (p.action === 'RUN') p.animFrame += 0.2;
      else p.animFrame = 0;

      // Collisions
      const map = levelMapRef.current;
      for (let block of map) {
          if (p.x < block.x + block.w && p.x + p.width > block.x &&
              p.y < block.y + block.h && p.y + p.height > block.y) {
                  
                  if (block.type !== 'ground' && block.type !== 'platform' && block.type !== 'wall') continue; // Ignore NPCs for collision

                  // Landing
                  if (p.vy > 0 && p.y + p.height - p.vy <= block.y + 12) { 
                      p.y = block.y - p.height;
                      p.vy = 0;
                      p.grounded = true;
                      if (p.action === 'JUMP') p.action = 'IDLE'; // Land
                  } 
                  // Ceiling
                  else if (p.vy < 0 && p.y - p.vy >= block.y + block.h - 10) {
                      p.y = block.y + block.h;
                      p.vy = 0;
                  }
                  // Horizontal
                  else if (p.vx > 0) {
                      p.x = block.x - p.width;
                      p.vx = 0;
                  }
                  else if (p.vx < 0) {
                      p.x = block.x + block.w;
                      p.vx = 0;
                  }
              }
      }

      if (p.y > 1000) {
          p.y = 100; p.vy = 0; 
      }

      cameraRef.current.x = p.x - 300;
      if (cameraRef.current.x < 0) cameraRef.current.x = 0;
  };

  // 3D Rabbit Drawing Function
  const draw3DRabbit = (ctx: CanvasRenderingContext2D, x: number, y: number, facingRight: boolean, frame: number, action: string, digTimer: number) => {
    ctx.save();
    ctx.translate(x + 16, y + 22);
    if (!facingRight) ctx.scale(-1, 1);
    
    let hop = 0;
    let armRot = 0;
    let bodyRot = 0;

    if (action === 'RUN') {
        hop = Math.sin(frame) * 4;
        armRot = Math.sin(frame) * 0.5;
        bodyRot = 0.1;
    } else if (action === 'JUMP') {
        hop = -5;
        armRot = -0.5;
    } else if (action === 'DIG') {
        if (digTimer < 10) {
            armRot = -1.5 * (digTimer / 10);
            bodyRot = -0.2 * (digTimer / 10);
        } else if (digTimer < 20) {
            armRot = 1.0; 
            bodyRot = 0.3;
            hop = 2; // Compress
        } else {
            armRot = 0.5;
            bodyRot = 0;
        }
    }

    ctx.rotate(bodyRot);

    // Ears
    ctx.save(); ctx.translate(-5, -35 + hop/2); ctx.rotate(-0.1 + (action==='RUN' ? Math.cos(frame)*0.1 : 0));
    let earGrad = ctx.createRadialGradient(-3, -10, 2, 0, 0, 15);
    earGrad.addColorStop(0, '#E0E0E0'); earGrad.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = earGrad; ctx.beginPath(); ctx.ellipse(0, 0, 5, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFB7B2'; ctx.beginPath(); ctx.ellipse(0, 2, 2.5, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    ctx.save(); ctx.translate(5, -35 + hop/2); ctx.rotate(0.1 + (action==='RUN' ? -Math.cos(frame)*0.1 : 0));
    earGrad = ctx.createRadialGradient(-3, -10, 2, 0, 0, 15);
    earGrad.addColorStop(0, '#E0E0E0'); earGrad.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = earGrad; ctx.beginPath(); ctx.ellipse(0, 0, 5, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFB7B2'; ctx.beginPath(); ctx.ellipse(0, 2, 2.5, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // Body
    const bodyGrad = ctx.createRadialGradient(-5, -5, 5, 0, 5, 20);
    bodyGrad.addColorStop(0, '#F5F5F5'); bodyGrad.addColorStop(1, '#BDBDBD');
    ctx.fillStyle = bodyGrad; ctx.beginPath(); ctx.ellipse(0, 10 + hop/2, 12, 16, 0, 0, Math.PI * 2); ctx.fill();

    // Belly
    const bellyGrad = ctx.createRadialGradient(0, 10, 2, 0, 12, 8);
    bellyGrad.addColorStop(0, '#FFFFFF'); bellyGrad.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = bellyGrad; ctx.beginPath(); ctx.ellipse(0, 12 + hop/2, 7, 10, 0, 0, Math.PI * 2); ctx.fill();

    // Head
    const headGrad = ctx.createRadialGradient(-5, -20, 5, 0, -15, 18);
    headGrad.addColorStop(0, '#F5F5F5'); headGrad.addColorStop(1, '#9E9E9E');
    ctx.fillStyle = headGrad; ctx.beginPath(); ctx.arc(0, -15 + hop/2, 14, 0, Math.PI * 2); ctx.fill();

    // Face
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(-5, -10 + hop/2, 5, 0, Math.PI * 2); ctx.arc(5, -10 + hop/2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(-4, -18 + hop/2, 4, 6, 0, 0, Math.PI * 2); ctx.ellipse(4, -18 + hop/2, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(-3, -18 + hop/2, 2, 0, Math.PI * 2); ctx.arc(3, -18 + hop/2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FF8A80"; ctx.beginPath(); ctx.ellipse(0, -12 + hop/2, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();

    // Feet
    const footGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
    footGrad.addColorStop(0, '#FFF'); footGrad.addColorStop(1, '#CCC');
    ctx.fillStyle = footGrad;
    ctx.save(); ctx.translate(-8, 24 - (action==='RUN' ? hop : 0)); ctx.beginPath(); ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(8, 24 + (action==='RUN' ? hop : 0)); ctx.beginPath(); ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // Tail
    ctx.fillStyle = "#FFF"; ctx.beginPath(); ctx.arc(-10, 18 + hop/2, 5, 0, Math.PI * 2); ctx.fill();

    // Shovel
    ctx.save(); ctx.translate(12, 5 + hop/2); ctx.rotate(armRot);
    ctx.fillStyle = "#8D6E63"; ctx.fillRect(-2, -10, 4, 20);
    const bladeGrad = ctx.createLinearGradient(-5, 10, 5, 16);
    bladeGrad.addColorStop(0, '#FDD835'); bladeGrad.addColorStop(1, '#F57F17');
    ctx.fillStyle = bladeGrad; ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(6, 10); ctx.lineTo(4, 20); ctx.lineTo(0, 22); ctx.lineTo(-4, 20); ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.restore();
  };

  const drawDecoration = (ctx: CanvasRenderingContext2D, type: string, x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      if (type === 'cactus') {
          ctx.fillStyle = "#2E8B57";
          ctx.fillRect(-6, -30, 12, 30);
          ctx.fillRect(-14, -22, 8, 8);
          ctx.fillRect(6, -26, 8, 8);
      } else if (type === 'flower') {
          ctx.fillStyle = "green"; ctx.fillRect(-2, -10, 4, 10);
          ctx.fillStyle = "pink"; ctx.beginPath(); ctx.arc(0, -12, 6, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "yellow"; ctx.beginPath(); ctx.arc(0, -12, 2, 0, Math.PI*2); ctx.fill();
      } else if (type === 'rock') {
          ctx.fillStyle = "#888";
          ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI, true); ctx.fill();
      } else if (type === 'grass') {
          ctx.fillStyle = "#32CD32";
          ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(-2,-10); ctx.lineTo(0,0); ctx.lineTo(2,-8); ctx.lineTo(5,0); ctx.fill();
      }
      ctx.restore();
  };

  const drawNPC = (ctx: CanvasRenderingContext2D, type: string, x: number, y: number, w: number, h: number, offset: number) => {
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      
      const bounce = Math.sin((globalTimeRef.current + offset) * 0.1) * 3;
      ctx.translate(0, bounce);

      if (type === 'slime') {
          ctx.fillStyle = "#00FA9A";
          ctx.beginPath(); ctx.arc(0, 0, 15, Math.PI, 0); ctx.lineTo(15, 10); ctx.lineTo(-15, 10); ctx.fill();
          ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(-5, -2, 2, 0, Math.PI*2); ctx.arc(5, -2, 2, 0, Math.PI*2); ctx.fill();
      } else if (type === 'ghost') {
          ctx.fillStyle = "white";
          ctx.beginPath(); ctx.arc(0, -5, 15, Math.PI, 0); ctx.lineTo(15, 15); ctx.lineTo(-15, 15); ctx.fill();
          ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(-5, -2, 2, 0, Math.PI*2); ctx.arc(5, -2, 2, 0, Math.PI*2); ctx.fill();
      } else {
          // Generic Box for others
          ctx.fillStyle = "#FF6347";
          ctx.fillRect(-w/2 + 5, -h/2 + 5, w - 10, h - 10);
          ctx.fillStyle = "white";
          ctx.fillRect(-10, -5, 5, 5); ctx.fillRect(5, -5, 5, 5);
      }
      ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky
    const bg = currentLevelData.bg || '#87CEEB';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    cloudsRef.current.forEach(c => {
        ctx.beginPath();
        ctx.ellipse(c.x - cameraRef.current.x, c.y, c.w / 2, c.w / 3, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Map
    const cx = cameraRef.current.x;
    levelMapRef.current.forEach(block => {
        if (block.x - cx > canvas.width || block.x + block.w - cx < 0) return; // Culling

        // Draw Block
        if (block.type === 'ground' || block.type === 'platform') {
             // Theme colors
             ctx.fillStyle = currentLevelData.ground || '#228B22';
             ctx.fillRect(block.x - cx, block.y, block.w, block.h);
             
             // Top Highlight
             ctx.fillStyle = "rgba(255,255,255,0.2)";
             ctx.fillRect(block.x - cx, block.y, block.w, 4);
             
             // Decoration
             if (block.decoration) {
                 drawDecoration(ctx, block.decoration, block.x - cx + block.w/2, block.y);
             }
        } 
        else if (block.type === 'npc') {
            drawNPC(ctx, block.npcType || 'slime', block.x - cx, block.y, block.w, block.h, block.animOffset || 0);
        }
        else if (block.type === 'wall') {
            ctx.fillStyle = '#000';
            ctx.fillRect(block.x - cx, block.y, block.w, block.h);
        }
    });

    // Player
    const p = playerRef.current;
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(p.x - cx + 16, p.y + 40, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    draw3DRabbit(ctx, p.x - cx, p.y, p.facingRight, p.animFrame, p.action, p.digTimer);

    // Particles
    particlesRef.current.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.life;
        ctx.beginPath();
        ctx.arc(pt.x - cx, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
    
    // Scanlines Effect
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for(let i=0; i<canvas.height; i+=4) {
        ctx.fillRect(0, i, canvas.width, 1);
    }
  };

  // Game Loop & Input Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        keysRef.current[e.code] = true; 
        setActiveBtn(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
        keysRef.current[e.code] = false; 
        setActiveBtn(null);
    };
    const handleDigInput = (e: KeyboardEvent) => {
        if (e.code === 'KeyA') startDig();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleDigInput);

    const loop = () => {
        update();
        draw();
        gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('keydown', handleDigInput);
        cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, progress.currentLevelIndex, localStamina]);

  // Robust Input Handlers using Pointer Events for Mobile
  const handlePointerDown = (e: React.PointerEvent, code: string) => {
      e.preventDefault(); // Prevent default touch actions
      e.currentTarget.setPointerCapture(e.pointerId); // Capture pointer events
      keysRef.current[code] = true;
      setActiveBtn(code);
      
      if (code === 'KeyA') startDig();
      if (code === 'Space' && playerRef.current.grounded) {
          playerRef.current.vy = JUMP_FORCE;
          playerRef.current.grounded = false;
          playerRef.current.action = 'JUMP';
      }
  };

  const handlePointerUp = (e: React.PointerEvent, code: string) => {
      e.preventDefault();
      e.currentTarget.releasePointerCapture(e.pointerId);
      keysRef.current[code] = false;
      setActiveBtn(null);
  };

  /* Left Controller Component */
  const DPad = () => (
    <div className="w-24 md:w-32 h-full flex flex-col justify-center items-center shrink-0 mr-2 md:mr-4 select-none touch-none" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <div className="relative w-32 h-32 md:w-40 md:h-40">
            <div className="absolute top-1/3 left-0 w-full h-1/3 bg-[#1a1a1a] rounded-sm shadow-inner"></div>
            <div className="absolute top-0 left-1/3 w-1/3 h-full bg-[#1a1a1a] rounded-sm shadow-inner"></div>
            <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-[#111] rounded-full radial-gradient(circle, #222 0%, #111 100%)"></div>

            <button 
                className={`absolute top-1/3 left-0 w-1/3 h-1/3 bg-[#333] hover:bg-[#444] active:bg-[#222] rounded-l-md flex items-center justify-center touch-none transition-all ${activeBtn === 'ArrowLeft' ? 'translate-y-[2px] shadow-none' : 'shadow-[0_4px_0_#111]'}`}
                style={{ WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
                onPointerDown={(e) => handlePointerDown(e, 'ArrowLeft')}
                onPointerUp={(e) => handlePointerUp(e, 'ArrowLeft')}
                onPointerCancel={(e) => handlePointerUp(e, 'ArrowLeft')}
                onPointerLeave={(e) => handlePointerUp(e, 'ArrowLeft')}
                onContextMenu={(e) => e.preventDefault()}
            >
                <span className="border-t-[10px] border-r-[15px] border-b-[10px] border-transparent border-r-gray-500/50 -ml-1 pointer-events-none"></span>
            </button>

            <button 
                className={`absolute top-1/3 right-0 w-1/3 h-1/3 bg-[#333] hover:bg-[#444] active:bg-[#222] rounded-r-md flex items-center justify-center touch-none transition-all ${activeBtn === 'ArrowRight' ? 'translate-y-[2px] shadow-none' : 'shadow-[0_4px_0_#111]'}`}
                style={{ WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
                onPointerDown={(e) => handlePointerDown(e, 'ArrowRight')}
                onPointerUp={(e) => handlePointerUp(e, 'ArrowRight')}
                onPointerCancel={(e) => handlePointerUp(e, 'ArrowRight')}
                onPointerLeave={(e) => handlePointerUp(e, 'ArrowRight')}
                onContextMenu={(e) => e.preventDefault()}
            >
                <span className="border-t-[10px] border-l-[15px] border-b-[10px] border-transparent border-l-gray-500/50 -mr-1 pointer-events-none"></span>
            </button>
            
            <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-[#333] rounded-t-md shadow-[0_4px_0_#111] pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-[#333] rounded-b-md shadow-[0_4px_0_#111] pointer-events-none"></div>
        </div>
    </div>
  );

  /* Right Controller Component */
  const ActionButtons = () => (
    <div className="w-24 md:w-32 h-full flex flex-col justify-center items-center shrink-0 ml-2 md:ml-4 relative select-none touch-none" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <div className="relative w-32 h-32 md:w-40 md:h-40 rotate-[-15deg]">
            <div className="absolute top-0 right-2 flex flex-col items-center">
                <button 
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-purple-600 border-purple-800 touch-none transition-all flex items-center justify-center select-none ${activeBtn === 'KeyA' ? 'translate-y-[4px] border-b-0' : 'border-b-4 shadow-lg'}`}
                style={{ WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
                onPointerDown={(e) => handlePointerDown(e, 'KeyA')}
                onPointerUp={(e) => handlePointerUp(e, 'KeyA')}
                onPointerCancel={(e) => handlePointerUp(e, 'KeyA')}
                onPointerLeave={(e) => handlePointerUp(e, 'KeyA')}
                onContextMenu={(e) => e.preventDefault()}
                >
                <Zap size={24} className="text-purple-200 pointer-events-none" />
                </button>
                <span className="font-pixel text-gray-400 text-xs font-bold mt-1">A</span>
            </div>

            <div className="absolute bottom-4 left-2 flex flex-col items-center">
                <button 
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-purple-600 border-purple-800 touch-none transition-all flex items-center justify-center select-none ${activeBtn === 'Space' ? 'translate-y-[4px] border-b-0' : 'border-b-4 shadow-lg'}`}
                style={{ WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
                onPointerDown={(e) => handlePointerDown(e, 'Space')}
                onPointerUp={(e) => handlePointerUp(e, 'Space')}
                onPointerCancel={(e) => handlePointerUp(e, 'Space')}
                onPointerLeave={(e) => handlePointerUp(e, 'Space')}
                onContextMenu={(e) => e.preventDefault()}
                >
                <ArrowUp size={28} className="text-purple-200 pointer-events-none" />
                </button>
                <span className="font-pixel text-gray-400 text-xs font-bold mt-1">B</span>
            </div>
        </div>
        
        <div className="absolute bottom-8 right-4 flex gap-1 rotate-[-15deg] opacity-30">
            <div className="w-1 h-8 bg-black rounded-full"></div>
            <div className="w-1 h-8 bg-black rounded-full"></div>
            <div className="w-1 h-8 bg-black rounded-full"></div>
            <div className="w-1 h-8 bg-black rounded-full"></div>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <audio ref={audioRef} loop src="https://assets.mixkit.co/music/preview/mixkit-arcade-retro-run-212.mp3" />
      <audio ref={cheerRef} src="https://assets.mixkit.co/sfx/preview/mixkit-video-game-treasure-2066.mp3" />

      {/* Main Console Container */}
      {/* Mobile: Column (Screen Top, Controls Bottom), Desktop: Row (Left, Screen, Right) */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full h-full p-2 md:p-6 bg-[#2f2f2f] relative select-none">
        
        {/* Desktop Left Controller (Hidden on Mobile) */}
        <div className="hidden md:block">
            <DPad />
        </div>

        {/* Screen Container */}
        <div className="flex-1 w-full md:w-auto aspect-[4/3] max-h-[60vh] md:max-h-full rounded-t-xl md:rounded-xl overflow-hidden shadow-inset-pixel border-[12px] md:border-[20px] border-gray-400 bg-gray-800 relative flex flex-col max-w-[800px] mb-4 md:mb-0">
            <div className="absolute top-1/2 -left-[16px] md:-left-[26px] -translate-y-1/2 w-2 h-8 md:w-3 md:h-12 bg-red-900 rounded-full flex items-center justify-center">
                 <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>
            </div>

            <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain image-pixelated bg-black" />
            
            <div className="absolute top-0 left-0 right-0 p-2 md:p-4 flex justify-between items-start pointer-events-none">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-white font-pixel text-xs md:text-sm drop-shadow-md">
                        <Hammer size={14} className="text-mario-yellow" />
                        <span>x {localShovels}</span>
                    </div>
                    {/* Stamina Display */}
                    <div className="flex items-center gap-2 text-white font-pixel text-xs md:text-sm drop-shadow-md mt-1">
                        <Zap size={14} className="text-blue-400 fill-blue-400" />
                        <span>x {localStamina}</span>
                    </div>

                    <div className="text-white font-pixel text-[10px] md:text-xs opacity-80 mt-1">
                        Lvl {progress.currentLevelIndex + 1}
                    </div>
                 </div>

                 <div className="flex gap-2 pointer-events-auto">
                    <button onClick={toggleMusic} className="bg-black/50 p-1 rounded hover:text-mario-blue text-white">
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <button onClick={onClose} className="bg-black/50 p-1 rounded hover:text-red-500 text-white">
                        <X size={16} />
                    </button>
                 </div>
            </div>

            <div className="absolute bottom-2 right-2 text-mario-yellow font-pixel text-xs drop-shadow-md">
               ${localCoins}/{COINS_TO_PASS_LEVEL}
            </div>

            {gameState === 'REWARD' && rewardItem && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm animate-in zoom-in duration-300">
                    <div className="relative bg-white border-4 border-mario-blue rounded-xl p-4 md:p-8 max-w-sm w-3/4 text-center shadow-[0_0_0_8px_rgba(0,0,0,0.5)] flex flex-col items-center gap-2">
                         <div className="text-6xl md:text-8xl mt-2 filter drop-shadow-md animate-bounce">
                           {rewardItem.icon}
                        </div>
                        <h2 className="text-lg md:text-2xl font-black text-gray-800 font-pixel drop-shadow-sm mt-2">
                           {rewardItem.name}
                        </h2>
                        <div className="flex gap-1 justify-center my-2">
                            {Array.from({length: 5}).map((_, i) => (
                                <Star key={i} size={16} className={i < rewardItem.rarity ? "text-mario-yellow fill-mario-yellow" : "text-gray-300"} />
                            ))}
                        </div>
                        <div className="bg-gray-100 rounded-lg p-2 w-full text-xs font-bold text-gray-500">
                            {rewardItem.type === 'GOLD' ? `+${COINS_PER_DIG} Coins` : '已收录!'}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Desktop Right Controller (Hidden on Mobile) */}
        <div className="hidden md:block">
             <ActionButtons />
        </div>

        {/* Mobile Controls Row (Visible on Mobile, Hidden on Desktop) */}
        <div className="flex md:hidden w-full justify-between items-center px-4 pb-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            <DPad />
            {/* Branding in middle of controller for mobile */}
            <div className="flex-1 text-center font-pixel text-[10px] text-gray-500 opacity-50">
                GAME BOY<br/>V2.0
            </div>
            <ActionButtons />
        </div>

      </div>
    </div>
  );
};

export default MiningGame;
