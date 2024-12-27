/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains code that interacts with the DOM, such as fetching elements and adding event listeners. */

import { getElement } from "../util/funcs.js";
import { Game } from "../vars.js";
import { Camera } from "./camera.js";
import { bundle } from "../content/i18n.js";
import type { PartialMouseEvent } from "./input.js";


export const CTX = (d => Object.fromEntries(Object.entries(d).map(([k, id]) =>
	[k, getElement(id, HTMLCanvasElement).getContext("2d")!]
)))({
	tiles: "canvas0", 
	tilesOver: "canvas1", //Tiles
	buildsUnder: "canvas2", //Ghost buildings
	builds: "canvas3", //Under buildings
	oBuilds: "canvas4", //Buildings
	gBuilds: "canvas5", //Overlay builds
	items: "canvas6", //Items
	effects: "canvas7", //Effects
	overlays: "canvas8", //Overlays
	___: "canvas9", //Unused
});

export const DOM = {
	uploadButton: getElement("uploadButton", HTMLInputElement),
	alertmessage: getElement("alertmessage", HTMLDivElement),
	alertexit: getElement("alertexit", HTMLDivElement),
	alertbox: getElement("alertbox", HTMLDivElement),
	tooltipbox: getElement("tooltipbox", HTMLDivElement),
	toolbarEl: getElement("toolbar", HTMLDivElement),
	clickcapture: getElement("clickcapture", HTMLDivElement),
	errorBackground: getElement("error_background", HTMLDivElement),
	loadingBackground: getElement("loading_background", HTMLDivElement),
	gameBackground: getElement("game_background", HTMLDivElement),
	resourcesEl: getElement("resources", HTMLDivElement),
	hudtextEl: getElement("hudtext", HTMLDivElement),
	objectiveEl: getElement("objective", HTMLDivElement),
	objectiveTitle: getElement("objective-title", HTMLDivElement),
	objectiveText: getElement("objective-text", HTMLSpanElement),
	objectiveDescription: getElement("objective-description", HTMLDivElement),
	objectiveNextButton: getElement("objective-next-button", HTMLSpanElement),
	resourcesItems: {} as Record<string, HTMLSpanElement>,
	texturesDiv: getElement("textures", HTMLDivElement),
	researchMenu: getElement("research-menu", HTMLDivElement),
	researchTree: getElement("research-tree", HTMLDivElement),
	buttonsPane: getElement("buttons-pane", HTMLDivElement),
	researchButton: getElement("research-button", HTMLSpanElement),
	settingsButton: getElement("settings-button", HTMLSpanElement),
	screenOverlay: getElement("screen-overlay", HTMLDivElement),
	creditsEl: getElement("credits-container", HTMLDivElement),
};

/**Registers event handlers, called once on page load. */
export async function registerEventHandlers(){
	//Dynamic import is necessary, without this, the import graph is hopeless
	const { scenes } = await import("./scenes.js");
	const { GUI } = await import("./gui.js");
	const { Buildings } = await import("../content/content.js");
	const { objectives } = await import("../objectives.js");
	const { safeToSave, SaveIO, saveToLocalStorage, selectID } = await import("../game-funcs.js");
	const { clickcapture } = DOM;
	const { Input, keybinds } = await import("./input.js");
	const { completeObjective } = await import("../game-funcs.js");

	const onmousemove = (e: PartialMouseEvent) => {
		//Update mouse position
		Input.mouseX = e.x;
		Input.mouseY = e.y;
		Input.latestMouseEvent = e;
	};
	

	const onmousedown = (e: PartialMouseEvent) => {
		Input.mouseX = e.x;
		Input.mouseY = e.y;
		Input.latestMouseEvent = e;
		//The default action is to bring up a context menu or the scroller thing, not desirable
		if (e.button) e.preventDefault();
		if (e.button === 0) {
			Input.mouseDown = true;
			Input.buildingPlaced = false;
		} else if (e.button === 2) {
			Input.rightMouseDown = true;
		}
		if (scenes[Game.sceneName] && Input.active) {
			scenes[Game.sceneName]?.onmousedown?.(e);
		}
	};
	const onmouseup = (e: PartialMouseEvent) => {
		Input.mouseX = e.x;
		Input.mouseY = e.y;
		Input.latestMouseEvent = e;
		if (e.button == 0) {
			Input.mouseDown = false;
		} else if (e.button == 2) {
			Input.rightMouseDown = false;
		}
		Input.buildingPlaced = false;
	};
	window.onmousemove = onmousemove;
	clickcapture.onmousedown = onmousedown;
	window.onmouseup = onmouseup;

	//For touch screens
	clickcapture.addEventListener("touchstart", (e:TouchEvent) => {
		onmousedown({
			x: e.touches[0]!.clientX,
			y: e.touches[0]!.clientY,
			button: 0,
			preventDefault(){ /* empty */ },
		});
	});
	clickcapture.addEventListener("touchend", (e:TouchEvent) => {
		//When the screen is tapped, touchend is fired immediately after touchstart, leaving no time for buildings to be placed.
		//Delays by 250ms
		setTimeout(() => {
			onmouseup({
				x: e.changedTouches[0]!.clientX,
				y: e.changedTouches[0]!.clientY,
				button: 0,
				preventDefault(){ /* empty */ },
			});
		}, 250);
	});
	clickcapture.addEventListener("touchmove", (e:TouchEvent) => {
		onmousemove({
			x: e.touches[0]!.clientX,
			y: e.touches[0]!.clientY,
			button: 0,
			preventDefault(){ /* empty */ },
		});
	});

	clickcapture.oncontextmenu = (e) => {
		//Prevent the menu from showing
		e.preventDefault();
	};

	//Do stuff when a key is pressed(not held).
	window.onkeydown = (e:KeyboardEvent) => {

		if((e.ctrlKey && e.key.match(/^[wertuniWERTUNIK1234567890!@#$%^&*()=-]$/)) || e.key.match(/^f(5|11)$/i)){
			return;
			//If you pressed one of these key combos, return
		}
		e.preventDefault();

		//Add key to keysHeld
		Input.keysHeld.add(e.key.toLowerCase());

		//Push key to lastKeysPressed
		Input.lastKeysPressed.push(e.key);
		Input.lastKeysPressed.shift();
		//Only the last 10 keypresses are logged

		//Handle keybinds
		if(Input.active){
			for(const section of Object.values(keybinds)){
				for(const keybind of Object.values(section)){
					keybind.check(e);
				}
			}
		}

		if(scenes[Game.sceneName]){
			scenes[Game.sceneName]?.onkeydown?.(e);
		}

		//Otherwise prevent default

	};
	window.onkeyup = (e:KeyboardEvent) => {
		//Remove key from list of held keys
		Input.keysHeld.delete(e.key.toLowerCase());
	};
	

	//When file uploaded
	DOM.uploadButton.onchange = (event:Event) => {
		//Load a save file
		const file = (event.target as HTMLInputElement)?.files?.[0];
		if(!file) return;
		const reader = new FileReader();
		reader.readAsText(file);
		reader.onload = e => {
			// eslint-disable-next-line @typescript-eslint/no-base-to-string
			const content = e.target?.result?.toString();
			if(content == null) return;
			SaveIO.import(content);
		};
	};

	window.onwheel = (e:WheelEvent) => {
		if(!Game.paused && Input.active){
			Camera.zoom(Math.pow(1.001, -e.deltaY));
		}
	};

	//When the window loses focus, clear the list of held keys and set mousePressed to false.
	window.onblur = () => {
		Input.keysHeld.clear();
		Input.mouseDown = false;
		//call pause here once I add it
	};

	window.onbeforeunload = (e:BeforeUnloadEvent) => {
		//Page is about to close
		if(Game.sceneName != "game"){
			return;
			//If you aren't in-game, just exit
		}

		if(safeToSave()){
			//If there's nothing in save1 or the uuid of save1 and the current level are the same, save
			saveToLocalStorage();
		} else {
			//Try to cancel page close
			e.preventDefault();
			e.returnValue = "";
			localStorage.setItem("save-recovered", JSON.stringify(SaveIO.export()));
			setTimeout(() => {
				if(confirm("Could not save automatically on page exit because your current world is unrelated to your saved world.\nWould you like to save anyway? This will overwrite your current save!")){
					saveToLocalStorage();
					localStorage.removeItem("save-recovered");
				}
			}, 1);
		}
	};
	for(const block of Buildings){
		if(block.hidden) continue;
		const img = document.createElement("img");
		img.src = `assets/textures/building/${block.id}!0.png`;
		img.id = "toolbar_" + block.id;
		img.addEventListener("drag", () => {
			GUI.alert(`Place a building by clicking it in the toolbar, then clicking again where you want the building to go.`);
		});
		img.title = [bundle.get(`building.${block.id}.name`), bundle.get(`building.${block.id}.description`)].filter(Boolean).join("\n");
		img.addEventListener("click", () => {
			selectID(block.id);
			Input.mouseDown = false;
		});
		DOM.toolbarEl.appendChild(img);
	}


	DOM.objectiveTitle.addEventListener("click", () => completeObjective());

	DOM.alertexit.onclick = GUI.closeAlert;
}

/**Sets the canvas sizes to the window size. */
export function setCanvasSizes(){
	//This has to be done dynamically because for some reason setting a canvas to width:100% height:100% makes it glitch out.
	for(const ctx of Object.values(CTX)){
		if(ctx.canvas.width != window.innerWidth){
			ctx.canvas.width = window.innerWidth;
			Game.forceRedraw = true;
		}
		if(ctx.canvas.height != window.innerHeight){
			ctx.canvas.height = window.innerHeight;
			Game.forceRedraw = true;
		}
	}
}

