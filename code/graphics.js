"use strict";
var _a;
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
        return Intersector.rectsIntersect(rect, [x - cullingMargin, y - cullingMargin, w + cullingMargin, h + cullingMargin]);
    }
    static isPointVisible(point, cullingMargin = 0) {
        const [x, y, w, h] = this.visibleRect();
        return Intersector.pointInRect(point, [x - cullingMargin, y - cullingMargin, w + cullingMargin, h + cullingMargin]);
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
    static layer(k) {
        this.ctx = this.layers[k];
        this.alpha(1);
    }
    static alpha(a) {
        this.ctx.globalAlpha = a;
    }
    static texture(id) {
        return this.textures[id] ?? this.textures["error"];
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
    static fillColor(color) {
        this.ctx.fillStyle = color;
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
            _ctx.fillRect(((tileX - 0.5) * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2, ((tileY - 0.5) * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2, width * Camera.zoomLevel * consts.TILE_SIZE, height * Camera.zoomLevel * consts.TILE_SIZE);
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
    static ellipse(x, y, w, h, _ctx = this.ctx) {
        _ctx.beginPath();
        _ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
        _ctx.fill();
    }
}
_a = Gfx;
Gfx.layers = {
    tile: ctxTiles,
    buildings: ctxBuilds,
    overlayBuilds: ctxOBuilds,
    ghostBuilds: ctxGBuilds,
    items: ctxItems,
    overlay: ctxOverlays,
};
Gfx.textures = {};
Gfx.rectMode = RectMode.CORNER;
Gfx.ctx = _a.layers.overlay;
