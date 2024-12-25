/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the concrete classes for all building types. */

import { Fluids, ItemIDs, recipes } from "../content/content.js";
import { bundle } from "../content/i18n.js";
import { ItemStack, FluidStack, Fluid } from "../content/registry.js";
import { objectives } from "../objectives.js";
import type { Recipe, BuildingMeta, CurrentFrame, BuildingData, ItemID, RawBuildingID, BuildingIDWithMeta, TextureInfo, ItemData } from "../types.js";
import { ParticleEffect, Gfx, AnimationData, getAnimationData, RectMode } from "../ui/graphics.js";
import { Direction } from "../util/direction.js";
import { Abstract, crash, round, constrain, linear_map } from "../util/funcs.js";
import { Rand } from "../util/random.js";
import { PosT, add, Pos } from "../util/geom.js";
import { Log } from "../util/log.js";
import { settings, consts, Mathf } from "../vars.js";
import { Building, BlockDrawer } from "./building.js";
import { type Level, Item } from "./world.js";


@Abstract
export class BuildingWithRecipe extends Building {
	timer = -1;
	runEffectTimer = -1;
	recipe: Recipe | null = null;
	running = false;
	items: ItemStack[] = [];
	fluidOut: FluidStack = [null, 0, this.block.fluidCapacity];
	/** During updatePower and preUpdate, this will be the actual efficiency on the previous tick. During update, this will be the actual efficiency of the block. */
	efficiency = 0;
	/** This is the potential efficiency. (for example, if there is low load on a generator but all inputs are full, efficiency will be low but efficiencyp will be 1.) */
	efficiencyp = 0;
	static outputsItems = true;
	static acceptsItems = true;
	static recipeType: { recipes: Recipe[]; };
	static recipeMaxInputs = 3;
	static craftEffect: [ParticleEffect, color: string] | null = null;
	/** Warning: spacing should be divisible (or nearly) by the recipe run time if chance is 1. */
	static runEffect: [ParticleEffect, color: string, spacing: number, chance: number] | null = null;
	block!: typeof BuildingWithRecipe;
	constructor(tileX: number, tileY: number, meta: BuildingMeta, level: Level) {
		super(tileX, tileY, meta, level);
	}
	acceptItem(item: Item): boolean {
		if (this.recipe) {
			if (!this.recipe.inputs) return false;
			const required = this.recipe.inputs.find(i => i[0] == item.id);
			const existingStack = this.items.find(i => i[0] == item.id);
			if (!required || !existingStack) return false;
			if (existingStack[1] < required[1]) {
				existingStack[1]++;
				if (this.recipe.inputs.every(([item, amount]) => this.items.some(([i, a]) => i == item && a >= amount))) {
					//If every item is present in the required amount
					this.running = true;
				}
				return true;
			}
		} else {
			for (let i = 0; i < this.block.recipeMaxInputs; i++) {
				//repeat recipeMaxInputs times
				if (!this.items[i] && !this.items.map(item => item[0]).includes(item.id)) {
					//if there is nothing in this item slot and the new item's id is not in the list of current items' ids
					for (const recipe of this.block.recipeType.recipes) {
						//for each recipe this building can do
						if (!recipe.inputs) continue; //If the recipe has no inputs, it cant be the right one
						if (recipe.fluidInputs && (this.block.fluidCapacity == 0 || !this.block.acceptsFluids)) continue; //recipe requires fluids but this crafter does not support fluids
						if (recipe.powerConsumption && !this.block.consumesPower) continue; //recipe requires power but this building doesn't accept power
						if (this.items.every(item => recipe.inputs!.some(([id, amount]) => id == item[0])) && recipe.inputs.some(([id, amount]) => id == item.id)) {
							//if all of the current items are inputs of the recipe and the item is an input of the recipe
							this.items[i] = [item.id, 1];
							if (recipe.inputs.length == i + 1) {
								this.setRecipe(recipe);
							}
							return true;
						}
					}
					return false;
				}
			}
		}
		return false;
	}
	hasItem() {
		return null;
	}
	removeItem() {
		return null;
	}
	setRecipe(recipe: Recipe) {
		this.recipe = recipe;
		this.timer = recipe.duration;
		this.runEffectTimer = recipe.duration;
		if (!this.recipe.inputs || this.recipe.inputs.every(([item, amount]) => this.items.some(([i, a]) => i == item && a >= amount))) {
			//If every item is present in the required amount
			this.running = true;
		}
	}
	update(currentFrame: CurrentFrame) {
		if (this.recipe && this.running) {
			if (this.timer > 0) {
				let minSatisfaction = this.recipe.inputs?.length ? Math.min(this.timer, 1) : 1;
				//if the recipe does not have any item inputs,
				//limiting the last tick at the correct amount will result in the last tick having potentially much lower efficiency
				//this is a problem for power generators as that one tick will cause the network to briefly drop
				//however if it does have item inputs, not limiting the last tick will result in more fluid/power output for the item
				//Calculate the maximum efficiency
				if (this.recipe.fluidInputs) { //Fluid check
					for (const fluidInput of this.recipe.fluidInputs) {
						const amountNeeded = fluidInput[1] / this.recipe.duration;
						const amountDrained = Fluid.checkDrain(this.fluid!, amountNeeded);
						minSatisfaction = Math.min(amountDrained / amountNeeded, minSatisfaction);
					}
				}
				if (this.block.consumesPower && this.recipe.powerConsumption) { //Power check
					minSatisfaction = Math.min(minSatisfaction, this.powerSatisfaction);
				}
				this.efficiencyp = minSatisfaction;
				if (this.block.producesPower && this.recipe.powerProduction) {
					minSatisfaction = Math.min(minSatisfaction, this.powerLoad); //Load was set in pre update so this is on-time
				}

				//Drain fluids
				if (this.recipe.fluidInputs) {
					for (const fluidInput of this.recipe.fluidInputs) { //Actually drain
						const amountNeeded = fluidInput[1] / this.recipe.duration * minSatisfaction;
						const amountDrained = Fluid.drain(this.fluid!, amountNeeded);
						if (amountDrained - amountNeeded > Number.EPSILON * 5)
							crash(`logic error when consuming fluids: needed ${amountNeeded}, got ${amountDrained}`);
					}
				}
				//Power production/consumption is handled separately, consumption will be off by one tick
				this.efficiency = minSatisfaction;
				this.timer -= minSatisfaction;
				if (this.recipe.fluidOutputs && minSatisfaction > 0) {
					for (const fluidOutput of this.recipe.fluidOutputs) {
						Fluid.fill(this.fluidOut, Fluids.get(fluidOutput[0]), fluidOutput[1] / this.recipe.duration * minSatisfaction);
					}
				}
			} else if (this.timer > -1) {
				if ((this.recipe.outputs && this.spawnItem(this.recipe.outputs[0][0])) || !this.recipe.outputs) {
					if (this.block.craftEffect) this.block.craftEffect[0].at(this.centeredPos(), this.block.craftEffect[1]);
					this.timer = -1;
					this.items = [];
					this.recipe = null;
					this.running = false;
				}
			}
		}
		if (this.recipe == null && this.block.recipeType.recipes.length == 1 && (this.block.recipeType.recipes[0]!.inputs?.length ?? 0) == 0) {
			this.setRecipe(this.block.recipeType.recipes[0]!);
		}
		super.update(currentFrame);
	}
	getMaxPowerProduction(): number {
		return (this.recipe?.powerProduction ?? 0) * this.efficiencyp;
	}
	getRequestedPower(): number {
		//Always request full power
		return (this.recipe?.powerConsumption ?? 0) /* * this.efficiency */;
	}
	display(currentFrame: CurrentFrame, layer?: keyof typeof Gfx.layers) {
		super.display(currentFrame, layer);
		if (this.block.runEffect &&
			this.timer > 0 &&
			this.timer <= this.runEffectTimer) {
			if (Rand.chance(this.block.runEffect[3]))
				this.block.runEffect[0].at(this.centeredPos(), this.block.runEffect[1]);
			this.runEffectTimer -= this.block.runEffect[2];
		}
	}
	tooltipProperties() {
		return {
			...super.tooltipProperties(),
			Progress: this.recipe ? `${round(this.recipe.duration - this.timer, 2).toFixed(2)} / ${this.recipe.duration}` : "",
			Efficiency: `${round(this.efficiency * 100, 2).toString()}%`,
			"Power Generation": this.recipe?.powerProduction ? `${(this.efficiency * this.recipe.powerProduction).toFixed(0)}/${(this.efficiencyp * this.recipe.powerProduction).toFixed(0)}` : undefined,
			"Power Usage": this.recipe?.powerConsumption ? `${(this.efficiency * this.recipe.powerConsumption).toFixed(0)}/${this.recipe.powerConsumption.toFixed(0)}` : undefined,
		};
	}
	export() {
		return {
			...super.export(),
			items: this.items
		};
	}
	static read(buildingData: BuildingData, level: Level): BuildingWithRecipe {
		const build = super.read(buildingData, level) as BuildingWithRecipe;
		for (const [item, amount] of buildingData.items ?? []) {
			if (ItemIDs.includes(item) && typeof amount == "number" && amount >= 0)
				build.items.push([item, amount]);
		}
		const recipe = this.recipeType.recipes.find(r => r.inputs?.every(([item, amount]) => build.items.some(([i, a]) => item == i && a > 0))
		);
		if (recipe) build.setRecipe(recipe);
		return build;
	}
	static makeDrawer<T extends BuildingWithRecipe>(drawer: (build: T, e: AnimationData, currentFrame: CurrentFrame) => void, ...drawers: Array<BlockDrawer<T>>) {
		return ((build: T, currentFrame: CurrentFrame) => {
			if (build.recipe) {
				Gfx.layer("buildings");
				drawer(build, getAnimationData(1 - (build.timer) / build.recipe.duration), currentFrame);
			}
			drawers.forEach(d => d(build, currentFrame));
		}) as BlockDrawer<Building>;
		//This is an unsafe cast
		//The issue is that static properties can't reference this in their type declaration, so I can't tell typescript that a (T extends BuildingWithRecipe)'s drawer won't get called with something other than a T (so it only accepts BuildingDrawer<Building>) without adding an extra line of boilerplate to each class.
	}
	static combineDrawers<T extends BuildingWithRecipe>(...drawers: Array<BlockDrawer<T>>) {
		return ((build: T, currentFrame: CurrentFrame) => {
			Gfx.layer("buildings");
			drawers.forEach(d => d(build, currentFrame));
		}) as BlockDrawer<Building>;
		//This is an unsafe cast
		//The issue is that static properties can't reference this in their type declaration, so I can't tell typescript that a (T extends BuildingWithRecipe)'s drawer won't get called with something other than a T (so it only accepts BuildingDrawer<Building>) without adding an extra line of boilerplate to each class.
	}
	static progressDrawerOld<T extends BuildingWithRecipe>() {
		return ((build: T, currentFrame: CurrentFrame) => {
			if (build.recipe) {
				Gfx.layer("buildings");
				Gfx.fillColor("blue");
				Gfx.tEllipse(...build.centeredPos().tile, 0.3, 0.3, 0, 0, (1 - (build.timer) / build.recipe.duration) * 2 * Math.PI);
			}
		}) as BlockDrawer<Building>;
	}
	static progressDrawer<T extends BuildingWithRecipe>() {
		return ((build: T, currentFrame: CurrentFrame) => {
			if (build.recipe) {
				const [w, h] = build.block.textureSize(build.meta)[0];
				Gfx.layer("buildings");
				Gfx.fillColor("darkblue");
				//numbers are fractions with denominator 64 (size of the building texture)
				Gfx.tRect(build.pos.tileX + 0.125 * w, build.pos.tileY + 0.125 * h, 0.75 * w, 0.0625 * h, RectMode.CORNER);
				Gfx.fillColor("cyan");
				Gfx.tRect(build.pos.tileX + 0.125 * w, build.pos.tileY + 0.125 * h, (1 - build.timer / build.recipe.duration) * 0.75 * w, 0.0625 * h, RectMode.CORNER);
			}
		}) as BlockDrawer<Building>;
	}
	static outputDrawer<T extends BuildingWithRecipe>() {
		return ((build: T, currentFrame: CurrentFrame) => {
			if (build.recipe?.outputs) {
				Item.display(build.recipe.outputs[0][0], build.centeredPos());
			}
		}) as BlockDrawer<Building>;
	}
	static drawFluid<T extends BuildingWithRecipe>(offset: PosT, width: number, height: number) {
		return ((build: T, currentFrame: CurrentFrame) => {
			if (!build.fluid![0]) return;
			Gfx.layer("buildingsUnder");
			Gfx.fillColor(build.fluid![0].color);
			Gfx.alpha(build.fluid![1] / build.block.fluidCapacity);
			Gfx.tRect(...add(build.pos.tileC, offset), width, height, RectMode.CENTER);
		}) as BlockDrawer<Building>;
	}
	static drawLayer<T extends Building>(texture: string, width = 1, height = 1, getAlpha: (build: T) => number = () => 1) {
		return ((build: T, currentFrame: CurrentFrame) => {
			Gfx.layer("buildings");
			Gfx.alpha(getAlpha(build));
			Gfx.tImage(
				Gfx.texture(texture),
				...build.pos.tile,
				width, height
			);
			Gfx.alpha(1);
		}) as BlockDrawer<Building>;
	}
}
export class Miner extends Building {
	timer: number;
	miningItem: ItemID | null = null;
	ranOnce = false;
	static outputsItems = true;
	constructor(tileX: number, tileY: number, meta: BuildingMeta, level: Level) {
		super(tileX, tileY, meta, level);
		this.timer = 61;
		const output = recipes.base_mining.recipes.find(r => r.tile == level.tileAtByTile(tileX, tileY))?.outputs[0][0];
		if (output) {
			this.miningItem = output;
			objectives.get("base_produceStone").satisfy();
		} else Log.warn(`Miner cannot mine tile at ${tileX}, ${tileY}`);
	}
	static canBuildAt(tileX: number, tileY: number, level: Level): boolean {
		return recipes.base_mining.recipes.some(r => r.tile == level.tileAtByTile(tileX, tileY));
	}
	update() {
		if (!this.miningItem) return;
		if (this.timer > 0) {
			this.timer--;
		} else {
			if (this.spawnItem(this.miningItem)) {
				this.timer = 61;
				this.ranOnce = true;
			}
		}
	}
}
export class TrashCan extends Building {
	static acceptsItems = true;
	static acceptsFluids = true;
	acceptItem(item: Item) {
		return true;
	}
	acceptFluid(stack: FluidStack, maxThroughput: number, from: Building): number {
		return Fluid.drain(stack, maxThroughput);
	}
}
export class Conveyor extends Building {
	static acceptsItemsFromAll = true;
	static displaysItem = true;
	static acceptsItems = true;
	static outputsItems = true;
	/**Speed of the item in pixels per update. */
	static speed = 1;
	static inputMapping = [
		//uldr
		0b0100,
		0b1000,
		0b0001,
		0b0010,
		0b0010,
		0b1000,
		0b0001,
		0b0100,
		0b0010,
		0b1000,
		0b0001,
		0b0100,
		0b0110,
		0b1100,
		0b1001,
		0b1100,
		0b0011,
		0b1001,
		0b0011,
		0b0110,
		0b1010,
		0b0101,
		0b1010,
		0b0101,
		0b1110,
		0b1101,
		0b1011,
		0b0111,
	];
	static outputMapping = [
		//uldr
		Direction.right,
		Direction.down,
		Direction.left,
		Direction.up,
		Direction.right,
		Direction.right,
		Direction.down,
		Direction.down,
		Direction.left,
		Direction.left,
		Direction.up,
		Direction.up,
		Direction.right,
		Direction.right,
		Direction.down,
		Direction.down,
		Direction.left,
		Direction.left,
		Direction.up,
		Direction.up,
		Direction.right,
		Direction.down,
		Direction.left,
		Direction.up,
		Direction.right,
		Direction.down,
		Direction.left,
		Direction.up,
	];

	block!: typeof Conveyor;
	outputSide: Direction = Conveyor.outputSide(this.meta);
	acceptsItemFromSide(side: Direction): boolean {
		return Boolean((this.block.inputMapping[this.meta] ?? crash(`Invalid meta ${this.meta}`)) & side.bitmask);
	}
	outputsItemToSide(side: Direction): boolean {
		return this.block.outputMapping[this.meta] == side;
	}
	static outputSide(meta: number): Direction {
		return this.outputMapping[meta] ?? crash(`Invalid meta ${meta}`);
	}
	static getID(type: RawBuildingID, direction: Direction, modifier: number): BuildingIDWithMeta {
		return [type, direction.num] as BuildingIDWithMeta;
	}
	static changeMeta(meta: BuildingMeta, tileX: number, tileY: number, level: Level, force_straight_conveyor:boolean): BuildingMeta {
		if (force_straight_conveyor) {
			return meta;
			//If holding shift, just return a straight conveyor.
		}

		const hasLeft = level.buildingAtTile(tileX - 1, tileY)?.outputsItemToSide(Direction.right) ?? false;
		const hasUp = level.buildingAtTile(tileX, tileY - 1)?.outputsItemToSide(Direction.down) ?? false;
		const hasRight = level.buildingAtTile(tileX + 1, tileY)?.outputsItemToSide(Direction.left) ?? false;
		const hasDown = level.buildingAtTile(tileX, tileY + 1)?.outputsItemToSide(Direction.up) ?? false;

		switch (meta) {
			case 0:
				if (hasLeft) {
					if (hasUp && hasDown) return 0x18;
					else if (hasUp) return 0x0D;
					else if (hasDown) return 0x0C;
					else return 0x00;
				} else {
					if (hasUp && hasDown) return 0x14;
					else if (hasUp) return 0x05;
					else if (hasDown) return 0x04;
					else return 0x00;
				}
			case 1:
				if (hasUp) {
					if (hasLeft && hasRight) return 0x19;
					else if (hasLeft) return 0x0F;
					else if (hasRight) return 0x0E;
					else return 0x01;
				} else {
					if (hasLeft && hasRight) return 0x15;
					else if (hasLeft) return 0x07;
					else if (hasRight) return 0x06;
					else return 0x01;
				}
			case 2:
				if (hasRight) {
					if (hasUp && hasDown) return 0x1A;
					else if (hasUp) return 0x11;
					else if (hasDown) return 0x10;
					else return 0x02;
				} else {
					if (hasUp && hasDown) return 0x16;
					else if (hasUp) return 0x09;
					else if (hasDown) return 0x08;
					else return 0x02;
				}
			case 3:
				if (hasDown) {
					if (hasLeft && hasRight) return 0x1B;
					else if (hasLeft) return 0x13;
					else if (hasRight) return 0x12;
					else return 0x03;
				} else {
					if (hasLeft && hasRight) return 0x17;
					else if (hasLeft) return 0x0B;
					else if (hasRight) return 0x0A;
					else return 0x03;
				}
			default: return meta;
		}
	}
	update() {
		if (this.item) {
			if (this.item.pos.tileX != this.pos.tileX || this.item.pos.tileY != this.pos.tileY) {
				//Item moved outside of this building, transfer it
				if (this.buildAt(this.outputSide)?.acceptItem(this.item, this.outputSide.opposite))
					this.item = null;
				return;
			}
			switch (this.meta) {
				//todo clean...
				case 0x00:
					if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x01:
					if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x02:
					if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x03:
					if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x04:
					if (this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles > 0.5)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x05:
					if (this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles < 0.5)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x06:
					if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY += this.block.speed;
					else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x07:
					if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY += this.block.speed;
					else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x08:
					if (this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x09:
					if (this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x0A:
					if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x0B:
					if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x0C:
					if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x0D:
					if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x0E:
					if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.block.speed;
					else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x0F:
					if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.block.speed;
					else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x10:
					if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x11:
					if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x12:
					if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY -= this.block.speed;
					else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x13:
					if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY -= this.block.speed;
					else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x14:
					if (this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
					break;
				case 0x15:
					if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY += this.block.speed;
					else if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
					break;
				case 0x16:
					if (this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
					break;
				case 0x17:
					if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					else if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
					break;
				case 0x18:
					if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
					break;
				case 0x19:
					if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.block.speed;
					else if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
					break;
				case 0x1A:
					if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
					break;
				case 0x1B:
					if (this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY -= this.block.speed;
					else if (this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
					break;
			}
		}
	}
}
export class OverlayBuild extends Building {
	static isOverlay = true;
	buildingUnder() {
		return this.level.buildingAtPos(this.pos);
	}
}
export class Extractor extends OverlayBuild {
	static displaysItem = true;
	static speed = 1;
	static outputsItems = true;
	block!: typeof Extractor;
	outputOffset: PosT = this.block.getOutputTile(this.meta);
	static textureSize(meta: BuildingMeta): TextureInfo {
		switch (meta) {
			case 0: return [[2, 1], [0, 0]];
			case 1: return [[1, 2], [0, 0]];
			case 2: return [[2, 1], [-1, 0]];
			case 3: return [[1, 2], [0, -1]];
			case 4: return [[3, 1], [0, 0]];
			case 5: return [[1, 3], [0, 0]];
			case 6: return [[3, 1], [-2, 0]];
			case 7: return [[1, 3], [0, -2]];
			case 8: return [[4, 1], [0, 0]];
			case 9: return [[1, 4], [0, 0]];
			case 10: return [[4, 1], [-3, 0]];
			case 11: return [[1, 4], [0, -3]];
			default: return [[1, 1], [0, 0]];
		}
	}
	static getID(type: RawBuildingID, direction: Direction, modifier: number): BuildingIDWithMeta {
		return [type, (modifier * 4) + direction.num] as BuildingIDWithMeta;
	}
	static getOutputTile(meta: BuildingMeta): PosT {
		switch (meta) {
			case 0: return [1, 0];
			case 1: return [0, 1];
			case 2: return [-1, 0];
			case 3: return [0, -1];
			case 4: return [2, 0];
			case 5: return [0, 2];
			case 6: return [-2, 0];
			case 7: return [0, -2];
			case 8: return [3, 0];
			case 9: return [0, 3];
			case 10: return [-3, 0];
			case 11: return [0, -3];
			default: crash(`Invalid meta ${meta}`);
		}
	}

	grabItemFromTile(filter: (item: Item) => boolean = () => true) {
		if (this.buildingUnder() instanceof Building &&
			this.buildingUnder()!.hasItem() &&
			filter(this.buildingUnder()!.hasItem()!)) {
			this.item = this.buildingUnder()!.removeItem()!;
			switch (this.meta) {
				case 0: case 4: case 8:
					this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
					break;
				case 1: case 5: case 9:
					this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
					break;
				case 2: case 6: case 10:
					this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
					break;
				case 3: case 7: case 11:
					this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
					break;
			}
		}
	}

	dropItem() {
		if (this.item) {
			if (this.buildAtOffset(this.outputOffset)?.acceptItem(this.item, null)) {
				this.item = null;
			}
		} else {
			console.error(this);
			crash(`no item to drop; extractor at ${this.pos.tileX} ${this.pos.tileY}`);
		}
	}

	update() {
		if (this.item) {
			switch (this.meta) {
				case 0x00:
					if (this.item.pos.tileXExact >= this.pos.tileX + 1.5) return this.dropItem();
					else this.item.pos.pixelX += this.block.speed;
					break;
				case 0x01:
					if (this.item.pos.tileYExact >= this.pos.tileY + 1.5) return this.dropItem();
					else this.item.pos.pixelY += this.block.speed;
					break;
				case 0x02:
					if (this.item.pos.tileXExact <= this.pos.tileX - 0.5) return this.dropItem();
					else this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x03:
					if (this.item.pos.tileYExact <= this.pos.tileY - 0.5) return this.dropItem();
					else this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x04:
					if (this.item.pos.tileXExact >= this.pos.tileX + 2.5) return this.dropItem();
					else this.item.pos.pixelX += this.block.speed;
					break;
				case 0x05:
					if (this.item.pos.tileYExact >= this.pos.tileY + 2.5) return this.dropItem();
					else this.item.pos.pixelY += this.block.speed;
					break;
				case 0x06:
					if (this.item.pos.tileXExact <= this.pos.tileX - 1.5) return this.dropItem();
					else this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x07:
					if (this.item.pos.tileYExact <= this.pos.tileY - 1.5) return this.dropItem();
					else this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x08:
					if (this.item.pos.tileXExact >= this.pos.tileX + 3.5) return this.dropItem();
					else this.item.pos.pixelX += this.block.speed;
					break;
				case 0x09:
					if (this.item.pos.tileYExact >= this.pos.tileY + 3.5) return this.dropItem();
					else this.item.pos.pixelY += this.block.speed;
					break;
				case 0x0A:
					if (this.item.pos.tileXExact <= this.pos.tileX - 2.5) return this.dropItem();
					else this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x0B:
					if (this.item.pos.tileYExact <= this.pos.tileY - 2.5) return this.dropItem();
					else this.item.pos.pixelY -= this.block.speed;
					break;
			}
		} else {
			this.grabItemFromTile();
		}
	}

	acceptsItemFromSide(side: Direction) { return false; }
	acceptItem(item: Item) { return false; }
}
export class StorageBuilding extends Building {
	inventory: Item[] = [];
	static capacity = 64;
	static acceptsItems = true;
	block!: typeof StorageBuilding;
	hasItem() {
		if (this.inventory.length != 0) return this.inventory[0]!;
		return super.hasItem();
	}
	removeItem() {
		if (this.inventory?.length > 0) {
			return this.inventory.pop()!;
		}
		return super.removeItem();
	}
	acceptItem(item: Item) {
		if (this.inventory.length < this.block.capacity) {
			this.inventory.push(item);
			return true;
		} else return false;
	}
	tooltipProperties() {
		return {
			...super.tooltipProperties(),
			Storage: `${this.inventory.length} / ${this.block.capacity}`
		};
	}
	export(): BuildingData {
		const inv: ItemData[] = [];
		if (this.inventory) {
			for (const item of this.inventory) {
				const data = item.export();
				if (data) inv.push(data);
			}
		}
		return {
			x: this.pos.tileX,
			y: this.pos.tileY,
			id: this.block.id,
			meta: this.meta,
			item: null,
			inv: inv
		};
	}
	static read(buildingData: BuildingData, level: Level) {
		const build = super.read(buildingData, level) as StorageBuilding;
		if (buildingData.inv) {
			for (const itemData of buildingData.inv) {
				build.inventory.push(Item.read(itemData));
			}
		}
		return build;
	}
}
export class ResourceAcceptor extends Building {
	static immutable = true;
	static acceptsItems = true;
	static textureSize(meta: number): TextureInfo {
		return [[4, 4], [0, 0]];
	}
	acceptItem(item: Item) {
		this.level.addResources([[item.id, 1]]);
		if (item.id == "base_stone") {
			this.level.timeSinceStoneRanOut = Date.now();
		}
		return true;
	}
}
export class MultiBlockSecondary extends Building {
	/**Assigned in buildBuilding */
	controller: MultiBlockController | null = null;
	static outputsItems = true;
	static acceptsItems = true;
	static acceptsFluids = true;
	static outputsFluids = true;
	static hidden = true;
	acceptItem(item: Item): boolean {
		return this.controller?.acceptItem(item) ?? false;
	}
	break(isRecursive = false) {
		if (this.controller && !isRecursive) this.controller.break(); //the controller will call this method again with isRecursive = true
		else {
			this.controller = null;
			super.break();
		}
	}
	display(currentFrame: CurrentFrame) {
		//Do nothing, the controller is responsible for displaying
	}
	override effectiveID(){
		return this.controller?.block.id ?? this.block.id;
	}
	update() {
		if (!(this.controller instanceof MultiBlockController)) {
			this.break();
		}
	}
	acceptFluid(stack: FluidStack, maxThroughput: number, from: Building): number | null {
		return this.controller?.acceptFluid(stack, maxThroughput, from) ?? null;
	}
	pressureIn(): number {
		return this.controller?.pressureIn() ?? 1;
	}
	pressureOut(): number {
		return this.controller?.pressureOut() ?? 0;
	}
}
export class MultiBlockController extends BuildingWithRecipe {
	block!: typeof MultiBlockController;
	secondaries: MultiBlockSecondary[] = [];
	static multiblockSize: PosT = [2, 2];
	static secondary: typeof MultiBlockSecondary;
	static outputPositions: Array<[x: number, y: number, direction: Direction]> = [];
	static {
		for (let y = 0; y < this.multiblockSize[0]; y++) {
			this.outputPositions.push([this.multiblockSize[0] - 1, y, Direction.right]);
		}
		for (let x = this.multiblockSize[0] - 1; x >= 0; x--) {
			this.outputPositions.push([x, this.multiblockSize[1] - 1, Direction.down]);
		}
		for (let y = this.multiblockSize[0] - 1; y >= 0; y--) {
			this.outputPositions.push([0, y, Direction.left]);
		}
		for (let x = 0; x < this.multiblockSize[0]; x++) {
			this.outputPositions.push([x, 0, Direction.up]);
		}
	}
	static textureSize(meta: number): TextureInfo {
		return [this.multiblockSize, [0, 0]];
	}
	/** Does not return 0,0 */
	static getOffsetsForSize(width: number, height: number) {
		const offsets: PosT[] = [];
		for (let i = 0; i < width; i++) {
			for (let j = 0; j < height; j++) {
				if (i == 0 && j == 0) continue;
				offsets.push([i, j]);
			}
		}
		return offsets;
	}
	centeredPos() {
		return Pos.fromTileCoords(
			this.pos.tileX + this.block.multiblockSize[0] / 2,
			this.pos.tileY + this.block.multiblockSize[1] / 2, false
		);
	}
	break() {
		this.secondaries.forEach(secondary => secondary.break(true));
		this.secondaries = [];
		super.break();
	}
	update(currentFrame: CurrentFrame) {
		if (this.secondaries.length != this.block.multiblockSize[0] * this.block.multiblockSize[1] - 1) {
			if (!this.resetSecondaries()) this.break();
		}
		super.update(currentFrame);
	}
	/**Attempts to reconnects to secondaries, returning if the attempt succeeded. */
	resetSecondaries(): boolean {
		const possibleSecondaries = MultiBlockController.getOffsetsForSize(...this.block.multiblockSize)
			.map(([xOffset, yOffset]) => this.level.buildingAtTile(this.pos.tileX + xOffset, this.pos.tileY + yOffset)
			);
		for (const possibleSecondary of possibleSecondaries) {
			if (possibleSecondary instanceof MultiBlockSecondary &&
				(possibleSecondary.controller == this || possibleSecondary.controller == undefined)) {
				possibleSecondary.controller = this;
				this.secondaries.push(possibleSecondary);
			} else {
				return false;
			}
		}
		return true;
	}
	spawnItem(id: ItemID): boolean {
		if (id == "base_stator") objectives.get("base_produceStators").satisfy();
		else if (id == "base_rotor") objectives.get("base_produceRotors").satisfy();
		else if (id == "base_motor") objectives.get("base_produceMotors").satisfy();
		if (super.spawnItem(id)) {
			return true;
		}
		for (const secondary of this.secondaries) {
			if (secondary.spawnItem(id)) {
				return true;
			}
		}
		return false;
	}
	dumpFluidAt(fluid: FluidStack, tileX: number, tileY: number, direction: Direction) {
		const build = this.level.buildingAtTile(tileX + direction.vec[0], tileY + direction.vec[1]);
		if (build && this.block.canOutputFluidTo(build) &&
			this.outputsFluidToSide(direction) && build.acceptsFluidFromSide(direction.opposite)) {
			this.fluidThroughput = build.acceptFluid(fluid, this.fluidOutputSpeed(build), this)!;
			return;
		}
	}
	dumpFluid() {
		this.fluidThroughput = 0;
		const fluid = this.fluidOut ?? this.fluid;
		if (fluid?.[0] == null || fluid[1] == 0) return;
		const numDirections = 2 * (this.block.multiblockSize[0] + this.block.multiblockSize[1]);
		for (let i = 0; i < numDirections; i++) {
			this.dumpFluidAt(fluid, ...this.block.outputPositions[this.cFluidOut]!);
			if (++this.cFluidOut >= numDirections) this.cFluidOut = 0;
		}
	}
}

export class Tank extends Building {
	static fluidCapacity = 600;
	static fluidOutputSpeed = 10;
	static fluidInputSpeed = 10;
	/** Minimum input pressure, even if the tank is empty the input pressure will be at least this much. */
	static pressureInMin = 0;
	/** pressure in uses this fraction of the tank's capacity for scaling. If the tank's fill level is below this amount, the output pressure is `pressureInMin`. */
	static pressureInMaxFill = 0.8;
	/** Minimum output pressure, even if the tank is empty the output pressure will be at least this much. */
	static pressureOutMin = 0.05;
	/** pressure out uses this fraction of the tank's capacity for scaling. If the tank's fill level is above this amount, the output pressure is max. */
	static pressureOutMaxFill = 0.2;
	static acceptsFluids = true;
	static outputsFluids = true;
	block!: typeof Tank;
	pressureOut() {
		//we could also use fluidExtraPressure = 1 to force max pressure, but that would allow even empty tanks to do max pressure
		const fillLevel = this.fluid![1] / this.block.fluidCapacity;
		//scale pressure to 20% of the tank's capacity, so if it is more than 20% full the tank will output at full speed
		//maybe use a max pressure of 2 to allow full speed output even to full pipes?
		return constrain(linear_map(fillLevel, 0, this.block.pressureOutMaxFill, 0, 1), this.block.pressureOutMin, 1);
	}
	pressureIn() {
		const fillLevel = this.fluid![1] / this.block.fluidCapacity;
		//scale pressure to 20% of the tank's capacity, so if it is more than 20% full the tank will output at full speed
		return constrain(linear_map(fillLevel, this.block.pressureInMaxFill, 1, 0, 1), this.block.pressureInMin, 1);
	}
	tooltipProperties() {
		return {
			...super.tooltipProperties(),
			Storage: `${round(this.fluid![1], 3)} / ${this.block.fluidCapacity}`,
			Fluid: this.fluid![0] ? bundle.get(`fluid.${this.fluid![0].id}.name`, "") : "Empty"
		};
	}
	static drawer: any = BuildingWithRecipe.drawFluid([0, 0], 0.8, 0.8);
}
export class Pipe extends Building {
	static acceptsFluidsFromAll = true;
	static fluidCapacity = 5;
	static outputsFluids = true;
	static acceptsFluids = true;
	static fluidExtraPressure = 0.05;
	block!: typeof Pipe;
	outputSide: Direction = Pipe.outputSide(this.meta);
	static getID(type: RawBuildingID, direction: Direction, modifier: number): BuildingIDWithMeta {
		return [type, direction.num] as BuildingIDWithMeta;
	}
	static outputSide(meta: BuildingMeta): Direction {
		switch (meta) {
			case 0: return Direction.right;
			case 1: return Direction.down;
			case 2: return Direction.left;
			case 3: return Direction.up;
			default: crash(`Invalid meta ${meta}`);
		}
	}
	static canOutputFluidTo(building: Building) {
		return true;
	}
	acceptsFluidFromSide(side: Direction) {
		return side != this.outputSide;
	}
	outputsFluidToSide(side: Direction) {
		return side === this.outputSide;
	}
	tooltipProperties() {
		return {
			...super.tooltipProperties(),
			"Fill level": `${round(this.fluid![1], 3)} / ${this.block.fluidCapacity}`,
			Fluid: this.fluid![0] ? bundle.get(`fluid.${this.fluid![0].id}.name`, "") : "Empty",
			Throughput: round(this.fluidThroughput, 5).toString()
		};
	}
	static drawer: any = function (build: Pipe, currentFrame: CurrentFrame) {
		if (!build.fluid![0]) return;
		const fillFract = build.fluid![1] / build.block.fluidCapacity;
		Gfx.layer("buildingsUnder");
		Gfx.fillColor(build.fluid![0].color);
		Gfx.alpha(fillFract);
		Gfx.tRect(...build.pos.tileC, 0.65 + +build.outputSide.horizontal * 0.35, 0.65 + +build.outputSide.vertical * 0.35, RectMode.CENTER);
		Gfx.alpha(1);
		if (settings.showExtraPipeInfo) {
			const throughputFract = build.fluidThroughput / build.block.fluidOutputSpeed;
			if (build.outputSide.horizontal)
				Gfx.tRect(build.pos.tileX, build.pos.tileY + 0.9, fillFract, 0.1, RectMode.CORNER);

			else
				Gfx.tRect(build.pos.tileX, build.pos.tileY + 1 - fillFract, 0.1, fillFract, RectMode.CORNER);
			Gfx.fillColor("yellow");
			if (build.outputSide.horizontal)
				Gfx.tRect(build.pos.tileX, build.pos.tileY, throughputFract, 0.1, RectMode.CORNER);

			else
				Gfx.tRect(build.pos.tileX + 0.9, build.pos.tileY + 1 - throughputFract, 0.1, throughputFract, RectMode.CORNER);
		}
	};
}
export class Pump extends Building {
	static productionSpeed = 2;
	static fluidOutputSpeed = 10;
	static fluidCapacity = 100;
	static outputsFluids = true;
	static outputFluid: Fluid;
	block!: typeof Pump;
	static canBuildAt(tileX: number, tileY: number, level: Level): boolean {
		return level.tileAtByTile(tileX, tileY) == "base_water";
	}
	update(currentFrame: CurrentFrame) {
		Fluid.fill(this.fluid!, this.block.outputFluid, this.block.productionSpeed);
		super.update(currentFrame);
	}
	static drawer: any = BuildingWithRecipe.drawFluid([0, 0], 0.4, 0.4);
}
export class PowerSource extends Building {
	block!: typeof PowerSource;
	static production = 100;
	static producesPower = true;
	getMaxPowerProduction(): number {
		return this.block.production;
	}
	static drawer: any = function (build: PowerSource, currentFrame: CurrentFrame) {
		Gfx.layer("overlay");
		const flashRate = consts.ups / build.powerLoad;
		const sin = Math.sin(Mathf.TWO_PI * (currentFrame.frame % flashRate / flashRate));
		Gfx.fillColor("yellow");
		Gfx.tEllipse(...build.pos.tileC, 0.3 + 0.2 * sin, 0.3 + 0.2 * sin);
	};
}
export class ArcTower extends Building {
	block!: typeof ArcTower;
	arcAngle = 0;
	arcAVel = 0;
	arcAAccel = 0;
	static consumesPower = true;
	static maxArcAAccel = 0.05;
	static maxArcAVel = 0.15;
	static consumption = 100;
	static primaryRadius = 4;
	static secondaryRadius = 1.5;
	static primaryRadiusRange = [-1, 1] as const;
	static secondaryRadiusRange = [-0.25, 0.5] as const;
	static color = "white";
	getRequestedPower(): number {
		return this.block.consumption;
	}
	static drawer: any = function (build: ArcTower, currentFrame: CurrentFrame) {
		if (currentFrame.frame % 10 == 0)
			build.arcAAccel = Rand.num(-build.block.maxArcAAccel, build.block.maxArcAAccel);
		//update accel 6 times per second
		build.arcAVel = constrain(build.arcAVel + build.arcAAccel, -build.block.maxArcAVel, build.block.maxArcAVel);
		build.arcAngle = (build.arcAngle + build.arcAVel) % Mathf.TWO_PI;
		const rad = (build.block.primaryRadius + Rand.num(...build.block.primaryRadiusRange)) * build.powerSatisfaction;
		const arcPos = [rad * Math.cos(build.arcAngle) + build.pos.tileXCentered, rad * Math.sin(build.arcAngle) + build.pos.tileYCentered] as const;
		const srad1 = (build.block.secondaryRadius + Rand.num(...build.block.secondaryRadiusRange)) * build.powerSatisfaction;
		const srad2 = (build.block.secondaryRadius + Rand.num(...build.block.secondaryRadiusRange)) * build.powerSatisfaction;
		const srad1Angle = build.arcAngle + Rand.num(-(Math.PI * 2 / 3), Math.PI * 2 / 3);
		const srad2Angle = build.arcAngle + Rand.num(-(Math.PI * 2 / 3), Math.PI * 2 / 3);
		const sArc1Pos = [arcPos[0] + srad1 * Math.cos(srad1Angle), arcPos[1] + srad1 * Math.sin(srad1Angle)] as const;
		const sArc2Pos = [arcPos[0] + srad2 * Math.cos(srad2Angle), arcPos[1] + srad2 * Math.sin(srad2Angle)] as const;

		Gfx.layer("overlay");
		Gfx.strokeColor(build.block.color);
		Gfx.lineWidth(5);
		Gfx.alpha(0.5);
		Gfx.tLine(...build.pos.tileC, ...arcPos);
		Gfx.tLine(...arcPos, ...sArc1Pos);
		Gfx.tLine(...arcPos, ...sArc2Pos);
		Gfx.lineWidth(3);
		Gfx.alpha(1);
		Gfx.tLine(...build.pos.tileC, ...arcPos);
		Gfx.tLine(...arcPos, ...sArc1Pos);
		Gfx.tLine(...arcPos, ...sArc2Pos);
	};
}

