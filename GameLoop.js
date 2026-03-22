export class GameLoop {
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        
        this.lastTime = 0;
        this.accumulator = 0;
        this.deltaTime = 1 / 60; // Целевой шаг (60 FPS)
        
        this.animationFrameId = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationFrameId);
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        // Расчет реального прошедшего времени в секундах
        let frameTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Защита от "спирали смерти" (если вкладка была неактивна)
        if (frameTime > 0.25) frameTime = 0.25;

        this.accumulator += frameTime;

        // Фиксированный шаг обновления физики/логики
        while (this.accumulator >= this.deltaTime) {
            this.updateFn(this.deltaTime);
            this.accumulator -= this.deltaTime;
        }

        // Рендер происходит так быстро, как позволяет экран
        // Передаем остаток (accumulator / deltaTime) для возможной интерполяции в будущем
        this.renderFn();

        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }
}
