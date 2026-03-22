import { GameConfig } from './Config.js';

export class ProgressionSystem {
    static generateLevel(index) {
        const lvl = index + 1; 
        
        const waves = [];
        for (let waveIndex = 0; waveIndex < 5; waveIndex++) {
            // Здоровье растет с уровнем и с каждой волной внутри уровня
            const hpMultiplier = 1 + (waveIndex * 0.3) + (lvl * 0.1); 
            
            // Количество мобов (растет плавно)
            let baseCount = 6 + Math.floor(lvl * 0.6); 
            let waveCount = Math.floor(baseCount * (1 + waveIndex * 0.2)); 

            // Список доступных врагов (открываются постепенно)
            const availableTypes = ['SCOUT', 'SWARM'];
            if (lvl > 5) availableTypes.push('RUNNER', 'TANK');
            if (lvl > 15) availableTypes.push('BRUISER', 'SHIELD', 'VIPER');
            if (lvl > 35) availableTypes.push('GHOST', 'NINJA', 'DRONE');
            if (lvl > 55) availableTypes.push('MUTANT', 'CYBORG', 'WRAITH');
            if (lvl > 75) availableTypes.push('MECHA', 'GOLEM', 'PHANTOM');
            if (lvl > 95) availableTypes.push('TITAN', 'BEHEMOTH');
            
            const enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            
            // ЛОГИКА БОССОВ (Исправление бага 10 уровня)
            if (waveIndex === 4 && lvl % 10 === 0) {
                let bossType = 'BOSS_1'; 
                if (lvl >= 100) bossType = 'GOD';
                else if (lvl >= 50) bossType = 'OVERLORD';

                waves.push({ 
                    wave: waveIndex + 1, hpMultiplier: hpMultiplier * 1.5,
                    groups: [{ type: bossType, count: 1, delay: 2.0 }] 
                });
            } else {
                waves.push({ 
                    wave: waveIndex + 1, hpMultiplier: hpMultiplier,
                    groups: [{ type: enemyType, count: waveCount, delay: 0.4 }] 
                });
            }
        }

        // 7 РАЗНЫХ ВИДОВ ДОРОЖЕК
        let waypoints = [];
        const pathType = index % 7; // Чередуем 7 типов
        
        switch(pathType) {
            case 0: // Змейка (S-образная)
                waypoints = [{x:0,y:2}, {x:17,y:2}, {x:17,y:6}, {x:2,y:6}, {x:2,y:10}, {x:17,y:10}, {x:17,y:13}, {x:19,y:13}];
                break;
            case 1: // Большой П-образный обход
                waypoints = [{x:2,y:0}, {x:2,y:12}, {x:17,y:12}, {x:17,y:2}, {x:10,y:2}, {x:10,y:7}, {x:19,y:7}];
                break;
            case 2: // Вертикальный зигзаг
                waypoints = [{x:1,y:1}, {x:1,y:13}, {x:5,y:13}, {x:5,y:1}, {x:9,y:1}, {x:9,y:13}, {x:13,y:13}, {x:13,y:1}, {x:18,y:1}];
                break;
            case 3: // Спираль к центру
                waypoints = [{x:0,y:0}, {x:19,y:0}, {x:19,y:14}, {x:0,y:14}, {x:0,y:4}, {x:15,y:4}, {x:15,y:10}, {x:5,y:10}, {x:10,y:10}];
                break;
            case 4: // Двойная петля (восьмерка)
                waypoints = [{x:0,y:7}, {x:8,y:7}, {x:8,y:2}, {x:15,y:2}, {x:15,y:12}, {x:5,y:12}, {x:5,y:14}, {x:19,y:14}];
                break;
            case 5: // Лабиринт (короткие резкие повороты)
                waypoints = [{x:1,y:1}, {x:5,y:1}, {x:5,y:5}, {x:1,y:5}, {x:1,y:10}, {x:10,y:10}, {x:10,y:1}, {x:18,y:1}, {x:18,y:14}];
                break;
            case 6: // Лестница (диагональные шаги)
                waypoints = [{x:0,y:0}, {x:4,y:0}, {x:4,y:4}, {x:8,y:4}, {x:8,y:8}, {x:12,y:8}, {x:12,y:12}, {x:16,y:12}, {x:16,y:14}, {x:19,y:14}];
                break;
        }

        return {
            name: `Уровень ${lvl}`,
            bgTheme: `hsl(${lvl * 45 % 360}, 15%, 7%)`, 
            pathTheme: `hsl(${lvl * 45 % 360}, 15%, 15%)`,
            start: waypoints[0],
            base: waypoints[waypoints.length - 1],
            waypoints: waypoints,
            waves: waves,
            condition: null
        };
    }
                             }
        
