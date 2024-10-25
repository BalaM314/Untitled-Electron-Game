"use strict";
var _a;
function getAnimationData(fin) {
    return {
        linc: (from = 0, to = 1) => from + fin * (to - from),
        ldec: (from = 1, to = 0) => from + fin * (to - from),
        pdec: (a, p = 10) => 1 - Math.pow(fin - 1 + a ** (1 / p), p) + (a - 1) * fin,
        edec: (a, to = 0) => (1 - to) * Math.exp(-a * fin) + to,
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
                widthByTwo: img.width / 2,
                heightByTwo: img.height / 2,
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
    static update() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.widthByTwo = this.width / 2;
        this.heightByTwo = this.height / 2;
        this.zoomedTileSize = this.zoomLevel * consts.TILE_SIZE;
        this.scrollXTimesZoomLevel = this.scrollX * this.zoomLevel;
        this.scrollYTimesZoomLevel = this.scrollY * this.zoomLevel;
        this.scrollXTimesZoomLevelPlusWidthByTwo = this.scrollX * this.zoomLevel + this.widthByTwo;
        this.scrollYTimesZoomLevelPlusHeightByTwo = this.scrollY * this.zoomLevel + this.heightByTwo;
        this.visibleRect = [
            ...this.unproject(0, 0),
            this.width / this.zoomLevel,
            this.height / this.zoomLevel,
        ];
    }
    static scroll(x, y) {
        this.scrollTo(this.scrollX - x, this.scrollY - y);
    }
    static scrollTo(x, y, limitScroll = true) {
        this.scrollX = x;
        this.scrollY = y;
        if (limitScroll) {
            const distSquared = this.scrollX ** 2 + this.scrollY ** 2;
            if (distSquared > this.maxDistanceSquared) {
                const dist = Math.sqrt(distSquared);
                this.scrollX *= this.maxDistance / dist;
                this.scrollY *= this.maxDistance / dist;
                this.scrollLimited = true;
            }
        }
        this.update();
        Game.forceRedraw = true;
    }
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
        this.zoomLevel *= scaleFactor;
        this.update();
        Game.forceRedraw = true;
    }
    static zoomTo(value) {
        this.zoomLevel = constrain(value, this.minZoom, this.maxZoom);
        this.update();
        Game.forceRedraw = true;
    }
    static isVisible(rect, cullingMargin = 0) {
        const [x, y, w, h] = this.visibleRect;
        return Intersector.rectsIntersect(rect, [x - cullingMargin, y - cullingMargin, w + cullingMargin * 2, h + cullingMargin * 2]);
    }
    static isPointVisible(point, cullingMargin = 0) {
        const [x, y, w, h] = this.visibleRect;
        return Intersector.pointInRect(point, [x - cullingMargin, y - cullingMargin, w + cullingMargin * 2, h + cullingMargin * 2]);
    }
    static project(x, y) {
        return [
            x * this.zoomLevel + this.scrollXTimesZoomLevelPlusWidthByTwo,
            y * this.zoomLevel + this.scrollYTimesZoomLevelPlusHeightByTwo,
        ];
    }
    static unproject(x, y) {
        return [
            (x - this.widthByTwo) / this.zoomLevel - this.scrollX,
            (y - this.heightByTwo) / this.zoomLevel - this.scrollY
        ];
    }
}
_a = Camera;
Camera.maxDistance = 170 * consts.TILE_SIZE;
Camera.minZoom = 1;
Camera.maxZoom = 5;
Camera.zoomLevel = 1;
Camera.scrollX = 0;
Camera.scrollY = 0;
Camera.width = window.innerWidth;
Camera.height = window.innerHeight;
Camera.scrollLimited = false;
Camera.zoomedTileSize = _a.zoomLevel * consts.TILE_SIZE;
Camera.maxDistanceSquared = _a.maxDistance ** 2;
(() => {
    _a.update();
})();
class Gfx {
    static addDrawer(drawer) {
        this.drawers.push(drawer);
    }
    static clearDrawers() {
        this.drawers = [];
    }
    static init() {
        this.layers = {
            tile: ctxTiles,
            tileOver: ctxTilesOver,
            buildingsUnder: ctxBuildsUnder,
            buildings: ctxBuilds,
            overlayBuilds: ctxOBuilds,
            ghostBuilds: ctxGBuilds,
            items: ctxItems,
            effects: ctxEffects,
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
    static clear(color, _ctx = this.ctx) {
        if (color) {
            _ctx.fillStyle = color;
            _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
        }
        else {
            _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
        }
    }
    static text(text, x, y) {
        this.ctx.fillText(text, x, y);
    }
    static textOutline(text, x, y) {
        this.ctx.fillText(text, x, y);
        this.ctx.strokeText(text, x, y);
    }
    static pText(pixelX, pixelY, text) {
        this.ctx.fillText(text, (pixelX + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, (pixelY + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2);
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
    static textAlign(align) {
        this.ctx.textAlign = align;
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
            _ctx.fillRect(pixelX * Camera.zoomLevel + Camera.scrollXTimesZoomLevelPlusWidthByTwo, pixelY * Camera.zoomLevel + Camera.scrollYTimesZoomLevelPlusHeightByTwo, width * Camera.zoomLevel, height * Camera.zoomLevel);
        else
            _ctx.fillRect(pixelX - (width / 2) * Camera.zoomLevel + Camera.scrollXTimesZoomLevelPlusWidthByTwo, pixelY - (height / 2) * Camera.zoomLevel + Camera.scrollYTimesZoomLevelPlusHeightByTwo, width * Camera.zoomLevel, height * Camera.zoomLevel);
    }
    static tRect(tileX, tileY, width, height, mode = this.rectMode, _ctx = this.ctx) {
        if (mode == RectMode.CORNER)
            _ctx.fillRect(tileX * Camera.zoomedTileSize + Camera.scrollXTimesZoomLevelPlusWidthByTwo, tileY * Camera.zoomedTileSize + Camera.scrollYTimesZoomLevelPlusHeightByTwo, width * Camera.zoomedTileSize, height * Camera.zoomedTileSize);
        else
            _ctx.fillRect((tileX - 0.5 * width) * Camera.zoomedTileSize + Camera.scrollXTimesZoomLevelPlusWidthByTwo, (tileY - 0.5 * height) * Camera.zoomedTileSize + Camera.scrollYTimesZoomLevelPlusHeightByTwo, width * Camera.zoomedTileSize, height * Camera.zoomedTileSize);
    }
    static tImage(texture, tileX, tileY, width = 1, height = 1, _ctx = this.ctx) {
        _ctx.drawImage(texture.image, tileX * Camera.zoomedTileSize + Camera.scrollXTimesZoomLevelPlusWidthByTwo, tileY * Camera.zoomedTileSize + Camera.scrollYTimesZoomLevelPlusHeightByTwo, width * Camera.zoomedTileSize, height * Camera.zoomedTileSize);
    }
    static tImageOneByOne(texture, tileX, tileY) {
        this.ctx.drawImage(texture.image, tileX * Camera.zoomedTileSize + Camera.scrollXTimesZoomLevelPlusWidthByTwo, tileY * Camera.zoomedTileSize + Camera.scrollYTimesZoomLevelPlusHeightByTwo, Camera.zoomedTileSize, Camera.zoomedTileSize);
    }
    static pImage(texture, pixelX, pixelY, width = texture.width, height = texture.height, mode = this.rectMode, _ctx = this.ctx) {
        if (mode == RectMode.CORNER)
            _ctx.drawImage(texture.image, pixelX * Camera.zoomLevel + Camera.scrollXTimesZoomLevelPlusWidthByTwo, pixelY * Camera.zoomLevel + Camera.scrollYTimesZoomLevelPlusHeightByTwo, width * Camera.zoomLevel, height * Camera.zoomLevel);
        else
            _ctx.drawImage(texture.image, (pixelX - (width / 2)) * Camera.zoomLevel + Camera.scrollXTimesZoomLevelPlusWidthByTwo, (pixelY - (height / 2)) * Camera.zoomLevel + Camera.scrollYTimesZoomLevelPlusHeightByTwo, width * Camera.zoomLevel, height * Camera.zoomLevel);
    }
    static tEllipse(tileX, tileY, width, height = width, rotation = 0, startAngle = 0, endAngle = 2 * Math.PI, _ctx = this.ctx) {
        _ctx.beginPath();
        _ctx.moveTo(tileX * Camera.zoomedTileSize + Camera.scrollXTimesZoomLevelPlusWidthByTwo, tileY * Camera.zoomedTileSize + Camera.scrollYTimesZoomLevelPlusHeightByTwo);
        _ctx.ellipse(tileX * Camera.zoomedTileSize + Camera.scrollXTimesZoomLevelPlusWidthByTwo, tileY * Camera.zoomedTileSize + Camera.scrollYTimesZoomLevelPlusHeightByTwo, width * Camera.zoomLevel * consts.TILE_SIZE / 2, height * Camera.zoomLevel * consts.TILE_SIZE / 2, rotation, startAngle, endAngle);
        _ctx.fill();
    }
    static ellipse(x, y, w, h = w, _ctx = this.ctx) {
        _ctx.beginPath();
        _ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
        _ctx.fill();
    }
}
Gfx.layers = null;
Gfx.textures = {};
Gfx.rectMode = RectMode.CORNER;
Gfx.ctx = null;
Gfx.drawers = [];
class ParticleEffect {
    constructor(args) {
        this.lifetime = 1000;
        this.color = "white";
        this.clipSize = 100;
        Object.assign(this, args);
    }
    display(data) {
        data.prand.reset();
        this.drawer({
            ...getAnimationData((Date.now() - data.createdAt) / this.lifetime),
            color: data.color,
            pos: data.pos,
            createdAt: data.createdAt,
            prand: data.prand
        });
    }
    at(pos, color = this.color) {
        ParticleEffect.effects.add({
            type: this,
            createdAt: Date.now(),
            pos, color,
            id: ++ParticleEffect.id,
            prand: new PseudoRandom(ParticleEffect.id),
        });
    }
    static displayAll() {
        Gfx.layer("effects");
        this.effects.forEach(e => {
            if (Date.now() >= e.createdAt + e.type.lifetime)
                this.effects.delete(e);
            else if (Camera.isPointVisible(e.pos.pixel, e.type.clipSize))
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
            Gfx.tEllipse(pos.tileXExact + linc(0, 0.1), pos.tileYExact - linc(0, 0.9), linc(0.2, 0.7), linc(0.2, 0.7));
        },
    }),
    spark: new ParticleEffect({
        lifetime: 500,
        color: "#FFD",
        drawer({ prand, linc, edec, pos, color }) {
            Gfx.alpha(edec(5));
            Gfx.strokeColor(color);
            Gfx.lineWidth(5);
            const location = add(add(pos.tile, prand.vec(prand.num(0.4, 0.55))), mul(prand.vec(0), linc()));
            const offset = add(location, prand.vec(0.15));
            const offset2 = add(location, prand.vec(0.15));
            Gfx.tLine(...location, ...offset);
            Gfx.tLine(...location, ...offset2);
        },
    }),
};
