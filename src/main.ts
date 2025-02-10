import './style.css';

// 添加全局变量来存储拼图相关的数据
let puzzleCanvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let pieces: { x: number, y: number, img: HTMLImageElement, sx: number, sy: number, width: number, height: number, index: number }[] = [];
let pieceWidth: number;
let pieceHeight: number;
let cols: number = 3; // 默认列数
let rows: number = 3; // 默认行数
let draggedPiece: { x: number, y: number, img: HTMLImageElement, sx: number, sy: number, width: number, height: number, index: number } | null = null;
let offsetX: number = 0;
let offsetY: number = 0;
let originalX: number = 0;
let originalY: number = 0;
let isPuzzleCompleted: boolean = false; // 添加变量来跟踪拼图是否完成
let startTime: number; // 添加变量来记录拼图开始时间

// 初始化函数
function init() {
    puzzleCanvas = document.createElement('canvas');
    ctx = puzzleCanvas.getContext('2d')!;
    document.body.appendChild(puzzleCanvas);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', handleImageUpload);
    document.body.appendChild(fileInput);

    // 添加输入框让用户输入列数和行数
    const colsInput = document.createElement('input');
    colsInput.type = 'number';
    colsInput.min = '1';
    colsInput.id = 'input1'
    colsInput.value = cols.toString();
    colsInput.addEventListener('blur', () => {
        cols = parseInt(colsInput.value, 10);
        createPuzzle(pieces[0].img); // 传递当前的图片对象
    });
    document.body.appendChild(colsInput);

    const rowsInput = document.createElement('input');
    rowsInput.type = 'number';
    rowsInput.min = '1';
    rowsInput.value = rows.toString();
    rowsInput.id = 'input2'
    rowsInput.addEventListener('blur', () => {
        rows = parseInt(rowsInput.value, 10);
        createPuzzle(pieces[0].img); // 传递当前的图片对象
    });
    document.body.appendChild(rowsInput);

    // 添加鼠标事件监听器
    puzzleCanvas.addEventListener('mousedown', onMouseDown);
    puzzleCanvas.addEventListener('mousemove', throttledOnMouseMove);
    puzzleCanvas.addEventListener('mouseup', onMouseUp);
}

// 处理图片上传
function handleImageUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                // 初始化列数和行数输入框的值
                cols = parseInt((document.querySelector('#input1') as HTMLInputElement).value, 10);
                rows = parseInt((document.querySelector('#input2') as HTMLInputElement).value, 10);
                createPuzzle(img); // 确保传递正确的 img 对象
            };
        };
        reader.readAsDataURL(file);
    }
}

// 创建拼图
function createPuzzle(img: HTMLImageElement) {
    puzzleCanvas.width = img.width;
    puzzleCanvas.height = img.height;
    pieceWidth = img.width / cols;
    pieceHeight = img.height / rows;
    pieces = [];

    let index = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            pieces.push({
                index: ++index,
                x: x * pieceWidth,
                y: y * pieceHeight,
                img: img,
                sx: x * pieceWidth,
                sy: y * pieceHeight,
                width: pieceWidth,
                height: pieceHeight
            });
        }
    }

    shufflePieces();
    console.log('Pieces after shuffle:', pieces); // 添加日志输出
    drawPuzzle();
    isPuzzleCompleted = false; // 初始化拼图状态为未完成
    startTime = Date.now(); // 记录拼图开始时间
}

// 打乱拼图块
function shufflePieces() {
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i].x, pieces[j].x] = [pieces[j].x, pieces[i].x];
        [pieces[i].y, pieces[j].y] = [pieces[j].y, pieces[i].y];
    }
}

// 绘制拼图
function drawPuzzle() {
    ctx.clearRect(0, 0, puzzleCanvas.width, puzzleCanvas.height);
    pieces.forEach(piece => {
        if (piece !== draggedPiece) {
            ctx.drawImage(piece.img, piece.sx, piece.sy, piece.width, piece.height, piece.x, piece.y, piece.width, piece.height);
        }
    });
    if (draggedPiece) {
        ctx.drawImage(draggedPiece.img, draggedPiece.sx, draggedPiece.sy, draggedPiece.width, draggedPiece.height, draggedPiece.x, draggedPiece.y, draggedPiece.width, draggedPiece.height);
    }
}

// 鼠标按下事件处理
function onMouseDown(event: MouseEvent) {
    const rect = puzzleCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let piece of pieces) {
        if (mouseX >= piece.x && mouseX <= piece.x + piece.width && mouseY >= piece.y && mouseY <= piece.y + piece.height) {
            draggedPiece = piece;
            offsetX = mouseX - piece.x;
            offsetY = mouseY - piece.y;
            // 记录拖拽图片的原始位置
            originalX = piece.x;
            originalY = piece.y;
            break;
        }
    }
}

// 添加节流函数
function throttle(func: Function, limit: number) {
    let lastFunc: number | undefined;
    let lastRan: number | undefined;
    return (...args: any[]) => {
        // @ts-ignore
        const context = this; // 移除此行或使用箭头函数
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if ((Date.now() - lastRan!) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan!));
        }
    };
}

// 修改 onMouseMove 使用节流函数
const throttledOnMouseMove = throttle(onMouseMove, 16); // 16ms 大约等于 60fps

function onMouseMove(event: MouseEvent) {
    if (draggedPiece) {
        const rect = puzzleCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        draggedPiece.x = mouseX - offsetX;
        draggedPiece.y = mouseY - offsetY;
        drawPuzzle(); // 删除: drawPuzzle();
    }
}

// 鼠标释放事件处理
function onMouseUp() {
    if (draggedPiece && !isPuzzleCompleted) {
        // 计算拼图块应该吸附到的网格位置
        const targetX = Math.round(draggedPiece.x / pieceWidth) * pieceWidth;
        const targetY = Math.round(draggedPiece.y / pieceHeight) * pieceHeight;

        // 计算当前拼图块与目标位置的距离
        // const distanceX = Math.abs(targetX - draggedPiece.x);
        // const distanceY = Math.abs(targetY - draggedPiece.y);

        // 如果距离超过一个格子宽度或高度，则不进行吸附
        // if (distanceX > pieceWidth || distanceY > pieceHeight) {
        //     // 将拼图块移动回原始位置
        //     draggedPiece.x = originalX;
        //     draggedPiece.y = originalY;
        // } else {
            // 检查是否是水平或垂直移动一个格子
            // if ((distanceX > 0 && distanceY === 0) || (distanceY > 0 && distanceX === 0)) {
                // 吸附到最近的网格位置
                // draggedPiece.x = targetX;
                // draggedPiece.y = targetY;

                // 找到目标网格位置上的拼图块
                let targetPiece = pieces.find(piece => piece.x === targetX && piece.y === targetY);

                if (targetPiece && targetPiece !== draggedPiece) {
                    // 交换两个拼图块的位置
                    [draggedPiece.x, targetPiece.x] = [targetPiece.x, originalX];
                    [draggedPiece.y, targetPiece.y] = [targetPiece.y, originalY];

                    // 交换两个拼图块在数组中的位置
                    const draggedIndex = pieces.indexOf(draggedPiece);
                    const targetIndex = pieces.indexOf(targetPiece);
                    [pieces[draggedIndex], pieces[targetIndex]] = [pieces[targetIndex], pieces[draggedIndex]];

                    // 检查拼图是否完成
                    checkPuzzleCompletion();
                }else{
                        // 将拼图块移动回原始位置
                        draggedPiece.x = originalX;
                        draggedPiece.y = originalY;
                }
            // } else {
            //     // 将拼图块移动回原始位置
            //     draggedPiece.x = originalX;
            //     draggedPiece.y = originalY;
            // }
        // }

        drawPuzzle();
        draggedPiece = null;
    }
}

// 检查拼图是否完成
function checkPuzzleCompletion() {
    for (let piece of pieces) {
        if (piece.x !== piece.sx || piece.y !== piece.sy) {
            return; // 如果有任何一块不在正确位置，则拼图未完成
        }
    }
    isPuzzleCompleted = true; // 所有块都在正确位置，拼图完成
    drawPuzzle(); // 确保拼图的最终状态被正确渲染
    disableDragging(); // 禁用拖拽

    const endTime = Date.now(); // 记录拼图结束时间
    const duration = (endTime - startTime) / 1000; // 计算耗时，单位为秒
    setTimeout(() => {
        alert(`拼图完成！耗时: ${duration.toFixed(2)} 秒`); // 提示用户完成并显示耗时
    }, 500);
}

// 禁用拖拽
function disableDragging() {
    puzzleCanvas.removeEventListener('mousedown', onMouseDown);
    puzzleCanvas.removeEventListener('mousemove', onMouseMove);
    puzzleCanvas.removeEventListener('mouseup', onMouseUp);
}

// 初始化游戏
init();


