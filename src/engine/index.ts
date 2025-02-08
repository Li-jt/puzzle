export type InitOptionsType = {
    el: HTMLElement | string
    width?: number
    height?: number
}

export abstract class Engine{
    private readonly canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    protected constructor(options: InitOptionsType) {
        let container;
        if(typeof options.el === 'string'){
            container = document.querySelector(options.el);
        }else {
            container = options.el;
        }
        if (!container) {
            throw new Error(`Container with id "${options.el}" not found.`);
        }

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        // 设置画布大小（可以根据需要调整）
        this.canvas.width = options.width || window.innerWidth;
        this.canvas.height = options.height || window.innerHeight;

        // 将画布添加到容器中
        container.appendChild(this.canvas);

        // 初始化游戏引擎
        this.start();
    }

    // 其他游戏引擎方法
    public start(): void {
        // 启动游戏循环
        console.log('Game started.');
        this.gameLoop();
    }

    private gameLoop(): void {
        // 游戏循环逻辑
        requestAnimationFrame(() => this.gameLoop());

        // 清除画布
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新游戏状态
        this.update();

        // 渲染游戏状态
        this.render();
    }

    private update(): void {
        // 更新游戏对象的状态
        // console.log('Updating game state.');

        this.onUpdate();
    }

    private render(): void {
        // 渲染游戏对象
        console.log('Rendering game state.');

        // 示例：绘制一个简单的矩形
        // this.context.fillStyle = 'red';
        // this.context.fillRect(100, 100, 100, 100);
        this.onRender();
    }

    public abstract onUpdate(): void

    public abstract onRender(): void
}
