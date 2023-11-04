"use strict";
function getAnimationData(fin) {
    return {
        linc: (from = 0, to = 1) => from + fin * (to - from),
        ldec: (from = 1, to = 0) => from + fin * (to - from),
        pdec: (a, p = 10) => 1 - Math.pow(fin - 1 + a ** (1 / p), p) + (a - 1) * fin,
        sin: (b = 1, a = 1, c = 0) => a * Math.sin(Math.PI * 2 * b * fin) + c,
        cos: (b = 1, a = 1, c = 0) => a * Math.cos(Math.PI * 2 * b * fin) + c,
    };
}
function loadTexture(t, texturesDiv) {
    return new Promise((resolve, reject) => {
        let img = document.createElement("img");
        img.setAttribute("src", `assets/textures/${t.id}.png`.replace(":", "%23"));
        img.addEventListener("load", () => {
            Game.loadedTextures++;
            resolve({
                ...t,
                image: img,
                width: img.width,
                height: img.height,
            });
        });
        img.addEventListener("error", (err) => {
            alert(`Failed to load texture "${t.id}": ${err.message}`);
            console.error(err);
            reject(`Failed to load texture "${t.id}": ${err.message}`);
        });
        texturesDiv.appendChild(img);
    });
}
async function loadTextures(textures, texturesDiv) {
    return Object.fromEntries((await Promise.all(textures.map(t => loadTexture(t, texturesDiv))))
        .map(t => [t.id, t]));
}
class Camera {
    static zoom(scaleFactor) {
        scaleFactor = constrain(scaleFactor, 0.9, 1.1);
        if (this.zoomLevel * scaleFactor < this.minZoom) {
            scaleFactor = this.minZoom / this.zoomLevel;
        }
        else if (this.zoomLevel * scaleFactor > this.maxZoom) {
            scaleFactor = this.maxZoom / this.zoomLevel;
        }
        if ((this.zoomLevel <= this.minZoom && scaleFactor <= 1) || (this.zoomLevel >= this.maxZoom && scaleFactor >= 1)) {
            return;
        }
        Game.forceRedraw = true;
        this.zoomLevel *= scaleFactor;
    }
    static visibleRect() {
        return [
            ...this.unproject(0, 0),
            this.width / this.zoomLevel,
            this.height / this.zoomLevel,
        ];
    }
    static isVisible(rect, cullingMargin = 0) {
        const [x, y, w, h] = this.visibleRect();
        return Intersector.rectsIntersect(rect, [x - cullingMargin, y - cullingMargin, w + cullingMargin * 2, h + cullingMargin * 2]);
    }
    static isPointVisible(point, cullingMargin = 0) {
        const [x, y, w, h] = this.visibleRect();
        return Intersector.pointInRect(point, [x - cullingMargin, y - cullingMargin, w + cullingMargin * 2, h + cullingMargin * 2]);
    }
    static project(x, y) {
        return [
            ((x + this.scrollX) * this.zoomLevel) + this.width / 2,
            ((y + this.scrollY) * this.zoomLevel) + this.height / 2
        ];
    }
    static unproject(x, y) {
        return [
            (x - this.width / 2) / this.zoomLevel - this.scrollX,
            (y - this.height / 2) / this.zoomLevel - this.scrollY
        ];
    }
}
Camera.zoomLevel = 1;
Camera.minZoom = 1;
Camera.maxZoom = 5;
Camera.scrollX = 0;
Camera.scrollY = 0;
Camera.width = window.innerWidth;
Camera.height = window.innerHeight;
class Gfx {
    static init() {
        this.layers = {
            tile: ctxTiles,
            ghostBuilds: ctxGBuilds,
            buildingsUnder: ctxBuildsUnder,
            buildings: ctxBuilds,
            overlayBuilds: ctxOBuilds,
            items: ctxItems,
            overlay: ctxOverlays,
        };
        this.ctx = this.layers.overlay;
    }
    static layer(k) {
        this.ctx = this.layers[k] ?? crash(`Invalid layer ${k}`);
        this.alpha(1);
    }
    static lerp(from, to, f) {
        return [
            from[0] + f * (to[0] - from[0]),
            from[1] + f * (to[1] - from[1]),
            from[2] + f * (to[2] - from[2])
        ];
    }
    static alpha(a) {
        this.ctx.globalAlpha = a;
    }
    static texture(id) {
        return this.textures[id] ?? this.textures["error"];
    }
    static tLine(x1, y1, x2, y2, _ctx = this.ctx) {
        _ctx.beginPath();
        _ctx.moveTo((x1 * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (y1 * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2);
        _ctx.lineTo((x2 * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (y2 * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2);
        _ctx.stroke();
    }
    static lineTRect(tileX, tileY, width, height, mode = this.rectMode, _ctx = this.ctx) {
        if (mode == RectMode.CORNER)
            _ctx.strokeRect((tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * Camera.zoomLevel * consts.TILE_SIZE, height * Camera.zoomLevel * consts.TILE_SIZE);
        else
            _ctx.strokeRect(((tileX - 0.5) * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, ((tileY - 0.5) * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * Camera.zoomLevel * consts.TILE_SIZE, height * Camera.zoomLevel * consts.TILE_SIZE);
    }
    static lineWidth(width) {
        this.ctx.lineWidth = width;
    }
    static text(text, x, y) {
        this.ctx.fillText(text, x, y);
    }
    static lineRect(x, y, w, h, mode = this.rectMode, _ctx = this.ctx) {
        if (mode == RectMode.CENTER) {
            _ctx.strokeRect(x - w / 2, y - w / 2, w, h);
        }
        else {
            _ctx.strokeRect(x, y, w, h);
        }
    }
    static strokeColor(color) {
        this.ctx.strokeStyle = color;
    }
    static fillColor(arg1, arg2, arg3) {
        if (typeof arg1 == "string") {
            this.ctx.fillStyle = arg1;
        }
        else {
            this.ctx.fillStyle = `rgb(${arg1},${arg2},${arg3})`;
        }
    }
    static font(font) {
        this.ctx.font = font;
    }
    static rect(x, y, w, h, mode = this.rectMode, _ctx = this.ctx) {
        if (mode == RectMode.CENTER) {
            _ctx.fillRect(x - w / 2, y - w / 2, w, h);
        }
        else {
            _ctx.fillRect(x, y, w, h);
        }
    }
    static pRect(pixelX, pixelY, width, height, mode = this.rectMode, _ctx = this.ctx) {
        if (mode == RectMode.CORNER)
            _ctx.fillRect((pixelX + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (pixelY + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * Camera.zoomLevel, height * Camera.zoomLevel);
        else
            _ctx.fillRect(pixelX + ((Camera.scrollX - width / 2) * Camera.zoomLevel) + Camera.width / 2, pixelY + ((Camera.scrollY - height / 2) * Camera.zoomLevel) + Camera.height / 2, width * Camera.zoomLevel, height * Camera.zoomLevel);
    }
    static tRect(tileX, tileY, width, height, mode = this.rectMode, _ctx = this.ctx) {
        if (mode == RectMode.CORNER)
            _ctx.fillRect((tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * Camera.zoomLevel * consts.TILE_SIZE, height * Camera.zoomLevel * consts.TILE_SIZE);
        else
            _ctx.fillRect(((tileX - 0.5 * width) * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, ((tileY - 0.5 * height) * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * Camera.zoomLevel * consts.TILE_SIZE, height * Camera.zoomLevel * consts.TILE_SIZE);
    }
    static tImage(texture, tileX, tileY, width = 1, height = 1, _ctx = this.ctx) {
        _ctx.drawImage(texture.image, (tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * consts.TILE_SIZE * Camera.zoomLevel, height * consts.TILE_SIZE * Camera.zoomLevel);
    }
    static pImage(texture, pixelX, pixelY, width = texture.width, height = texture.height, mode = this.rectMode, _ctx = this.ctx) {
        if (mode == RectMode.CORNER)
            _ctx.drawImage(texture.image, (pixelX + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (pixelY + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * Camera.zoomLevel, height * Camera.zoomLevel);
        else
            _ctx.drawImage(texture.image, (pixelX - (width / 2) + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (pixelY - (width / 2) + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * Camera.zoomLevel, height * Camera.zoomLevel);
    }
    static tEllipse(tileX, tileY, width, height, rotation = 0, startAngle = 0, endAngle = 2 * Math.PI, _ctx = this.ctx) {
        _ctx.beginPath();
        _ctx.moveTo((tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2);
        _ctx.ellipse((tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * Camera.zoomLevel * consts.TILE_SIZE / 2, height * Camera.zoomLevel * consts.TILE_SIZE / 2, rotation, startAngle, endAngle);
        _ctx.fill();
    }
    static ellipse(x, y, w, h, _ctx = this.ctx) {
        _ctx.beginPath();
        _ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
        _ctx.fill();
    }
}
Gfx.layers = null;
Gfx.textures = {};
Gfx.rectMode = RectMode.CORNER;
Gfx.ctx = null;
class ParticleEffect {
    constructor(args) {
        this.lifetime = 1000;
        this.color = "white";
        Object.assign(this, args);
    }
    display(data) {
        this.drawer({
            ...getAnimationData((Date.now() - data.createdAt) / this.lifetime),
            color: data.color,
            pos: data.pos,
            createdAt: data.createdAt
        });
    }
    at(pos, color = this.color) {
        ParticleEffect.effects.add({
            type: this,
            createdAt: Date.now(),
            pos, color,
            id: ++ParticleEffect.id,
        });
    }
    static displayAll() {
        Gfx.layer("overlay");
        this.effects.forEach(e => {
            if (Date.now() >= e.createdAt + e.type.lifetime)
                this.effects.delete(e);
            else
                e.type.display(e);
        });
    }
}
ParticleEffect.effects = new Set();
ParticleEffect.id = 0;
const Fx = {
    smoke: new ParticleEffect({
        lifetime: 1500,
        color: "#555",
        drawer({ linc, pdec, pos, color }) {
            Gfx.alpha(pdec(0.3, 8));
            Gfx.fillColor(color);
            Gfx.tEllipse(pos.tileXCentered + linc(0, 0.1), pos.tileYCentered - linc(0, 0.9), linc(0.2, 0.7), linc(0.2, 0.7));
        },
    })
};
