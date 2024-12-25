/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains content registry related code. */

import type { TechTree, TechTreeNode } from "../objectives.js";
import type { FluidID, ItemID } from "../types.js";
import { crash } from "../util/funcs.js";
import type { Templatable } from "../util/types.js";


export class Content<K extends string> {
	nid:number;
	static _id = 0;
	constructor(public id:K){
		this.nid = (this.constructor as typeof Content)._id++;
	}
}

/** Content registry where the content is a class. */
export class ContentRegistryC<K extends Templatable, T extends new (...args:any[]) => {}> implements Iterable<T> {
	private contentMap = new Map<K, T>();
	register<B extends T>(id:K, ctor:B, props:Partial<Exclude<B, "prototype">> = {}) {
		const clazz = Object.assign(class extends ctor {}, {
			...props, id
		});
		this.contentMap.set(id, clazz);
		return clazz;
	}
	setNodes(tree:TechTree){
		for(const [id, clazz] of this.contentMap.entries()){
			if("node" in clazz)
				(clazz as UnlockableContent).node = tree.getOpt(`building_${id}`); //TODO nongeneric: uses "building" but might be something else
		}
	}
	get(id:K):T {
		return this.contentMap.get(id) ?? crash(`Object with id ${id} does not exist.`);
	}
	getOpt(id:K | undefined):T | null {
		return (this.contentMap.get as (key: K | undefined) => T | undefined)(id) ?? null;
	}
	[Symbol.iterator]():Iterator<T> {
		return this.contentMap.values();
	}
	keys():K[] {
		return Array.from(this.contentMap.keys());
	}
}

/** Content registry for when the content is a class instance. */
export class ContentRegistryI<K extends string, T extends Content<string>> {
	private stringContentMap = new Map<K, T>();
	private numberContentMap = [] as T[];
	register(content:T){
		this.stringContentMap.set(content.id as K, content);
		this.numberContentMap[content.nid] = content;
	}
	get(id:K):T;
	get(id:number):T;
	get(id:null):null;
	get(id:K | number | null):T | null;
	get(id:K | number | null):T | null {
		if(typeof id == "number") return this.numberContentMap[id] ?? crash(`No content with id ${id} exists.`);
		else if(id == null) return null;
		else return this.stringContentMap.get(id) ?? crash(`No content with id ${id} exists.`);
	}
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface UnlockableContent {
	node:TechTreeNode | null;
}

/**A combination of an ItemID and an amount. The amount is frequently mutated by function calls. */
export type ItemStack = [id:ItemID, amount:number];

export type FluidStack = [type:Fluid | null, amount:number, capacity:number];
export class Fluid extends Content<FluidID> {

	constructor(id:FluidID, public color:string){
		super(id);
	}
	/**
	 * Moves fluid from `from` to `to`.
	 * @returns the amount of fluid moved.
	 */
	static merge(from:FluidStack, to:FluidStack, maxThroughput = Infinity):number {
		if(from[0] == null || from[1] == 0) return 0; //from is empty
		if(to[0] === null) to[0] = from[0]; //set fluid
		else if(from[0] !== to[0]) return 0; //fluids are different
		const remainingSpace = to[2] - to[1];
		const amountTransferred = Math.min(remainingSpace, from[1], maxThroughput);
		from[1] -= amountTransferred;
		to[1] += amountTransferred;
		return amountTransferred;
	}
	static fill(stack:FluidStack, type:Fluid, amount:number){
		if(type == null || amount == 0) return 0;
		if(stack[0] === null) stack[0] = type; //set fluid
		else if(stack[0] !== type) return 0; //different fluid
		const remainingSpace = stack[2] - stack[1];
		const amountTransferred = Math.min(remainingSpace, amount);
		stack[1] += amountTransferred;
		return amountTransferred;
	}
	/** @returns the amount that can be drained. */
	static checkDrain(stack:FluidStack, amount:number):number {
		if(stack[0] == null) return 0;
		return Math.min(stack[1], amount);
	}	
	/** @returns the amount drained. */
	static drain(stack:FluidStack, amount:number):number {
		if(stack[0] == null) return 0;
		const amountDrained = Math.min(stack[1], amount);
		stack[1] -= amountDrained;
		return amountDrained;
	}
}

