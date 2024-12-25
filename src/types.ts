/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains game-specific types. */

import type { ItemStack } from "./content/registry.js";
import type { Keybind } from "./ui/input.js";
import { NonEmptyArray } from "./util/types.js";


export type TileID = 
"base_grass" |  //Grass
"base_stone" |  //stone
"base_water" |	//water
"base_sand" |	//sand
"base_ore_iron" |  //iron ore
"base_ore_coal" |  //coal ore
"base_ore_copper" |	//copper ore
"base_null" ;  //Unset

export type LegacyBuildingID = 
//0x0000 is invalid
"0x0001" |	//Conveyor Belt Facing Right
"0x0101" |	//Conveyor Belt Facing Down
"0x0201" |	//Conveyor Belt Facing Left
"0x0301" |	//Conveyor Belt Facing Up
"0x0401" |	//Conveyor Belt Facing Down->Right
"0x0501" |	//Conveyor Belt Facing Up->Right
"0x0601" |	//Conveyor Belt Facing Right->Down
"0x0701" |	//Conveyor Belt Facing Left->Down
"0x0801" |	//Conveyor Belt Facing Down->Left
"0x0901" |	//Conveyor Belt Facing Up->Left
"0x0A01" |	//Conveyor Belt Facing Right->Up
"0x0B01" |	//Conveyor Belt Facing Left->Up
"0x0C01" |	//Conveyor Belt Facing Left+Down->Right
"0x0D01" |	//Conveyor Belt Facing Left+Up->Right
"0x0E01" |	//Conveyor Belt Facing Up+Right->Down
"0x0F01" |	//Conveyor Belt Facing Up+Left->Down
"0x1001" |	//Conveyor Belt Facing Right+Down->Left
"0x1101" |	//Conveyor Belt Facing Right+Up->Left
"0x1201" |	//Conveyor Belt Facing Down+Right->Up
"0x1301" |	//Conveyor Belt Facing Down+Left->Up
"0x1401" |	//Conveyor Belt Facing Down+up->Right
"0x1501" |	//Conveyor Belt Facing Right+Left->Down
"0x1601" |	//Conveyor Belt Facing Down+Up->Left
"0x1701" |	//Conveyor Belt Facing Right+Left->Up
"0x1801" |	//Conveyor Belt Facing Up+Left+Down->Right
"0x1901" |	//Conveyor Belt Facing Left+Up+Right->Down
"0x1A01" |	//Conveyor Belt Facing Down+Right+Up->Left
"0x1B01" |	//Conveyor Belt Facing Right+Down+Left->Up
"0x0002" |	//Miner
"0x0003" |	//Trash Can
"0x0004" |	//Furnace
"0x0005" |	//Extractor Facing Right
"0x0105" |	//Extractor Facing Down
"0x0205" |	//Extractor Facing Left
"0x0305" |	//Extractor Facing Up
"0x0405" |	//Long Extractor Facing Right
"0x0505" |	//Long Extractor Facing Down
"0x0605" |	//Long Extractor Facing Left
"0x0705" |	//Long Extractor Facing Up
"0x0805" |	//Longer Extractor Facing Right
"0x0905" |	//Longer Extractor Facing Down
"0x0A05" |	//Longer Extractor Facing Left
"0x0B05" |	//Longer Extractor Facing Up
"0x0006" |	//Chest
"0x0007" |	//Alloy Smelter
"0x0008" |	//Resource Acceptor
"0x0009" |	//Wiremill
"0x000A" |	//Compressor
"0x000B" |	//Lathe
"0x0010" |	//Multiblock secondary
"0x0011" |	//Assembler
"0xFFFF" ;	//Null

export type LegacyRawBuildingID = "0x01" | "0x02" | "0x03" | "0x04" | "0x05" | "0x06" | "0x07" | "0x08" | "0x09" | "0x0A" | "0x0B" | "0x10" | "0x11" | "0xFF";
export type RawBuildingID = "base_conveyor" | "base_miner" | "base_trash_can" | "base_furnace" | "base_extractor" | "base_chest" | "base_alloy_smelter" | "base_resource_acceptor" | "base_stirling_generator" | "base_wiremill" | "base_compressor" | "base_lathe" | "base_multiblock_secondary" | "base_assembler" | "base_null" | "base_arc_tower" | "base_power_source" | "base_pipe" | "base_pump" | "base_tank" | "base_boiler" | "base_steam_generator";
export type BuildingIDWithMeta = [buildingID:RawBuildingID, meta:BuildingMeta];
export type BuildingMeta = number;
export type StringBuildingID = `${RawBuildingID}:${BuildingMeta}`;

export type ItemID =
| "base_null"
| "base_coalOre"
| "base_coal" //fuel
| "base_sand"
| "base_ironOre"
| "base_ironIngot" //dog bowl
| "base_stone"
| "base_stoneBrick"
| "base_ironPlate"
| "base_ironRod"
| "base_copperOre"
| "base_copperIngot" //molten
| "base_copperWire"
| "base_steelIngot" //cast iron
| "base_steelPlate"
| "base_steelRod"
| "base_stator"
| "base_rotor"
| "base_motor"
| "base_siliconCrude"
;
export type FluidID = "base_water" | "base_steam";

export interface Recipe {
	inputs?: NonEmptyArray<ItemStack>;
	fluidInputs?: [fluid:FluidID, totalAmount:number][];
	outputs?: NonEmptyArray<ItemStack>;
	fluidOutputs?: [fluid:FluidID, totalAmount:number][];
	duration: number;
	tile?: TileID;
	powerConsumption?: number;
	powerProduction?: number;
}

export interface Recipes {
	[index: `${string}_${string}`]: {
		recipes: Recipe[];
	};
}

export type Keybinds = Record<string, Record<string, Keybind>>;

export interface SaveData {
	UntitledElectronGame: {
		metadata: {
			validationCode: "esrdtfgvczdsret56u7yhgvfcesrythgvfd!";
			uuid: string;
			version: string;
			timeCreated: string;
		};
		level1: LevelData;
		techTree: string;
		objectives: string;
	}
}

export interface LevelData {
	chunks: Record<string, ChunkData>;
	resources: ItemStack[];
	seed: number;
	uuid: string;
	version: string;
}

export interface ChunkData {
	layers: [(BuildingData | null)[][], (BuildingData | null)[][]];
	version: string;
}


export interface LegacyBuildingData {
	x: number;
	y: number;
	id: LegacyBuildingID;
	item: ItemData | null;
	inv: ItemData[];
}

export interface BuildingData {
	x: number;
	y: number;
	id: RawBuildingID;
	meta: BuildingMeta;
	item: ItemData | null;
	items?: ItemStack[];
	fluid?: FluidData | null;
	inv?: ItemData[];
}

export interface ItemData {
	x: number;
	y: number;
	id: ItemID;
}
export type FluidData = [fluidID:FluidID | null, amount:number];

export interface CurrentFrame {
	tooltip: boolean;
	debug: boolean;
	cps: number;//Chunks per frame
	tps: number;//Tiles per frame
	ips: number;//Items per frame
	redraw: boolean;
	frame: number;
}


export type TextureInfo = [size:[width:number, height:number], offset:[x:number, height:number]];
