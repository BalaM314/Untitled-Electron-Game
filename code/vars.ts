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
	VERSION: "alpha 1.3.0",
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
let lastKeysPressed:string[] = ["", "", "", "", "", "", "", "", "", ""];

let settings = {
	graphics_mode: 1,
	debug: true,
	alwaysLoadSave: true,
	autoSave: true,
	tutorial: false,
};
let Game: {
	scroll: {
		x: number;
		y: number;
		speed: number;
	}
	startTime: number;
	lastSaved: number;
	forceRedraw: boolean;
	tutorial: {
		[index: string]: any
	};
	state: "loading" | "title" | "settings" | "game";
	title: {
		splashtext: string;
		splashbehavior: string;
	}
} = {
	scroll: {
		x: 300,
		y: 300,
		speed: 5
	},
	startTime: new Date().getTime(),
	lastSaved: null,
	forceRedraw: true,
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
	state: "loading",
	title: {
		splashtext: "",
		splashbehavior: "sin"
	}
};
let splashes:string[] = [
	"§kGet out of my files! It tickles!",
	"Remember everyone, the secret to a good game in 2020 is s p l a s h t e x t",
	"Got any grapes?",
	"e",
	"Hello fellow untitled electron game enthusiast, I have made this splash text ridiculously long to the point where it is only actually readable by accessing the game files. wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww Hello fellow untitled electron game enthusiast, I have made this splash text ridiculously long to the point where it is only actually readable by accessing the game files.",
	"/execute order 66",
	"Now a noodle.",
	"${splash}",
	"Goes brrrrrrr!",
	"Looking kinda sus!",
	"Who parked their car on my sandwich?",
	"Also try Factorio!",
	"Also try Satisfactory!",
	"Also try Mindustry!",
	"not related to minecraft",
	"Aww man!",
	"uiwcoufhuwrwytyur g fhk",
	"Oi",
	"what am i even doing",
	"Do distribute!",
	"Do not sell!",
	"wanna see me speed bridge",
	"doot doot",
	"/kill",
	"Reddit, here we come!",
	"c148 is still the best lol",
	"I wonder what this button does!",
	"Ctrl+W for 420 free diamonds!",
	"One day, somewhere in the future, my work will be quoted!",
	"For the last time guys, the Earth is *round*.",
	".party()!",
	".play()!",
	".code()!",
	"We are number one!",
	"haha splash text goes brrrrrrr",
	"Diamonds aren't hot, carbon dioxide is!",
	"Forge!",
	"Blue is my favorite colour",
	"pog",
	"kthxbai",
	"No swords!",
	"1337 is my middle name",
	"Records on my fingers!",
	"BURN IT WITH FIRE!!!!!",
	"Getting ready to show!",
	"Getting ready to know!",
	"Getting ready to drop!",
	"Getting ready to shock!",
	"Getting ready to freak!",
	"Getting ready to speak!",
	"Never gonna give you up!",
	"§b§o[Enchanted Renamed Item!]§r",
	"A Very Fancy Door!",
	"Ghostpinged!",
	"████ ████ ██████e██ ████m ████ne ██",
	"Op!",
	"when the imposter is sus 😳",
	"3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481",
	"Noted.",
	"let splashes: string[] = ",
	"I just simultaneously whipped and nae nae'd!",
	"TypeScript powered!",
	"Server friendly!",
	"Environmentally friendly!",
	"More stone than you'll ever need!",
	"amogus",
	"amomogus",
	"amoamogus",
	"amoamomogus",
	"amogusgus",
	"amomogusgus",
	"amoamogusgus",
	"amoamomogusgus",
	"abominatiogus",
	"u r sussy",
	"Brought to you by BalaM314!",
	"Brought to you by the letter π"
];
let raresplashes: string[] = [
	"This is the rarest splash of all. It's so rare it never displays!",
	"HAIL SUN CORP",
	"notched apple",
	"Diamonds never were actually forever",
	"\"Now you can eat sunlight!\" - bill wurtz",
	"WAAAAAAAARRR!!",
	"undefined!",
	"null!",
	"Uncaught TypeError: undefined!",
	"Uncaught ball!",
	"Unhandled exception in thread main!",
	"RARE SPLASH?!?! 🤣😂😉😗🙃😁😛🤔😲🤯🙀‼",
	"pee pee poo poo",
	"🔴🟢\\n🔵🟡",
	"§6§kMM§r§2lBalaM314 is awesome!§r§6§kMM",
	"Never gonna give you up!",
	"Never gonna let you down!",
];

let loadedtextures = 0;

function makeError(name):(typeof Error){
	return class extends Error {
		constructor(message?: string){
			super(...arguments);
			this.name = name;
		}
	} as typeof Error;
}

const ShouldNotBePossibleError = makeError("ShouldNotBePossibleError");
const AssertionFailedError = makeError("AssertionFailedError");
const ArgumentError = makeError("ArgumentError");
const InvalidStateError = makeError("InvalidStateError");

function importIntoGlobalScope(obj:Object){
	Object.assign(window, obj);
}
