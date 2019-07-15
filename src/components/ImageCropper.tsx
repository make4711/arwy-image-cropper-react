import * as React from 'react'



export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
};

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
};

interface Drawable {
    draw(ctx: CanvasRenderingContext2D, color?: string): void
}

class Point2D implements Drawable, Point {
    x: number;
    y: number;

    constructor(p: Point = { x: 0, y: 0 }) {
        this.x = p.x;
        this.y = p.y;
    }

    public set point(point: Point) {
        if (!point) {
            this.x = 0;
            this.y = 0;
            return;
        }
        this.x = point.x;
        this.y = point.y;
    }

    public isTouch(p2: Point) {
        return (Math.abs(this.x - p2.x) < CanvasPainter.DELTA && Math.abs(this.y - p2.y) < CanvasPainter.DELTA)
    }

    public draw(ctx: CanvasRenderingContext2D, color: string): void {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(this.x - CanvasPainter.DELTA, this.y - CanvasPainter.DELTA, CanvasPainter.DELTA * 2, CanvasPainter.DELTA * 2);
    }
};

class PickUpPoints implements Drawable {
    public canvasSize: Size = null;
    public points: Point2D[] = null;

    constructor(canvasSize: Size, points: Point2D[]) {
        this.points = points;
        this.canvasSize = canvasSize;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        this.points.forEach(point => point.draw(ctx, '#00ffff'));
    }

    public getTouchPoint(p: Point): Point2D {
        let index = this.whichPoint(p);
        if (!index || index === 1000) {
            return null;
        }
        return this.points[index - 1];
    }

    public whichPoint(p: Point): number {
        let index = this.points.findIndex(point => point.isTouch(p));

        if (index === -1 &&
            p.x >= this.points[0].x &&
            p.y >= this.points[0].y &&
            p.x <= this.points[2].x &&
            p.y <= this.points[2].y) {
            return 1000;
        }

        if (index === -1) {
            return 0;
        }

        return index + 1;
    }

    public move(mode: number, point: Point, deltaX: number, deltaY: number) {

        const clonedClipPoints: Point2D[] = this.points.map(point => new Point2D(point));
        switch (mode) {
            case 1:
                clonedClipPoints[0].x = point.x;
                clonedClipPoints[0].y = point.y;
                clonedClipPoints[3].x = point.x;
                clonedClipPoints[1].y = point.y;
                break;
            case 2:
                clonedClipPoints[1].x = point.x;
                clonedClipPoints[1].y = point.y;
                clonedClipPoints[0].y = point.y;
                clonedClipPoints[2].x = point.x;
                break;
            case 3:
                clonedClipPoints[2].x = point.x;
                clonedClipPoints[2].y = point.y;
                clonedClipPoints[3].y = point.y;
                clonedClipPoints[1].x = point.x;
                break;
            case 4:
                clonedClipPoints[3].x = point.x;
                clonedClipPoints[3].y = point.y;
                clonedClipPoints[2].y = point.y;
                clonedClipPoints[0].x = point.x;
                break;
            case 1000:
                clonedClipPoints.forEach((point) => { point.x += deltaX; point.y += deltaY; });
                break;
            default:
                break;
        }

        if (clonedClipPoints[0].x > CanvasPainter.DELTA &&
            clonedClipPoints[1].x < this.canvasSize.width - CanvasPainter.DELTA &&
            clonedClipPoints[0].y > CanvasPainter.DELTA &&
            clonedClipPoints[2].y < this.canvasSize.height - CanvasPainter.DELTA
        ) {
            this.points[0].point = clonedClipPoints[0];
            this.points[1].point = clonedClipPoints[1];
            this.points[2].point = clonedClipPoints[2];
            this.points[3].point = clonedClipPoints[3];
        }
    }

    public calcImageBoundary = (w: number, h: number): Rect => {
        let scaleX: number = this.canvasSize.width / w;
        let scaleY: number = this.canvasSize.height / h;

        let scale: number = 1.0;

        if (scaleX < scaleY) {
            scale = scaleX;
        } else {
            scale = scaleY;
        }

        let ciw = w * scale * CanvasPainter.SCALE;
        let cih = h * scale * CanvasPainter.SCALE;

        let cix = (this.canvasSize.width - ciw) / 2;
        let ciy = (this.canvasSize.height - cih) / 2;

        let clipImageRect: Rect = { x: cix, y: ciy, w: ciw, h: cih };

        this.points[0].point = { x: clipImageRect.x, y: clipImageRect.y };
        this.points[1].point = { x: clipImageRect.x + clipImageRect.w, y: clipImageRect.y };
        this.points[2].point = { x: clipImageRect.x + clipImageRect.w, y: clipImageRect.y + clipImageRect.h };
        this.points[3].point = { x: clipImageRect.x, y: clipImageRect.y + clipImageRect.h };
        return clipImageRect;
    }

};

class ImageBounds implements Drawable {
    private clipPoints: Point2D[] = null;

    constructor(clipPoints: Point2D[]) {
        this.clipPoints = clipPoints;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.moveTo(this.clipPoints[0].x, this.clipPoints[0].y);
        this.clipPoints.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.closePath();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1.0;
        ctx.stroke();
    }
};

class BorderWithHole implements Drawable {
    private canvasSize: Size = null;
    private clipPoints: Point2D[] = null;

    constructor(canvasSize: Size, clipPoints: Point2D[]) {
        this.clipPoints = clipPoints;
        this.canvasSize = canvasSize;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.lineWidth = 0.0;
        //outer shape, clockwise
        ctx.moveTo(0, 0);
        ctx.lineTo(this.canvasSize.width, 0);
        ctx.lineTo(this.canvasSize.width, this.canvasSize.height);
        ctx.lineTo(0, this.canvasSize.height);
        ctx.closePath();

        //inner shape (hole), counter-clockwise
        ctx.moveTo(this.clipPoints[0].x, this.clipPoints[0].y);
        this.clipPoints.reverse().forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        this.clipPoints.reverse();
        //fill
        ctx.fillStyle = "#333333";
        ctx.globalAlpha = 0.85;
        ctx.fill();
    }
};

class CanvasPainter {
    public static readonly DELTA: number = 20;
    public static readonly SCALE: number = .7;

    private imageCanvas: HTMLCanvasElement;
    private imageCtx: CanvasRenderingContext2D;

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private drawables: Drawable[];
    private pickUpPoints: PickUpPoints;

    private touchPoint: Point2D;
    private _mousePos: Point2D;

    private mode: number = 0;

    private image: HTMLImageElement;

    public imageRect: Rect = null;

    constructor(imageCanvas: HTMLCanvasElement, canvas: HTMLCanvasElement, image: HTMLImageElement) {
        this.imageCanvas = imageCanvas;
        this.imageCtx = this.imageCanvas.getContext("2d");

        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.image = image;

        let size:Size={width:1,height:1};
        let points= [new Point2D(), new Point2D(), new Point2D(), new Point2D()];

        this.pickUpPoints = new PickUpPoints(size,points);
        this._mousePos = new Point2D();
        let borderWithHole = new BorderWithHole(this.pickUpPoints.canvasSize, this.pickUpPoints.points);
        let imageBounds = new ImageBounds(this.pickUpPoints.points,);

        this.drawables = [borderWithHole, imageBounds, this.pickUpPoints,this._mousePos];

        this.resizeCanvas(this.canvas.width, this.canvas.height);
    }

    public resizeCanvas(w: number, h: number) {
        this.imageCanvas.width = this.canvas.width = w;
        this.imageCanvas.height = this.canvas.height = h;
        this.pickUpPoints.canvasSize.width = w;
        this.pickUpPoints.canvasSize.height = h;

        this.imageRect = this.pickUpPoints.calcImageBoundary(this.image.width, this.image.height);

        if (this.imageRect) {
            this.imageCtx.clearRect(0, 0, this.pickUpPoints.canvasSize.width, this.pickUpPoints.canvasSize.height);
            this.imageCtx.strokeStyle = '#000000';
            this.imageCtx.lineWidth = 0.5;
            this.imageCtx.globalAlpha = 1.0;
            this.imageCtx.strokeRect(this.imageRect.x, this.imageRect.y, this.imageRect.w, this.imageRect.h);
            this.imageCtx.drawImage(this.image, this.imageRect.x, this.imageRect.y, this.imageRect.w, this.imageRect.h);
        }
    }

    public refreshPainting() {
        this.paintCanvas();
        requestAnimationFrame(() => this.paintCanvas());
    }

    public set mousePos(point: Point) {
        if (!point) {
            this._mousePos = null;
            this.touchPoint = null;
            return;
        }
        let deltaX = this._mousePos ? point.x - this._mousePos.x : 0;
        let deltaY = this._mousePos ? point.y - this._mousePos.y : 0;

        this._mousePos.point = point;

        this.touchPoint = this.pickUpPoints.getTouchPoint(point);
        this.pickUpPoints.move(this.mode, point, deltaX, deltaY);
    }

    public set mouseStart(value: Point) {
        if (value) {
            this.mode = this.pickUpPoints.whichPoint(value);
        } else {
            this.mode = 0;
        }
    }

    public get rect(): Rect {
        let p1: Point = this.pickUpPoints.points[0];
        let p2: Point = this.pickUpPoints.points[2];
        return { x: p1.x, y: p1.y, w: p2.x - p1.x, h: p2.y - p1.y };
    }

    public paintCanvas = () => {
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.pickUpPoints.canvasSize.width, this.pickUpPoints.canvasSize.height);

            this.ctx.save();

            this.drawables.forEach(drawable => drawable.draw(this.ctx));

            if (this.touchPoint) {
                this.touchPoint.draw(this.ctx, '#0000ff');
            }

            this.ctx.restore();
        }
    }

}

export default class ImageCropper extends React.Component<{ onChange: Function, src: string, thumbSize: Size, preview?: boolean }, {}> {
    private canvasPainter: CanvasPainter = null;

    private container: HTMLDivElement;
    private imageCanvas: HTMLCanvasElement;
    private canvas: HTMLCanvasElement;
    private canvasPreview: HTMLCanvasElement;

    private g_previewTimer: NodeJS.Timeout = null;
    private g_count: number = 0;

    componentDidMount() {
        window.addEventListener('resize', this.resizeHandler);

        ['mousemove', 'touchmove'].forEach((e) => window.addEventListener(e, this.moveHandler));
        ['mousedown', 'touchstart'].forEach((e) => window.addEventListener(e, this.pressedHandler));
        ['mouseup', 'touchend'].forEach((e) => window.addEventListener(e, this.releasedHandler));

        (async () => {
            let image: HTMLImageElement = await this.loadImage(this.props.src);
            
            this.canvasPainter = new CanvasPainter(this.imageCanvas, this.canvas, image);
            this.resizeHandler(null);

            this.canvasPreview.width = this.props.thumbSize.width;
            this.canvasPreview.height = this.props.thumbSize.height;
            this.drawPreview();
        })();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resizeHandler);

        ['mousemove', 'touchmove'].forEach((e) => window.removeEventListener(e, this.moveHandler));
        ['mousedown', 'touchstart'].forEach((e) => window.removeEventListener(e, this.pressedHandler));
        ['mouseup', 'touchend'].forEach((e) => window.removeEventListener(e, this.releasedHandler));
    }

    private resizeHandler = (e: Event) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        this.canvasPainter.resizeCanvas(this.container.clientWidth, this.container.clientHeight);
        this.canvasPainter.refreshPainting();
    }

    private loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            let img: HTMLImageElement = new Image();
            img.addEventListener('load', () => resolve(img));
            img.addEventListener('error', () => {
                reject(new Error(`Failed to load image's URL: ${url}`));
            });
            img.src = url;
        });
    }

    private moveHandler = (event: any) => {
        if (!this.canvasPainter) {
            return;
        }

        let p = this.getMousePos(event);
        this.canvasPainter.mousePos = p;
        this.drawPreview();
        this.canvasPainter.refreshPainting();
    }

    private pressedHandler = (event: any) => {
        if (!this.canvasPainter) {
            return;
        }

        let p = this.getMousePos(event);
        this.canvasPainter.mousePos = p;
        this.canvasPainter.mouseStart = p;
        this.canvasPainter.refreshPainting();
    }

    private releasedHandler = () => {
        if (!this.canvasPainter) {
            return;
        }

        this.canvasPainter.mouseStart = null;
        this.canvasPainter.refreshPainting();
    }

    private getMousePos(event: any) {
        let clientX = event.clientX || event.touches && event.touches[0] && event.touches[0].clientX;
        let clientY = event.clientY || event.touches && event.touches[0] && event.touches[0].clientY;

        var rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    private refreshPreview = () => {
        this.g_count = 0;
        this.g_previewTimer = null;

        let imageSrc: string = this.imageCanvas.toDataURL();

        let ctx: CanvasRenderingContext2D = this.canvasPreview.getContext("2d");

        (async () => {
            let image: HTMLImageElement = await this.loadImage(imageSrc);

            let r: Rect = this.canvasPainter.rect;

            let aspectRatioWidth = r.w / this.props.thumbSize.width;
            let aspectRatioHeight = r.h / this.props.thumbSize.height;

            let ratio = Math.min(aspectRatioWidth, aspectRatioHeight);

            let w = this.props.thumbSize.width * ratio;
            let h = this.props.thumbSize.height * ratio;

            ctx.clearRect(0, 0, this.props.thumbSize.width, this.props.thumbSize.height);
            ctx.drawImage(image, r.x, r.y, w, h, 0, 0, this.props.thumbSize.width, this.props.thumbSize.height);
            this.props.onChange(this.canvasPreview.toDataURL());
        })();
    };

    private drawPreview() {

        if (this.g_previewTimer) {
            clearTimeout(this.g_previewTimer);
            this.g_previewTimer = null;
            this.g_count++;
        }
        this.g_previewTimer = setTimeout(this.refreshPreview, 100);

        if (this.g_count > 7) {
            this.refreshPreview();
        }
    }

    render() {
        let containerStyle: any = {
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: "#fff",
            boxSizing: "border-box",
            padding: 0,
            margin: '0 auto'
        };

        let canvasStyle: any = {
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            boxSizing: "border-box",
            padding: 0,
            margin: 0
        }

        let canvasPreviewStyle: any = {
            width: this.props.thumbSize.width,
            height: this.props.thumbSize.height,
            position: 'absolute',
            left: 5,
            top: 5,
            backgroundColor: "#ffffff",
            boxSizing: "border-box",
            padding: 0,
            margin: 0,
            display: !this.props.preview ? 'none' : 'block'
        }

        return (
            <div ref={(ref) => this.container = ref} style={containerStyle}>
                <canvas ref={(ref) => this.imageCanvas = ref} style={canvasStyle} />
                <canvas ref={(ref) => this.canvas = ref} style={canvasStyle} />
                <canvas ref={(ref) => this.canvasPreview = ref} style={canvasPreviewStyle} />
            </div>
        )
    }
}
