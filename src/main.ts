import './style.css';
import { Engine, EngineConfig } from "./engine";

// 定义拼图块的接口
interface Piece {
    x: number;
    y: number;
    img: HTMLImageElement;
    sx: number;
    sy: number;
    width: number;
    height: number;
    index: number;
}

// 创建一个新的类 PuzzleManager 来处理图片和拼图逻辑
class PuzzleManager {
    pieces: Piece[] = [];
    pieceWidth: number = 0;
    pieceHeight: number = 0;
    cols: number = 3; // 默认列数
    rows: number = 3; // 默认行数
    private startTime: number | null = null; // 添加 startTime 变量

    constructor(private engine: Engine) {}

    // 创建拼图
    public createPuzzle(img: HTMLImageElement | undefined) {
        if (img) {
            const canvas = this.engine.getCanvas();
            canvas.width = img.width;
            canvas.height = img.height;
            this.pieceWidth = img.width / this.cols;
            this.pieceHeight = img.height / this.rows;
            this.pieces = [];

            let index = 0;
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    this.pieces.push({
                        index: ++index,
                        x: x * this.pieceWidth,
                        y: y * this.pieceHeight,
                        img: img,
                        sx: x * this.pieceWidth,
                        sy: y * this.pieceHeight,
                        width: this.pieceWidth,
                        height: this.pieceHeight
                    });
                }
            }

            this.shufflePieces();
            this.drawPuzzle();
            this.startTime = Date.now(); // 记录拼图开始时间
        }
    }

    // 打乱拼图块
    public shufflePieces() {
        for (let i = this.pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.pieces[i].x, this.pieces[j].x] = [this.pieces[j].x, this.pieces[i].x];
            [this.pieces[i].y, this.pieces[j].y] = [this.pieces[j].y, this.pieces[i].y];
        }
    }

    // 检查拼图是否完成
    public checkPuzzleCompletion(): boolean {
        for (let piece of this.pieces) {
            if (piece.x !== piece.sx || piece.y !== piece.sy) {
                return false; // 如果有任何一块不在正确位置，则拼图未完成
            }
        }
        const endTime = Date.now(); // 记录拼图结束时间
        const duration = (endTime - this.startTime!) / 1000; // 计算所用时间
        setTimeout(() => {
            alert(`拼图完成！用时: ${duration.toFixed(2)} 秒`); // 提示用户完成及所用时间
        }, 500);
        return true;
    }

    // 绘制拼图
    drawPuzzle() {
        const context = this.engine.getContext();
        context.clearRect(0, 0, this.engine.getCanvas().width, this.engine.getCanvas().height);
        this.pieces.forEach(piece => {
            context.drawImage(piece.img, piece.sx, piece.sy, piece.width, piece.height, piece.x, piece.y, piece.width, piece.height);
        });
    }
}

class Puzzle extends Engine {
    private draggedPiece: Piece | null = null;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private originalX: number = 0;
    private originalY: number = 0;
    private puzzleManager: PuzzleManager;

    constructor(container: HTMLElement, width: number, height: number, backgroundColor: string = 'white') {
        const config: EngineConfig = {
            container,
            width,
            height,
            backgroundColor
        };
        super(config);

        this.puzzleManager = new PuzzleManager(this);

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', this.handleImageUpload.bind(this));
        document.body.appendChild(fileInput);

        // 添加输入框让用户输入列数和行数
        const colsInput = document.createElement('input');
        colsInput.type = 'number';
        colsInput.min = '1';
        colsInput.id = 'input1';
        colsInput.value = this.puzzleManager.cols.toString();
        colsInput.addEventListener('blur', () => {
            this.puzzleManager.cols = parseInt(colsInput.value, 10);
            this.puzzleManager.createPuzzle(this.puzzleManager.pieces[0]?.img); // 传递当前的图片对象
        });
        document.body.appendChild(colsInput);

        const rowsInput = document.createElement('input');
        rowsInput.type = 'number';
        rowsInput.min = '1';
        rowsInput.value = this.puzzleManager.rows.toString();
        rowsInput.id = 'input2';
        rowsInput.addEventListener('blur', () => {
            this.puzzleManager.rows = parseInt(rowsInput.value, 10);
            this.puzzleManager.createPuzzle(this.puzzleManager.pieces[0]?.img); // 传递当前的图片对象
        });
        document.body.appendChild(rowsInput);

        // 添加鼠标事件监听器
        this.getCanvas().addEventListener('mousedown', this.onMouseDown.bind(this));
        this.getCanvas().addEventListener('mousemove', this.throttledOnMouseMove);
        this.getCanvas().addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    // 处理图片上传
    private handleImageUpload(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    this.puzzleManager.createPuzzle(img); // 确保传递正确的 img 对象
                };
            };
            reader.readAsDataURL(file);
        }
    }

    // 鼠标按下事件处理
    private onMouseDown(event: MouseEvent) {
        const rect = this.getCanvas().getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        for (let piece of this.puzzleManager.pieces) {
            if (mouseX >= piece.x && mouseX <= piece.x + piece.width && mouseY >= piece.y && mouseY <= piece.y + piece.height) {
                this.draggedPiece = piece;
                this.offsetX = mouseX - piece.x;
                this.offsetY = mouseY - piece.y;
                // 记录拖拽图片的原始位置
                this.originalX = piece.x;
                this.originalY = piece.y;
                break;
            }
        }
    }

    // 添加节流函数
    private throttle(func: Function, limit: number) {
        let lastFunc: number | undefined;
        let lastRan: number | undefined;
        return (...args: any[]) => {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan!) >= limit) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan!));
            }
        };
    }

    // 修改 onMouseMove 使用节流函数
    private throttledOnMouseMove = this.throttle(this.onMouseMove.bind(this), 16); // 16ms 大约等于 60fps

    private onMouseMove(event: MouseEvent) {
        if (this.draggedPiece) {
            const rect = this.getCanvas().getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            this.draggedPiece.x = mouseX - this.offsetX;
            this.draggedPiece.y = mouseY - this.offsetY;
            this.puzzleManager.drawPuzzle();
        }
    }

    // 鼠标释放事件处理
    private onMouseUp() {
        if (this.draggedPiece) {
            // 计算拼图块应该吸附到的网格位置
            const targetX = Math.round(this.draggedPiece.x / this.puzzleManager.pieceWidth) * this.puzzleManager.pieceWidth;
            const targetY = Math.round(this.draggedPiece.y / this.puzzleManager.pieceHeight) * this.puzzleManager.pieceHeight;

            // 找到目标网格位置上的拼图块
            let targetPiece = this.puzzleManager.pieces.find(piece => piece.x === targetX && piece.y === targetY);

            if (targetPiece && targetPiece !== this.draggedPiece) {
                // 交换两个拼图块的位置
                [this.draggedPiece.x, targetPiece.x] = [targetPiece.x, this.originalX];
                [this.draggedPiece.y, targetPiece.y] = [targetPiece.y, this.originalY];

                // 交换两个拼图块在数组中的位置
                const draggedIndex = this.puzzleManager.pieces.indexOf(this.draggedPiece);
                const targetIndex = this.puzzleManager.pieces.indexOf(targetPiece);
                [this.puzzleManager.pieces[draggedIndex], this.puzzleManager.pieces[targetIndex]] = [this.puzzleManager.pieces[targetIndex], this.puzzleManager.pieces[draggedIndex]];

                // 检查拼图是否完成
                if (this.puzzleManager.checkPuzzleCompletion()) {
                    this.disableDragging(); // 禁用拖拽
                }
            } else {
                // 将拼图块移动回原始位置
                this.draggedPiece.x = this.originalX;
                this.draggedPiece.y = this.originalY;
            }

            this.puzzleManager.drawPuzzle();
            this.draggedPiece = null;
        }
    }

    // 禁用拖拽
    private disableDragging() {
        this.getCanvas().removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.getCanvas().removeEventListener('mousemove', this.throttledOnMouseMove);
        this.getCanvas().removeEventListener('mouseup', this.onMouseUp.bind(this));
    }
}

// 初始化游戏
const container = document.createElement('div');
document.body.appendChild(container);
new Puzzle(container, 600, 600);
