"use strict";
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
    VERSION: "alpha 1.1.0",
    CHUNK_SIZE: 16,
    TILE_SIZE: 30,
    DISPLAY_SCALE: 1,
    get DISPLAY_TILE_SIZE() {
        return this.TILE_SIZE * this.DISPLAY_SCALE;
    },
    buildings: {
        conveyor: {
            SPEED: 1
        }
    }
};
const recipes = {
    maxInputs: 3,
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
    pressed: false,
    latestEvent: null
};
let keysPressed = [];
let settings = {
    graphics_mode: 1,
    debug: true
};
let Game = {
    scroll: {
        x: 300,
        y: 300,
        speed: 5
    },
    startTime: new Date(),
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
const ctx = document.getElementById("canvas").getContext("2d");
const ctx1 = document.getElementById("canvas1").getContext("2d");
const ctx2 = document.getElementById("canvas2").getContext("2d");
const ctx25 = document.getElementById("canvas25").getContext("2d");
const ctx3 = document.getElementById("canvas3").getContext("2d");
const ctx4 = document.getElementById("canvas4").getContext("2d");
const ctxs = [ctx, ctx1, ctx2, ctx25, ctx3, ctx4];
const uploadButton = document.getElementById('uploadButton');
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
