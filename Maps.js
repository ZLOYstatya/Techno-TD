export class ProgressionSystem {
    static generateLevel(index) {
        const lvl = index + 1; 
        
        const waves = [];
        for (let waveIndex = 0; waveIndex < 5; waveIndex++) {
            const hpMultiplier = 1 + (waveIndex * 0.4); 
            
            // БАЛАНС: Количество мобов теперь растет адекватно
            // На 1 уровне: 10-15 мобов в волне. На 100 уровне: ~150 мобов.
            let baseCount = 8 + Math.floor(lvl * 1.2); 
            let waveCount = Math.floor(baseCount * (1 + waveIndex * 0.3)); 

            const availableTypes = ['SCOUT', 'SWARM'];
            if (lvl > 5) availableTypes.push('RUNNER', 'TANK');
            if (lvl > 15) availableTypes.push('BRUISER', 'SHIELD', 'VIPER');
            if (lvl > 35) availableTypes.push('GHOST', 'NINJA', 'DRONE');
            if (lvl > 55) availableTypes.push('MUTANT', 'CYBORG', 'WRAITH');
            if (lvl > 75) availableTypes.push('MECHA', 'GOLEM', 'PHANTOM');
            if (lvl > 95) availableTypes.push('TITAN', 'BEHEMOTH');
            
            const enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            
            if (waveIndex === 4 && lvl % 10 === 0) {
                let bossType = lvl >= 100 ? 'GOD' : (lvl >= 50 ? 'OVERLORD' : 'BOSS_1');
                waves.push({ 
                    wave: waveIndex + 1, hpMultiplier: hpMultiplier,
                    groups: [{ type: bossType, count: Math.max(1, Math.floor(lvl/25)), delay: 2.0 }] 
                });
            } else {
                // Плотный поток без пауз
                waves.push({ 
                    wave: waveIndex + 1, hpMultiplier: hpMultiplier,
                    groups: [{ type: enemyType, count: waveCount, delay: 0.25 }] 
                });
            }
        }

        // ДЛИННЫЕ ДОРОЖКИ (Используем почти все пространство 20x15)
        let waypoints = [];
        const type = lvl % 3;
        if (type === 0) {
            // S-образная длинная дорога
            waypoints = [{x:0,y:1}, {x:17,y:1}, {x:17,y:4}, {x:2,y:4}, {x:2,y:8}, {x:17,y:8}, {x:17,y:12}, {x:2,y:12}, {x:2,y:14}, {x:19,y:14}];
        } else if (type === 1) {
            // Периметр с заходом в центр
            waypoints = [{x:10,y:0}, {x:10,y:2}, {x:18,y:2}, {x:18,y:13}, {x:1,y:13}, {x:1,y:7}, {x:15,y:7}, {x:15,y:10}, {x:19,y:10}];
        } else {
            // Большой зигзаг
            waypoints = [{x:0,y:14}, {x:5,y:14}, {x:5,y:2}, {x:10,y:2}, {x:10,y:14}, {x:15,y:14}, {x:15,y:2}, {x:19,y:2}];
        }

        let condition = null;
        if (lvl > 50 && Math.random() > 0.6) {
            const restrictions = [['kinetic'], ['laser', 'plasma'], ['tesla', 'rapid'], ['sniper', 'cryo']];
            const randRes = restrictions[Math.floor(Math.random() * restrictions.length)];
            condition = { type: 'restrict', allowed: randRes, text: `ТОЛЬКО: ${randRes.join(', ').toUpperCase()}` };
        }

        return {
            name: `Уровень ${lvl}`,
            bgTheme: `hsl(${lvl * 30 % 360}, 30%, 7%)`, 
            pathTheme: `hsl(${lvl * 30 % 360}, 20%, 15%)`,
            start: waypoints[0],
            base: waypoints[waypoints.length - 1],
            waypoints: waypoints,
            waves: waves,
            condition: condition
        };
    }
}

