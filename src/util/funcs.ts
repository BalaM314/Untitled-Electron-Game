/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains generic utility functions, as well as game related functions. */

import { Buildings } from "../content/content.js";
import { SaveIO } from "../game-funcs.js";
import { tech, objectives } from "../objectives.js";
import type { SaveData, RawBuildingID, BuildingMeta, StringBuildingID, LegacyRawBuildingID, LegacyBuildingID } from "../types.js";
import { DOM } from "../ui/dom.js";
import type { Texture } from "../ui/graphics.js";
import { Input, Keybind, PartialMouseEvent } from "../ui/input.js";
import { Game } from "../vars.js";
import { Intersector } from "./geom.js";


//#region general utils

export function sort2<T>(array:T[], func:(item:T) => number){
	array.sort((a, b) => func(a) - func(b));
}
if(!Array.prototype.at){
	Array.prototype.at = function<T>(this:T[], index:number){
		return this[index < 0 ? index + this.length : index];
	};
	Object.defineProperty(Array.prototype, "at", {
		enumerable: false
	});
}

/**Returns the time passed since program start in milliseconds. */
export function millis():number{
	return (new Date()).valueOf() - Game.startTime.valueOf();
}

/**Finds the greatest common divisor of two numbers */
export function gcd(x:number, y:number){
	if((typeof x !== 'number') || (typeof y !== 'number')){
		return 1;
	}
	x = Math.abs(x);
	y = Math.abs(y);
	while(y) {
		const t = y;
		y = x % y;
		x = t;
	}
	return x;
}

export function delay(time:number):Promise<void> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
}

export function until(predicate:() => boolean, checkInterval = 100):Promise<void> {
	return new Promise((resolve, reject) => {
		const id = setInterval(() => {
			if(predicate()){
				clearInterval(id);
				resolve();
			}
		}, checkInterval);
	});
}

export function round(amount:number, places = 0):number {
	const tenEplaces = 10 ** places;
	return Math.round(amount * tenEplaces) / tenEplaces;
}
/** Displays a number as a percentage. */
export function percentage(amount:number, places = 0):string {
	return `${round(amount * 100, places)}%`;
}

/** Inclusive. */
export function range(start:number, end:number, step = 1){
	return Array.from(
		{length: Math.floor((end - start + step) / step)},
		(_, i) => start + i * step
	);
}

export function constrain(x:number, min:number, max:number){
	if(x > max) return max;
	if(x < min) return min;
	return x;
}

export function linear_map(value:number, from1:number, from2:number, to1:number, to2:number){
	return ((value - from1) / (from2 - from1)) * (to2 - to1) + to1;
}


export function assert(x:unknown, message?:string){
	if(!x) crash(message ? `Assertion failed: ${message}` : message);
}

export function download(filename:string, text:string){
	//Self explanatory.
	const temp2 = document.createElement('a');
	temp2.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
	temp2.setAttribute('download', filename);
	temp2.style.display = 'none';
	document.body.appendChild(temp2);
	temp2.click();
	document.body.removeChild(temp2);
}

export function parseError(err:unknown):string {
	if(err instanceof Error){
		return err.message;
	} else if(typeof err == "number" || typeof err == "string" || typeof err == "boolean"){
		return err.toString();
	} else return String(err);
}

export function typeMatches(a:unknown, b:unknown){
	if(a === null) return b === null;
	if(a === undefined) return b === undefined;
	return typeof a === typeof b;
}

export function importObject(base:{}, ext:{}){
	for(const [k, v] of Object.entries(base)){
		if(k in ext && typeMatches(ext[k], v)){
			if(typeof v === "object" && v != null){
				importObject(v, ext[k]);
			} else base[k] = ext[k];
		}
	}
}

export class Button {
	declare x: number;
	declare y: number;
	declare width: number;
	declare height: number;
	declare label: string | Texture;
	//is this really the best way to solve this?
	color: string;
	font: string;
	onClick: (event:PartialMouseEvent) => void;
	constructor(config:{
		x: number | (() => number);
		y: number | (() => number);
		width: number | (() => number);
		height: number | (() => number);
		label: string | (() => string | Texture) | Texture;
		color: string;
		font: string;
		onClick: (event:PartialMouseEvent) => void;
	}){
		if(config.x instanceof Function)
			Object.defineProperty(this, "x", {get: config.x});
		else
			this.x = config.x ?? 300;
		
		if(config.y instanceof Function)
			Object.defineProperty(this, "y", {get: config.y});
		else
			this.y = config.y ?? 300;
		
		if(config.width instanceof Function)
			Object.defineProperty(this, "width", {get: config.width});
		else
			this.width = config.width ?? 300;
		
		if(config.height instanceof Function)
			Object.defineProperty(this, "height", {get: config.height});
		else
			this.height = config.height ?? 300;
		
		if(config.label instanceof Function)
			Object.defineProperty(this, "label", {get: config.label});
		else
			this.label = config.label ?? "Button";
		
		this.color = config.color ?? "#0000FF";
		this.font = config.font ?? "20px sans-serif";
		this.onClick = config.onClick ?? (()=>{});
	}
	display(_ctx:CanvasRenderingContext2D){
		_ctx.fillStyle = this.color;
		_ctx.strokeStyle = "#000000";
		_ctx.lineWidth = 2;
		_ctx.globalAlpha = 1.0;
		_ctx.fillRect(this.x, this.y, this.width, this.height);
		_ctx.strokeRect(this.x, this.y, this.width, this.height);
		if(this.isMouseInside()){
			_ctx.fillStyle = "#FFFFFF";
			if(Input.mouseDown){
				_ctx.globalAlpha = 0.4;
			} else {
				_ctx.globalAlpha = 0.2;
			}
			_ctx.lineWidth = 0;
			_ctx.fillRect(this.x, this.y, this.width, this.height);
		}
		_ctx.lineWidth = 1;
		_ctx.globalAlpha = 1.0;
		_ctx.font = this.font;
		_ctx.textAlign = "center";
		const tempBaseline = _ctx.textBaseline;
		_ctx.textBaseline = "middle";
		_ctx.fillStyle = "#FFFFFF";
		if(typeof this.label == "string"){
			_ctx.fillText(this.label,this.x + this.width/2,this.y + this.height/2);
		} else {
			_ctx.drawImage(this.label.image, this.x, this.y, this.width, this.height);
		}
		_ctx.textBaseline = tempBaseline;
	}
	isMouseInside(){
		return Intersector.pointInRect([Input.mouseX, Input.mouseY], [this.x, this.y, this.width, this.height]);
	}
	handleMouseClick(e:PartialMouseEvent){
		if(this.isMouseInside() && e.button == 0){
			this.onClick(e);
		}
	}
}

export function Abstract<TClass extends new (...args:any[]) => any>(input:TClass, context:ClassDecoratorContext<TClass>):TClass {
	return class __temp extends input {
		constructor(...args:any[]){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			super(...args);
			if(this.constructor === __temp) crash(`Cannot construct abstract class ${input.name}`);
		}
	};
}

/**
 * Drawing Functions
 * 
 */

export function* pseudoRandom(seed:number) {
	let value = seed + 11111111111111;
	while(true){
		value = value * 16807 % 16777216;
		const num = value / 16777216;
		yield {
			value: num,
			chance(amount:number){
				return num < amount;
			}
		};
	}
	return null!; //never returns
}
export function getElement<T extends typeof HTMLElement>(id:string, type:T){
	const element = document.getElementById(id) as unknown;
	if(element instanceof type) return element as T["prototype"];
	else if(element instanceof HTMLElement) crash(`Element with id ${id} was fetched as type ${type.name}, but was of type ${element.constructor.name}`);
	else crash(`Element with id ${id} does not exist`);
}


/**Sets a variable to be of a particular type. */
export function forceType<T>(input:unknown): asserts input is T {
	//
}

export function crash(message = `Unreachable code was reached!`):never {
	throw new Error(message);
}

/** @returns formatted HTML */
export function tooltip(title:string, properties:Partial<Record<string, string>> | string[]):string {
	const props:string[] = [];
	if(Array.isArray(properties)){
		props.push(...properties);
	} else {
		for(const [k, v] of Object.entries(properties)){
			if(v && v.trim().length > 0){
				if(k.startsWith("_")) props.push(v.trim());
				else props.push(`${k}: ${v.trim()}`);
			}
		}
	}
	return `${title}<div style="font-size: 70%;">${props.join("<br/>")}</div>`;
}

export function bindFunctionProperties<T extends Record<string, unknown>>(obj:T):{
	[K in keyof T]: T[K] extends (...args:infer Args extends any[]) => infer Out ? (this:void, ...args:Args) => Out : T[K];
} {
	return Object.fromEntries(Object.entries(obj).map(([k, v]) =>
		[k, typeof v == "function" ? v.bind(obj) : v]
	)) as never;
}

/**
 * Helper function to display a popup on first use of a feature. Do not overuse as getting spammed with alert() is annoying.
 * @param key Gets "untitled-electron-game-" prepended to it.
 * @param message Message displayed in the alert box.
 * @param callback Called if it is not the first use.
 */
export function firstUsePopup(key:string, message:string, callback?:() => unknown, runCallbackAfterMessage = false){
	const lsKey = `untitled-electron-game-${key}`;
	if(localStorage.getItem(lsKey) != null){
		callback?.();
	} else {
		alert(message);
		localStorage.setItem(lsKey, "true");
		if(runCallbackAfterMessage) callback?.();
	}
}

//#endregion
//#region Game-related functions

export function saveExists(){
	return localStorage.getItem("save1") != null;
}

export function safeToSave():boolean {
	if(!saveExists()) return true;
	try {
		const data = JSON.parse(localStorage.getItem("save1")!) as SaveData;
		assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
		return data.UntitledElectronGame.metadata.uuid == Game.level1.uuid || (data.UntitledElectronGame.metadata as {id?: unknown;}).id == Game.level1.uuid;
	} catch(err){
		return true;
	}
}

export function saveToLocalStorage(){
	localStorage.setItem("save1", JSON.stringify(SaveIO.export()));
	localStorage.setItem("untitled-electron-game:tech-tree", tech.write());
	localStorage.setItem("untitled-electron-game:objectives", objectives.write());
	Game.lastSaved = Date.now();
}

export function hex(num:number, length:number){
	return `0x${(Array(length).fill("0").join("") + num.toString(16)).toUpperCase().slice(-length)}`;
	//it just works
}

export function stringifyMeta(buildingID:RawBuildingID, buildingMeta:BuildingMeta):StringBuildingID {
	return `${buildingID}:${buildingMeta}`;
}

export function mapLegacyRawBuildingID(id:LegacyRawBuildingID):RawBuildingID {
	switch(id){
		case "0x01": return "base_conveyor";
		case "0x02": return "base_miner";
		case "0x03": return "base_trash_can";
		case "0x04": return "base_furnace";
		case "0x05": return "base_extractor";
		case "0x06": return "base_chest";
		case "0x07": return "base_alloy_smelter";
		case "0x08": return "base_resource_acceptor";
		case "0x09": return "base_wiremill";
		case "0x0A": return "base_compressor";
		case "0x0B": return "base_lathe";
		case "0x10": return "base_multiblock_secondary";
		case "0x11": return "base_assembler";
		case "0xFF": return "base_null";
	}
}
export function getLegacyRawBuildingID(buildingID:LegacyBuildingID):LegacyRawBuildingID {
	return hex(+buildingID, 2) as LegacyRawBuildingID;
}

export function makeRebindButton(
	y: number,
	keybind: Keybind,
	buttonName: string,
	defaultKey: string
){
	return new Button({
		x: () => innerWidth * 0.3,
		y: () => innerHeight * y,
		width: () => innerWidth * 0.4,
		height: () => innerHeight * 0.05,
		label: () => 
			`${buttonName}: ${
				keybind.modifiers
					.filter(key => !key.startsWith("!"))
					.map(el => el + " + ")
					.join("")
				//Get the list of modifiers, remove the ones that start with !, then add " + " to each one.
			}${keybind.mainKey}`,
		color: "#08F",
		font: "15px sans-serif",
		onClick: () => {
			keybind.mainKey =
				(prompt(`Rebind ${buttonName.toLowerCase()} to:`) ?? defaultKey).toLowerCase().substring(0,1);
		}
	});
}

export function selectID(id:RawBuildingID){
	const block = Buildings.getOpt(id);
	if(block && !block.unlocked()) id = "base_null";
	Input.placedBuilding.type = id;
	const image = document.querySelector(`img#toolbar_${id}`);
	for(const icon of DOM.toolbarEl.children){
		icon.classList.remove("selected");
	}
	if(image) image.classList.add("selected");
}

//#endregion
