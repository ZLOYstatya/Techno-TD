import { GameConfig } from './Config.js';

export class Grid {
    constructor() {
        this.cols = GameConfig.grid.cols;
        this.rows = GameConfig.grid.rows;
        this.cellSize = GameConfig.grid.cellSize;
        this.cells = Array.from({ length: this.cols }, () => Array(this.rows).fill(0));
        this.mapData = null;
    }

    loadMap(mapData) {
        this.mapData = mapData;
        this.cells = Array.from({ length: this.cols }, () => Array(this.rows).fill(0));

        for (let i = 0; i < mapData.waypoints.length - 1; i++) {
            let p1 = mapData.waypoints[i]; let p2 = mapData.waypoints[i+1];
            let minX = Math.min(p1.x, p2.x); let maxX = Math.max(p1.x, p2.x);
            let minY = Math.min(p1.y, p2.y); let maxY = Math.max(p1.y, p2.y);
            
            for(let x = minX; x <= maxX; x++) {
                for(let y = minY; y <= maxY; y++) {
                    // БРОНЯ: Проверка границ карты, чтобы JS не вылетал с ошибкой
                    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                        this.cells[x][y] = 1; 
                    }
                }
            }
        }
    }

    render(ctx) {
        if (this.mapData) {
            ctx.fillStyle = this.mapData.bgTheme;
            ctx.fillRect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);
        }

        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                const cell = this.cells[x][y];
                const px = x * this.cellSize; const py = y * this.cellSize;

                if (cell === 1) {
                    ctx.fillStyle = this.mapData ? this.mapData.pathTheme : 'rgba(100, 100, 100, 0.5)';
                    ctx.fillRect(px, py, this.cellSize, this.cellSize);
                }
            }
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1;
        for (let x = 0; x <= this.cols; x++) { ctx.beginPath(); ctx.moveTo(x * this.cellSize, 0); ctx.lineTo(x * this.cellSize, this.rows * this.cellSize); ctx.stroke(); }
        for (let y = 0; y <= this.rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * this.cellSize); ctx.lineTo(this.cols * this.cellSize, y * this.cellSize); ctx.stroke(); }
    }
}

