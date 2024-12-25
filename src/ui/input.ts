/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains code that handles getting input from the player. */

import { Buildings } from "../content/content.js";
import { SaveIO, manualLocalSave } from "../game-funcs.js";
import { Keybinds, RawBuildingID, BuildingIDWithMeta } from "../types.js";
import { Direction } from "../util/direction.js";
import { download, firstUsePopup, selectID } from "../util/funcs.js";
import { Game } from "../vars.js";
import type { Building } from "../world/building.js";
import { DOM } from "./dom.js";
import { GUI, HUD } from "./gui.js";

export class Keybind {
	constructor(
		public mainKey: string,
		public modifiers: string[] = [],
		public action: () => void = () => {}
	){
		this.modifiers = modifiers.map(key => key.toLowerCase());
	}
	isHeld(){
		let modifiersHeld = this.modifiers
			.filter(key => !key.startsWith("!"))
			.filter(key => !Input.keysHeld.has(key))
			.length == 0;
		let disallowedModifiersNotHeld = this.modifiers
			.filter(key => key.startsWith("!"))
			.map(key => key.split("!")[1])
			.filter(key => Input.keysHeld.has(key))
			.length == 0;
		//Array.filter and Array.map ftw
		//these functions have saved me so many for loops
		return Input.keysHeld.has(this.mainKey) && modifiersHeld && disallowedModifiersNotHeld;
	}
	check(e:KeyboardEvent){
		let modifiersHeld = this.modifiers
			.filter(key => !key.startsWith("!"))
			.filter(key => !Input.keysHeld.has(key))
			.length == 0;
		let disallowedModifiersNotHeld = this.modifiers
			.filter(key => key.startsWith("!"))
			.map(key => key.split("!")[1])
			.filter(key => Input.keysHeld.has(key))
			.length == 0;
		if(this.mainKey == e.key.toLowerCase() && modifiersHeld && disallowedModifiersNotHeld){
			e.preventDefault();
			this.action();
		}
	}
	toString(){
		let key = this.mainKey;
		if(this.mainKey == " ") key = "Space";
		return this.modifiers.map(m => m + "+").join("") + key;
	}
}

/**Contains all the keybindings for keyboard controls. */
export const keybinds = {
	move: {
		up: new Keybind("w", ["!control", "!alt"]),
		left: new Keybind("a", ["!control", "!alt"]),
		down: new Keybind("s", ["!control", "!alt"]),
		right: new Keybind("d", ["!control", "!alt"]),
		scroll_faster: new Keybind("shift"),
	},
	saves: {
		save_to_file: new Keybind("s", ["control", "alt", "!shift"], () => {
			download("Untitled-Electron-Game-save.json", JSON.stringify(SaveIO.export()));
		}),
		save: new Keybind("s", ["control", "!alt", "!shift"], () => manualLocalSave(true, true)),
		load_from_file: new Keybind("o", ["control"], () => DOM.uploadButton.click()),
	},
	placement: {
		force_straight_conveyor: new Keybind("shift"),
		allow_multiple_overwrite: new Keybind("shift"),
		invert_rotate: new Keybind("shift"),
		break_building: new Keybind("backspace"),
		modifier_1: new Keybind(",", [], () => {Input.placedBuilding.modifier = 0;}),
		modifier_2: new Keybind(".", [], () => {Input.placedBuilding.modifier = 1;}),
		modifier_3: new Keybind("/", [], () => {Input.placedBuilding.modifier = 2;}),
		direction_up: new Keybind("arrowup", [], () => {Input.placedBuilding.direction = Direction.up;}),
		direction_left: new Keybind("arrowleft", [], () => {Input.placedBuilding.direction = Direction.left;}),
		direction_down: new Keybind("arrowdown", [], () => {Input.placedBuilding.direction = Direction.down;}),
		direction_right: new Keybind("arrowright", [], () => {Input.placedBuilding.direction = Direction.right;}),
		direction_rotate: new Keybind("r", [], () => {
			Input.placedBuilding.direction = Input.placedBuilding.direction[
				keybinds.placement.invert_rotate.isHeld() ? "ccw" : "cw"
			];
		}),
		type_1: new Keybind("1", [], () => selectID("base_conveyor")),
		type_2: new Keybind("2", [], () => selectID("base_miner")),
		type_3: new Keybind("3", [], () => selectID("base_trash_can")),
		type_4: new Keybind("4", [], () => selectID("base_furnace")),
		type_5: new Keybind("5", [], () => selectID("base_extractor")),
		type_6: new Keybind("6", [], () => selectID("base_chest")),
		type_7: new Keybind("7", [], () => selectID("base_alloy_smelter")),
		type_8: new Keybind("8", [], () => selectID("base_stirling_generator")),
		type_11: new Keybind("9", [], () => selectID("base_compressor")),
		type_9: new Keybind("f1", [], () => selectID("base_wiremill")),
		type_12: new Keybind("f2", [], () => selectID("base_lathe")),
		type_13: new Keybind("f3", [], () => selectID("base_assembler")),
		// type_13: new Keybind("f3", [], () => selectID("base_arc_tower")),
		// type_14: new Keybind("f4", [], () => selectID("base_power_source")),
		type_14: new Keybind("f4", [], () => selectID("base_pipe")),
		type_16: new Keybind("f6", [], () => selectID("base_pump")),
		type_17: new Keybind("f7", [], () => selectID("base_tank")),
		type_18: new Keybind("f8", [], () => selectID("base_boiler")),
		type_19: new Keybind("f9", [], () => selectID("base_steam_generator")),
		// type_18: new Keybind("f9", [], () => selectID("base_boiler")),
		type_0: new Keybind("0", [], () => selectID("base_null")),
	},
	display: {
		show_tooltip: new Keybind("shift"),
		hide_gui: new Keybind("c", [], () => firstUsePopup("hide-gui-message", "You have hidden the gui by pressing (c). Press c again to show it.", HUD.toggle, true)),
		research: new Keybind("j", [], () => GUI.toggleResearchMenu()),
	},
	misc: {
		pause: new Keybind(" ", [], () => {Game.paused = !Game.paused;}),
		close_dialog: new Keybind("escape", [], () => GUI.closeDialog()),
		close_alert: new Keybind("enter", [], () => GUI.closeAlert()),
		undo: new Keybind("z", ["control"], () => {
			Input.lastBuilding?.break();
			Input.lastBuilding = null;
		})
	}
} satisfies Keybinds;

export const Input = {
	mouseX: 0,
	mouseY: 0,
	active: true,
	get mouse():[mouseX:number, mouseY:number]{
		return [Input.mouseX, Input.mouseY];
	},
	mouseDown: false,
	rightMouseDown: false,
	mouseDownTime: 0,
	canOverwriteBuilding(){
		return !this.buildingPlaced || keybinds.placement.allow_multiple_overwrite.isHeld();
	},
	buildingPlaced: false,
	lastBuilding: null as Building | null,
	latestMouseEvent: null as MouseEvent | null,
	keysHeld: new Set<string>(),
	lastKeysPressed: new Array<string>(11).fill(""),
	shift: () => Input.keysHeld.has("shift"),
	alt: () => Input.keysHeld.has("alt"),
	ctrl: () => Input.keysHeld.has("ctrl"),
	/** Stores the type, direction, and modifier of placed buildings. */
	placedBuilding: {
		type: "base_null" as RawBuildingID,
		direction: Direction.right,
		modifier: 0 as 0 | 1 | 2,
		get ID():BuildingIDWithMeta {
			if(this.type == "base_null") return ["base_null", 0];
			return Buildings.get(this.type).getID(this.type, this.direction, this.modifier);
		}
	},
};
