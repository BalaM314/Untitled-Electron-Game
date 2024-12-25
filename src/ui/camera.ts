/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the Camera object. */

import { constrain } from "../util/funcs.js";
import { Rect, Intersector, PosT } from "../util/geom.js";
import { consts, Game } from "../vars.js";


export class Camera {
	//Configuration
	static readonly maxDistance = 170 * consts.TILE_SIZE;
	static readonly minZoom = 1;
	static readonly maxZoom = 5;

	//Variables
	static zoomLevel = 1;
	static scrollX = 0;
	static scrollY = 0;
	static width = window.innerWidth;
	static height = window.innerHeight;
	/** If true, the distance limit has triggered at least once. */
	static scrollLimited = false;

	//Cached calculations
	static zoomedTileSize = this.zoomLevel * consts.TILE_SIZE;
	static widthByTwo: number;
	static heightByTwo: number;
	static scrollXTimesZoomLevel: number;
	static scrollYTimesZoomLevel: number;
	static scrollXTimesZoomLevelPlusWidthByTwo: number;
	static scrollYTimesZoomLevelPlusHeightByTwo: number;
	/**The rectangle that is visible in in-world coordinates.*/
	static visibleRect: Rect;
	static readonly maxDistanceSquared = this.maxDistance ** 2;
	static {
		this.update();
	}
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
	static scroll(x: number, y: number) {
		this.scrollTo(this.scrollX - x, this.scrollY - y);
	}
	static scrollTo(x: number, y: number, limitScroll = true) {
		this.scrollX = x;
		this.scrollY = y;
		if (limitScroll) {
			//Limit the length of this.scroll
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
	static zoom(scaleFactor: number) {
		scaleFactor = constrain(scaleFactor, 0.9, 1.1);
		if (this.zoomLevel * scaleFactor < this.minZoom) {
			scaleFactor = this.minZoom / this.zoomLevel;
		} else if (this.zoomLevel * scaleFactor > this.maxZoom) {
			scaleFactor = this.maxZoom / this.zoomLevel;
		}
		if ((this.zoomLevel <= this.minZoom && scaleFactor <= 1) || (this.zoomLevel >= this.maxZoom && scaleFactor >= 1)) {
			return;
		}
		this.zoomLevel *= scaleFactor;
		this.update();
		Game.forceRedraw = true;
	}
	static zoomTo(value: number) {
		this.zoomLevel = constrain(value, this.minZoom, this.maxZoom);
		this.update();
		Game.forceRedraw = true;
	}
	static isVisible(rect: Rect, cullingMargin = 0) {
		const [x, y, w, h] = this.visibleRect;
		return Intersector.rectsIntersect(rect, [x - cullingMargin, y - cullingMargin, w + cullingMargin * 2, h + cullingMargin * 2]);
	}
	static isPointVisible(point: PosT, cullingMargin = 0) {
		const [x, y, w, h] = this.visibleRect;
		return Intersector.pointInRect(point, [x - cullingMargin, y - cullingMargin, w + cullingMargin * 2, h + cullingMargin * 2]);
	}
	/**Converts world coordinates to screen coordinates, where [0,0] is at the top left. */
	static project(x: number, y: number): PosT {
		return [
			x * this.zoomLevel + this.scrollXTimesZoomLevelPlusWidthByTwo,
			y * this.zoomLevel + this.scrollYTimesZoomLevelPlusHeightByTwo,
		];
	}
	/**Converts screen coordinates to world coordinates. */
	static unproject(x: number, y: number): PosT {
		return [
			(x - this.widthByTwo) / this.zoomLevel - this.scrollX,
			(y - this.heightByTwo) / this.zoomLevel - this.scrollY
		];
	}
}
