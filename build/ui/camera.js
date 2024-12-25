/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
var _a;
import { constrain } from "../util/funcs.js";
import { Intersector } from "../util/geom.js";
import { consts, Game } from "../vars.js";
export class Camera {
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
