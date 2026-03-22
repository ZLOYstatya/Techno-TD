import { GameLoop } from './GameLoop.js';
import { Grid } from './Grid.js';
import { WaveManager } from './WaveManager.js';
import { Tower } from './Tower.js';
import { GameConfig } from './Config.js'; 
import { ProgressionSystem } from './Maps.js';

const TOWERS_DB = [
    { id: 'kinetic', name: 'Пушка', cost: 100, unlock: 1, color: '#00ffcc', desc: 'Базовая скорострельная пушка.' },
    { id: 'rapid', name: 'Пулемет', cost: 150, unlock: 10, color: '#aaaaaa', desc: 'Бешеная скорость стрельбы.' },
    { id: 'laser', name: 'Лазер', cost: 200, unlock: 20, color: '#ff0055', desc: 'Замедляет врагов на 30%.' },
    { id: 'missile', name: 'Ракеты', cost: 300, unlock: 30, color: '#ff8800', desc: 'Огромный радиус поражения.' },
    { id: 'sniper', name: 'Снайпер', cost: 400, unlock: 40, color: '#ffffff', desc: 'Колоссальный урон на дистанции.' },
    { id: 'tesla', name: 'Тесла', cost: 500, unlock: 50, color: '#ffff00', desc: 'Бьет током сразу группу врагов.' },
    { id: 'plasma', name: 'Плазма', cost: 700, unlock: 60, color: '#cc00ff', desc: 'Идеально против тяжелой брони.' },
    { id: 'cryo', name: 'Крио', cost: 1000, unlock: 70, color: '#00ffff', desc: 'Замораживает врагов на 60%.' },
    { id: 'gauss', name: 'Гаусс', cost: 1500, unlock: 80, color: '#00ff00', desc: 'Пробивает врагов насквозь.' },
    { id: 'nuke', name: 'Ядерка', cost: 3000, unlock: 90, color: '#ff0000', desc: 'Ультимативное оружие.' }
];

class SoundFX {
    constructor() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    play(type) {
        if(this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;
        if(type === 'shoot') {
            osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
            gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'build') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        }
    }
}

export class Game {
    constructor() {
        this.bgCanvas = document.getElementById('bg-layer'); this.bgCtx = this.bgCanvas.getContext('2d');
        this.dynamicCanvas = document.getElementById('dynamic-layer'); this.dynamicCtx = this.dynamicCanvas.getContext('2d');
        this.uiCanvas = document.getElementById('ui-layer'); 
        this.grid = new Grid(); this.waveManager = new WaveManager();
        this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));
        this.sfx = null;
        this.maxUnlockedLevel = parseInt(localStorage.getItem('technoMagic_maxLvl')) || 0; 
        
        this.isGameOver = false; this.isVictory = false; this.isMenu = true; this.isPaused = false;
        this.selectedTowerType = null; this.focusedTower = null; 
        this.gameTime = 0;
        this.gameSpeed = 1; // Множитель скорости

        this.bindEvents();
    }

    bindEvents() {
        // Главное меню
        document.getElementById('btn-play').addEventListener('pointerdown', () => {
            if(!this.sfx) { this.sfx = new SoundFX(); window.playSound = (t) => this.sfx.play(t); }
            document.getElementById('start-menu').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
            this.renderLevels();
        });
        document.getElementById('btn-exit').addEventListener('pointerdown', () => { alert("Закройте вкладку :)"); });
        document.getElementById('btn-back-to-start').addEventListener('pointerdown', () => {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('start-menu').classList.remove('hidden');
        });

        // Регулятор скорости
        const speedBtn = document.getElementById('btn-speed');
        speedBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if(this.gameSpeed === 1) this.gameSpeed = 2;
            else if(this.gameSpeed === 2) this.gameSpeed = 4;
            else if(this.gameSpeed === 4) this.gameSpeed = 0.5;
            else this.gameSpeed = 1;
            speedBtn.innerText = 'x' + this.gameSpeed;
        });

        // Пауза и Рестарт
        document.getElementById('btn-pause').addEventListener('pointerdown', (e) => {
            e.stopPropagation(); this.isPaused = true; 
            document.getElementById('pause-menu').classList.remove('hidden');
        });
        document.getElementById('btn-resume').addEventListener('pointerdown', () => {
            this.isPaused = false; document.getElementById('pause-menu').classList.add('hidden');
        });
        document.getElementById('btn-restart').addEventListener('pointerdown', () => {
            this.isPaused = false; document.getElementById('pause-menu').classList.add('hidden');
            this.loadLevel(this.currentLevelIndex);
        });
        document.getElementById('btn-quit').addEventListener('pointerdown', () => { location.reload(); });

        document.getElementById('btn-unlock-ok').addEventListener('pointerdown', () => {
            document.getElementById('unlock-modal').classList.add('hidden'); 
            this.isPaused = false;
        });

        this.uiCanvas.addEventListener('pointerdown', this.handleInput.bind(this));
    }

    renderLevels() {
        const grid = document.getElementById('levels-grid'); grid.innerHTML = '';
        for(let i=0; i<100; i++) {
            const b = document.createElement('button'); b.className = 'level-btn'; b.innerText = i+1;
            if(i > this.maxUnlockedLevel) b.style.opacity = 0.2;
            else b.addEventListener('pointerdown', () => {
                document.getElementById('main-menu').classList.add('hidden');
                this.isMenu = false; this.loadLevel(i); this.loop.start();
            });
            grid.appendChild(b);
        }
    }

    loadLevel(idx) {
        this.currentLevelIndex = idx; this.currentMap = ProgressionSystem.generateLevel(idx);
        this.energy = 800; this.baseHp = 20; this.towers = []; this.projectiles = [];
        this.waveManager.reset(); this.waveManager.loadWaves(this.currentMap.waves);
        this.grid.loadMap(this.currentMap); this.renderStatic();
        
        this.isGameOver = false; this.isVictory = false; this.isPaused = false;
        this.gameSpeed = 1; 
        document.getElementById('btn-speed').innerText = 'x1';
        document.getElementById('btn-pause').classList.remove('hidden');
        document.getElementById('btn-speed').classList.remove('hidden');
        this.updateTowerUI();
        
        setTimeout(() => { if(!this.isPaused && !this.isMenu) this.waveManager.startNextWave(this.currentMap.waypoints); }, 2000);
    }

    updateTowerUI() {
        const p = document.getElementById('ui-panel'); p.innerHTML = '';
        TOWERS_DB.forEach(t => {
            if (this.maxUnlockedLevel + 1 >= t.unlock) {
                const b = document.createElement('div'); b.className = 'tower-btn';
                if(this.selectedTowerType === t.id) b.classList.add('selected');
                b.innerHTML = `<div class="tower-icon" style="background-color:${t.color}"></div>
                               <div class="tower-info">${t.name}<br><span class="tower-cost">${t.cost}⚡</span></div>`;
                b.addEventListener('pointerdown', (e) => {
                    e.stopPropagation();
                    this.selectedTowerType = (this.selectedTowerType === t.id) ? null : t.id;
                    this.focusedTower = null; this.updateTowerUI();
                });
                p.appendChild(b);
            }
        });
    }

    handleInput(e) {
        // ЕСЛИ ПОБЕДА ИЛИ ПОРАЖЕНИЕ - ЛЮБОЙ КЛИК ПРОДОЛЖАЕТ
        if (this.isVictory) { 
            this.initUI_next(); // Костыль для перехода
            this.loadLevel(this.currentLevelIndex + 1); 
            return; 
        }
        if (this.isGameOver) { location.reload(); return; }

        if(this.isMenu || this.isPaused) return;
        const rect = this.uiCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.uiCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.uiCanvas.height / rect.height);
        const gx = Math.floor(x / GameConfig.grid.cellSize);
        const gy = Math.floor(y / GameConfig.grid.cellSize);
        
        if(gx < 0 || gx >= 25 || gy < 0 || gy >= 15) return;

        const cell = this.grid.cells[gx][gy];
        if(cell === 4) {
            const t = this.towers.find(t => t.gridX === gx && t.gridY === gy);
            if(this.focusedTower === t) {
                if(t.upgradeCost && this.energy >= t.upgradeCost) {
                    this.energy -= t.upgradeCost; t.upgrade(); if(this.sfx) this.sfx.play('build');
                }
            } else { this.focusedTower = t; this.selectedTowerType = null; this.updateTowerUI(); }
            return;
        }

        this.focusedTower = null;
        if(this.selectedTowerType && cell === 0) {
            const cfg = TOWERS_DB.find(t => t.id === this.selectedTowerType);
            if(this.energy >= cfg.cost) {
                this.energy -= cfg.cost; this.grid.cells[gx][gy] = 4;
                this.towers.push(new Tower(gx, gy, this.selectedTowerType));
                if(this.sfx) this.sfx.play('build'); this.renderStatic();
            }
        }
    }

    initUI_next() {
        document.getElementById('btn-pause').classList.add('hidden');
        document.getElementById('btn-speed').classList.add('hidden');
    }

    update(realDt) {
        if(this.isPaused || this.isMenu || this.isGameOver || this.isVictory) return;
        
        // ПРИМЕНЯЕМ СКОРОСТЬ ИГРЫ
        const dt = realDt * this.gameSpeed;
        
        this.gameTime += dt;
        const res = this.waveManager.update(dt);
        this.energy += res.energyGained; this.baseHp -= res.baseDamage;
        
        if(this.baseHp <= 0) { this.isGameOver = true; return; }
        
        if(this.waveManager.isAllCleared) {
            this.isVictory = true;
            if(this.currentLevelIndex >= this.maxUnlockedLevel) {
                this.maxUnlockedLevel++; localStorage.setItem('technoMagic_maxLvl', this.maxUnlockedLevel);
                const nextT = TOWERS_DB.find(t => t.unlock === this.maxUnlockedLevel + 1);
                if(nextT) {
                    this.isPaused = true; 
                    document.getElementById('unlock-modal').classList.remove('hidden');
                    document.getElementById('unlock-name').innerText = nextT.name;
                    document.getElementById('unlock-desc').innerText = nextT.desc;
                    document.getElementById('unlock-icon').style.backgroundColor = nextT.color;
                }
            }
            return;
        }
        this.towers.forEach(t => t.update(dt, this.waveManager.activeEnemies, this.projectiles));
        for(let i=this.projectiles.length-1; i>=0; i--) {
            this.projectiles[i].update(dt); if(this.projectiles[i].isDestroyed) this.projectiles.splice(i,1);
        }
    }

    renderStatic() { this.bgCtx.clearRect(0,0,1000,600); this.grid.render(this.bgCtx); }

    render() {
        if(this.isMenu) return;
        this.dynamicCtx.clearRect(0,0,1000,600);
        this.towers.forEach(t => t.render(this.dynamicCtx, t === this.focusedTower));
        this.waveManager.render(this.dynamicCtx);
        this.projectiles.forEach(p => p.render(this.dynamicCtx));
        this.renderCore(this.dynamicCtx); this.renderHUD(this.dynamicCtx);
        if(this.isGameOver) this.drawEnd(this.dynamicCtx, "ПОРАЖЕНИЕ", "#ff0055");
        if(this.isVictory) this.drawEnd(this.dynamicCtx, "ПОБЕДА", "#00ffcc");
    }

    renderCore(ctx) {
        const cs = GameConfig.grid.cellSize; const cx = this.currentMap.base.x * cs + cs/2; const cy = this.currentMap.base.y * cs + cs/2;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.gameTime);
        ctx.shadowBlur = 20; ctx.shadowColor = '#00ffcc';
        ctx.fillStyle = '#00ffcc'; ctx.beginPath(); ctx.rect(-15, -15, 30, 30); ctx.fill();
        ctx.restore();
    }

    renderHUD(ctx) {
        ctx.fillStyle = '#00ffff'; ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`⚡ ${Math.floor(this.energy)}`, 20, 40);
        ctx.fillStyle = '#ff0055'; ctx.fillText(`❤️ ${this.baseHp}`, 20, 75);
    }

    drawEnd(ctx, txt, col) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,1000,600);
        ctx.fillStyle = col; ctx.font = '900 80px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, 500, 280);
        ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText("НАЖМИТЕ ДЛЯ ПРОДОЛЖЕНИЯ", 500, 380);
    }
}

