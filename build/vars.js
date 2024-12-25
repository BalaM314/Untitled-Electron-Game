/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { WindowedMean } from "./util/windowed-mean.js";
export const consts = {
    VERSION: "alpha 3.2.0",
    CHUNK_SIZE: 16,
    TILE_SIZE: 30,
    ITEM_SIZE: 16,
    chunkSizeInPixels: 16 * 30,
    chunkCullingMargin: 120,
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
export const Game = {
    texturesReady: false,
    startTime: new Date().getTime(),
    lastSaved: 0,
    forceRedraw: true,
    paused: false,
    sceneName: "loading",
    splash: {
        text: "",
        bounceFunc: Math.sin,
        clickBehavior: () => { },
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
    level1: null,
};
