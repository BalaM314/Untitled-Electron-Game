
class I18NBundle {
	mapping:Map<string, string>;
	constructor(text:[key:string, value:string][]){
		this.mapping = new Map(text);
	}
	static read(text:string, prefix?:string):I18NBundle {
		const entries:[string, string][] = [];
		let _type = null;
		for(const l of text.split(/\r?\n/g).map(l => l.trim())){
			if(l.match(/^\[\w+\]$/)){
				_type = l.slice(1, -1);
				continue;
			} else if(l.length == 0) continue;
			const line = l.split(/ ?= ?/);
			if(line.length == 2 && line[0].length > 0 && line[1].length > 0){
				const [key, value] = line;
				const parts = key.split(".");
				if(parts.length == 3 && parts.every(p => p.length > 0)){
					const [type, name, prop] = parts;
					if(prefix) entries.push([`${type}.${prefix}${name}.${prop}`, value]);
					else entries.push([key, value]);
				} else if(parts.length == 2 && parts.every(p => p.length > 0) && _type != null){
					const [name, prop] = parts;
					if(prefix) entries.push([`${_type}.${prefix}${name}.${prop}`, value]);
					else entries.push([`${_type}.${name}.${prop}`, value]);
				} else crash(`I18NBundle: Invalid key "${key}"`)
			} else crash(`I18NBundle: Invalid line "${l}"`);
		}
		return new I18NBundle(entries);
	}
	get(key:string, fallback = `???${key}???`){
		return this.mapping.get(key) ?? fallback;
	}
	//format?
}

const bundle = I18NBundle.read(`\
[tile]
grass.name = Grass
stone.name = Stone
water.name = Water
sand.name = Sand
water.description = Buildings can't be built on water.
ore_coal.name = Coal Ore Node
ore_coal.description = Ore nodes are infinite, and can be mined with a miner.
ore_iron.name = Iron Ore Node
ore_iron.description = Ore nodes are infinite, and can be mined with a miner.
ore_copper.name = Copper Ore Node
ore_copper.description = Ore nodes are infinite, and can be mined with a miner.
null.name = [ERR!] Null Tile

[building]
conveyor.name = Conveyor Belt
conveyor.description = Transports items.
miner.name = Miner
miner.description = Place on ore nodes to extract ore.
trash_can.name = Trash Can
furnace.name = Furnace
furnace.description = Smelts ores into ingots.
extractor.name = Extractor
extractor.description = Can be placed on other buildings, and extracts their items. Use comma, period, and slash to change the length.
chest.name = Storage
chest.description = Stores items.
alloy_smelter.name = Alloy Smelter
alloy_smelter.description = Heats coal with iron ingots to produce steel.
resource_acceptor.name = Hub
stirling_generator.name = Stirling Generator
stirling_generator.description = Burns coal to inefficiently produce a small amount of electricity.
wiremill.name = Wiremill
wiremill.description = Turns ingots into wires.
compressor.name = Compressor
compressor.description = Turns ingots into plates.
lathe.name = Lathe
lathe.description = Turns ingots into rods.
multiblock_secondary.name = [ERR!] Multiblock Secondary
assembler.name = Assembler
assembler.description = Produces components from simpler ones.
null.name = [ERR!] No Building
arc_tower.name = Arc Tower
arc_tower.description = Shoots arcs, consuming power. Has no function other than looking cool.
power_source.name = Power Source
pipe.name = Pipe
pump.name = Pump
tank.name = Tank
boiler.name = Boiler
boiler.description = Burns coal to heat water into steam.
steam_generator.name = Steam Turbine
steam_generator.description = Produces large amounts of electricity from steam.

[item]
null.name = Debug Item
coalOre.name = Coal Ore
coalOre.description = Can be converted into Coal by a Furnace.
coal.name = Coal
stone.name = Stone
stoneBrick.name = Stone Brick
sand.name = Sand
sand.description = (unused)
ironOre.name = Iron Ore
ironOre.description = Can be smelted into Iron by a Furnace.
ironIngot.name = Iron Ingot
ironPlate.name = Iron Plate
ironRod.name = Iron Rod
steelIngot.name = Steel Ingot
steelPlate.name = Steel Plate
steelRod.name = Steel Rod
copperOre.name = Copper Ore
copperOre.description = Can be smelted into Copper by a Furnace.
copperIngot.name = Copper Ingot
copperWire.name = Copper Wire
stator.name = Stator
rotor.name = Rotor
motor.name = Motor

[fluid]
water.name = Water
steam.name = Steam

[objective]
leave.name = Objective: Leave
leave.description = Go towards the left. Use WASD to move, and press Shift to scroll faster.
leave_satisfied.name = Objective: ...build a boat
leave_satisfied.description = Looks like you're stranded on an island. To get off, you'll need to make a boat from scratch.\\nClick the arrow to proceed.
tooltips.name = Use tooltips
tooltips.description = Move the mouse to this text and press Shift to show tooltips.
tooltips_satisfied.name = Use tooltips
tooltips_satisfied.description = Almost everything supports tooltips.
produceStone.name = Produce Stone
produceStone.description = Stone is used for most early-game buildings. Build a Miner on stone to produce it.
gatherStone.name = Gather Stone
gatherStone.description = Use conveyors to transport the stone to the Hub. Use the arrow keys to change the direction of placed conveyors. To break misplaced buildings, hold Backspace and move the cursor over a building.
gatherCoal.name = Gather Coal
gatherCoal.description = Most buildings will require a source of energy. Coal deposits are available close to the Hub.
researchStoneFurnace.name = Research a furnace
researchStoneFurnace.description = Coal can be used as fuel for furnaces, which can purify raw materials. Research the Furnace by clicking the 🧪 icon.
gatherStoneBrick.name = Gather Stone Bricks
gatherStoneBrick.description = The furnace can be used to produce Stone Bricks, which are more suitable for construction than raw stone. Use belts to direct Raw Stone into a Furnace.
gatherIronIngot.name = Gather Iron
gatherIronIngot.description = Iron ore nodes are found slightly farther away from the Hub in any direction. The ore requires processing before usage.
researchExtractor.name = Research the Extractor
researchExtractor.description = The extractor is a versatile item transportation device which can be placed on top of conveyors to split the flow of items. Press "," "." and "/" to change the length of the extractor.
researchAlloySmelter.name = Research the Alloy Smelter
researchAlloySmelter.description = Combining raw resources can produce stronger materials, such as steel.
gatherSteelIngot.name = Gather Steel
gatherSteelIngot.description = Steel is slow to produce. 8 alloy smelters running in parallel should produce enough to saturate a conveyor belt.
gatherCopperIngot.name = Gather Copper
gatherCopperIngot.description = Copper is a good electrical conductor, and is used in machines that produce or consume electricity. Its ore nodes are found far from the Hub.
researchStirlingGenerator.name = Research the Stirling Generator
researchStirlingGenerator.description = The Stirling Generator is a simple, but inefficient electrical generator that runs by burning items.
producePower.name = Produce Power
producePower.description = Use Coal to fuel a Stirling Generator. Produced electrical power is automatically transmitted to buildings that require power. (Note: if no buildings requiring power are present, the generator will not use any coal.)
researchCompressor.name = Research the Compressor
researchCompressor.description = The Compressor can convert metal ingots to plates.
gatherIronPlate.name = Gather Iron Plates
gatherIronPlate.description = Iron plates will be necessary to handle fluids.
researchPipe.name = Research Pipes
researchPipe.description = Pipes can be used to transport fluids. Unlike conveyors, there is no way to cross pipe lines.
researchPump.name = Research the Pump
researchPump.description = Pumps must be placed on water.
researchBoiler.name = Research the Boiler
researchBoiler.description = The Boiler can heat water to produce steam.
researchWiremill.name = Research the Wiremill
researchWiremill.description = Copper wires will be necessary for more advanced electrical buildings.
researchSteamGenerator.name = Research the Steam Turbine
researchSteamGenerator.description = This building can produce large amounts of electricity from steam. It may require more than one boiler to run at full efficiency.
activateSteamGenerator.name = Activate a Steam Turbine (or two)
activateSteamGenerator.description = Finally, enough electricity to run a properly sized factory.
researchLathe.name = Research the Lathe
researchLathe.description = The Lathe can produce rods from metal ingots. Unfortunately, most of the input is lost.
researchAssembler.name = Research the Assembler
researchAssembler.description = The Assembler is a large machine capable of producing useful items from their components.
produceStators.name = Produce Stators
produceStators.description = Stators are made from iron plates and copper wire.
produceRotors.name = Produce Rotors
produceRotors.description = Rotors are made from steel rods and copper wire.
produceMotors.name = Produce Motors
produceMotors.description = Motors are made by combining Stators and Rotors.
researchBoat.name = Research the Boat
researchBoat.description = It will take a lot of items to build a boat.

[research]
boat.name = Boat
boat.description = The final task.
`, "base_");


type ItemID =
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
;

type FluidID = "base_water" | "base_steam";

type Direction = {
	num: number;
	opposite: Direction;
	string: string;
	vec: PosT;
	horizontal: boolean;
	vertical: boolean;
	cw: Direction;
}
//I miss java enums
const Direction: {
	right: Direction;
	down: Direction;
	left: Direction;
	up: Direction;
	all: Direction[];
	number: number;
	[Symbol.iterator](): IterableIterator<Direction>;
} = (() => {
	let right:any = { num: 0, string: "right", vec: [1, 0], horizontal: true, vertical: false};
	let down:any = { num: 1, string: "down", vec: [0, 1], horizontal: false, vertical: true};
	let left:any = { num: 2, string: "left", vec: [-1, 0], horizontal: true, vertical: false};
	let up:any = { num: 3, string: "up", vec: [0, -1], horizontal: false, vertical: true};
	right.opposite = left;
	left.opposite = right;
	down.opposite = up;
	up.opposite = down;
	right.cw = down;
	down.cw = left;
	left.cw = up;
	up.cw = right;
	down.ccw = right;
	left.ccw = down;
	up.ccw = left;
	right.ccw = up;
	return {
		right, down, left, up,
		*[Symbol.iterator](){
			yield right;
			yield down;
			yield left;
			yield up;
		},
		all: [right, down, left, up],
		number: 4
	};
})();

type Triggers = {
	placeBuilding: {
		building: Building,
	},
	placeBuildingFail: {
		type: typeof Building,
		pos: Pos,
	},
	buildingFirstRun: {
		building: Building,
	}
}

const consts = {
	VERSION: "alpha 3.2.0",
	/**Size of a chunk in tiles. */
	CHUNK_SIZE: 16,
	/**Size of a tile in pixels. */
	TILE_SIZE: 30,
	/**Size of an item in pixels. */
	ITEM_SIZE: 16,
	chunkSizeInPixels: 16 * 30,
	/**Margin applied to chunk culling. */
	chunkCullingMargin: 120,
	/**Updates per second. */
	ups: 60,
	scrollSpeed: 5,
	fastScrollSpeed: 20,
};
const Mathf = {
	TWO_PI: Math.PI * 2,
	HALF_PI: Math.PI / 2,
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
		save: new Keybind("s", ["control", "!alt", "!shift"], () => attemptManualLocalSave()),
		load_from_file: new Keybind("o", ["control"], () => {
			uploadButton.click();
		}),
	},
	placement: {
		force_straight_conveyor: new Keybind("shift"),
		allow_multiple_overwrite: new Keybind("shift"),
		invert_rotate: new Keybind("shift"),
		break_building: new Keybind("backspace"),
		modifier_1: new Keybind(",", [], () => {placedBuilding.modifier = 0;}),
		modifier_2: new Keybind(".", [], () => {placedBuilding.modifier = 1;}),
		modifier_3: new Keybind("/", [], () => {placedBuilding.modifier = 2;}),
		direction_up: new Keybind("arrowup", [], () => {placedBuilding.direction = Direction.up;}),
		direction_left: new Keybind("arrowleft", [], () => {placedBuilding.direction = Direction.left;}),
		direction_down: new Keybind("arrowdown", [], () => {placedBuilding.direction = Direction.down;}),
		direction_right: new Keybind("arrowright", [], () => {placedBuilding.direction = Direction.right;}),
		direction_rotate: new Keybind("r", [], () => {placedBuilding.direction = placedBuilding.direction[keybinds.placement.invert_rotate.isHeld() ? "ccw" : "cw"];}),
		type_1: new Keybind("1", [], () => selectID("base_conveyor")),
		type_2: new Keybind("2", [], () => selectID("base_miner")),
		type_3: new Keybind("3", [], () => selectID("base_trash_can")),
		type_4: new Keybind("4", [], () => selectID("base_furnace")),
		type_5: new Keybind("5", [], () => selectID("base_extractor")),
		type_6: new Keybind("6", [], () => selectID("base_chest")),
		type_7: new Keybind("7", [], () => selectID("base_alloy_smelter")),
		type_8: new Keybind("8", [], () => selectID("base_stirling_generator")),
		type_11: new Keybind("9", [], () => selectID("base_compressor")),
		type_9: new Keybind("f1", [], () => selectID("base_wiremill")),
		type_12: new Keybind("f2", [], () => selectID("base_lathe")),
		type_13: new Keybind("f3", [], () => selectID("base_assembler")),
		// type_13: new Keybind("f3", [], () => selectID("base_arc_tower")),
		// type_14: new Keybind("f4", [], () => selectID("base_power_source")),
		type_14: new Keybind("f4", [], () => selectID("base_pipe")),
		type_16: new Keybind("f6", [], () => selectID("base_pump")),
		type_17: new Keybind("f7", [], () => selectID("base_tank")),
		type_18: new Keybind("f8", [], () => selectID("base_boiler")),
		type_19: new Keybind("f9", [], () => selectID("base_steam_generator")),
		// type_18: new Keybind("f9", [], () => selectID("base_boiler")),
		type_0: new Keybind("0", [], () => selectID("base_null")),
	},
	display: {
		show_tooltip: new Keybind("shift"),
		hide_gui: new Keybind("c", [], () => firstUsePopup("hide-gui-message", "You have hidden the gui by pressing (c). Press c again to show it.", GUI.toggle, true)),
		research: new Keybind("r", [], () => GUI.toggleResearchMenu()),
	},
	misc: {
		pause: new Keybind(" ", [], () => {Game.paused = !Game.paused;}),
		close_dialog: new Keybind("escape", [], () => GUI.closeDialog()),
	}
});

const Input = {
	mouseX: 0,
	mouseY: 0,
	active: true,
	get mouse():[mouseX:number, mouseY:number]{
		return [Input.mouseX, Input.mouseY];
	},
	mouseDown: false,
	rightMouseDown: false,
	mouseDownTime: 0,
	canOverwriteBuilding(){
		return !this.buildingPlaced || keybinds.placement.allow_multiple_overwrite.isHeld();
	},
	buildingPlaced: false,
	latestMouseEvent: null as MouseEvent | null,
	keysHeld: new Set<string>(),
	lastKeysPressed: new Array<string>(11).fill(""),
	shift: () => Input.keysHeld.has("shift"),
	alt: () => Input.keysHeld.has("alt"),
	ctrl: () => Input.keysHeld.has("ctrl"),
};
let settings = {
	debug: false,
	alwaysLoadSave: true,
	autoSave: true,
	showExtraPipeInfo: false,
	showIDsInTooltips: false,
	showChunkBorders: false,
	showTileBorders: true,
};
let Game: {
	texturesReady: boolean;
	startTime: number;
	lastSaved: number;
	forceRedraw: boolean;
	tutorial: {
		[index: string]: any
	};
	sceneName: "loading" | "title" | "settings" | "settings.keybinds" | "game";
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
	enteredGame: boolean;
	stats: {
		/** Stores the time in milliseconds to render for the past 120 frames. */
		frameTimes: WindowedMean;
		objectiveHovered: boolean;
		//TODO wrong abstraction
		stoneRunOutMessageShown: boolean;
	}
} = {
	texturesReady: false,
	startTime: new Date().getTime(),
	lastSaved: 0,
	forceRedraw: true,
	tutorial: {
		
	},
	paused: false,
	sceneName: "loading",
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
	enteredGame: false,
	stats: {
		frameTimes: new WindowedMean(120),
		objectiveHovered: false,
		stoneRunOutMessageShown: false,
	},
};
let level1:Level = null!;
const splashes:string[] = [
	"Get out of my files!",
	`Remember everyone, the secret to a good game in ${new Date().getFullYear()} is s p l a s h t e x t`,
	"Got any grapes?",
	"e",
	"Hello fellow untitled electron game enthusiast, I have made this splash text ridiculously long to the point where it is only actually readable by accessing the game files. w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w w Hello fellow untitled electron game enthusiast, I have made this splash text ridiculously long to the point where it is only actually readable by accessing the game files.",
	// "/execute order 420",
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
	// "Do distribute!",
	"Do not sell!",
	"doot doot",
	"/kill",
	"c418 is still the best lol",
	"I wonder what this button does!",
	// "Ctrl+W for 420 free diamonds!",
	"One day, somewhere in the future, my work will be quoted!",
	"For the last time guys, the Earth is a *rhombicubeoctahedron*.",
	".party()!",
	".play()!",
	".code()!",
	"haha splash text goes brrrrrrr",
	"Blue is my favorite colour",
	"pog",
	"kthxbai",
	"No swords!",
	"1337 is my middle name",
	"BURN IT WITH FIRE!!!!!",
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
	"Dragon free!",
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
