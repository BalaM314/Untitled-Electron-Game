/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the game's scenes; the code that is run dependent on the game's state. */

import { load } from "../game-funcs.js";
import { tech, objectives } from "../objectives.js";
import { textureIDs } from "../texturedata.js";
import type { CurrentFrame } from "../types.js";
import { crash, parseError } from "../util/funcs.js";
import { makeRebindButton } from "../util/button.js";
import { Button } from "../util/button.js";
import { Intersector, Pos } from "../util/geom.js";
import { Game, settings, consts } from "../vars.js";
import { Item } from "../world/world.js";
import { CTX } from "./dom.js";
import { Gfx, ParticleEffect } from "./graphics.js";
import { Camera } from "./camera.js";
import { HUD } from "./gui.js";
import { Input, keybinds, PartialMouseEvent } from "./input.js";


//todo fix this VV probably repeating myself a lot
/**Holds all the function that do things in each game state. */
export const scenes: Record<typeof Game.sceneName, {
	buttons: Button[];
	update: (currentFrame: CurrentFrame) => void;
	display: (currentFrame: CurrentFrame) => void;
	onmousedown?: (e: PartialMouseEvent) => void;
	onmouseheld?: (currentFrame: CurrentFrame) => void;
	onrightmouseheld?: (currentFrame: CurrentFrame) => void;
	onkeydown?: (e: KeyboardEvent) => void;
	onkeyheld?: (currentFrame: CurrentFrame) => void;
}> = {
	loading: {
		buttons: [],
		update() {
			if (Game.texturesReady) Game.sceneName = "title";
		},
		display(currentFrame: CurrentFrame) {
			Gfx.layer("overlay");
			Gfx.clear("#0033CC");

			Gfx.font("70px sans-serif");
			Gfx.textAlign("center");
			CTX.overlays.textBaseline = "middle";
			Gfx.fillColor("#FFF");
			Gfx.text("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);

			Gfx.font(`40px sans-serif`);
			Gfx.text(`Loading... ${Game.loadedTextures}/${textureIDs.length}`, innerWidth / 2, innerHeight * 0.35);
		}
	},
	title: {
		buttons: [
			new Button({
				x: () => innerWidth / 4,
				y: () => innerHeight / 2,
				width: () => innerWidth / 2,
				height: () => innerHeight / 5,
				label: "Play",
				color: "#08F",
				font: "40px sans-serif",
				onClick: () => { Input.mouseDown = false; load(); }
			}),
			new Button({
				x: () => innerWidth / 4,
				y: () => innerHeight * 0.75,
				width: () => innerWidth / 2,
				height: () => innerHeight / 5,
				label: "Settings",
				color: "#08F",
				font: "40px sans-serif",
				onClick: () => { Game.sceneName = "settings"; }
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.5,
				width: () => Math.min(innerWidth, innerHeight) * 0.1,
				height: () => Math.min(innerWidth, innerHeight) * 0.1,
				label: () => Gfx.texture("misc/github-60x60"),
				color: "#08F",
				font: "30px sans-serif",
				onClick: () => { window.open("https://github.com/BalaM314/Untitled-Electron-Game/"); }
			}),
		],
		update(){
			//empty
		},
		display(){
			Gfx.layer("overlay");
			Gfx.clear("#0033CC");

			Gfx.font("70px sans-serif");
			Gfx.textAlign("center");
			Gfx.ctx.textBaseline = "middle";
			Gfx.fillColor("#FFF");
			Gfx.text("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
			Gfx.font("20px sans-serif");
			Gfx.text("Version Alpha 4.0.0", innerWidth / 2, innerHeight * 0.25);
			Gfx.fillColor("#cccc00");
			Gfx.font(`${20 + 5 * Game.splash.bounceFunc((Date.now() - Game.startTime) / 400)}px sans-serif`);
			Gfx.text(Game.splash.text ?? "splash not found! this is actually an error pls report", innerWidth / 2, innerHeight * 0.35);

			scenes.title.buttons.forEach(button => button.display(Gfx.ctx));
		},
		onmousedown(e){
			scenes.title.buttons.forEach(button => button.handleMouseClick(e));
			if (Intersector.pointInRect(Input.mouse, [innerWidth * 0.4, innerHeight * 0.3, innerWidth * 0.2, innerHeight * 0.1]))
				Game.splash.clickBehavior();
		}
	},
	settings: {
		buttons: [
			new Button({
				x: () => innerWidth * 0.51,
				y: () => innerHeight * 0.5,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Debug: " + settings.debug,
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => { settings.debug = !settings.debug; }
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.66,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Always load save: " + settings.alwaysLoadSave,
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => { settings.alwaysLoadSave = !settings.alwaysLoadSave; }
			}),
			new Button({
				x: () => innerWidth * 0.51,
				y: () => innerHeight * 0.66,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Autosave: " + settings.autoSave,
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => { settings.autoSave = !settings.autoSave; }
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.5,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: "Controls",
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => { Game.sceneName = "settings.keybinds"; }
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.82,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Show tile borders: " + settings.showTileBorders,
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => { settings.showTileBorders = !settings.showTileBorders; }
			}),
			new Button({
				x: () => innerWidth * 0.51,
				y: () => innerHeight * 0.82,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Extra pipe info: " + settings.showExtraPipeInfo,
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => { settings.showExtraPipeInfo = !settings.showExtraPipeInfo; }
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#08F",
				font: "40px sans-serif",
				onClick: () => { Game.sceneName = "title"; localStorage.setItem("settings", JSON.stringify(settings)); }
			}),
		],
		update(){
			//empty
		},
		display(currentFrame: CurrentFrame) {
			Gfx.layer("overlay");
			Gfx.clear("#0033CC");

			Gfx.font("70px sans-serif");
			Gfx.textAlign("center");
			Gfx.ctx.textBaseline = "middle";
			Gfx.fillColor("#FFF");
			Gfx.text("Settings", innerWidth / 2, innerHeight * 0.2);

			scenes.settings.buttons.forEach(button => button.display(Gfx.ctx));
		},
		onmousedown(e) {
			scenes.settings.buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	"settings.keybinds": {
		buttons: [
			makeRebindButton(0.3, keybinds.move.up, "Move up", "w"),
			makeRebindButton(0.35, keybinds.move.left, "Move left", "a"),
			makeRebindButton(0.4, keybinds.move.down, "Move down", "s"),
			makeRebindButton(0.45, keybinds.move.right, "Move right", "d"),
			makeRebindButton(0.5, keybinds.move.scroll_faster, "Scroll faster", "shift"),
			makeRebindButton(0.55, keybinds.saves.save_to_file, "Save to file", "s"),
			makeRebindButton(0.6, keybinds.saves.save, "Save to browser", "s"),
			makeRebindButton(0.65, keybinds.saves.load_from_file, "Load from file", "o"),
			makeRebindButton(0.7, keybinds.placement.break_building, "Break building", "backspace"),
			makeRebindButton(0.75, keybinds.placement.force_straight_conveyor, "Force straight conveyor", "shift"),
			makeRebindButton(0.8, keybinds.display.show_tooltip, "Show tooltips", "shift"),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#08F",
				font: "40px sans-serif",
				onClick: () => { Game.sceneName = "settings"; }
			}),
		],
		update(){
			//empty
		},
		display(){
			Gfx.layer("overlay");
			Gfx.clear("#0033CC");

			Gfx.font("60px sans-serif");
			Gfx.textAlign("center");
			Gfx.ctx.textBaseline = "middle";
			Gfx.fillColor("#FFF");
			Gfx.text("Keybinds", innerWidth / 2, innerHeight * 0.2);

			this.buttons.forEach(button => button.display(Gfx.ctx));
		},
		onmousedown(e) {
			this.buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	game: {
		buttons: [],
		update(currentFrame: CurrentFrame) {
			if (Game.paused) return;
			try {
				Game.level1.generateNecessaryChunks();
				Game.level1.update(currentFrame);
				objectives.update();
			} catch (err) {
				console.error(err);
				crash(`Error updating world: ${parseError(err)}`);
			}
		},
		display(currentFrame: CurrentFrame) {
			//display
			if (Game.paused) {
				Gfx.layer("overlay");
				Gfx.font("72px sans-serif");
				Gfx.fillColor("#3333FF");
				Gfx.textAlign("center");
				Gfx.lineWidth(1);
				Gfx.strokeColor("#0000AA");
				Gfx.textOutline("Game paused", innerWidth * 0.5, innerHeight * 0.19);
				Gfx.font("36px sans-serif");
				Gfx.fillColor("#0000AA");
				Gfx.text(`Press ${keybinds.misc.pause.toString()} to unpause`, innerWidth * 0.5, innerHeight * 0.26);
				Game.forceRedraw = true;
				return;
			}

			for (const ctx of Object.values(CTX)) {
				if (!(ctx == CTX.tiles || ctx == CTX.tilesOver) || currentFrame.redraw) { //Only clear the tiles ctx if redrawing
					Gfx.clear(null, ctx);
				}
			}
			Game.level1.resetResourceDisplayData();

			Game.level1.display(currentFrame);
			ParticleEffect.displayAll();
			Game.level1.displayGhostBuilding(
				...(Camera.unproject(...Input.mouse).map(Pos.pixelToTile)),
				Input.placedBuilding.ID, currentFrame
			);

			Gfx.drawers.forEach(d => d());
			HUD.display(currentFrame);

		},
		onmousedown(e) {
			if (Game.paused) return;
			if (e.ctrlKey && e.button == 0) {
				Game.level1.buildingAtPixel(
					...(Camera.unproject(e.x, e.y))
				)?.acceptItem(new Item(
					...(Camera.unproject(e.x, e.y).map(c => Pos.tileToPixel(Pos.pixelToTile(c), true))),
					"base_null"
				), null);
			} else if (e.button === 1) {
				const buildUnder = Game.level1.buildingAtPixel(...Camera.unproject(...Input.mouse));
				if (buildUnder) {
					Input.placedBuilding.type = buildUnder.effectiveID();
				}
			}
		},
		onmouseheld() {
			if (Game.paused) return;
			if (!Input.latestMouseEvent) return;
			if (!Input.ctrl() && !keybinds.placement.break_building.isHeld() && Input.placedBuilding.ID[0] != "base_null") {
				Game.level1.buildBuilding(
					...(Camera.unproject(Input.latestMouseEvent.x, Input.latestMouseEvent.y).map(Pos.pixelToTile)),
					Input.placedBuilding.ID
				);
			}
		},
		onrightmouseheld() {
			if (Game.paused) return;
			if (!Input.latestMouseEvent) return;
			if (!Input.ctrl() && !keybinds.placement.break_building.isHeld()) {
				Game.level1.breakBuilding(
					...Camera.unproject(...Input.mouse).map(Pos.pixelToTile)
				);
			}
		},
		//Unlike the onkeydown function, this one needs to run based on keys being held.
		onkeyheld(currentframe: CurrentFrame) {
			if (Game.paused) return;
			const scrollSpeed = keybinds.move.scroll_faster.isHeld() ? consts.fastScrollSpeed : consts.scrollSpeed;
			if (keybinds.move.up.isHeld()) Camera.scroll(0, -scrollSpeed);
			if (keybinds.move.left.isHeld()) Camera.scroll(-scrollSpeed, 0);
			if (keybinds.move.down.isHeld()) Camera.scroll(0, scrollSpeed);
			if (keybinds.move.right.isHeld()) Camera.scroll(scrollSpeed, 0);
			if (keybinds.placement.break_building.isHeld()) {
				Game.level1.breakBuilding(
					...Camera.unproject(...Input.mouse).map(Pos.pixelToTile)
				);
			}
		},
		onkeydown(e) {
			//Easter egg
			if (e.key == "Enter" && Input.lastKeysPressed.join(", ") ==
				["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a", "Enter"].join(", ")) {
				window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ"); //this is fine
				for (const [key] of Object.entries(Game.level1.resources)) {
					Game.level1.resources[key] = 999999;
				}
				tech.nodes.forEach(n => n.unlocked = true);
			}
		}
	}
};
