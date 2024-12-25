/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains abstract classes related to Buildings. */

import { Buildings, Fluids } from "../content/content.js";
import { bundle } from "../content/i18n.js";
import { ItemStack, FluidStack, Fluid } from "../content/registry.js";
import type { TechTreeNode } from "../objectives.js";
import type { CurrentFrame, RawBuildingID, BuildingMeta, BuildingIDWithMeta, TextureInfo, ItemID, BuildingData } from "../types.js";
import { Gfx } from "../ui/graphics.js";
import { Direction } from "../util/direction.js";
import { Abstract, stringifyMeta, tooltip, constrain, crash } from "../util/funcs.js";
import { Pos, PosT } from "../util/geom.js";
import { settings, consts } from "../vars.js";
import { Item, Level } from "./world.js";


export type BlockDrawer<T> = (build:T, currentFrame:CurrentFrame) =>void;
@Abstract
export class Building {
	static outputsItems = false;
	static acceptsItems = false;
	static acceptsItemsFromAll = false;
	static acceptsFluidsFromAll = false;
	static outputsFluids = false;
	static acceptsFluids = false;
	static fluidCapacity = 100;
	static fluidInputSpeed = 1;
	static fluidOutputSpeed = 1;
	static fluidExtraPressure = 0;
	static id:RawBuildingID;
	/**Whether this building cannot be placed or broken.*/
	static immutable = false;
	static isOverlay = false;
	static displaysItem = false;
	static buildCost:ItemStack[] = [];
	static drawer:BlockDrawer<Building> | null = null;
	static node:TechTreeNode | null = null;
	static producesPower = false;
	static consumesPower = false;
	static hidden = false;

	item: Item | null = null;
	fluid: FluidStack | null = null;
	/** If set by a subclass, uses this for outputting. */
	fluidOut: FluidStack | null = null;
	pos:Pos;
	/** Counter that specifies which direction to start at when trying to dump items. Used for even distribution. */
	cItemOut = 0;
	/** Counter that specifies which direction to start at when trying to dump fluids. Used for even distribution. */
	cFluidOut = 0;
	fluidThroughput = 0;
	grid:PowerGrid | null = null;
	num1 = 0;
	/** Gets set during power update, after getMaxPowerProduction is called. */
	powerLoad = 0;
	/** Gets set during power update, after getRequestedPower is called. */
	powerSatisfaction = 0;

	//https://www.typescriptlang.org/play?#code/CYUwxgNghgTiAEAzArgOzAFwJYHtXzgHMsBnDEGAHgCF4QAPc1YE+DATwAcQdF5rkWCMCypCAPgAUWYAC4yMUYQA08TDhizqqzjBycSsgN4AoeOfgBtAArxR8ANYh2vfgF0A-LP423AbhMAXwBKLQCAenCAFQALUiQ0TFx8GKhWACMQEHwsAFtOCBBc7PJgeChmeAB3DQdWRGgqwpISCHZVKAgMGJxkQhi2GIQwHFB4CBwcOoIQTrbqkCwYYAA6ExNIgEEc1DIKsARXbvjINNY4XRASEtYoeBIlQvh0wWElO1QAWhqYYTXTlr8V4iMTwUwWe4YKDYMB2OQKd4AXngACI0KgoMUyi8hCDCCiAhC9jD7lgAF4gWSoZC5TIweDIgCMhIs6QmYAcDMGpBWI12GBgyHU9LSbC4PD4AlxShZ5kIIAwAElgJJguCIRY4BhkDB8McSCs2TgOSsZLL4IEzBZkJxgNCQKqjJbLSYAawAMJ4ABuzg0dEY2RYQOloPV5mJWFhJG4IDk1NpFC5zKt5kiiuqFQwbBw8FSPvgIkQiAoJTF3FYrj5PpcMFYVSw3QLWCLJdQWejWRYKfgkQAsuwkEsyOVOLocFAwAMqqKMDmwHB7eV4KgQFU1NBAQwmHi1N7ffT6427oXi3A2-cY2UvZ1kAh7N076gG1hOuSKKoXlnutCCzgrqgAHIs1Aa4YHzWdngQO43Q+QYEEICZ0k6e4Rm4NYITTNQF1KJciFIch6RQdBsDwao4kneBkGuVgAHl0gAK3ADAVjOLBCD1HN5RXGBFwfdcznKLNBTbPIoMqMgNDvLN7GgvAmCzXIoE4dCLEiWJ4h+aZuBgYtMHmRBRBAD9kC-IY4AA1h6KorM8DvFpb1kbtMJXWNuVYCBDMgiYqhU8wjQ5ABCbwOG4VxPVQasNHNLZ0hwfN7yGYM3lBN1VCqVIs3TBcIHmadz3iFFRFPOCy0OPh9V5PAFCFWcYBRYysyicUSHnLBOGk1BT1YBtylYFEADFEhI1AUTIyMBniKiQGaEgOkqdNA0ozhcygL13gg1CB31Z4cCECgCkXDyV3KVB2GndhfKWu1yEdbsIQq-yHBWDtY3NZ11hg3tDPpLdA1YKVksIMFuwjWFckMgBlS8qRpOkuQANgABnNR6gtK1wvu480bWuh01TuiwHvZJ7wZXKHOzeoJ1jwsgKEkFFWhwKp6vgcLIpgVQjAvTtvERlYAFYLWCAIaYI+nEDSDAWbZ-dOe52NvAAZiFkWQGIWmYHp9I2M+UmKBZzH3zBUkKW8RkVaAA
	block = this.constructor as typeof Building;
	constructor(x:number, y:number, public readonly meta:BuildingMeta, public level:Level){
		this.pos = Pos.fromTileCoords(x, y, false);
		if(this.block.fluidCapacity) //initialize fluid stack
			this.fluid = [null, 0, this.block.fluidCapacity];
	}
	static unlocked(){
		return this.node?.unlocked ?? this.hidden;
	}
	static changeMeta(meta:BuildingMeta, tileX:number, tileY:number, level:Level):BuildingMeta {
		return meta;
	}
	static getID(type:RawBuildingID, direction:Direction, modifier:number):BuildingIDWithMeta {
		return [type, 0];
	}
	static canBuildAt(tileX:number, tileY:number, level:Level){
		//By default, buildings cant be built on water
		return level.tileAtByTile(tileX, tileY) != "base_water";
	}
	/**Returns texture size and offset given meta. */
	static textureSize(meta:number):TextureInfo {
		return [[1, 1], [0, 0]];
	}
	static canOutputTo(building:Building | null):boolean {
		return Boolean(building?.block.acceptsItemsFromAll);
	}
	static canOutputFluidTo(building:Building | null):boolean {
		return Boolean(building?.block.acceptsFluidsFromAll);
	}
	/**Called to destroy the building. Should remove all references to it. */
	break(){
		this.level.buildings.delete(this);
		if(this.grid){
			if(this.block.consumesPower) this.grid.removeConsumer(this);
			if(this.block.producesPower) this.grid.removeProducer(this);
		}
		if(this.block.isOverlay) this.level.writeOverlayBuild(this.pos.tileX, this.pos.tileY, null);
		else this.level.writeBuilding(this.pos.tileX, this.pos.tileY, null);
		this.level.addResources(this.block.buildCost);
	}
	preUpdate(currentFrame:CurrentFrame){
		//empty
	}
	update(currentFrame:CurrentFrame){
		this.item?.update(currentFrame);
		if(this.block.outputsFluids) this.dumpFluid();
	}
	stringID(){
		return stringifyMeta(this.block.id, this.meta);
	}
	centeredPos(){
		return Pos.fromTileCoords(this.pos.tileX, this.pos.tileY, true);
	}
	static tooltip(...lines:string[]){
		return tooltip(bundle.get(`building.${this.id}.name`), [
			bundle.get(`building.${this.id}.description`, ""),
			...lines
		]);
	}
	static display(id:BuildingIDWithMeta, pos:Pos, layer?:(keyof typeof Gfx.layers)){
		const block = Buildings.get(id[0]);
		const textureSize = block.textureSize(id[1]);
		layer ??= block.isOverlay ? "overlayBuilds" : "buildings";
		Gfx.tImage(
			Gfx.texture(`building/${stringifyMeta(...id)}`),
			pos.tileX + textureSize[1][0], pos.tileY + textureSize[1][1],
			...textureSize[0],
			Gfx.layers[layer]
		);
	}
	displayName(){
		return bundle.get(`building.${this.block.id}.name`);
	}
	getTooltip(){
		//returns raw html, make sure to escape!
		return tooltip(this.displayName(), this.tooltipProperties());
	}
	tooltipProperties():Partial<Record<string, string>> {
		return {
			_description: bundle.get(`building.${this.block.id}.description`, ""),
			id: settings.showIDsInTooltips ? this.block.id : ""
		};
	}
	display(currentFrame:CurrentFrame, layer:(keyof typeof Gfx.layers) = this.block.isOverlay ? "overlayBuilds" : "buildings"){
		Gfx.layer(layer);
		Building.display([this.block.id, this.meta], this.pos, layer);
		this.block.drawer?.(this, currentFrame);
		if(this.item instanceof Item && this.block.displaysItem){
			this.item.display(currentFrame);
		}
	}
	hasItem():Item | null {
		if(this.item) return this.item;
		return null;
	}
	removeItem():Item | null {
		if(this.item){
			const temp = this.item;
			this.item = null;
			return temp;
		}
		return null;
	}
	/**Whether a building can ever accept items from a particular side. */
	acceptsItemFromSide(side:Direction):boolean {
		return this.block.acceptsItems;
	}
	/**Whether a building can ever output items to a particular side. */
	outputsItemToSide(side:Direction):boolean {
		return this.block.outputsItems;
	}
	/**Whether a building can ever accept items from a particular side. */
	acceptsFluidFromSide(side:Direction):boolean {
		return this.block.acceptsFluids;
	}
	/**Whether a building can ever output items to a particular side. */
	outputsFluidToSide(side:Direction):boolean {
		return this.block.outputsFluids;
	}
	/** This can vary based on power, eg for transit pumps */
	fluidExtraPressure(){
		return this.block.fluidExtraPressure;
	}
	fluidInputSpeed(from:Building){
		return this.block.fluidInputSpeed;
	}
	fluidOutputSpeed(to:Building){
		return this.block.fluidOutputSpeed * constrain(
			(this.pressureOut() - to.pressureIn()) + this.fluidExtraPressure(),
			//Multiply by the difference in pressure, but maybe add a bit
			0, 1
		);
	}
	/**
	 * Called between preUpdate and update.
	 * @returns the maximum power that this building can produce on this tick.
	**/
	getMaxPowerProduction():number {
		crash(`Function "getMaxPowerProduction" not implemented for base class Building.`);
	}
	/**
	 * Called between preUpdate and update.
	 * @returns whether or not this generator can decrease its power output.
	**/
	//TODO use JS getters
	canVaryPowerProduction():boolean {
		return true;
	}
	/**
	 * Called between preUpdate and update.
	 * @returns the amount of power that this building wants on this tick.
	 **/
	getRequestedPower():number {
		crash(`Function "getRequestedPower" not implemented for base class Building.`);
	}
	buildAt(direction:Direction):Building | null {
		return this.level.buildingAtTile(this.pos.tileX + direction.vec[0], this.pos.tileY + direction.vec[1]);
	}
	buildAtOffset(offset:PosT):Building | null {
		return this.level.buildingAtTile(this.pos.tileX + offset[0], this.pos.tileY + offset[1]);
	}
	spawnItem(id:ItemID){
		for(const direction of Direction){
			const build = this.buildAt(direction);
			if(
				build && this.block.canOutputTo(build) &&
				this.outputsItemToSide(direction) && build.acceptsItemFromSide(direction.opposite) && build.acceptItem(new Item(
					(this.pos.tileX + 0.5 + direction.vec[0] * 0.6) * consts.TILE_SIZE,
					(this.pos.tileY + 0.5 + direction.vec[1] * 0.6) * consts.TILE_SIZE,
					id
				), direction.opposite)
			) return true;
		}
		return false;
	}
	/**
	 * Attempts to tranfer an item.
	 * @param side Direction relative to this building. (+x is right, +y is down)
	 * @returns true if the transfer succeeded and the item was moved, false if it was not moved
	 */
	acceptItem(item:Item, side:Direction | null):boolean {
		if(this.item === null && this.block.acceptsItems && (side == null || this.acceptsItemFromSide(side))){
			this.item = item;
			return true;
		} else {
			return false;
		}
	}
	dumpFluid(){
		this.fluidThroughput = 0;
		const fluid = this.fluidOut ?? this.fluid;
		if(fluid?.[0] == null || fluid[1] == 0) return;
		for(let i = 0; i < Direction.number; i ++){
			if(++this.cFluidOut > 3) this.cFluidOut = 0;
			const direction = Direction.all[this.cFluidOut]!;
			const build = this.buildAt(direction);
			if(
				build && this.block.canOutputFluidTo(build) &&
				this.outputsFluidToSide(direction) && build.acceptsFluidFromSide(direction.opposite)
			){
				this.fluidThroughput = build.acceptFluid(fluid, this.fluidOutputSpeed(build), this)!;
				return;
			}
		}
	}
	acceptFluid(stack:FluidStack, maxThroughput:number, from:Building):number | null {
		if(this.fluid)
			return Fluid.merge(stack, this.fluid, Math.min(maxThroughput, this.fluidInputSpeed(from)));
		return null;
	}
	/** should be between 0 and 1. */
	pressureOut(){
		const fluid = this.fluidOut ?? this.fluid;
		if(!fluid) return 0;
		const fillLevel = fluid[1] / this.block.fluidCapacity;
		//is this fine?
		return fillLevel;
	}
	/** should be between 0 and 1. */
	pressureIn(){
		if(!this.fluid) return 0;
		const fillLevel = this.fluid[1] / this.block.fluidCapacity;
		return fillLevel;
	}
	export():BuildingData {
		return {
			x: this.pos.tileX,
			y: this.pos.tileY,
			id: this.block.id,
			meta: this.meta,
			item: this.item?.export() ?? null,
			fluid: this.fluid ? [this.fluid[0]?.id ?? null, this.fluid[1]] : null,
		};
	}
	/**Must be called with a "this" context obtained from Buildings.get(id). */
	static read(buildingData:BuildingData, level:Level):Building {
		//"this" refers to the subclass that read() was called on, which should be Buildings.get(id)
		//This is done because subclasses may want to override the read() method, so you have to Buildings.get() anyway.
		const build = new this(buildingData.x, buildingData.y, buildingData.meta, level);
		if(buildingData.item) build.item = Item.read(buildingData.item);
		level.grid.addBuilding(build);
		if(buildingData.fluid && this.fluidCapacity) build.fluid = [Fluids.get(buildingData.fluid[0]), buildingData.fluid[1], this.fluidCapacity];
		return build;
	}
}


class ItemModule {
	storage:Partial<Record<ItemID, number>> = {};
	constructor(public maxCapacity = 10){}
	get(id:ItemID){
		return this.storage[id] ?? 0;
	}
	has(id:ItemID){
		return this.storage[id] === 0 || this.storage[id] === undefined;
	}
	/**
	 * Attempts to grab an ItemStack, mutating it.
	 * @returns whether the ItemStack was fully consumed.
	 **/
	addFrom(stack:ItemStack):boolean {
		const remainingSpace = this.maxCapacity - this.get(stack[0]);
		const amountTransferred = Math.max(0, Math.min(remainingSpace, stack[1]));
		this.storage[stack[0]] ??= 0;
		this.storage[stack[0]]! += amountTransferred;
		return (stack[1] -= amountTransferred) <= 0;
	}
	/**
	 * Attempts to output to an ItemStack, mutating it.
	 * @returns whether the output stack is full.
	 */
	removeTo(stack:ItemStack, maxCapacity = Infinity):boolean {
		const remainingSpace = maxCapacity - stack[1];
		const amountTransferred = Math.min(remainingSpace, this.get(stack[0]));
		this.storage[stack[0]] ??= 0;
		this.storage[stack[0]]! -= amountTransferred;
		return (stack[1] += amountTransferred) == maxCapacity;
	}
	merge(from:ItemStack, to:ItemStack){
		//TODO
	}
}


// class SingleFluidModule {
// 	type: Fluid | null = null;
// 	capacity = 100;
// 	amount = 0;
// 	get(id:number){
// 		if(this.type && this.type.id == id) return this.amount;
// 		else return 0;
// 	}
// 	has(id:number){
// 		return this.type && this.type.id == id;
// 	}
// 	/**
// 	 * Attempts to grab a FluidStack, mutating it.
// 	 * @returns whether the FluidStack was fully consumed.
// 	 **/
// 	addFrom(stack:FluidStack):boolean {
// 		if(stack[1] <= 0 || stack[0] == null) return false; //empty
// 		if(this.type === null) this.type = stack[0];
// 		else if(this.type != stack[0]) return false; //Different fluids
		
// 		const remainingSpace = this.capacity - this.amount;
// 		const amountTransferred = Math.max(0, Math.min(remainingSpace, stack[1]));
// 		this.amount += amountTransferred;
// 		return (stack[1] -= amountTransferred) <= 0;
// 	}
// 	/**
// 	 * Attempts to output to a FluidStack, mutating it.
// 	 * @returns whether the output stack has been filled.
// 	 */
// 	removeTo(stack:FluidStack):boolean {
// 		if(this.amount <= 0 || this.type == null) return false; //empty
// 		if(this.type === null) this.type = stack[0];
// 		else if(this.type != stack[0]) return false; //Different fluids
// 		const remainingSpace = stack[2] - stack[1];
// 		const amountTransferred = Math.min(remainingSpace, this.amount);
// 		this.amount -= amountTransferred;
// 		stack[1] += amountTransferred;
// 		return amountTransferred === remainingSpace;
// 	}
// }

export class PowerGrid {
	//array is fine, faster iteration than quadtree, deletion is O(n) but that's not that bad
	producers: Building[] = [];
	consumers: Building[] = [];
	powerRequested = 0;
	maxProduction = 0;
	updatePower(){
		this.powerRequested = this.consumers.reduce((acc, p) => acc + p.getRequestedPower(), 0);
		let variablePower = 0, fixedPower = 0;
		for(const producer of this.producers){
			if(producer.canVaryPowerProduction()) variablePower += producer.getMaxPowerProduction();
			else fixedPower += producer.getMaxPowerProduction();
		}
		this.maxProduction = variablePower + fixedPower;
		const load = this.maxProduction == 0 ? 0 : constrain((this.powerRequested - fixedPower) / this.maxProduction, 0, 1);
		const satisfaction = this.powerRequested == 0 ? 0 : Math.min(this.maxProduction / this.powerRequested, 1);
		this.producers.forEach(p => p.powerLoad = load);
		this.consumers.forEach(c => c.powerSatisfaction = satisfaction);
	}
	addBuilding(build:Building):boolean {
		if(build.block.consumesPower) this.consumers.push(build);
		else if(build.block.producesPower) this.producers.push(build);
		else return false;
		build.grid = this;
		return true;
	}
	removeProducer(build:Building){
		const index = this.producers.indexOf(build);
		if(index == -1) return false;
		this.producers.splice(index, 1);
		build.powerLoad = 0;
	}
	removeConsumer(build:Building){
		const index = this.consumers.indexOf(build);
		if(index == -1) return false;
		this.consumers.splice(index, 1);
		build.powerSatisfaction = 0;
	}
}
