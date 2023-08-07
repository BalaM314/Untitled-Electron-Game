"use strict";
const names = {
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
const Direction = (() => {
    let right = { num: 0, string: "right", vec: [1, 0] };
    let down = { num: 1, string: "down", vec: [0, 1] };
    let left = { num: 2, string: "left", vec: [-1, 0] };
    let up = { num: 3, string: "up", vec: [0, -1] };
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
        }
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
    VERSION: "alpha 3.0.2",
    CHUNK_SIZE: 16,
    TILE_SIZE: 30,
    ITEM_SIZE: 16,
    chunkCullingMargin: 120,
    ups: 60,
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
        type_1: new Keybind("1", [], () => { placedBuilding.type = "base_conveyor"; }),
        type_2: new Keybind("2", [], () => { placedBuilding.type = "base_miner"; }),
        type_3: new Keybind("3", [], () => { placedBuilding.type = "base_trash_can"; }),
        type_4: new Keybind("4", [], () => { placedBuilding.type = "base_furnace"; }),
        type_5: new Keybind("5", [], () => { placedBuilding.type = "base_extractor"; }),
        type_6: new Keybind("6", [], () => { placedBuilding.type = "base_chest"; }),
        type_7: new Keybind("7", [], () => { placedBuilding.type = "base_alloy_smelter"; }),
        type_9: new Keybind("8", [], () => { placedBuilding.type = "base_wiremill"; }),
        type_A: new Keybind("9", [], () => { placedBuilding.type = "base_compressor"; }),
        type_B: new Keybind("f1", [], () => { placedBuilding.type = "base_lathe"; }),
        type_11: new Keybind("f2", [], () => { placedBuilding.type = "base_assembler"; }),
        type_0: new Keybind("0", [], () => { placedBuilding.type = "base_null"; }),
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
