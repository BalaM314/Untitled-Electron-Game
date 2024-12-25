/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains global variables. */

import { WindowedMean } from "./util/windowed-mean.js";
import type { Level } from "./world/world.js";


export const consts = {
	VERSION: "alpha 3.2.0",
	/**Size of a chunk in tiles. */
	CHUNK_SIZE: 16,
	/**Size of a tile in pixels. */
	TILE_SIZE: 30,
	/**Size of an item in pixels. */
	ITEM_SIZE: 16,
	chunkSizeInPixels: 16 * 30,
	/**Margin applied to chunk culling. */
	chunkCullingMargin: 120,
	/**Updates per second. */
	ups: 60,
	scrollSpeed: 5,
	fastScrollSpeed: 20,
};
export const Mathf = {
	TWO_PI: Math.PI * 2,
	HALF_PI: Math.PI / 2,
};



export const settings = {
	debug: false,
	alwaysLoadSave: true,
	autoSave: true,
	showExtraPipeInfo: false,
	showIDsInTooltips: false,
	showChunkBorders: false,
	showTileBorders: true,
};
export const Game: {
	texturesReady: boolean;
	startTime: number;
	lastSaved: number;
	forceRedraw: boolean;
	sceneName: "loading" | "title" | "settings" | "settings.keybinds" | "game";
	paused: boolean;
	splash: {
		text: string;
		bounceFunc: (x:number) => number;
		clickBehavior: () => unknown;
	};
	loadedTextures: number;
	animationFrame: number;
	frames: number;
	enteredGame: boolean;
	transientStats: {
		/** Stores the time in milliseconds to render for the past 120 frames. */
		frameTimes: WindowedMean;
		objectiveHovered: boolean;
		//TODO wrong abstraction
		stoneRunOutMessageShown: boolean;
	};
	level1: Level;
} = {
	texturesReady: false,
	startTime: new Date().getTime(),
	lastSaved: 0,
	forceRedraw: true,
	paused: false,
	sceneName: "loading",
	splash: {
		text: "",
		bounceFunc: Math.sin,
		clickBehavior: () => {},
	},
	loadedTextures: 0,
	animationFrame: 0,
	frames: 0,
	enteredGame: false,
	transientStats: {
		frameTimes: new WindowedMean(120),
		objectiveHovered: false,
		stoneRunOutMessageShown: false,
	},
	level1: null!,
};

