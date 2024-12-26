/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains generic utility functions, as well as game related functions. */

import type { RawBuildingID, BuildingMeta, StringBuildingID, LegacyRawBuildingID, LegacyBuildingID } from "../types.js";


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

export function formatTime(time:number){
	const months = Math.floor(time / (30 * 24 * 60 * 60 * 1000));
	const days = Math.floor((time % (30 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
	const hours = Math.floor((time % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
	const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
	const seconds = Math.floor((time % (60 * 1000)) / (1000));

	const lines = [
		months && `${months} month${months == 1 ? "" : "s"}`,
		days && `${days} day${days == 1 ? "" : "s"}`,
		hours && `${hours} hour${hours == 1 ? "" : "s"}`,
		minutes && `${minutes} minute${minutes == 1 ? "" : "s"}`,
		seconds && `${seconds} second${seconds == 1 ? "" : "s"}`,
	].filter(Boolean);
	if(lines.length < 3) return lines.join(", ");
	else return lines.slice(0, -1).join(", ") + ", and " + lines.at(-1);
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


