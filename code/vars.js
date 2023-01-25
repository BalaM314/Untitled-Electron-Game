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
        "0x01": "Conveyor Belt",
        "0x02": "Miner",
        "0x03": "Trash Can",
        "0x04": "Furnace",
        "0x05": "Extractor",
        "0x06": "Storage",
        "0x07": "Alloy Smelter",
        "0x08": "Resource Acceptor",
        "0x09": "Wiremill",
        "0x0A": "Compressor",
        "0x0B": "Lathe",
        "0x10": "Multiblock Secondary",
        "0x11": "Assembler",
        "0xFF": "[D] No Building"
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
var ItemID;
(function (ItemID) {
    ItemID["base_null"] = "base_null";
    ItemID["base_coalOre"] = "base_coalOre";
    ItemID["base_coal"] = "base_coal";
    ItemID["base_ironOre"] = "base_ironOre";
    ItemID["base_ironIngot"] = "base_ironIngot";
    ItemID["base_ironPlate"] = "base_ironPlate";
    ItemID["base_ironRod"] = "base_ironRod";
    ItemID["base_copperOre"] = "base_copperOre";
    ItemID["base_copperIngot"] = "base_copperIngot";
    ItemID["base_copperWire"] = "base_copperWire";
    ItemID["base_steelIngot"] = "base_steelIngot";
    ItemID["base_steelPlate"] = "base_steelPlate";
    ItemID["base_steelRod"] = "base_steelRod";
    ItemID["base_stator"] = "base_stator";
    ItemID["base_rotor"] = "base_rotor";
    ItemID["base_motor"] = "base_motor";
})(ItemID || (ItemID = {}));
var Direction;
(function (Direction) {
    Direction[Direction["right"] = 0] = "right";
    Direction[Direction["down"] = 1] = "down";
    Direction[Direction["left"] = 2] = "left";
    Direction[Direction["up"] = 3] = "up";
})(Direction || (Direction = {}));
var triggerType;
(function (triggerType) {
    triggerType[triggerType["placeBuilding"] = 0] = "placeBuilding";
    triggerType[triggerType["placeBuildingFail"] = 1] = "placeBuildingFail";
    triggerType[triggerType["spawnItem"] = 2] = "spawnItem";
    triggerType[triggerType["buildingRun"] = 3] = "buildingRun";
})(triggerType || (triggerType = {}));
let alerts = {
    list: [],
    active: false
};
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
    VERSION: "alpha 2.0.1",
    CHUNK_SIZE: 16,
    TILE_SIZE: 30,
    DISPLAY_SCALE: 1,
    get DISPLAY_TILE_SIZE() {
        return this.TILE_SIZE * this.DISPLAY_SCALE;
    },
    recipeMaxInputs: 3,
    buildings: {
        conveyor: {
            SPEED: 1
        }
    }
};
const registry = {
    recipes: {
        "base_mining": {
            "type": "t-1",
            "recipes": [
                {
                    "outputs": [ItemID.base_coalOre],
                    "duration": 60,
                    "tile": "base_ore_coal"
                },
                {
                    "outputs": [ItemID.base_ironOre],
                    "duration": 60,
                    "tile": "base_ore_iron"
                },
                {
                    "outputs": [ItemID.base_copperOre],
                    "duration": 60,
                    "tile": "base_ore_copper"
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
    },
    buildings: null,
    buildingIDs: ["0x0001", "0x0101", "0x0201", "0x0301", "0x0401", "0x0501", "0x0601", "0x0701", "0x0801", "0x0901", "0x0A01", "0x0B01", "0x0C01", "0x0D01", "0x0E01", "0x0F01", "0x1001", "0x1101", "0x1201", "0x1301", "0x1401", "0x1501", "0x1601", "0x1701", "0x1801", "0x1901", "0x1A01", "0x1B01", "0x0002", "0x0003", "0x0004", "0x0005", "0x0105", "0x0205", "0x0305", "0x0405", "0x0505", "0x0605", "0x0705", "0x0805", "0x0905", "0x0A05", "0x0B05", "0x0006", "0x0007", "0x0008", "0x0009", "0x000A", "0x000B", "0x0010", "0x0011", "0xFFFF"],
    itemIDs: Object.values(ItemID),
    tileIDs: ["base_grass", "base_stone", "base_water", "base_ore_coal", "base_ore_iron", "base_ore_copper", "base_null"],
    miscTextures: ["invalidunderlay", "ghostunderlay"],
    textures: {
        item: {},
        building: {},
        tile: {},
        misc: {}
    },
    keybinds: {
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
                if ((!localStorage.getItem("save1")
                    || JSON.parse(localStorage.getItem("save1")).UntitledElectronGame?.level1?.uuid == level1?.uuid)
                    || confirm("Are you sure you want to save? This will overwrite your current saved world which seems to be different!")) {
                    try {
                        localStorage.setItem("save1", JSON.stringify(exportData()));
                        alert("Saved successfully!");
                        Game.lastSaved = millis();
                    }
                    catch (err) {
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
            modifier_1: new Keybind(",", [], () => { placedBuilding.modifier = 0x000; }),
            modifier_2: new Keybind(".", [], () => { placedBuilding.modifier = 0x400; }),
            modifier_3: new Keybind("/", [], () => { placedBuilding.modifier = 0x800; }),
            direction_up: new Keybind("arrowup", [], () => { placedBuilding.direction = 0x300; }),
            direction_left: new Keybind("arrowleft", [], () => { placedBuilding.direction = 0x200; }),
            direction_down: new Keybind("arrowdown", [], () => { placedBuilding.direction = 0x100; }),
            direction_right: new Keybind("arrowright", [], () => { placedBuilding.direction = 0x000; }),
            type_1: new Keybind("1", [], () => { placedBuilding.type = "0x01"; }),
            type_2: new Keybind("2", [], () => { placedBuilding.type = "0x02"; }),
            type_3: new Keybind("3", [], () => { placedBuilding.type = "0x03"; }),
            type_4: new Keybind("4", [], () => { placedBuilding.type = "0x04"; }),
            type_5: new Keybind("5", [], () => { placedBuilding.type = "0x05"; }),
            type_6: new Keybind("6", [], () => { placedBuilding.type = "0x06"; }),
            type_7: new Keybind("7", [], () => { placedBuilding.type = "0x07"; }),
            type_9: new Keybind("8", [], () => { placedBuilding.type = "0x09"; }),
            type_A: new Keybind("9", [], () => { placedBuilding.type = "0x0A"; }),
            type_B: new Keybind("f1", [], () => { placedBuilding.type = "0x0B"; }),
            type_11: new Keybind("f2", [], () => { placedBuilding.type = "0x11"; }),
            type_0: new Keybind("0", [], () => { placedBuilding.type = "0xFF"; }),
        },
        display: {
            show_tooltip: new Keybind("shift"),
        },
        misc: {
            pause: new Keybind("escape", [], () => { Game.paused = !Game.paused; }),
        }
    }
};
let mouse = {
    x: 0,
    y: 0,
    held: false,
    latestEvent: null
};
let keysHeld = [];
let lastKeysPressed = ["", "", "", "", "", "", "", "", "", ""];
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
    lastSaved: 0,
    forceRedraw: true,
    tutorial: {},
    paused: false,
    state: "loading",
    title: {
        splashtext: "",
        splashbehavior: Math.sin
    },
    loadedTextures: 0,
    animationFrame: 0,
};
let level1 = null;
let splashes = [
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
let raresplashes = [
    "This is the rarest splash of all. It's so rare it never displays!",
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
    "§b§o[Enchanted Renamed Item!]§r",
    "",
    "amoGUS",
    "declare let splashes"
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
