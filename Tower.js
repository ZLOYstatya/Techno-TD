import { GameConfig } from './Config.js';
import { Projectile } from './Projectile.js';

const T_STATS = {
    kinetic: { dmg: [25, 45, 80, 150, 300], rng: [120, 130, 140, 150, 170], fr: [1.2, 1.5, 1.8, 2.2, 3.0], cost: [100, 200, 500, 1200, 3000], col: '#00ffcc' },
    rapid:   { dmg: [8, 15, 25, 45, 80], rng: [100, 110, 120, 130, 140], fr: [4, 5, 7, 10, 15], cost: [150, 300, 700, 1500, 4000], col: '#aaaaaa' },
    laser:   { dmg: [1, 2, 4, 8, 15], rng: [110, 120, 130, 140, 160], fr: [0, 0, 0, 0, 0], cost: [200, 400, 900, 2000, 5000], col: '#ff0055' },
    missile: { dmg: [100, 200, 400, 800, 1500], rng: [180, 200, 220, 250, 300], fr: [0.5, 0.6, 0.7, 0.8, 1.0], cost: [300, 600, 1200, 2500, 6000], col: '#ff8800' },
    sniper:  { dmg: [400, 800, 1600, 3200, 7000], rng: [300, 400, 500, 600, 800], fr: [0.2, 0.25, 0.3, 0.4, 0.5], cost: [400, 800, 1500, 3500, 8000], col: '#ffffff' },
    tesla:   { dmg: [30, 60, 120, 250, 500], rng: [120, 130, 140, 150, 170], fr: [1.0, 1.2, 1.5, 2.0, 2.5], cost: [500, 1000, 2000, 4500, 10000], col: '#ffff00', multi: [2, 3, 4, 5, 6] },
    plasma:  { dmg: [150, 350, 700, 1500, 3500], rng: [150, 160, 170, 190, 220], fr: [0.4, 0.5, 0.7, 0.9, 1.2], cost: [700, 1200, 2500, 6000, 15000], col: '#cc00ff' },
    cryo:    { dmg: [2, 5, 10, 20, 50], rng: [100, 110, 120, 130, 150], fr: [0, 0, 0, 0, 0], cost: [1000, 2000, 4000, 9000, 20000], col: '#00ffff' },
    gauss:   { dmg: [1000, 2500, 5000, 10000, 25000], rng: [220, 240, 260, 280, 320], fr: [0.3, 0.4, 0.5, 0.7, 1.0], cost: [1500, 3000, 7000, 15000, 35000], col: '#00ff00' },
    nuke:    { dmg: [5000, 15000, 40000, 100000, 300000], rng: [250, 280, 320, 360, 450], fr: [0.1, 0.12, 0.15, 0.2, 0.3], cost: [3000, 7000, 15000, 35000, 70000], col: '#ff0000' }
};

export class Tower {
    constructor(gridX, gridY, type = 'kinetic') {
        this.gridX = gridX; this.gridY = gridY;
        const cs = GameConfig.grid.cellSize;
        this.x = this.gridX * cs + cs / 2; this.y = this.gridY * cs + cs / 2;
        this.type = type; this.level = 0; this.maxLevel = 4;
        this.angle = 0; this.cooldownTimer = 0;
        this.updateStats(); this.activeTargets = [];
    }

    updateStats() {
        const s = T_STATS[this.type];
        this.damage = s.dmg[this.level]; this.range = s.rng[this.level];
        this.fireRate = s.fr[this.level]; this.color = s.col;
        this.upgradeCost = this.level < this.maxLevel ? s.cost[this.level + 1] : null;
        this.multiTargets = s.multi ? s.multi[this.level] : 1;
    }

    upgrade() {
        if (this.level >= this.maxLevel) return false;
        this.level++; this.updateStats(); return true;
    }

    update(dt, enemies, projectiles) {
        if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
        this.activeTargets = [];
        const target = this.findSingleTarget(enemies);
        if (target) {
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            if (this.type === 'laser' || this.type === 'cryo') {
                this.activeTargets.push(target);
                target.takeDamage(this.damage, 'energy');
                target.applySlow(this.type === 'cryo' ? 0.4 : 0.7);
            } else if (this.cooldownTimer <= 0) {
                projectiles.push(new Projectile(this.x, this.y, target, this.damage, 600, this.type));
                this.cooldownTimer = 1 / this.fireRate;
                if(window.playSound) window.playSound('shoot');
            }
        }
    }

    findSingleTarget(enemies) {
        let best = null; let maxP = -1;
        for (const e of enemies) {
            if (e.isDead || e.hasReachedBase) continue;
            if (Math.hypot(e.x - this.x, e.y - this.y) <= this.range && e.currentWaypointIndex > maxP) {
                maxP = e.currentWaypointIndex; best = e;
            }
        }
        return best;
    }

    render(ctx, isFocused = false) {
        const cs = GameConfig.grid.cellSize;
        if (isFocused) {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fill();
            ctx.strokeStyle = this.color; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#00ffff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(this.upgradeCost ? `UP: ${this.upgradeCost}⚡` : `MAX`, this.x, this.y - 35);
        }

        // База
        ctx.fillStyle = '#1a1c26'; ctx.fillRect(this.gridX * cs + 4, this.gridY * cs + 4, cs - 8, cs - 8);
        
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;

        // Эволюция графики
        ctx.fillStyle = '#888';
        if (this.level < 2) {
            ctx.fillRect(0, -4, 18, 8); // Ур 1-2
        } else if (this.level < 4) {
            ctx.fillRect(0, -7, 22, 5); // Ур 3-4 (двойная)
            ctx.fillRect(0, 2, 22, 5);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, -10, 25, 4); // Ур 5 (тройная + неон)
            ctx.fillRect(0, -2, 28, 4);
            ctx.fillRect(0, 6, 25, 4);
        }

        ctx.beginPath(); ctx.arc(0, 0, 8 + this.level, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.restore();
    }
}

