/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains cutscene code. */

import { returnToTitle } from "../game-main.js";
import { delay, until } from "../util/funcs.js";
import { Pos } from "../util/geom.js";
import { consts, settings, Game } from "../vars.js";
import { DOM } from "./dom.js";
import { Camera, Gfx, Fx } from "./graphics.js";
import { HUD } from "./gui.js";
import { Input } from "./input.js";

export async function showCredits(){
	
	HUD.hide();
	Input.active = false;

	await delay(1000);

	//activate the animation
	DOM.screenOverlay.classList.add("active");

	//wait for the fade to black animation, then wait on the black screen for a bit
	await delay(1500 + 2500);

	//scene setup
	let boatX = 1 * consts.TILE_SIZE;
	let boatY = 161 * consts.TILE_SIZE;
	let cameraOffset = -5 * consts.TILE_SIZE;
	let boatVel = 0;
	let boatAccel = 0;
	let smokeSpeed = 15;
	const previousShowTileBorders = settings.showTileBorders;
	settings.showTileBorders = false;
	Camera.scrollTo(consts.TILE_SIZE * -3, -boatY + cameraOffset);
	Camera.zoomTo(1.3);
	//boat
	Gfx.addDrawer(() => {
		Camera.scrollTo(consts.TILE_SIZE * -3, -boatY + cameraOffset, false);
		boatVel += boatAccel;
		boatY += boatVel;
		Gfx.layer("items"); //don't override the effects
		Gfx.pImage(Gfx.texture("misc/base_boat"), boatX, boatY);
		if((Game.frames % smokeSpeed) == 0){
			Fx.smoke.at(Pos.fromPixelCoords(boatX + 2.2 * consts.TILE_SIZE, boatY + 7.5 * consts.TILE_SIZE));
			Fx.smoke.at(Pos.fromPixelCoords(boatX + 4.2 * consts.TILE_SIZE, boatY + 7.5 * consts.TILE_SIZE));
		}
	});
	DOM.screenOverlay.classList.remove("active"); //show screen

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

	DOM.creditsEl.innerHTML = atob(`PGRpdiBpZD0iY3JlZGl0cy1pbm5lciI+PGgxIGlkPSJjcmVkaXRzLXRpdGxlIj5VbnRpdGxlZCBFbGVjdHJvbiBHYW1lPC9oMT4KPGltZyBzcmM9ImFzc2V0cy90ZXh0dXJlcy9sb2dvLnBuZyIgYWx0PSJVbnRpdGxlZCBFbGVjdHJvbiBHYW1lIExvZ28iIGlkPSJjcmVkaXRzLWxvZ28iPgo8cD5HYW1lIERlc2lnbiw8L3A+CjxwPlByb2dyYW1taW5nLDwvcD4KPHA+U3RvcnksPC9wPgo8cD5HcmFwaGljcyAvIEFydC0gQmFsYSBNPC9wPgo8cD5QbGF5dGVzdGluZy0gQWRpdGksIENyYXksIE5hdGVzaCwgUHJhZHl1biwgUml0aGlrYSwgUml0aGlzaCwgVHZpc2hhPC9wPgo8cD48YSBocmVmPSJodHRwczovL2dpdGh1Yi5jb20vQmFsYU0zMTQvVW50aXRsZWQtRWxlY3Ryb24tR2FtZS8iPlNvdXJjZSBjb2RlIGF2YWlsYWJsZSBvbiBHaXRIdWI8L2E+PC9wPgo8cCBzdHlsZT0iY29sb3I6IGxpZ2h0Ymx1ZSI+VGhhbmtzIGZvciBwbGF5aW5nITwvcD48L2Rpdj4=`);
	DOM.creditsEl.classList.add("active");
	DOM.screenOverlay.classList.remove("active");

	await delay(60000);

	settings.showTileBorders = previousShowTileBorders;
	DOM.creditsEl.classList.remove("active");
	Input.active = true;
	returnToTitle();
}
