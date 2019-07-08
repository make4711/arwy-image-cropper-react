import * as React from 'react'

export interface Point {
    x: number;
    y: number;
};

export interface Size {
    w: number;
    h: number;
};

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
};

class CanvasPainter {
    private static readonly DELTA: number = 20;
    private static readonly SCALE: number = .7;

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private touchPoint: Point;
    private _mousePos: Point;
    private deltaX: number = 0;
    private deltaY: number = 0;

    private mode: number = 0;

    public clipPoints: Point[] = null;
    private image: HTMLImageElement;

    public imageBounds: Rect = null;

    constructor(canvas: HTMLCanvasElement, image: HTMLImageElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.image = image;

        this.resizeCanvas();
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
        this.deltaX = this._mousePos ? point.x - this._mousePos.x : 0;
        this.deltaY = this._mousePos ? point.y - this._mousePos.y : 0;

        this._mousePos = point;
        this.touchPoint = this.getTouchPoint(point);

        this.movePoints(point);
    }

    public set mouseStart(value: Point) {
        if (value) {
            this.mode = this.witchPoint(value);
        } else {
            this.mode = 0;
        }
    }

    public resizeCanvas() {
        this.calcImageBoundary(this.image.width, this.image.height);
    }

    private calcImageBoundary = (w: number, h: number) => {
        let scaleX: number = this.canvas.width / w;
        let scaleY: number = this.canvas.height / h;

        let scale: number = 1.0;

        if (scaleX < scaleY) {
            scale = scaleX;
        } else {
            scale = scaleY;
        }

        let ciw = w * scale * CanvasPainter.SCALE;
        let cih = h * scale * CanvasPainter.SCALE;

        let cix = (this.canvas.width - ciw) / 2;
        let ciy = (this.canvas.height - cih) / 2;

        let clipImageRect: Rect = { x: cix, y: ciy, w: ciw, h: cih };

        this.imageBounds = clipImageRect;
        this.clipPoints = [
            { x: clipImageRect.x, y: clipImageRect.y },
            { x: clipImageRect.x + clipImageRect.w, y: clipImageRect.y },
            { x: clipImageRect.x + clipImageRect.w, y: clipImageRect.y + clipImageRect.h },
            { x: clipImageRect.x, y: clipImageRect.y + clipImageRect.h }
        ];
    }

    private movePoints(point: Point) {
        const clipPoints = [...this.clipPoints].map(item => ({ ...item }));

        switch (this.mode) {
            case 1:
                clipPoints[0].x = point.x;
                clipPoints[0].y = point.y;
                clipPoints[3].x = point.x;
                clipPoints[1].y = point.y;
                break;
            case 2:
                clipPoints[1].x = point.x;
                clipPoints[1].y = point.y;
                clipPoints[0].y = point.y;
                clipPoints[2].x = point.x;
                break;
            case 3:
                clipPoints[2].x = point.x;
                clipPoints[2].y = point.y;
                clipPoints[3].y = point.y;
                clipPoints[1].x = point.x;
                break;
            case 4:
                clipPoints[3].x = point.x;
                clipPoints[3].y = point.y;
                clipPoints[2].y = point.y;
                clipPoints[0].x = point.x;
                break;
            case 1000:
                clipPoints.forEach((point) => { point.x += this.deltaX; point.y += this.deltaY; });
                break;
            default:
                break;
        }

        if (clipPoints[0].x > CanvasPainter.DELTA &&
            clipPoints[1].x < this.canvas.width - CanvasPainter.DELTA &&
            clipPoints[0].y > CanvasPainter.DELTA &&
            clipPoints[2].y < this.canvas.height - CanvasPainter.DELTA
        ) {
            this.clipPoints = clipPoints;
        }
    }

    private drawImageBounds() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.clipPoints[0].x, this.clipPoints[0].y);
        this.clipPoints.forEach((point) => this.ctx.lineTo(point.x, point.y));
        this.ctx.closePath();

        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 1.0;
        this.ctx.stroke();
    }

    private drawOuterWithHole() {
        this.ctx.beginPath();
        this.ctx.lineWidth = 0.0;
        //outer shape, clockwise
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.canvas.width, 0);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();

        //inner shape (hole), counter-clockwise
        this.ctx.moveTo(this.clipPoints[0].x, this.clipPoints[0].y);
        this.clipPoints.reverse().forEach((point) => this.ctx.lineTo(point.x, point.y));
        this.ctx.closePath();
        this.clipPoints.reverse();
        //fill
        this.ctx.fillStyle = "#333333";
        this.ctx.globalAlpha = 0.85;
        this.ctx.fill();
    }

    private drawPoint = (x: number, y: number, color: string) => {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeRect(x - CanvasPainter.DELTA, y - CanvasPainter.DELTA, CanvasPainter.DELTA * 2, CanvasPainter.DELTA * 2);
    }

    public paintCanvas = (forPreview: boolean = true) => {
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.save();

            if (this.imageBounds) {
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 0.5;
                this.ctx.globalAlpha = 1.0;
                this.ctx.strokeRect(this.imageBounds.x, this.imageBounds.y, this.imageBounds.w, this.imageBounds.h);
                this.ctx.drawImage(this.image, this.imageBounds.x, this.imageBounds.y, this.imageBounds.w, this.imageBounds.h);
            }
            if (forPreview) {
                this.drawOuterWithHole();

                this.drawImageBounds();

                this.ctx.beginPath();
                if (this.mousePos) {
                    this.drawPoint(this.mousePos.x, this.mousePos.y, '#00ff00');
                }

                this.clipPoints.forEach(point => this.drawPoint(point.x, point.y, '#00ffff'));

                this.ctx.stroke();
                if (this.touchPoint) {
                    this.drawPoint(this.touchPoint.x, this.touchPoint.y, '#0000ff');
                }
            }

            this.ctx.restore();

            //console.log('PAINT')
        }
    }

    private getTouchPoint(p: Point): Point {
        let index = this.witchPoint(p);
        if (!index || index === 1000) {
            return null;
        }
        return this.clipPoints[index - 1];
    }

    private witchPoint(p: Point): number {
        let index = this.clipPoints.findIndex(item => this.isTouch(p, item));

        if (index === -1 &&
            p.x >= this.clipPoints[0].x &&
            p.y >= this.clipPoints[0].y &&
            p.x <= this.clipPoints[2].x &&
            p.y <= this.clipPoints[2].y) {
            return 1000;
        }

        if (index === -1) {
            return 0;
        }

        return index + 1;
    }

    private isTouch(p1: Point, p2: Point) {
        return (Math.abs(p1.x - p2.x) < CanvasPainter.DELTA && Math.abs(p1.y - p2.y) < CanvasPainter.DELTA)
    }
}

export default class ImageCropper extends React.Component<{ onChange: Function, src: string, thumbSize: Size, preview?: boolean }, {}> {
    private canvasPainter: CanvasPainter = null;

    private container: HTMLDivElement;
    private canvas: HTMLCanvasElement;
    private canvasPreview: HTMLCanvasElement;

    componentDidMount() {
        window.addEventListener('resize', this.resizeHandler);

        window.addEventListener('mousemove', this.mouseMoveHandler);
        window.addEventListener('mousedown', this.mousePressedHandler);
        window.addEventListener('mouseup', this.mouseReleasedHandler);

        window.addEventListener('touchmove', this.touchMoveHandler);
        window.addEventListener('touchstart', this.touchPressedHandler);
        window.addEventListener('touchend', this.touchReleasedHandler);

        (async () => {
            let image: HTMLImageElement = await this.loadImage(this.props.src);
            this.canvasPainter = new CanvasPainter(this.canvas, image);

            this.resizeHandler(null);

            this.canvasPreview.width = this.props.thumbSize.w;
            this.canvasPreview.height = this.props.thumbSize.h;

            this.canvasPainter.paintCanvas(false);
            this.drawPreview();
            this.canvasPainter.refreshPainting();
        })();
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.resizeHandler);

        window.removeEventListener('mousemove', this.mouseMoveHandler);
        window.removeEventListener('mousedown', this.mousePressedHandler);
        window.removeEventListener('mouseup', this.mouseReleasedHandler);

        window.removeEventListener('touchmove', this.touchMoveHandler);
        window.removeEventListener('touchstart', this.touchPressedHandler);
        window.removeEventListener('touchend', this.touchReleasedHandler);
    }
    
    private resizeHandler = (e: Event) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;

        this.canvasPainter.resizeCanvas();//(this.image_width, this.image_height);
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

    private touchMoveHandler = (e: TouchEvent) => this.mouseMoveHandler(e.changedTouches[0])

    private touchPressedHandler = (e: TouchEvent) => this.mousePressedHandler(e.changedTouches[0])

    private touchReleasedHandler = () => this.mouseReleasedHandler()

    private mousePressedHandler = ({ clientX, clientY }: { clientX: number, clientY: number }) => {
        let p = this.getMousePos({ clientX, clientY });
        if (this.canvasPainter) {
            this.canvasPainter.mousePos = p;
            this.canvasPainter.mouseStart = p;
        }
    }

    private mouseReleasedHandler = () => {
        if (this.canvasPainter) {
            this.canvasPainter.mouseStart = null;
        }

        this.canvasPainter.paintCanvas(false);
        this.drawPreview();
        this.canvasPainter.refreshPainting();
    }

    private mouseMoveHandler = ({ clientX, clientY }: { clientX: number, clientY: number }) => {
        let p = this.getMousePos({ clientX, clientY });
        if (this.canvasPainter) {
            this.canvasPainter.mousePos = p;
            this.canvasPainter.paintCanvas(false);
            this.drawPreview();
            this.canvasPainter.refreshPainting();
        }
    }

    private getMousePos({ clientX, clientY }: { clientX: number, clientY: number }) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    private drawPreview() {
        let imageSrc: string = this.canvas.toDataURL();

        let ctx: CanvasRenderingContext2D = this.canvasPreview.getContext("2d");

        (async () => {
            let image: HTMLImageElement = await this.loadImage(imageSrc);
            let p1: Point = this.canvasPainter.clipPoints[0];
            let p2: Point = this.canvasPainter.clipPoints[2];

            let w = Math.min(p2.x - p1.x, p2.y - p1.y);
            let h = w;
            ctx.clearRect(0, 0, this.props.thumbSize.w, this.props.thumbSize.h);
            ctx.drawImage(image, p1.x, p1.y, w, h, 0, 0, this.props.thumbSize.w, this.props.thumbSize.h);
            this.props.onChange(this.canvasPreview.toDataURL());
        })();
    }

    render() {

        let containerStyle: any = {
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: "#ff0",
            boxSizing: "border-box",
            padding: 0,
            margin: '0 auto'
        };

        let canvasStyle: any = {
            width: '100%',
            height: "100%",
            backgroundColor: "#ffffff",
            boxSizing: "border-box",
            padding: 0,
            margin: 0
        }
        let canvasPreviewStyle: any = {
            width: this.props.thumbSize.w,
            height: this.props.thumbSize.h,
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
            <div
                ref={(ref) => this.container = ref}
                style={containerStyle}>
                <canvas ref={(ref) => this.canvas = ref}
                    style={canvasStyle} />
                <canvas ref={(ref) => this.canvasPreview = ref}
                    style={canvasPreviewStyle} />
            </div>
        )
    }

}
