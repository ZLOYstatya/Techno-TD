export class Pathfinding {
    /**
     * Главный метод поиска пути.
     * @param {Array<Array<number>>} gridMatrix - 2D массив сетки (0 - пусто, 1 - башня)
     * @param {Object} start - Начальная координата {x, y}
     * @param {Object} end - Конечная координата {x, y}
     * @returns {Array<Object>|null} Массив координат пути или null, если пути нет
     */
    static findPath(gridMatrix, start, end) {
        const cols = gridMatrix.length;
        const rows = gridMatrix[0].length;

        // 1. Инициализируем виртуальную сетку узлов (Nodes) для алгоритма
        const nodes = [];
        for (let x = 0; x < cols; x++) {
            nodes[x] = [];
            for (let y = 0; y < rows; y++) {
                nodes[x][y] = {
                    x: x,
                    y: y,
                    walkable: gridMatrix[x][y] === 0, // Если 0, значит клетка свободна
                    g: 0, // Стоимость пути от старта до текущей клетки
                    h: 0, // Эвристика: примерное расстояние от клетки до финиша
                    f: 0, // Полная стоимость (g + h)
                    parent: null // Ссылка на предыдущий узел (чтобы восстановить путь)
                };
            }
        }

        const startNode = nodes[start.x][start.y];
        const endNode = nodes[end.x][end.y];

        // Защита от ошибок: если старт или финиш заблокированы
        if (!startNode.walkable || !endNode.walkable) {
            return null;
        }

        // Открытый список: узлы, которые нужно проверить (начинаем со старта)
        const openSet = [startNode];
        // Закрытый список: узлы, которые уже проверены (используем Set для скорости O(1))
        const closedSet = new Set();

        while (openSet.length > 0) {
            // 2. Ищем узел с наименьшей стоимостью f в открытом списке
            // Примечание архитектора: для сетки 20x15 обычный поиск работает за доли миллисекунды.
            // Для огромных карт здесь нужно использовать структуру Binary Heap (Min-Heap).
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[currentIndex].f || 
                   (openSet[i].f === openSet[currentIndex].f && openSet[i].h < openSet[currentIndex].h)) {
                    currentIndex = i;
                }
            }

            const currentNode = openSet[currentIndex];

            // 3. Если мы дошли до финиша, восстанавливаем путь
            if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
                const path = [];
                let current = currentNode;
                while (current !== null) {
                    path.push({ x: current.x, y: current.y });
                    current = current.parent;
                }
                // Разворачиваем путь, чтобы он шел от старта к финишу
                return path.reverse(); 
            }

            // 4. Переносим текущий узел из открытого в закрытый список
            openSet.splice(currentIndex, 1);
            closedSet.add(`${currentNode.x},${currentNode.y}`);

            // 5. Проверяем соседей (верх, низ, лево, право)
            const neighbors = this.getNeighbors(currentNode, nodes, cols, rows);

            for (const neighbor of neighbors) {
                // Игнорируем препятствия (башни) и уже проверенные узлы
                if (!neighbor.walkable || closedSet.has(`${neighbor.x},${neighbor.y}`)) {
                    continue;
                }

                // Стоимость перехода на соседнюю клетку всегда 1
                const tentativeG = currentNode.g + 1; 

                let isNewPath = false;
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor); // Нашли новый узел
                    isNewPath = true;
                } else if (tentativeG < neighbor.g) {
                    isNewPath = true; // Нашли путь к старому узлу, но он короче
                }

                if (isNewPath) {
                    neighbor.parent = currentNode;
                    neighbor.g = tentativeG;
                    // Считаем эвристику (Манхэттенское расстояние)
                    neighbor.h = Math.abs(neighbor.x - endNode.x) + Math.abs(neighbor.y - endNode.y);
                    neighbor.f = neighbor.g + neighbor.h;
                }
            }
        }

        // Если открытый список пуст, а финиш не найден — пути не существует
        return null;
    }

    /**
     * Получает соседние узлы по 4 направлениям.
     */
    static getNeighbors(node, nodes, cols, rows) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Вверх
            { x: 1, y: 0 },  // Вправо
            { x: 0, y: 1 },  // Вниз
            { x: -1, y: 0 }  // Влево
        ];

        for (const dir of directions) {
            const nx = node.x + dir.x;
            const ny = node.y + dir.y;

            // Проверка выхода за границы карты
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                neighbors.push(nodes[nx][ny]);
            }
        }

        return neighbors;
    }
}
