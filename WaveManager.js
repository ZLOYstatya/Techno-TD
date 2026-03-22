import { Enemy, EnemyTypes } from './Enemy.js';

export class WaveManager {
    constructor() { this.reset(); }

    reset() {
        this.activeEnemies = []; this.currentWaveIndex = 0; this.spawnTimer = 0;
        this.enemiesQueue = []; this.isWaveActive = false; this.wavesConfig = [];
        this.hpMultiplier = 1;
    }

    loadWaves(waves) { this.wavesConfig = waves; }

    get isAllCleared() { return this.currentWaveIndex >= this.wavesConfig.length && this.activeEnemies.length === 0 && this.enemiesQueue.length === 0 && !this.isWaveActive; }

    startNextWave(currentPath) {
        if (this.isWaveActive || this.currentWaveIndex >= this.wavesConfig.length) return;
        this.isWaveActive = true; this.currentPath = currentPath;
        const waveData = this.wavesConfig[this.currentWaveIndex];
        
        this.enemiesQueue = [];
        for (const group of waveData.groups) {
            for (let i = 0; i < group.count; i++) this.enemiesQueue.push({ type: group.type, delay: group.delay });
        }
        this.spawnTimer = this.enemiesQueue[0].delay;
    }

    update(dt) {
        let energyGained = 0; let baseDamage = 0;
        if (this.isWaveActive && this.enemiesQueue.length > 0) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                const nextEnemyData = this.enemiesQueue.shift();
                this.activeEnemies.push(new Enemy(EnemyTypes[nextEnemyData.type], this.currentPath, this.hpMultiplier));
                if (this.enemiesQueue.length > 0) this.spawnTimer = this.enemiesQueue[0].delay;
            }
        }

        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i]; enemy.update(dt);
            if (enemy.isDead) { 
                this.activeEnemies.splice(i, 1); 
                energyGained += enemy.reward || 10; // Выдаем Энергию за убийство!
            } 
            else if (enemy.hasReachedBase) { this.activeEnemies.splice(i, 1); baseDamage += 1; }
        }

        if (this.isWaveActive && this.enemiesQueue.length === 0 && this.activeEnemies.length === 0) {
            this.isWaveActive = false; this.currentWaveIndex++;
            if (this.currentWaveIndex < this.wavesConfig.length) setTimeout(() => this.startNextWave(this.currentPath), 3000);
        }
        return { energyGained, baseDamage };
    }

    render(ctx) {
        this.activeEnemies.sort((a, b) => a.y - b.y);
        for (const enemy of this.activeEnemies) enemy.render(ctx);
    }
}

