import { Game } from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    // Запускаем игру новым методом start() вместо старого init()
    game.start(); 
});

