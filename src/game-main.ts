/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the game's main code. */

//Import order
import "./ui/gui.js";
import "./ui/scenes.js";

import { splashes } from "./content/splashes.js";
import { manualLocalSave } from "./game-funcs.js";
import type { CurrentFrame } from "./types.js";
import { setCanvasSizes, registerEventHandlers, DOM, CTX } from "./ui/dom.js";
import { Camera, Gfx, loadTextures } from "./ui/graphics.js";
import { HUD, GUI } from "./ui/gui.js";
import { Input } from "./ui/input.js";
import { scenes } from "./ui/scenes.js";
import { assert, parseError, crash } from "./util/funcs.js";
import { Rand } from "./util/random.js";
import { Log } from "./util/log.js";
import { Game, settings } from "./vars.js";
import { textureIDs } from "./texturedata.js";
import * as noise from "./util/perlin.js";


export function returnToTitle(){
	HUD.hide();
	manualLocalSave(false, false);
	Game.sceneName = "title";
}

/**The main loop! Called once per frame. */
function main_loop(){
	try {
		let startFrameTime = Date.now();
		let currentFrame:CurrentFrame = {
			tooltip: true,
			debug: settings.debug,
			cps: 0,
			tps: 0,
			ips: 0,
			redraw: Game.forceRedraw,
			frame: Game.frames
		};
		Game.forceRedraw = false;
		setCanvasSizes();
		Camera.update();
		window.getSelection()?.empty();

		let currentState = scenes[Game.sceneName] ?? crash(`Invalid game state "${Game.sceneName}"`);

		if(Input.mouseDown){
			currentState.onmouseheld?.(currentFrame);
		}
		if(Input.rightMouseDown){
			currentState.onrightmouseheld?.(currentFrame);
		}
		if(Input.keysHeld.size > 0){
			currentState.onkeyheld?.(currentFrame);
		}

		currentState.update(currentFrame);
		currentState.display(currentFrame);
		let frameMS = Date.now() - startFrameTime;
		Game.transientStats.frameTimes.add(frameMS);

		GUI.updateAlertDialog();
		Game.frames ++;

	} catch(err){
		alert("An error has occurred!\nPlease create an issue on this project's GitHub so I can fix it.\nError message: " + parseError(err));
		Object.values(CTX).forEach(ctx => Gfx.clear(null, ctx));
		DOM.errorBackground.style.zIndex = "99999";
		DOM.gameBackground.classList.add("hidden");
		throw err;
	}
	Game.animationFrame = requestAnimationFrame(main_loop);
}

/**Called once on page load. */
async function init(){
	Log.showBanner();
	Log.info("Starting...");
	Log.raw`${Log.style({color: "blue", "font-size": "150%"})}\
Hey there! It looks like you're checking out the console.
This game is open source! https://github.com/BalaM314/Untitled-Electron-Game`;

	try {
		assert(localStorage.getItem("settings"));
		const loadedSettings = JSON.parse(localStorage.getItem("settings")!) as any;
		for(const [k, v] of Object.entries(settings) as [keyof typeof settings, (typeof settings)[keyof typeof settings]][]){
			if(loadedSettings[k] && typeof loadedSettings[k] == typeof settings[k]) settings[k] = loadedSettings[k];
		}
	} catch(err){
		Log.caution("Invalid persistent settings!\nIf this is your first time visiting this site, nothing to worry about.");
		localStorage.setItem("settings", JSON.stringify(settings));
	}

	Gfx.init();
	
	noise.seed(1);
	loadTextures(textureIDs.map(id => ({id})), DOM.texturesDiv)
		.then(loadedTextures => {
			Gfx.textures = loadedTextures;
			Game.texturesReady = true;
			Log.info(`Successfully loaded ${Object.keys(loadedTextures).length} textures.`);
		})
		.catch(() => {});
	
	
	await registerEventHandlers();
	
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
		alert("It looks like you're trying to play on a phone. Unfortunately, mobile devices are not currently supported.");
	}
	
	Game.splash.text = Rand.chance(0.95)
		? Rand.item(splashes.normal.slice(1))
		: Rand.item(splashes.rare.slice(1));

	Game.splash.bounceFunc = Rand.chance(0.9) ? Math.sin : Math.tan;
	if(Game.splash.text == "I wonder what this button does!") Game.splash.clickBehavior = () => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

	DOM.errorBackground.classList.remove("hidden");
	DOM.loadingBackground.classList.add("hidden");
	DOM.gameBackground.classList.remove("hidden");
	
	main_loop();
}

Promise.resolve().then(() => init());
