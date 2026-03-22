export class Projectile {
    constructor(startX, startY, targetEnemy, damage, speed, damageType = 'kinetic') {
        this.x = startX;
        this.y = startY;
        this.target = targetEnemy;
        this.damage = damage;
        this.speed = speed;
        this.damageType = damageType;
        
        this.radius = 4;
        this.color = '#ffff00'; // Желтый цвет для кинетики
        this.isDestroyed = false;
    }

    update(dt) {
        // Если цель умерла до того, как снаряд долетел, уничтожаем снаряд
        // (в продвинутых версиях снаряд может лететь в последнюю известную точку)
        if (this.target.isDead) {
            this.isDestroyed = true;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.hypot(dx, dy);

        // Проверка коллизии (радиус снаряда + радиус врага)
        if (distance < this.radius + this.target.radius) {
            this.target.takeDamage(this.damage, this.damageType);
            this.isDestroyed = true;
            return;
        }

        // Движение к цели
        const moveX = (dx / distance) * this.speed * dt;
        const moveY = (dy / distance) * this.speed * dt;

        this.x += moveX;
        this.y += moveY;
    }

    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}
