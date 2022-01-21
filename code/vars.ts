const names = {
	tile: {
		0x00: "Grass",
		0x01: "Stone",
		0x02: "Water",
		0x10: "Coal Ore Node",
		0x11: "Iron Ore Node",
		0x12: "Copper Ore Node"
	},
	building: {
		0x01: "Conveyor Belt",
		0x02: "Miner",
		0x03: "Trash Can",
		0x04: "Furnace",
		0x05: "Extractor",
		0x06: "Storage",
		0x07: "Alloy Smelter",
		0x08: "Resource Acceptor",
		0x09: "Wiremill",
		0x0A: "Compressor",
		0x0B: "Lathe",
		0x10: "Multiblock Secondary",
		0x11: "Assembler"
	},
	item: {
		"base_null": "Debug Item",
		"base_coalOre": "Coal Ore",
		"base_coal": "Coal",
		"base_ironOre": "Iron Ore",
		"base_ironIngot": "Iron Ingot",
		"base_ironPlate": "Iron Plate",
		"base_ironRod": "Iron Rod",
		"base_steelIngot": "Steel Ingot",
		"base_steelPlate": "Steel Plate",
		"base_steelRod": "Steel Rod",
		"base_copperOre": "Copper Ore",
		"base_copperIngot": "Copper Ingot",
		"base_copperWire": "Copper Wire",
		"base_stator": "Stator",
		"base_rotor": "Rotor",
		"base_motor": "Motor"
	}
};

enum ItemID {
	base_null = "base_null",
	base_coalOre = "base_coalOre",
	base_coal = "base_coal",
	base_ironOre = "base_ironOre",
	base_ironIngot = "base_ironIngot",
	base_ironPlate = "base_ironPlate",
	base_ironRod = "base_ironRod",
	base_copperOre = "base_copperOre",
	base_copperIngot = "base_copperIngot",
	base_copperWire = "base_copperWire",
	base_steelIngot = "base_steelIngot",
	base_steelPlate = "base_steelPlate",
	base_steelRod = "base_steelRod",
	base_stator = "base_stator",
	base_rotor = "base_rotor",
	base_motor = "base_motor"
}

const generation_consts = {
	//All distance values are in chunks.
	perlin_scale: 2 * Math.PI,//An irrational number used to scale the perlin noise. The larger the number, the larger the terrain formations.
	y_offset: 2031,//To make the terrain not mirrored diagonally.
	ore_scale: 3,//Affects how fast the stone/ore gets bigger as you move away from spawn.
	min_water_chunk_distance: 3,//The minimum distance from spawn for water chunks to spawn.
	hilly: {
		terrain_cutoff: 0.01,//Determins where the hilly(perlin generated) terrain starts. Higher values make it start further away.
		stone_threshold: 0.7,//Determines how high the perlin noise has to go for stone to generate... sort of. See Chunk.generate().
		ore_threshold: 0.8,//Same as above but for ore.
		min_iron_distance: 8,//Minimum distance from spawn for iron ore to generate.
		min_copper_distance: 12//Minimum distance from spawn for copper ore to generate.
	}
};

const consts = {
	VERSION: "alpha 1.2.1",
	CHUNK_SIZE: 16,//Size of a chunk in tiles.
	TILE_SIZE: 30,//Sile of a tile in pixels.
	DISPLAY_SCALE: 1,
	get DISPLAY_TILE_SIZE(){
		return this.TILE_SIZE * this.DISPLAY_SCALE;
	},
	buildings: {
		conveyor: {
			SPEED: 1//pixels per update
		}
	}
};

const recipes: {//List of all recipes.
	maxInputs: number;
	[index: `${string}_${string}`]: {
		type: RecipeType;
		recipes: Recipe[];
	};
} = {
	maxInputs: 3,//temp, max inputs that are checked for
	"base_mining": {
		"type": "t-1",
		"recipes": [
			{
				"outputs": [ItemID.base_coalOre],
				"duration": 60,
				"tile": 0x10
			},
			{
				"outputs": [ItemID.base_ironOre],
				"duration": 60,
				"tile": 0x11
			},
			{
				"outputs": [ItemID.base_copperOre],
				"duration": 60,
				"tile": 0x12
			},
		]
	},
	"base_smelting": {
		"type": "1-1",
		"recipes": [
			{
				"inputs": [ItemID.base_coalOre],
				"outputs": [ItemID.base_coal],
				"duration": 60
			},
			{
				"inputs": [ItemID.base_ironOre],
				"outputs": [ItemID.base_ironIngot],
				"duration": 60
			},
			{
				"inputs": [ItemID.base_copperOre],
				"outputs": [ItemID.base_copperIngot],
				"duration": 60
			}
		]
	},
	"base_alloying": {
		"type": "2-1",
		"recipes": [
			{
				"inputs": [ItemID.base_coal, ItemID.base_ironIngot],
				"outputs": [ItemID.base_steelIngot],
				duration: 240
			}
		]
	},
	"base_wiremilling": {
		"type": "1-1",
		"recipes": [
			{
				"inputs": [ItemID.base_copperIngot],
				"outputs": [ItemID.base_copperWire],
				"duration": 120
			}
		]
	},
	"base_compressing": {
		"type": "1-1",
		"recipes": [
			{
				"inputs": [ItemID.base_ironIngot],
				"outputs": [ItemID.base_ironPlate],
				"duration": 60
			},
			{
				"inputs": [ItemID.base_steelIngot],
				"outputs": [ItemID.base_steelPlate],
				"duration": 60
			}
		]
	},
	"base_lathing": {
		"type": "1-1",
		"recipes": [
			{
				"inputs": [ItemID.base_ironIngot],
				"outputs": [ItemID.base_ironRod],
				"duration": 60
			},
			{
				"inputs": [ItemID.base_steelIngot],
				"outputs": [ItemID.base_steelRod],
				"duration": 60
			}
		]
	},
	"base_assembling": {
		"type": "2-1",
		recipes: [
			{
				"inputs": [ItemID.base_steelRod, ItemID.base_copperWire],
				"outputs": [ItemID.base_rotor],
				duration: 120
			},
			{
				"inputs": [ItemID.base_ironPlate, ItemID.base_copperWire],
				"outputs": [ItemID.base_stator],
				duration: 120
			},
			{
				"inputs": [ItemID.base_stator, ItemID.base_rotor],
				"outputs": [ItemID.base_motor],
				duration: 30
			}
		]
	}
};

let mouse = {
	x: 0,
	y: 0,
	held: false,
	latestEvent: null
};
let keysHeld:string[] = [];

let settings = {
	graphics_mode: 1,
	debug: true,
	alwaysLoadSave: true,
	autoSave: true,
};
let Game = {
	scroll: {
		x: 300,
		y: 300,
		speed: 5
	},
	startTime: new Date().getTime(),
	lastSaved: null,
	forceRedraw: true,
	persistent: {
		tutorialenabled: false
	},
	tutorial: {
		conveyor: {
			placed: true,
			beltchain: true,
			placefail: true
		},
		miner: {
			placefail: true,
			placed: true,
			coaloutput: true
		},
		trashcan: {
			placed: true
		},
		furnace: {
			placefail: true,
			placed: true
		},
		item: {
			coal: true,
			iron: true,
			steel: true
		},
		multiplesteel: false
	},
	state: "title"
};

const ctx = (document.getElementById("canvas") as HTMLCanvasElement).getContext("2d");//Tiles
const ctx1 = (document.getElementById("canvas1") as HTMLCanvasElement).getContext("2d");//Ghost buildings
const ctx2 = (document.getElementById("canvas2") as HTMLCanvasElement).getContext("2d");//Buildings
const ctx25 = (document.getElementById("canvas25") as HTMLCanvasElement).getContext("2d");//Extractors
const ctx3 = (document.getElementById("canvas3") as HTMLCanvasElement).getContext("2d");//Items
const ctx4 = (document.getElementById("canvas4") as HTMLCanvasElement).getContext("2d");//Overlays
const ctxs = [ctx, ctx1, ctx2, ctx25, ctx3, ctx4];
const uploadButton = document.getElementById('uploadButton')! as HTMLInputElement;

function makeError(name){
	return class extends Error {
		constructor(message){
			super(...arguments);
			this.name = name;
		}
	};
}
const ShouldNotBePossibleError = makeError("ShouldNotBePossibleError");
const AssertionFailedError = makeError("AssertionFailedError");
const ArgumentError = makeError("ArgumentError");
const InvalidStateError = makeError("InvalidStateError");

function importIntoGlobalScope(obj:Object){
	Object.assign(window, obj);
}
