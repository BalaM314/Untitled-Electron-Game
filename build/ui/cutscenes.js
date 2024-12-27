/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { delay, formatTime, round, until } from "../util/funcs.js";
import { Pos } from "../util/geom.js";
import { consts, settings, Game } from "../vars.js";
import { DOM } from "./dom.js";
import { Gfx, Fx } from "./graphics.js";
import { Camera } from "./camera.js";
import { HUD } from "./gui.js";
import { Input } from "./input.js";
import { returnToTitle } from "../game-main.js";
import { PersistentStats } from "../stats.js";
import { Log } from "../util/log.js";
export async function showCredits() {
    HUD.hide();
    Input.active = false;
    PersistentStats.value.misc.timeWon = Date.now();
    const stats = PersistentStats.value;
    await delay(1000);
    DOM.screenOverlay.classList.add("active");
    await delay(1500 + 2500);
    const boatX = 1 * consts.TILE_SIZE;
    let boatY = 161 * consts.TILE_SIZE;
    const cameraOffset = -5 * consts.TILE_SIZE;
    let boatVel = 0;
    let boatAccel = 0;
    let smokeSpeed = 15;
    const previousShowTileBorders = settings.showTileBorders;
    settings.showTileBorders = false;
    Camera.scrollTo(consts.TILE_SIZE * -3, -boatY + cameraOffset);
    Camera.zoomTo(1.3);
    Gfx.addDrawer(() => {
        Camera.scrollTo(consts.TILE_SIZE * -3, -boatY + cameraOffset, false);
        boatVel += boatAccel;
        boatY += boatVel;
        Gfx.layer("items");
        Gfx.pImage(Gfx.texture("misc/base_boat"), boatX, boatY);
        if ((Game.frames % smokeSpeed) == 0) {
            Fx.smoke.at(Pos.fromPixelCoords(boatX + 2.2 * consts.TILE_SIZE, boatY + 7.5 * consts.TILE_SIZE));
            Fx.smoke.at(Pos.fromPixelCoords(boatX + 4.2 * consts.TILE_SIZE, boatY + 7.5 * consts.TILE_SIZE));
        }
    });
    DOM.screenOverlay.classList.remove("active");
    await delay(2000);
    Camera.zoomTo(1);
    await delay(1000);
    boatAccel = 0.01;
    smokeSpeed = 12;
    await until(() => boatY > 180 * consts.TILE_SIZE);
    boatAccel = 0.02;
    smokeSpeed = 9;
    await until(() => boatY > 300 * consts.TILE_SIZE);
    boatAccel = 0;
    DOM.screenOverlay.classList.add("active");
    await delay(1500);
    Gfx.clearDrawers();
    await delay(500);
    DOM.creditsEl.innerHTML = atob(`PGRpdiBpZD0iY3JlZGl0cy1pbm5lciI+PGgxIGlkPSJjcmVkaXRzLXRpdGxlIj5VbnRpdGxlZCBFbGVjdHJvbiBHYW1lPC9oMT4KPGltZyBzcmM9ImFzc2V0cy90ZXh0dXJlcy9sb2dvLnBuZyIgYWx0PSJVbnRpdGxlZCBFbGVjdHJvbiBHYW1lIExvZ28iIGlkPSJjcmVkaXRzLWxvZ28iPgo8aDI+U3RhdGlzdGljczwvaDI+CjxkaXYgaWQ9ImNyZWRpdHMtc3RhdGlzdGljcyI+PC9kaXY+CjxoMj5DcmVkaXRzPC9oMj4KPHA+R2FtZSBEZXNpZ24sPC9wPgo8cD5Qcm9ncmFtbWluZyw8L3A+CjxwPlN0b3J5LDwvcD4KPHA+R3JhcGhpY3MgLyBBcnQtIEJhbGEgTTwvcD4KPHA+UGxheXRlc3RpbmctIEFkaXRpLCBDcmF5LCBOYXRlc2gsIFByYWR5dW4sIFJpdGhpa2EsIFJpdGhpc2gsIFR2aXNoYTwvcD4KPHA+PGEgaHJlZj0iaHR0cHM6Ly9naXRodWIuY29tL0JhbGFNMzE0L1VudGl0bGVkLUVsZWN0cm9uLUdhbWUvIj5Tb3VyY2UgY29kZSBhdmFpbGFibGUgb24gR2l0SHViPC9hPjwvcD4KPHAgc3R5bGU9ImNvbG9yOiBsaWdodGJsdWUiPlRoYW5rcyBmb3IgcGxheWluZyE8L3A+PC9kaXY+`);
    DOM.creditsEl.classList.add("active");
    const timeToBeat = stats.misc.timeWon - stats.misc.timeStarted;
    Log.info(`Time to beat: ${timeToBeat} (${stats.misc.timeWon} - ${stats.misc.timeStarted})`);
    DOM.creditsEl.querySelector("#credits-statistics").innerHTML =
        `<p>Final time: ${stats.misc.konamiCodeUsed ? "N/A" : formatTime(timeToBeat)}</p>
<p>Buildings built: ${stats.buildings.totalBuilt}<br>Buildings removed: ${stats.buildings.totalRemoved}</p>
<p>Items produced: ${stats.items.totalReachedHub}<br>Items used: ${stats.items.totalUsed}</p>
<p>Total power produced: ${stats.power.totalProduced} (averaging ${round(stats.power.totalProduced / (timeToBeat / 1000), 1)}/s)</p>`;
    DOM.screenOverlay.classList.remove("active");
    await delay(60000);
    settings.showTileBorders = previousShowTileBorders;
    DOM.creditsEl.classList.remove("active");
    Input.active = true;
    returnToTitle();
}
