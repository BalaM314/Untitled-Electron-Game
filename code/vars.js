"use strict";
class I18NBundle {
    constructor(text) {
        this.mapping = new Map(text);
    }
    static read(text, prefix) {
        const entries = [];
        let _type = null;
        for (const l of text.split(/\r?\n/g).map(l => l.trim())) {
            if (l.match(/^\[\w+\]$/)) {
                _type = l.slice(1, -1);
                continue;
            }
            else if (l.length == 0)
                continue;
            const line = l.split(/ ?= ?/);
            if (line.length == 2 && line[0].length > 0 && line[1].length > 0) {
                const [key, value] = line;
                const parts = key.split(".");
                if (parts.length == 3 && parts.every(p => p.length > 0)) {
                    const [type, name, prop] = parts;
                    if (prefix)
                        entries.push([`${type}.${prefix}${name}.${prop}`, value]);
                    else
                        entries.push([key, value]);
                }
                else if (parts.length == 2 && parts.every(p => p.length > 0) && _type != null) {
                    const [name, prop] = parts;
                    if (prefix)
                        entries.push([`${_type}.${prefix}${name}.${prop}`, value]);
                    else
                        entries.push([`${_type}.${name}.${prop}`, value]);
                }
                else
                    crash(`I18NBundle: Invalid key "${key}"`);
            }
            else
                crash(`I18NBundle: Invalid line "${l}"`);
        }
        return new I18NBundle(entries);
    }
    get(key, fallback = `???${key}???`) {
        return this.mapping.get(key) ?? fallback;
    }
}
const bundle = I18NBundle.read(`\
[tile]
grass.name = Grass
stone.name = Stone
water.name = Water
water.description = Buildings can't be built on water.
ore_coal.name = Coal Ore Node
ore_coal.description = Ore nodes are infinite, and can be mined with a miner.
ore_iron.name = Iron Ore Node
ore_coal.description = Ore nodes are infinite, and can be mined with a miner.
ore_copper.name = Copper Ore Node
ore_coal.description = Ore nodes are infinite, and can be mined with a miner.
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
chest.name = Storage
alloy_smelter.name = Alloy Smelter
alloy_smelter.description = Heats coal with iron ingots to produce steel.
resource_acceptor.name = Resource Acceptor
wiremill.name = Wiremill
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

[item]
null.name = Debug Item
coalOre.name = Coal Ore
coalOre.description = Can be converted into Coal by a Furnace.
coal.name = Coal
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
`, "base_");
const Direction = (() => {
    let right = { num: 0, string: "right", vec: [1, 0], horizontal: true, vertical: false };
    let down = { num: 1, string: "down", vec: [0, 1], horizontal: false, vertical: true };
    let left = { num: 2, string: "left", vec: [-1, 0], horizontal: true, vertical: false };
    let up = { num: 3, string: "up", vec: [0, -1], horizontal: false, vertical: true };
    right.opposite = left;
    left.opposite = right;
    down.opposite = up;
    up.opposite = down;
    return {
        right, down, left, up,
        *[Symbol.iterator]() {
            yield right;
            yield down;
            yield left;
            yield up;
        },
        all: [right, down, left, up],
        number: 4
    };
})();
var triggerType;
(function (triggerType) {
    triggerType[triggerType["placeBuilding"] = 0] = "placeBuilding";
    triggerType[triggerType["placeBuildingFail"] = 1] = "placeBuildingFail";
    triggerType[triggerType["spawnItem"] = 2] = "spawnItem";
    triggerType[triggerType["buildingRun"] = 3] = "buildingRun";
})(triggerType || (triggerType = {}));
const generation_consts = {
    perlin_scale: 2 * Math.PI,
    y_offset: 2031,
    ore_scale: 3,
    min_water_chunk_distance: 3,
    hilly: {
        terrain_cutoff: 0.01,
        stone_threshold: 0.7,
        ore_threshold: 0.8,
        min_iron_distance: 8,
        min_copper_distance: 12
    }
};
const consts = {
    VERSION: "alpha 3.1.0",
    CHUNK_SIZE: 16,
    TILE_SIZE: 30,
    ITEM_SIZE: 16,
    chunkCullingMargin: 120,
    ups: 60,
    scrollSpeed: 5,
    fastScrollSpeed: 20,
};
const Mathf = {
    TWO_PI: Math.PI * 2,
    HALF_PI: Math.PI / 2,
};
const keybinds = extend()({
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
        modifier_1: new Keybind(",", [], () => { placedBuilding.modifier = 0; }),
        modifier_2: new Keybind(".", [], () => { placedBuilding.modifier = 1; }),
        modifier_3: new Keybind("/", [], () => { placedBuilding.modifier = 2; }),
        direction_up: new Keybind("arrowup", [], () => { placedBuilding.direction = Direction.up; }),
        direction_left: new Keybind("arrowleft", [], () => { placedBuilding.direction = Direction.left; }),
        direction_down: new Keybind("arrowdown", [], () => { placedBuilding.direction = Direction.down; }),
        direction_right: new Keybind("arrowright", [], () => { placedBuilding.direction = Direction.right; }),
        type_1: new Keybind("1", [], () => selectID("base_conveyor")),
        type_2: new Keybind("2", [], () => selectID("base_miner")),
        type_3: new Keybind("3", [], () => selectID("base_trash_can")),
        type_4: new Keybind("4", [], () => selectID("base_furnace")),
        type_5: new Keybind("5", [], () => selectID("base_extractor")),
        type_6: new Keybind("6", [], () => selectID("base_chest")),
        type_7: new Keybind("7", [], () => selectID("base_alloy_smelter")),
        type_9: new Keybind("8", [], () => selectID("base_wiremill")),
        type_10: new Keybind("9", [], () => selectID("base_compressor")),
        type_11: new Keybind("f1", [], () => selectID("base_lathe")),
        type_12: new Keybind("f2", [], () => selectID("base_assembler")),
        type_13: new Keybind("f3", [], () => selectID("base_arc_tower")),
        type_14: new Keybind("f4", [], () => selectID("base_power_source")),
        type_15: new Keybind("f6", [], () => selectID("base_pipe")),
        type_16: new Keybind("f7", [], () => selectID("base_pump")),
        type_17: new Keybind("f8", [], () => selectID("base_tank")),
        type_0: new Keybind("0", [], () => selectID("base_null")),
    },
    display: {
        show_tooltip: new Keybind("shift"),
    },
    misc: {
        pause: new Keybind(" ", [], () => { Game.paused = !Game.paused; }),
        close_dialog: new Keybind("escape", [], () => { if (Game.alerts.active)
            closeAlert(); }),
    }
});
const Input = {
    mouseX: 0,
    mouseY: 0,
    get mouse() {
        return [Input.mouseX, Input.mouseY];
    },
    mouseDown: false,
    latestMouseEvent: null,
    keysHeld: new Set(),
    lastKeysPressed: new Array(11).fill(""),
};
let settings = {
    debug: true,
    alwaysLoadSave: true,
    autoSave: true,
    showExtraPipeInfo: false,
    showIDsInTooltips: false,
};
let Game = {
    texturesReady: false,
    startTime: new Date().getTime(),
    lastSaved: 0,
    forceRedraw: true,
    tutorial: {},
    paused: false,
    state: "loading",
    splash: {
        text: "",
        bounceFunc: Math.sin,
        clickBehavior: () => { },
    },
    loadedTextures: 0,
    animationFrame: 0,
    alerts: {
        list: [],
        active: false
    },
    frames: 0,
    stats: {
        frameTimes: new WindowedMean(120),
    }
};
let level1 = null;
const splashes = [
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
const raresplashes = [
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
function makeError(name) {
    return class extends Error {
        constructor(message) {
            super(...arguments);
            this.name = name;
        }
    };
}
const ShouldNotBePossibleError = makeError("ShouldNotBePossibleError");
const AssertionFailedError = makeError("AssertionFailedError");
const ArgumentError = makeError("ArgumentError");
const InvalidStateError = makeError("InvalidStateError");
function importIntoGlobalScope(obj) {
    Object.assign(window, obj);
}
function amogus() {
    return "sus!";
}
