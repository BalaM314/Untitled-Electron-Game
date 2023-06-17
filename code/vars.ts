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

type ItemID =
	"base_null" |
	"base_coalOre" |
	"base_coal" |
	"base_ironOre" |
	"base_ironIngot" |
	"base_ironPlate" |
	"base_ironRod" |
	"base_copperOre" |
	"base_copperIngot" |
	"base_copperWire" |
	"base_steelIngot" |
	"base_steelPlate" |
	"base_steelRod" |
	"base_stator" |
	"base_rotor" |
	"base_motor"
;

type Direction = {
	num: number;
	opposite: Direction;
	string: string;
	vec: [x:number, y:number];
}
//I miss java enums
const Direction: {
	right: Direction;
	down: Direction;
	left: Direction;
	up: Direction;
	[Symbol.iterator](): IterableIterator<Direction>;
} = (() => {
	let right:any = { num: 0, string: "right", vec: [1, 0]};
	let down:any = { num: 1, string: "down", vec: [0, 1]};
	let left:any = { num: 2, string: "left", vec: [-1, 0]};
	let up:any = { num: 3, string: "up", vec: [0, -1]};
	right.opposite = left;
	left.opposite = right;
	down.opposite = up;
	up.opposite = down;
	return {
		right, down, left, up,
		*[Symbol.iterator](){
			yield right;
			yield down;
			yield left;
			yield up;
		}
	};
})();

enum triggerType {
	placeBuilding,
	placeBuildingFail,
	spawnItem,
	buildingRun
}

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
	VERSION: "alpha 3.0.2",
	/**Size of a chunk in tiles. */
	CHUNK_SIZE: 16,
	/**Size of a tile in pixels. */
	TILE_SIZE: 30,
	/**Size of an item in pixels. */
	ITEM_SIZE: 16,
	/**Margin applied to chunk culling. */
	chunkCullingMargin: 120,
	/**Updates per second. */
	ups: 60,
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
		save: new Keybind("s", ["control", "!alt", "!shift"], () => attemptManualLocalSave),
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
		pause: new Keybind(" ", [], () => {Game.paused = !Game.paused;}),
		close_dialog: new Keybind("escape", [], () => {if(Game.alerts.active) closeAlert()}),
	}
});

const Input = {
	mouseX: 0,
	mouseY: 0,
	get mouse():[mouseX:number, mouseY:number]{
		return [Input.mouseX, Input.mouseY];
	},
	mouseDown: false,
	latestMouseEvent: null as MouseEvent | null,
	keysHeld: new Set<string>(),
	lastKeysPressed: new Array<string>(11).fill(""),
};
let settings = {
	graphics_mode: 1,
	debug: true,
	alwaysLoadSave: true,
	autoSave: true,
};
let Game: {
	texturesReady: boolean;
	startTime: number;
	lastSaved: number;
	forceRedraw: boolean;
	tutorial: {
		[index: string]: any
	};
	state: "loading" | "title" | "settings" | "settings.keybinds" | "game";
	paused: boolean;
	splash: {
		text: string;
		bounceFunc: (x:number) => number;
		clickBehavior: () => unknown;
	};
	loadedTextures: number;
	animationFrame: number;
	alerts: {
		list: string[];
		active: boolean;
	}
	frames: number;
} = {
	texturesReady: false,
	startTime: new Date().getTime(),
	lastSaved: 0,
	forceRedraw: true,
	tutorial: {
		
	},
	paused: false,
	state: "loading",
	splash: {
		text: "",
		bounceFunc: Math.sin,
		clickBehavior: () => {},
	},
	loadedTextures: 0,
	animationFrame: 0,
	alerts: {
		list: [],
		active: false
	},
	frames: 0,
};
let level1:Level = null!;
const splashes:string[] = [
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
const raresplashes: string[] = [
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
