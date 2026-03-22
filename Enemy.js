import { GameConfig } from './Config.js';

export const EnemyTypes = {
    SCOUT:     { type: 'scout', hp: 40, speed: 130, armor: 0, reward: 20, color: '#00ffff', radius: 10 },
    SWARM:     { type: 'swarm', hp: 20, speed: 150, armor: 0, reward: 12, color: '#ffaa00', radius: 7 },
    TANK:      { type: 'tank', hp: 200, speed: 50, armor: 15, reward: 50, color: '#ff0055', radius: 16 },
    RUNNER:    { type: 'runner', hp: 70, speed: 190, armor: 0, reward: 25, color: '#00ff00', radius: 9 },
    BRUISER:   { type: 'bruiser', hp: 500, speed: 45, armor: 25, reward: 60, color: '#8b0000', radius: 18 },
    SHIELD:    { type: 'shield', hp: 120, speed: 80, armor: 5, shield: 200, reward: 50, color: '#4169e1', radius: 14 },
    GHOST:     { type: 'ghost', hp: 90, speed: 100, armor: 0, reward: 40, color: '#ffffff', radius: 11, isStealth: true },
    MUTANT:    { type: 'mutant', hp: 700, speed: 55, armor: 20, reward: 80, color: '#800080', radius: 18 },
    MECHA:     { type: 'mecha', hp: 1200, speed: 40, armor: 45, reward: 120, color: '#c0c0c0', radius: 22 },
    VIPER:     { type: 'viper', hp: 180, speed: 160, armor: 5, reward: 60, color: '#32cd32', radius: 12 },
    GOLEM:     { type: 'golem', hp: 1800, speed: 35, armor: 55, reward: 150, color: '#a0522d', radius: 24 },
    NINJA:     { type: 'ninja', hp: 140, speed: 210, armor: 0, reward: 80, color: '#2f4f4f', radius: 10 },
    CYBORG:    { type: 'cyborg', hp: 900, speed: 70, armor: 30, reward: 110, color: '#4682b4', radius: 17 },
    WRAITH:    { type: 'wraith', hp: 500, speed: 115, armor: 5, reward: 130, color: '#e6e6fa', radius: 15 },
    TITAN:     { type: 'titan', hp: 3000, speed: 25, armor: 70, reward: 300, color: '#d2691e', radius: 28 },
    BEHEMOTH:  { type: 'behemoth', hp: 5000, speed: 22, armor: 80, reward: 500, color: '#556b2f', radius: 32 },
    DRONE:     { type: 'drone', hp: 60, speed: 240, armor: 0, reward: 40, color: '#00ced1', radius: 8 },
    PHANTOM:   { type: 'phantom', hp: 600, speed: 145, armor: 5, reward: 200, color: '#dda0dd', radius: 14 },
    OVERLORD:  { type: 'overlord', hp: 10000, speed: 30, armor: 90, reward: 1500, color: '#8b008b', radius: 38 },
    GOD:       { type: 'god', hp: 30000, speed: 28, armor: 110, reward: 5000, color: '#ffd700', radius: 45 },
    // Добавь это внутрь EnemyTypes в файле Enemy.js
    BOSS_1:    { type: 'boss_1', hp: 1500, speed: 25, armor: 45, reward: 500, color: '#ff0000', radius: 30 }

};

export class Enemy {
    constructor(stats, path, hpMultiplier = 1) {
        this.type = stats.type;
        this.maxHp = Math.floor(stats.hp * hpMultiplier);
        this.hp = this.maxHp;
        this.speed = stats.speed; 
        this.armor = stats.armor;
        this.reward = stats.reward;
        this.radius = stats.radius;
        this.color = stats.color;
        this.path = path;
        this.currentWaypointIndex = 0;
        this.isDead = false; this.hasReachedBase = false;
        
        const cellSize = GameConfig.grid.cellSize;
        this.x = this.path[0].x * cellSize + cellSize / 2;
        this.y = this.path[0].y * cellSize + cellSize / 2;
        
        this.speedModifier = 1.0;
        this.angle = 0; // Направление движения для поворота текстуры
    }

    takeDamage(amount, type = 'kinetic') {
        let dmg = amount;
        if (type === 'kinetic') dmg = Math.max(1, amount - this.armor);
        this.hp -= dmg;
        if (this.hp <= 0) { this.hp = 0; this.isDead = true; }
    }

    applySlow(factor) {
        if (this.speedModifier > factor) this.speedModifier = Math.max(0.4, factor); 
    }

    update(dt) {
        if (this.isDead || this.hasReachedBase) return;
        this.speedModifier = Math.min(1.0, this.speedModifier + dt * 0.4);

        const targetNode = this.path[this.currentWaypointIndex];
        const cs = GameConfig.grid.cellSize;
        const tx = targetNode.x * cs + cs / 2;
        const ty = targetNode.y * cs + cs / 2;

        const dx = tx - this.x; const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 2) {
            this.currentWaypointIndex++;
            if (this.currentWaypointIndex >= this.path.length) this.hasReachedBase = true;
        } else {
            this.angle = Math.atan2(dy, dx);
            const moveStep = this.speed * this.speedModifier * dt;
            this.x += (dx / dist) * moveStep;
            this.y += (dy / dist) * moveStep;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Основное тело монстра с неоновым свечением
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        // 1. Отрисовка ГЕОМЕТРИИ в зависимости от типа
        if (this.type === 'tank' || this.type === 'behemoth' || this.type === 'golem') {
            // ТЯЖЕЛЫЕ: Квадратная броня
            ctx.fillStyle = '#222';
            ctx.fillRect(-this.radius, -this.radius, this.radius*2, this.radius*2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(-this.radius, -this.radius, this.radius*2, this.radius*2);
            // Пластины брони
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.radius+2, -this.radius+2, 5, 5);
            ctx.fillRect(this.radius-7, -this.radius+2, 5, 5);
        } else if (this.type === 'ghost' || this.type === 'phantom' || this.type === 'wraith') {
            // ПРИЗРАКИ: Полупрозрачный ромб
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(this.radius, 0); ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius, 0); ctx.lineTo(0, -this.radius);
            ctx.closePath();
            ctx.fillStyle = this.color; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.stroke();
            ctx.globalAlpha = 1.0;
        } else {
            // СТАНДАРТНЫЕ: Треугольные/Дроноподобные
            ctx.beginPath();
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(-this.radius, this.radius/1.5);
            ctx.lineTo(-this.radius/2, 0);
            ctx.lineTo(-this.radius, -this.radius/1.5);
            ctx.closePath();
            ctx.fillStyle = '#1a1a1a'; ctx.fill();
            ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.stroke();
        }

        // 2. ГЛАЗА (Светящиеся точки)
        ctx.shadowBlur = 15;
        ctx.fillStyle = (this.hp / this.maxHp < 0.3) ? 'red' : '#fff';
        ctx.beginPath();
        ctx.arc(this.radius/2, -this.radius/3, 2, 0, Math.PI*2);
        ctx.arc(this.radius/2, this.radius/3, 2, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();

        // 3. ПОЛОСКА HP (над монстром, не вращается)
        const hpW = this.radius * 2;
        const hpP = this.hp / this.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 12, hpW, 4);
        ctx.fillStyle = hpP > 0.5 ? '#00ff00' : (hpP > 0.2 ? '#ffff00' : '#ff0000');
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 12, hpW * hpP, 4);
    }
}

