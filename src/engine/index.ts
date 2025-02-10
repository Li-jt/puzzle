// 定义 Engine 的配置接口
export interface EngineConfig {
    container: HTMLElement;
    width: number;
    height: number;
    backgroundColor?: string;
}

// 游戏逻辑引擎
 export class Engine {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;

    constructor(config: EngineConfig) {
        // 创建 canvas 元素
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
        this.canvas.width = config.width;
        this.canvas.height = config.height;
        this.canvas.style.backgroundColor = config.backgroundColor || 'white';
        config.container.appendChild(this.canvas);
    }

    // 获取 canvas 元素
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    // 获取 2D 上下文
    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
}
