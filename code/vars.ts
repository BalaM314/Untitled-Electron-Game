const names: {
	tile: {
		[P in TileID]: string;
	};
	building: {
		[P in RawBuildingID]: string;
	};
	item: {
		[P in ItemID]: string;
	};
} = {
	tile: {
		"base_grass": "Grass",
		"base_stone": "Stone",
		"base_water": "Water",
		"base_ore_coal": "Coal Ore Node",
		"base_ore_iron": "Iron Ore Node",
		"base_ore_copper": "Copper Ore Node",
		"base_null": "Null Tile"
	},
	building: {
		"base_conveyor": "Conveyor Belt",
		"base_miner": "Miner",
		"base_trash_can": "Trash Can",
		"base_furnace": "Furnace",
		"base_extractor": "Extractor",
		"base_chest": "Storage",
		"base_alloy_smelter": "Alloy Smelter",
		"base_resource_acceptor": "Resource Acceptor",
		"base_wiremill": "Wiremill",
		"base_compressor": "Compressor",
		"base_lathe": "Lathe",
		"base_multiblock_secondary": "Multiblock Secondary",
		"base_assembler": "Assembler",
		"base_null": "[D] No Building"
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


enum Direction {
	right, down, left, up
}

enum triggerType {
	placeBuilding,
	placeBuildingFail,
	spawnItem,
	buildingRun
}

let alerts: {
	list: string[];
	active: boolean;
} = {
	list: [],
	active: false
};

const generation_consts = {
	//All distance values are in chunks.
	/**	An irrational number used to scale the perlin noise. The larger the number, the larger the terrain formations.*/
	perlin_scale: 2 * Math.PI,
	/** To make the terrain not mirrored diagonally.*/
	y_offset: 2031,
	/** Affects how fast the stone/ore gets bigger as you move away from spawn.*/
	ore_scale: 3,
	/** The minimum distance from spawn for water chunks to spawn.*/
	min_water_chunk_distance: 3,
	hilly: {
		/** Determins where the hilly(perlin generated) terrain starts. Higher values make it start further away.*/
		terrain_cutoff: 0.01,
		/** Determines how high the perlin noise has to go for stone to generate... sort of. See Chunk.generate().*/
		stone_threshold: 0.7,
		/** Same as terrain stone threshold but for ore.*/
		ore_threshold: 0.8,
		/** Minimum distance from spawn for iron ore to generate.*/
		min_iron_distance: 8,
		/** Minimum distance from spawn for copper ore to generate.*/
		min_copper_distance: 12
	}
};
const consts = {
	VERSION: "alpha 3.0.0",
	/**Size of a chunk in tiles. */
	CHUNK_SIZE: 16,
	/**Size of a tile in pixels. */
	TILE_SIZE: 30,
	DISPLAY_SCALE: 1,
	ITEM_SIZE: 16,
	//todo refactor to graphics
	get DISPLAY_TILE_SIZE(){
		return this.TILE_SIZE * this.DISPLAY_SCALE;
	},
	recipeMaxInputs: 3,
	//todo refactor to BuildingType.
	buildings: {
		conveyor: {
			SPEED: 1//pixels per update
		}
	}
};



/**Contains all the keybindings for keyboard controls. */
const keybinds = extend<Keybinds>()({
	move: {
		up: new Keybind("w", ["!control", "!alt"]),
		left: new Keybind("a", ["!control", "!alt"]),
		down: new Keybind("s", ["!control", "!alt"]),
		right: new Keybind("d", ["!control", "!alt"]),
		scroll_faster: new Keybind("shift"),
	},
	saves: {
		save_to_file: new Keybind("s", ["control", "alt", "!shift"], () => {
			download("Untitled-Electron-Game-save.json", JSON.stringify(exportData()));
		}),
		save: new Keybind("s", ["control", "!alt", "!shift"], () => {
			if(
				(!localStorage.getItem("save1") 
					|| (JSON.parse(localStorage.getItem("save1")!) as SaveData).UntitledElectronGame?.level1?.uuid == level1?.uuid)
				|| confirm("Are you sure you want to save? This will overwrite your current saved world which seems to be different!")
			){
				try {
					localStorage.setItem("save1", JSON.stringify(exportData()));
					alert("Saved successfully!");
					Game.lastSaved = millis();
				} catch(err){
					alert("Failed to save! " + parseError(err));
				}
			}
		}),
		load_from_file: new Keybind("o", ["control"], () => {
			uploadButton.click();
		}),
	},
	placement: {
		force_straight_conveyor: new Keybind("shift"),
		break_building: new Keybind("backspace"),
		modifier_1: new Keybind(",", [], () => {placedBuilding.modifier = 0;}),
		modifier_2: new Keybind(".", [], () => {placedBuilding.modifier = 1;}),
		modifier_3: new Keybind("/", [], () => {placedBuilding.modifier = 2;}),
		direction_up: new Keybind("arrowup", [], () => {placedBuilding.direction = Direction.up;}),
		direction_left: new Keybind("arrowleft", [], () => {placedBuilding.direction = Direction.left;}),
		direction_down: new Keybind("arrowdown", [], () => {placedBuilding.direction = Direction.down;}),
		direction_right: new Keybind("arrowright", [], () => {placedBuilding.direction = Direction.right;}),
		type_1: new Keybind("1", [], () => {placedBuilding.type = "base_conveyor";}),
		type_2: new Keybind("2", [], () => {placedBuilding.type = "base_miner";}),
		type_3: new Keybind("3", [], () => {placedBuilding.type = "base_trash_can";}),
		type_4: new Keybind("4", [], () => {placedBuilding.type = "base_furnace";}),
		type_5: new Keybind("5", [], () => {placedBuilding.type = "base_extractor";}),
		type_6: new Keybind("6", [], () => {placedBuilding.type = "base_chest";}),
		type_7: new Keybind("7", [], () => {placedBuilding.type = "base_alloy_smelter";}),
		type_9: new Keybind("8", [], () => {placedBuilding.type = "base_wiremill";}),
		type_A: new Keybind("9", [], () => {placedBuilding.type = "base_compressor";}),
		type_B: new Keybind("f1", [], () => {placedBuilding.type = "base_lathe";}),
		type_11: new Keybind("f2", [], () => {placedBuilding.type = "base_assembler";}),
		type_0: new Keybind("0", [], () => {placedBuilding.type = "base_null";}),
	},
	display: {
		show_tooltip: new Keybind("shift"),
	},
	misc: {
		pause: new Keybind("escape", [], () => {Game.paused = !Game.paused;}),
	}
});

let mouse = {
	x: 0,
	y: 0,
	held: false,
	latestEvent: null as MouseEvent | null
};
let keysHeld:string[] = [];
//todo refactor this to input
let lastKeysPressed:string[] = ["", "", "", "", "", "", "", "", "", ""];

let settings = {
	graphics_mode: 1,
	debug: true,
	alwaysLoadSave: true,
	autoSave: true,
};
let Game: {
	texturesReady: boolean;
	scroll: {
		x: number;
		y: number;
		speed: number;
	}//todo refactor to graphics
	startTime: number;
	lastSaved: number;
	forceRedraw: boolean;
	tutorial: {
		[index: string]: any
	};
	state: "loading" | "title" | "settings" | "settings.keybinds" | "game";
	paused: boolean;
	title: {
		splashtext: string;
		splashbehavior: (x:number) => number;
	};
	loadedTextures: number;
	animationFrame: number;
} = {
	texturesReady: false,
	scroll: {
		x: 300,
		y: 300,
		speed: 5
	},
	startTime: new Date().getTime(),
	lastSaved: 0,
	forceRedraw: true,
	tutorial: {
		
	},
	paused: false,
	state: "loading",
	title: {
		splashtext: "",
		splashbehavior: Math.sin
	},
	loadedTextures: 0,
	animationFrame: 0,
};
let level1:Level = null!;
let splashes:string[] = [
	"Get out of my files!",
	"Remember everyone, the secret to a good game in 2020 is s p l a s h t e x t",
	"Got any grapes?",
	"e",
	"Hello fellow untitled electron game enthusiast, I have made this splash text ridiculously long to the point where it is only actually readable by accessing the game files. wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww Hello fellow untitled electron game enthusiast, I have made this splash text ridiculously long to the point where it is only actually readable by accessing the game files.",
	"/execute order 420",
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
	"For the last time guys, the Earth is a *rhombicubeoctahedron*.",
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
	"Brought to you by the letter π",
	"Type the Konami code for a secret!"
];
let raresplashes: string[] = [
	"This is the rarest splash of all. It's so rare it never displays!",
	"notched apple",
	"Diamonds never were actually forever",
	"\"Now you can eat sunlight!\" - bill wurtz",
	"undefined!",
	"null!",
	"Uncaught TypeError: undefined!",
	"Uncaught ball!",
	"Unhandled exception in thread main!",
	"RARE SPLASH?!?! 🤣😂😉😗🙃😁😛🤔😲🤯🙀‼",
	"🔴🟢\\n🔵🟡",
	"Never gonna give you up!",
	"Never gonna let you down!",
	"§b§o[Enchanted Renamed Item!]§r",
	"",
	"amoGUS",
	"declare let raresplashes:"
];

function makeError(name:string):(typeof Error){
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
function amogus(){
	return "sus!";
}
