/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains content, such as items, fluids, buildings, and recipes. */

import type { Recipes, ItemID, FluidID, RawBuildingID } from "../types.js";
import { Gfx, RectMode, Fx } from "../ui/graphics.js";
import { Camera } from "../ui/camera.js";
import { linear_map } from "../util/funcs.js";
import { PosT, add, mul } from "../util/geom.js";
import { Mathf } from "../vars.js";
import type { Building } from "../world/building.js";
import { Conveyor, Miner, TrashCan, BuildingWithRecipe, Extractor, StorageBuilding, ResourceAcceptor, MultiBlockSecondary, MultiBlockController, ArcTower, PowerSource, Pipe, Pump, Tank } from "../world/building-types.js";
import { ContentRegistryI, Fluid, ContentRegistryC } from "./registry.js";


export const recipes = {
	base_mining: {
		recipes: [
			{
				outputs: [["base_coal", 1]],
				duration: 60,
				tile: "base_ore_coal"
			},{
				outputs: [["base_ironOre", 1]],
				duration: 60,
				tile: "base_ore_iron"
			},{
				outputs: [["base_copperOre", 1]],
				duration: 60,
				tile: "base_ore_copper"
			},{
				outputs: [["base_stone", 1]],
				duration: 60,
				tile: "base_stone"
			},{
				outputs: [["base_sand", 1]],
				duration: 60,
				tile: "base_sand"
			},
		]
	},
	base_smelting: {
		recipes: [
			{
				inputs: [["base_ironOre", 1]],
				outputs: [["base_ironIngot", 1]],
				duration: 60
			},{
				inputs: [["base_copperOre", 1]],
				outputs: [["base_copperIngot", 1]],
				duration: 60
			},{
				inputs: [["base_stone", 2]],
				outputs: [["base_stoneBrick", 1]],
				duration: 60
			},{
				inputs: [["base_sand", 2]],
				outputs: [["base_siliconCrude", 1]],
				duration: 180
			}
		]
	},
	base_alloying: {
		recipes: [
			{
				inputs: [["base_coal", 1], ["base_ironIngot", 1]],
				outputs: [["base_steelIngot", 1]],
				duration: 240
			}
		]
	},
	base_wiremilling: {
		recipes: [
			{
				inputs: [["base_copperIngot", 1]],
				outputs: [["base_copperWire", 1]],
				powerConsumption: 10,
				duration: 120
			}
		]
	},
	base_compressing: {
		recipes: [
			{
				inputs: [["base_ironIngot", 1]],
				outputs: [["base_ironPlate", 1]],
				duration: 60,
				powerConsumption: 10,
			},{
				inputs: [["base_steelIngot", 1]],
				outputs: [["base_steelPlate", 1]],
				duration: 60,
				powerConsumption: 15,
			}
		]
	},
	base_lathing: {
		recipes: [
			{
				inputs: [["base_ironIngot", 1]],
				outputs: [["base_ironRod", 1]],
				duration: 60,
				powerConsumption: 10,
			},{
				inputs: [["base_steelIngot", 1]],
				outputs: [["base_steelRod", 1]],
				duration: 60,
				powerConsumption: 15,
			}
		]
	},
	base_assembling: {
		recipes: [
			{
				inputs: [["base_steelRod", 1], ["base_copperWire", 1]],
				outputs: [["base_rotor", 1]],
				duration: 120,
				powerConsumption: 30,
			},{
				inputs: [["base_ironPlate", 1], ["base_copperWire", 1]],
				outputs: [["base_stator", 1]],
				duration: 120,
				powerConsumption: 30,
			},{
				inputs: [["base_stator", 1], ["base_rotor", 1]],
				outputs: [["base_motor", 1]],
				duration: 30,
				powerConsumption: 10,
			}
		]
	},
	base_boiling: {
		recipes: [
			{
				inputs: [["base_coal", 1]],
				fluidInputs: [["base_water", 5]],
				fluidOutputs: [["base_steam", 10]],
				duration: 30
			}
		]
	},
	base_stirling_generating: {
		recipes: [
			{
				inputs: [["base_coal", 1]],
				duration: 120,
				powerProduction: 10
			}
		]
	},
	base_steam_generating: {
		recipes: [
			{
				fluidInputs: [["base_steam", 15]],
				duration: 30,
				powerProduction: 150
			}
		]
	},
} satisfies Recipes;
export const ItemIDs:ItemID[] = [
	"base_null",
	"base_coalOre",
	"base_coal",
	"base_sand",
	"base_ironOre",
	"base_ironIngot",
	"base_stone",
	"base_stoneBrick",
	"base_ironPlate",
	"base_ironRod",
	"base_copperOre",
	"base_copperIngot",
	"base_copperWire",
	"base_steelIngot",
	"base_steelPlate",
	"base_steelRod",
	"base_stator",
	"base_rotor",
	"base_motor",
];
export const FluidIDs:FluidID[] = [
	"base_water",
	"base_steam",
];

export const Fluids = new ContentRegistryI<FluidID, Fluid>();
Fluids.register(new Fluid("base_water", "blue"));
Fluids.register(new Fluid("base_steam", "white"));

export const Buildings = new ContentRegistryC<RawBuildingID, typeof Building>();
Buildings.register("base_conveyor", Conveyor, {
	buildCost: m => [["base_stone", m >= 12 ? 2 : 1]],
});
Buildings.register("base_miner", Miner, {
	buildCost: () => [["base_stone", 10]],
});
Buildings.register("base_trash_can", TrashCan, {
	buildCost: () => [["base_stone", 12]],
});
Buildings.register("base_furnace", BuildingWithRecipe, {
	recipeType: recipes.base_smelting,
	buildCost: () => [["base_stone", 15]],
	drawer: BuildingWithRecipe.makeDrawer<BuildingWithRecipe>((build, e) => {
		Gfx.fillColor(...Gfx.lerp([255, 127, 39], [255, 95, 29], e.sin()));
		Gfx.tRect(...build.centeredPos().tile, 0.5, 0.5, RectMode.CENTER);
	}, BuildingWithRecipe.progressDrawer()),
	craftEffect: [Fx.smoke, "#555"]
});
Buildings.register("base_extractor", Extractor, {
	buildCost: m => {
		const mul = Math.floor(m / 4) + 1;
		return [["base_stone", 2 * mul], ["base_ironIngot", 2 * mul]];
	},
});
Buildings.register("base_chest", StorageBuilding, {
	buildCost: () => [["base_ironIngot", 15], ["base_stoneBrick", 10]],
	capacity: 64
});
Buildings.register("base_resource_acceptor", ResourceAcceptor, {
	hidden: true,
});
Buildings.register("base_alloy_smelter", BuildingWithRecipe, {
	buildCost: () => [["base_stoneBrick", 30], ["base_ironIngot", 15]],
	recipeType: recipes.base_alloying, drawer: BuildingWithRecipe.progressDrawer(), craftEffect: [Fx.smoke, "#222"]
});
Buildings.register("base_stirling_generator", BuildingWithRecipe, {
	buildCost: () => [["base_stoneBrick", 20], ["base_ironIngot", 35], ["base_copperIngot", 15]],
	recipeType: recipes.base_stirling_generating,
	producesPower: true,
	outputsItems: false,
	drawer: BuildingWithRecipe.drawLayer<BuildingWithRecipe>(
		"building/base_boiler_fire", 1, 1,
		b => b.timer >= 0 ? linear_map(b.timer, b.recipe?.duration ?? -1, 0, 1, 0.7) : 0
	)
});
Buildings.register("base_compressor", BuildingWithRecipe, {
	buildCost: () => [["base_stoneBrick", 25], ["base_ironIngot", 35], ["base_copperIngot", 10]],
	consumesPower: true,
	recipeType: recipes.base_compressing, drawer: BuildingWithRecipe.progressDrawer()
});
Buildings.register("base_wiremill", BuildingWithRecipe, {
	buildCost: () => [["base_stoneBrick", 20], ["base_ironIngot", 35], ["base_copperIngot", 15]],
	consumesPower: true,
	recipeType: recipes.base_wiremilling, drawer: BuildingWithRecipe.progressDrawer()
});
Buildings.register("base_lathe", BuildingWithRecipe, {
	buildCost: () => [["base_stoneBrick", 20], ["base_ironIngot", 35], ["base_copperIngot", 10], ["base_steelIngot", 10]],
	consumesPower: true,
	recipeType: recipes.base_lathing, drawer: BuildingWithRecipe.progressDrawer(), runEffect: [Fx.spark, "#FFC", 20, 0.8]
});
Buildings.register("base_multiblock_secondary", MultiBlockSecondary, {
	hidden: true,
});
Buildings.register("base_assembler", MultiBlockController, {
	buildCost: () => [["base_stoneBrick", 50], ["base_ironIngot", 100], ["base_copperIngot", 25], ["base_ironPlate", 25], ["base_ironRod", 10], ["base_copperWire", 10]],
	recipeType: recipes.base_assembling,
	consumesPower: true,
	multiblockSize: [2, 2],
	drawer: BuildingWithRecipe.progressDrawer(),
	secondary: Buildings.get("base_multiblock_secondary") as typeof MultiBlockSecondary
});
Buildings.register("base_arc_tower", ArcTower, {
	hidden: true,
});
Buildings.register("base_power_source", PowerSource, {
	hidden: true,
});
Buildings.register("base_pipe", Pipe, {
	buildCost: () => [["base_ironPlate", 1]],
});
Buildings.register("base_pump", Pump, {
	buildCost: () => [["base_ironPlate", 20], ["base_ironIngot", 15], ["base_stoneBrick", 25]],
	outputFluid: Fluids.get("base_water")
});
Buildings.register("base_tank", Tank, {
	buildCost: () => [["base_ironPlate", 15], ["base_stoneBrick", 15]]
});
Buildings.register("base_boiler", BuildingWithRecipe, {
	buildCost: () => [["base_ironPlate", 20], ["base_ironIngot", 30], ["base_stoneBrick", 50]],
	recipeType: recipes.base_boiling,
	fluidCapacity: 10,
	acceptsFluids: true,
	outputsFluids: true,
	outputsItems: false,
	fluidExtraPressure: 1,
	runEffect: [Fx.smoke, "#222", 30, 1],
	drawer: BuildingWithRecipe.combineDrawers(
		BuildingWithRecipe.drawFluid([0, -0.2], 0.8, 0.4),
		BuildingWithRecipe.drawLayer<BuildingWithRecipe>(
			"building/base_boiler_fire", 1, 1,
			b => b.timer >= 0 ? linear_map(b.timer, b.recipe?.duration ?? -1, 0, 1, 0.7) : 0
		)
	)
});
Buildings.register("base_steam_generator", MultiBlockController, {
	buildCost: () => [["base_ironPlate", 45], ["base_ironIngot", 90], ["base_stoneBrick", 55], ["base_copperIngot", 10], ["base_copperWire", 40]],
	recipeType: recipes.base_steam_generating,
	secondary: Buildings.get("base_multiblock_secondary") as typeof MultiBlockSecondary,
	multiblockSize: [2, 2],
	fluidCapacity: 30,
	acceptsFluids: true,
	outputsFluids: false,
	acceptsItems: false,
	outputsItems: false,
	producesPower: true,
	runEffect: [Fx.smoke, "#FFF", 30, 1],
	drawer: BuildingWithRecipe.makeDrawer((build, e) => {
		//theta is build.num1
		const numLines = 6;
		const vel = build.efficiency * 0.15;
		const spokeRadius = 0.8;
		const spokeWidth = 1;

		const pos = build.centeredPos().tile;
		build.num1 = (build.num1 + vel) % Mathf.TWO_PI;
		Gfx.lineWidth(Camera.zoomLevel * spokeWidth);
		Gfx.strokeColor("#DDD");
		for(let i = 0; i < numLines; i ++){
			const theta = (i / numLines) * Math.PI + build.num1;
			const offset:PosT = [spokeRadius * Math.cos(theta), spokeRadius * Math.sin(theta)];
			Gfx.tLine(...add(pos, offset), ...add(pos, mul(offset, -1)));
		}
	})
});
