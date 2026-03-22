import { GameLoop } from './GameLoop.js';
import { Grid } from './Grid.js';
import { WaveManager } from './WaveManager.js';
import { Tower } from './Tower.js';
import { GameConfig } from './Config.js';
import { ProgressionSystem } from './Maps.js';

const TOWERS_DB = [
    { id: 'kinetic', name: 'Пушка', cost: 100, unlock: 1, color: '#00ffcc', desc: 'Базовая скорострельная пушка.' },
    { id: 'rapid', name: 'Рапид', cost: 150, unlock: 10, color: '#aaaaaa', desc: 'Бешеная скорость стрельбы.' },
    { id: 'laser', name: 'Лазер', cost: 200, unlock: 20, color: '#ff0055', desc: 'Замедляет врагов на 30%.' },
    { id: 'missile', name: 'Ракеты', cost: 300, unlock: 30, color: '#ff8800', desc: 'Огромный радиус поражения.' },
    { id: 'sniper', name: 'Снайпер', cost: 400, unlock: 40, color: '#ffffff', desc: 'Колоссальный урон на дистанции.' },
    { id: 'tesla', name: 'Тесла', cost: 500, unlock: 50, color: '#44ff00', desc: 'Бьет током сразу группу врагов.' },
    { id: 'plasma', name: 'Плазма', cost: 700, unlock: 60, color: '#cc00ff', desc: 'Идеально против тяжелой брони.' },
    { id: 'cryo', name: 'Крио', cost: 1000, unlock: 70, color: '#00ffff', desc: 'Замораживает врагов на 60%.' },
    { id: 'gauss', name: 'Гаусс', cost: 1500, unlock: 80, color: '#00ffaa', desc: 'Пробивает врагов насквозь.' },
    { id: 'nuke', name: 'Ядерка', cost: 3000, unlock: 90, color: '#ff0000', desc: 'Ультимативное оружие.' }
];

class SoundFX {
    constructor() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    play(type) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;
        if (type === 'shoot') {
            osc.type = 'square'; osc.frequency.setValueAtTime(400, now);
            gain.gain.setValueAtTime(0.02, now); osc.start(); osc.stop(now + 0.1);
        } else if (type === 'build') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.05, now); osc.start(); osc.stop(now + 0.1);
        }
    }
}

export class Game {
    constructor() {
        this.bgCanvas = document.getElementById('bg-layer');
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.dynamicCanvas = document.getElementById('dynamic-layer');
        this.dynamicCtx = this.dynamicCanvas.getContext('2d');
        this.uiCanvas = document.getElementById('ui-layer');
        this.uiCtx = this.uiCanvas.getContext('2d');

        this.grid = new Grid();
        this.waveManager = new WaveManager();
        this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));
        this.sfx = null;

        this.maxUnlockedLevel = parseInt(localStorage.getItem('technoMagic_maxlvl')) || 0;
        this.isGameOver = false; this.isVictory = false; this.isMenu = true; this.isPaused = false;
        this.selectedTowerType = null; this.focusedTower = null;
        this.gameTime = 0; this.gameSpeed = 1;

        this.bindEvents();
        this.renderLevels();
    }

    bindEvents() {
        const listen = (id, event, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, fn);
        };

        listen('btn-play', 'click', () => {
            if (!this.sfx) this.sfx = new SoundFX();
            document.getElementById('start-menu').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        });

        listen('btn-back-to-start', 'click', () => {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('start-menu').classList.remove('hidden');
        });

        listen('btn-pause', 'click', (e) => {
            e.stopPropagation(); this.isPaused = true;
            document.getElementById('pause-menu').classList.remove('hidden');
        });

        listen('btn-resume', 'click', () => {
            this.isPaused = false; document.getElementById('pause-menu').classList.add('hidden');
        });

        listen('btn-restart', 'click', () => {
            this.isPaused = false; document.getElementById('pause-menu').classList.add('hidden');
            this.loadLevel(this.currentLevelIndex);
        });

        listen('btn-speed', 'click', (e) => {
            e.stopPropagation();
            if (this.gameSpeed === 1) this.gameSpeed = 2;
            else if (this.gameSpeed === 2) this.gameSpeed = 4;
            else if (this.gameSpeed === 4) this.gameSpeed = 0.5;
            else this.gameSpeed = 1;
            document.getElementById('btn-speed').innerText = 'x' + this.gameSpeed;
        });

        this.uiCanvas.addEventListener('pointerdown', this.handleInput.bind(this));
    }

    renderLevels() {
        const grid = document.getElementById('levels-grid');
        grid.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const b = document.createElement('button');
            b.className = 'level-btn';
            b.innerText = i + 1;
            if (i > this.maxUnlockedLevel) {
                b.style.opacity = 0.3;
            } else {
                b.addEventListener('click', () => {
                    document.getElementById('main-menu').classList.add('hidden');
                    this.isMenu = false; this.loadLevel(i); this.loop.start();
                });
            }
            grid.appendChild(b);
        }
    }

    loadLevel(idx) {
        this.currentLevelIndex = idx;
        this.currentMap = ProgressionSystem.generateLevel(idx);
        this.energy = 800; this.baseHp = 20; this.towers = []; this.projectiles = [];
        this.waveManager.reset();
        this.waveManager.loadWaves(this.currentMap.waves);
        this.grid.loadMap(this.currentMap);
        this.renderStatic();
        this.isGameOver = false; this.isVictory = false; this.isPaused = false;
        this.updateTowerUI();
    }

    updateTowerUI() {
        const p = document.getElementById('ui-panel');
        if (!p) return;
        p.innerHTML = '';
        TOWERS_DB.forEach(t => {
            if (this.maxUnlockedLevel + 1 >= t.unlock) {
                const b = document.createElement('div');
                b.className = `tower-btn ${this.selectedTowerType === t.id ? 'selected' : ''}`;
                b.innerHTML = `<div class="tower-icon" style="background:${t.color}"></div>
                               <div class="tower-info">${t.name}<br><b>${t.cost}⚡</b></div>`;
                b.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectedTowerType = (this.selectedTowerType === t.id) ? null : t.id;
                    this.updateTowerUI();
                });
                p.appendChild(b);
            }
        });
    }

    handleInput(e) {
        if (this.isVictory || this.isGameOver) { location.reload(); return; }
        if (this.isMenu || this.isPaused) return;

        const rect = this.uiCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.uiCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.uiCanvas.height / rect.height);
        const gx = Math.floor(x / GameConfig.grid.cellSize);
        const gy = Math.floor(y / GameConfig.grid.cellSize);

        const cell = this.grid.cells[gx][gy];
        if (cell === 4) { // Клик по башне для апгрейда
            const t = this.towers.find(t => t.gridX === gx && t.gridY === gy);
            if (t && t.upgradeCost <= this.energy) {
                this.energy -= t.upgradeCost; t.upgrade();
                if (this.sfx) this.sfx.play('build');
            }
            return;
        }

        if (this.selectedTowerType && cell === 0) {
            const cfg = TOWERS_DB.find(t => t.id === this.selectedTowerType);
            if (this.energy >= cfg.cost) {
                this.energy -= cfg.cost;
                this.grid.cells[gx][gy] = 4;
                this.towers.push(new Tower(gx, gy, this.selectedTowerType));
                if (this.sfx) this.sfx.play('build');
                this.renderStatic();
            }
        }
    }

    update(realDt) {
        if (this.isPaused || this.isMenu || this.isGameOver || this.isVictory) return;
        const dt = realDt * this.gameSpeed;
        this.gameTime += dt;
        const res = this.waveManager.update(dt);
        this.energy += res.energyGained;
        this.baseHp -= res.baseDamage;

        if (this.baseHp <= 0) { this.isGameOver = true; return; }
        if (this.waveManager.isAllCleared) {
            this.isVictory = true;
            if (this.currentLevelIndex >= this.maxUnlockedLevel) {
                this.maxUnlockedLevel++;
                localStorage.setItem('technoMagic_maxlvl', this.maxUnlockedLevel);
            }
            return;
        }

        this.towers.forEach(t => t.update(dt, this.waveManager.activeEnemies, this.projectiles));
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(dt);
            if (this.projectiles[i].isDestroyed) this.projectiles.splice(i, 1);
        }
    }

    renderStatic() {
        this.bgCtx.clearRect(0, 0, 1000, 600);
        this.grid.render(this.bgCtx);
    }

    render() {
        if (this.isMenu) return;
        this.dynamicCtx.clearRect(0, 0, 1000, 600);
        this.towers.forEach(t => t.render(this.dynamicCtx, t === this.focusedTower));
        this.waveManager.render(this.dynamicCtx);
        this.projectiles.forEach(p => p.render(this.dynamicCtx));
        this.renderCore(this.dynamicCtx);
        this.renderUI(this.uiCtx);

        if (this.isGameOver) this.drawEnd(this.dynamicCtx, "ПОРАЖЕНИЕ", "#ff0055");
        if (this.isVictory) this.drawEnd(this.dynamicCtx, "ПОБЕДА", "#00ffcc");
    }

    renderCore(ctx) {
        const cs = GameConfig.grid.cellSize;
        const cx = this.currentMap.base.x * cs + cs/2;
        const cy = this.currentMap.base.y * cs + cs/2;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(this.gameTime);
        ctx.shadowBlur = 20; ctx.shadowColor = '#00ffcc';
        ctx.fillStyle = '#00ffcc'; ctx.beginPath(); ctx.rect(-15, -15, 30, 30); ctx.fill();
        ctx.restore();
    }

        renderUI(ctx) {
        ctx.clearRect(0, 0, 1000, 600);
        ctx.font = 'bold 14px sans-serif'; // Еще меньше шрифт
        
        ctx.fillStyle = '#00ffff'; 
        ctx.fillText(`⚡ ${Math.floor(this.energy)}`, 10, 20);
// и вторая
ctx.fillText(`❤️ ${this.baseHp}`, 10, 40);
            
    }

    drawEnd(ctx, txt, col) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,1000,600);
        ctx.fillStyle = col; 
        ctx.font = '900 40px sans-serif'; // Уменьшил заголовок ПОБЕДА/ПОРАЖЕНИЕ в 2 раза
        ctx.textAlign = 'center';
        ctx.fillText(txt, 500, 280);
        
        ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText("КЛИКНИТЕ ДЛЯ ПРОДОЛЖЕНИЯ", 500, 340);
    }
    
