export class WaveManager {
    constructor() {
        this.activeEnemies = [];
        this.waves = [];
        this.currentWaveIndex = -1;
        this.spawnTimer = 0;
        this.enemiesToSpawn = [];
        this.isAllCleared = false;
    }

    reset() {
        this.activeEnemies = [];
        this.currentWaveIndex = -1;
        this.isAllCleared = false;
        this.enemiesToSpawn = [];
    }

    loadWaves(wavesData) {
        this.waves = wavesData;
    }

    startNextWave(waypoints) {
        this.currentWaveIndex++;
        if (this.currentWaveIndex < this.waves.length) {
            const wave = this.waves[this.currentWaveIndex];
            this.enemiesToSpawn = [];
            
            // Импортируем типы врагов динамически (так как EnemyTypes в другом файле)
            // Но обычно мы передаем уже готовый массив объектов
            wave.groups.forEach(group => {
                for (let i = 0; i < group.count; i++) {
                    this.enemiesToSpawn.push({
                        type: group.type,
                        delay: group.delay,
                        hpMultiplier: wave.hpMultiplier,
                        waypoints: waypoints
                    });
                }
            });
            this.spawnTimer = 0;
        }
    }

    update(dt) {
        let energyGained = 0;
        let baseDamage = 0;

        // 1. СПАВН ВРАГОВ
        if (this.enemiesToSpawn.length > 0) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                const spawnData = this.enemiesToSpawn.shift();
                this.spawnTimer = spawnData.delay;
                this.spawnEnemy(spawnData);
            }
        }

        // 2. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ВРАГОВ
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i];
            enemy.update(dt);

            // Если монстр убит башнями
            if (enemy.isDead) {
                energyGained += enemy.reward;
                this.activeEnemies.splice(i, 1);
                continue;
            }

            // Если монстр ДОШЕЛ ДО ЯДРА
            if (enemy.hasReachedBase) {
                baseDamage += 1; // Урон базе (можно сделать зависимым от типа монстра)
                
                // ВОТ ТВОЁ ОБНОВЛЕНИЕ: 
                // Теперь даем энергию, даже если враг дошел до конца!
                energyGained += enemy.reward; 
                
                this.activeEnemies.splice(i, 1);
                continue;
            }
        }

        // ПРОВЕРКА ПОБЕДЫ В УРОВНЕ
        if (this.enemiesToSpawn.length === 0 && 
            this.activeEnemies.length === 0 && 
            this.currentWaveIndex === this.waves.length - 1) {
            this.isAllCleared = true;
        }

        return { energyGained, baseDamage };
    }

    // Вспомогательный метод для создания объекта Enemy
    // В реальном проекте здесь нужно импортировать класс Enemy и EnemyTypes
    async spawnEnemy(data) {
        const { Enemy, EnemyTypes } = await import('./Enemy.js');
        const stats = EnemyTypes[data.type];
        if (stats) {
            this.activeEnemies.push(new Enemy(stats, data.waypoints, data.hpMultiplier));
        }
    }

    render(ctx) {
        this.activeEnemies.forEach(enemy => enemy.render(ctx));
    }
}
