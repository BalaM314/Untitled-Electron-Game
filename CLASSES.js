"use strict";
let textures = new Map();
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
        0x08: "Resource Acceptor"
    },
    item: {
        "base_null": "Debug Item",
        "base_coalOre": "Coal Ore",
        "base_coal": "Coal",
        "base_ironOre": "Iron Ore",
        "base_ironIngot": "Iron Ingot",
        "base_steelIngot": "Steel Ingot",
        "base_copperOre": "Copper Ore",
        "base_copperIngot": "Copper Ingot",
    }
};
const ItemID = {
    "base_null": "base_null",
    "base_coalOre": "base_coalOre",
    "base_coal": "base_coal",
    "base_ironOre": "base_ironOre",
    "base_ironIngot": "base_ironIngot",
    "base_copperOre": "base_copperOre",
    "base_copperIngot": "base_copperIngot",
    "base_steelIngot": "base_steelIngot"
};
const generation_consts = {
    //All distance values are in chunks.
    perlin_scale: 2 * Math.PI,
    y_offset: 2031,
    ore_scale: 3,
    min_water_chunk_distance: 3,
    hilly: {
        terrain_cutoff: 0.01,
        stone_threshold: 0.7,
        ore_threshold: 0.8,
        min_iron_distance: 8,
        min_copper_distance: 12 //Minimum distance from spawn for copper ore to generate.
    }
};
const Globals = {
    VERSION: "alpha 1.0.0",
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
class Level {
    constructor(data) {
        this.storage = new Map();
        this.format = Globals.VERSION;
        this.items = [];
        this.resources = {};
        if (typeof data != "object") {
            this.seed = data ? data : 0;
        }
        else {
            // Generate a level from JSON
            let { chunks, items, resources, seed, version } = data;
            this.seed = seed;
            for (var [position, chunkData] of Object.entries(chunks)) { //Get data for a chunk
                this.storage.set(position, new Chunk({
                    x: parseInt(position.split(",")[0]), y: parseInt(position.split(",")[1]),
                    seed: seed, parent: this
                }, chunkData).generate());
                //Generate a chunk with that data
            }
            if (version !== "alpha 0.0.0") { //Needed because before (e4360ab) items being moved by conveyor belts were in-world and the below code would otherwise dupe them.
                for (var item of items) {
                    let tempItem = new Item(item.x, item.y, item.id, this);
                    if (item.grabbedBy) {
                        tempItem.grabbedBy = this.buildingAtTile(item.grabbedBy.x, item.grabbedBy.y);
                        assert(tempItem.grabbedBy);
                    }
                    this.items.push(tempItem);
                }
            }
        }
    }
    getChunk(tileX, tileY, dontGenerateChunk) {
        if (this.storage.get(`${Math.floor(tileX / Globals.CHUNK_SIZE)},${Math.floor(tileY / Globals.CHUNK_SIZE)}`)) {
            return this.storage.get(`${Math.floor(tileX / Globals.CHUNK_SIZE)},${Math.floor(tileY / Globals.CHUNK_SIZE)}`);
        }
        else if (!dontGenerateChunk) {
            return this.generateChunk(Math.floor(tileX / Globals.CHUNK_SIZE), Math.floor(tileY / Globals.CHUNK_SIZE));
        }
        else {
            return null;
        }
    }
    generateChunk(x, y) {
        if (this.storage.get(`${x},${y}`)) {
            return;
        }
        this.storage.set(`${x},${y}`, new Chunk({ x: x, y: y, seed: this.seed, parent: this })
            .generate());
        return this.storage.get(`${x},${y}`);
    }
    tileAtByPixel(pixelX, pixelY) {
        return this.getChunk(Math.floor(pixelX / Globals.TILE_SIZE), Math.floor(pixelY / Globals.TILE_SIZE)).tileAt(tileToChunk(pixelX / Globals.TILE_SIZE), tileToChunk(pixelY / Globals.TILE_SIZE));
    }
    tileAtByTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).tileAt(tileToChunk(tileX), tileToChunk(tileY));
    }
    setTileByTile(tileX, tileY, tile) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setTile(tileToChunk(tileX), tileToChunk(tileY), tile);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    generateNecessaryChunks() {
        var xOffset = -Math.floor((Game.scroll.x * Globals.DISPLAY_SCALE) / (Globals.DISPLAY_TILE_SIZE * Globals.CHUNK_SIZE));
        var yOffset = -Math.floor((Game.scroll.y * Globals.DISPLAY_SCALE) / (Globals.DISPLAY_TILE_SIZE * Globals.CHUNK_SIZE));
        this.generateChunk(xOffset - 1, yOffset - 1);
        this.generateChunk(xOffset, yOffset - 1);
        this.generateChunk(xOffset + 1, yOffset - 1);
        this.generateChunk(xOffset - 1, yOffset);
        this.generateChunk(xOffset, yOffset);
        this.generateChunk(xOffset + 1, yOffset);
        this.generateChunk(xOffset - 1, yOffset + 1);
        this.generateChunk(xOffset, yOffset + 1);
        this.generateChunk(xOffset + 1, yOffset + 1);
        this.generateChunk(xOffset + 2, yOffset - 1);
        this.generateChunk(xOffset + 2, yOffset);
        this.generateChunk(xOffset + 2, yOffset + 1);
        this.generateChunk(xOffset + 3, yOffset - 1);
        this.generateChunk(xOffset + 3, yOffset);
        this.generateChunk(xOffset + 3, yOffset + 1);
        //good enough
    }
    buildingIDAtPixel(pixelX, pixelY) {
        return this.getChunk(Math.floor(pixelX / Globals.TILE_SIZE), Math.floor(pixelY / Globals.TILE_SIZE)).buildingAt(tileToChunk(pixelX / Globals.TILE_SIZE), tileToChunk(pixelY / Globals.TILE_SIZE))?.id ?? 0xFFFF;
    }
    buildingIDAtTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).buildingAt(tileToChunk(tileX), tileToChunk(tileY))?.id ?? 0xFFFF;
    }
    buildingAtTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).buildingAt(tileToChunk(tileX), tileToChunk(tileY));
    }
    extractorAtTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).extractorAt(tileToChunk(tileX), tileToChunk(tileY));
    }
    addItem(x, y, id) {
        let tempitem = new Item(x, y, id, this);
        this.items.push(tempitem);
        return tempitem;
    }
    update(currentframe) {
        for (var item of this.items) {
            item.update(currentframe);
        }
        for (var chunk of level1.storage.values()) {
            chunk.update();
        }
    }
    displayGhostBuilding(tileX, tileY, buildingID) {
        tileX = Math.floor(tileX);
        tileY = Math.floor(tileY);
        if (this.getChunk(tileX, tileY, true) == null) {
            return;
        }
        switch (buildingID) {
            case 0x0007:
                this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, AlloySmelter.canBuildAt(tileX, tileY, this) ? 1 : 2);
                break;
            case 0x0006:
                this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, StorageBuilding.canBuildAt(tileX, tileY, this) ? 1 : 2);
                break;
            case 0x0005:
            case 0x0105:
            case 0x0205:
            case 0x0305:
            case 0x0405:
            case 0x0505:
            case 0x0605:
            case 0x0705:
            case 0x0805:
            case 0x0905:
            case 0x0A05:
            case 0x0B05:
                this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, Extractor.canBuildAt(tileX, tileY, this) ? 1 : 2);
                break;
            case 0x0004:
                this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, Furnace.canBuildAt(tileX, tileY, this) ? 1 : 2);
                break;
            case 0x0002:
                this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, Miner.canBuildAt(tileX, tileY, this) ? 1 : 2);
                break;
            case 0x0001:
            case 0x0101:
            case 0x0201:
            case 0x0301:
                this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), this.getTurnedConveyor(tileX, tileY, buildingID >> 8), Conveyor.canBuildAt(tileX, tileY, this) ? 1 : 2);
                break;
            default:
                this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, 1);
                break;
        }
    }
    getTurnedConveyor(tileX, tileY, conveyorType) {
        tileX = Math.floor(tileX);
        tileY = Math.floor(tileY);
        let topConveyor = this.buildingIDAtTile(tileX, tileY - 1);
        topConveyor = topConveyor == 0x0101 || topConveyor == 0x0601 || topConveyor == 0x0701 || topConveyor == 0x0002 || topConveyor == 0x0004 || topConveyor == 0x0007;
        let rightConveyor = this.buildingIDAtTile(tileX + 1, tileY);
        rightConveyor = rightConveyor == 0x0201 || rightConveyor == 0x0801 || rightConveyor == 0x0901 || rightConveyor == 0x0002 || rightConveyor == 0x0004 || rightConveyor == 0x0007;
        let leftConveyor = this.buildingIDAtTile(tileX - 1, tileY);
        leftConveyor = leftConveyor == 0x0001 || leftConveyor == 0x0401 || leftConveyor == 0x0501 || leftConveyor == 0x0002 || leftConveyor == 0x0004 || leftConveyor == 0x0007;
        let bottomConveyor = this.buildingIDAtTile(tileX, tileY + 1);
        bottomConveyor = bottomConveyor == 0x0301 || bottomConveyor == 0x0A01 || bottomConveyor == 0x0B01 || bottomConveyor == 0x0002 || bottomConveyor == 0x0004 || bottomConveyor == 0x0007;
        let buildingID = 0xFFFF;
        switch (conveyorType) {
            case 0:
                if (leftConveyor) {
                    buildingID = 0x0001;
                }
                else if (topConveyor && bottomConveyor) {
                    buildingID = 0x0001;
                }
                else if (topConveyor) {
                    buildingID = 0x0501;
                }
                else if (bottomConveyor) {
                    buildingID = 0x0401;
                }
                else {
                    buildingID = 0x0001;
                }
                break;
            case 1:
                if (topConveyor) {
                    buildingID = 0x0101;
                }
                else if (leftConveyor && rightConveyor) {
                    buildingID = 0x0101;
                }
                else if (leftConveyor) {
                    buildingID = 0x0701;
                }
                else if (rightConveyor) {
                    buildingID = 0x0601;
                }
                else {
                    buildingID = 0x0101;
                }
                break;
            case 2:
                if (rightConveyor) {
                    buildingID = 0x0201;
                }
                else if (topConveyor && bottomConveyor) {
                    buildingID = 0x0201;
                }
                else if (topConveyor) {
                    buildingID = 0x0901;
                }
                else if (bottomConveyor) {
                    buildingID = 0x0801;
                }
                else {
                    buildingID = 0x0201;
                }
                break;
            case 3:
                if (bottomConveyor) {
                    buildingID = 0x0301;
                }
                else if (leftConveyor && rightConveyor) {
                    buildingID = 0x0301;
                }
                else if (leftConveyor) {
                    buildingID = 0x0B01;
                }
                else if (rightConveyor) {
                    buildingID = 0x0A01;
                }
                else {
                    buildingID = 0x0301;
                }
                break;
        }
        return buildingID;
    }
    writeBuilding(tileX, tileY, building) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setBuilding(tileToChunk(tileX), tileToChunk(tileY), building);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    writeExtractor(tileX, tileY, building) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setExtractor(tileToChunk(tileX), tileToChunk(tileY), building);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    buildBuilding(tileX, tileY, building) {
        if ((building % 0x100 != 5 ? this.buildingIDAtTile(tileX, tileY) : this.extractorAtTile(tileX, tileY)?.id) === building) {
            if (canOverwriteBuilding) {
                canOverwriteBuilding = false;
            }
            else {
                return false;
            }
        }
        this.buildingAtTile(tileX, tileY)?.break();
        var tempBuilding;
        switch (building) {
            //A lot of the code here is duplicated, oh well
            case 0x0008:
                if (!ResourceAcceptor.canBuildAt(tileX, tileY, this)) {
                    return;
                }
                tempBuilding = new ResourceAcceptor(tileX, tileY, building, this);
                break;
            case 0x0007:
                if (!AlloySmelter.canBuildAt(tileX, tileY, this)) {
                    return;
                }
                tempBuilding = new AlloySmelter(tileX, tileY, building, this);
                break;
            case 0x0006:
                if (!StorageBuilding.canBuildAt(tileX, tileY, this)) {
                    return;
                }
                tempBuilding = new StorageBuilding(tileX, tileY, building, this);
                break;
            case 0x0005:
            case 0x0105:
            case 0x0205:
            case 0x0305:
            case 0x0405:
            case 0x0505:
            case 0x0605:
            case 0x0705:
            case 0x0805:
            case 0x0905:
            case 0x0A05:
            case 0x0B05:
                if (!Extractor.canBuildAt(tileX, tileY, this)) {
                    return;
                }
                tempBuilding = new Extractor(tileX, tileY, building, this);
                break;
            case 0x0004:
                if (!Furnace.canBuildAt(tileX, tileY, this)) {
                    if (Game.tutorial.furnace.cantbeplacedongrass && Game.persistent.tutorialenabled) {
                        _alert("The Furnace generates a lot of heat and is pretty heavy, so you can only place it on stone.");
                        Game.tutorial.furnace.cantbeplacedongrass = false;
                    }
                    return;
                }
                tempBuilding = new Furnace(tileX, tileY, 0x0004, this);
                if (Game.tutorial.furnace.placedcorrectly && Game.persistent.tutorialenabled) {
                    _alert("The Furnace converts raw ores into their smelted forms. Simply point a conveyor belt carrying ores at it and provide another belt for it to output onto.");
                    Game.tutorial.furnace.placedcorrectly = false;
                }
                break;
            case 0x0003:
                tempBuilding = new TrashCan(tileX, tileY, 0x0003, this);
                if (Game.tutorial.trashcan.placedcorrectly && Game.persistent.tutorialenabled) {
                    _alert("The Trash Can is pretty simple: it deletes all items it receives.");
                    Game.tutorial.trashcan.placedcorrectly = false;
                }
                break;
            case 0x0002:
                if (!Miner.canBuildAt(tileX, tileY, this)) {
                    if (Game.tutorial.miner.cantbeplacedongrass && Game.persistent.tutorialenabled) {
                        _alert("The Miner can only be placed on a resource node(the colored circles).");
                        Game.tutorial.miner.cantbeplacedongrass = false;
                    }
                    return;
                }
                ;
                tempBuilding = new Miner(tileX, tileY, 0x0002, this);
                if (Game.tutorial.miner.placedcorrectly && Game.persistent.tutorialenabled) {
                    _alert("The Miner mines ore nodes, producing one ore per second. \nIt auto-outputs to adjacent conveyor belts.\nAlso, ore nodes are infinite.");
                    Game.tutorial.miner.placedcorrectly = false;
                }
                break;
            case 0x0001:
            case 0x0101:
            case 0x0201:
            case 0x0301:
            case 0x0401:
            case 0x0501:
            case 0x0601:
            case 0x0701:
            case 0x0801:
            case 0x0901:
            case 0x0A01:
            case 0x0B01:
                if (!Conveyor.canBuildAt(tileX, tileY, this)) {
                    if (Game.tutorial.conveyor.cantbeplacedonwater && Game.persistent.tutorialenabled) {
                        _alert("Conveyors don't float!\nYes, I know, then water chunks are useless... I'll add pontoons in a future update.");
                        Game.tutorial.conveyor.cantbeplacedonwater = false;
                    }
                    return;
                }
                if (Game.tutorial.conveyor.placedcorrectly && Game.persistent.tutorialenabled) {
                    _alert("Conveyors are the way to move items around. \nYou can use the arrow keys to change the direction of placed belts. \nTry making a belt chain, then putting a debug item on it with Ctrl+click.\nYou can drag-click to build multiple of the same building.");
                    Game.tutorial.conveyor.placedcorrectly = false;
                }
                tempBuilding = new Conveyor(tileX, tileY, this.getTurnedConveyor(tileX, tileY, building >> 8), this);
                break;
            case 0xFFFF:
                this.writeExtractor(tileX, tileY, null);
                this.writeBuilding(tileX, tileY, null);
                return;
            default:
                return this.writeBuilding(tileX, tileY, new Building(tileX, tileY, building, this));
                break;
        }
        if (tempBuilding instanceof Extractor) {
            return this.writeExtractor(tileX, tileY, tempBuilding);
        }
        else {
            return this.writeBuilding(tileX, tileY, tempBuilding);
        }
    }
    display(currentframe) {
        for (let item of this.items) {
            item.display(currentframe);
        }
        //Insta returns in the display method if offscreen.
        for (var chunk of this.storage.values()) {
            chunk.display(currentframe);
        }
    }
    displayTooltip(mousex, mousey, currentframe) {
        if (!currentframe.tooltip) {
            return;
        }
        var x = (mousex - (Game.scroll.x * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_SCALE;
        var y = (mousey - (Game.scroll.y * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_SCALE;
        ctx4.font = "16px monospace";
        for (let item of this.items) {
            if ((Math.abs(item.x - x) < 16) && Math.abs(item.y - y) < 16) {
                ctx4.fillStyle = "#0033CC";
                ctx4.fillRect(mousex, mousey, names.item[item.id].length * 10, 16);
                ctx4.strokeStyle = "#000000";
                ctx4.strokeRect(mousex, mousey, names.item[item.id].length * 10, 16);
                ctx4.fillStyle = "#FFFFFF";
                ctx4.fillText(names.item[item.id], mousex + 2, mousey + 10);
                return;
            }
        }
        if (this.buildingIDAtPixel(x, y) !== 0xFFFF) {
            let buildingID = this.buildingIDAtPixel(x, y) % 0x100;
            ctx4.fillStyle = "#0033CC";
            ctx4.fillRect(mousex, mousey, names.building[buildingID].length * 10, 16);
            ctx4.strokeStyle = "#000000";
            ctx4.strokeRect(mousex, mousey, names.building[buildingID].length * 10, 16);
            ctx4.fillStyle = "#FFFFFF";
            ctx4.fillText(names.building[buildingID], mousex + 2, mousey + 10);
            return;
        }
        let tileID = this.tileAtByPixel(x, y);
        ctx4.fillStyle = "#0033CC";
        ctx4.fillRect(mousex, mousey, names.tile[tileID].length * 10, 16);
        ctx4.strokeStyle = "#000000";
        ctx4.strokeRect(mousex, mousey, names.tile[tileID].length * 10, 16);
        ctx4.fillStyle = "#FFFFFF";
        ctx4.fillText(names.tile[tileID], mousex + 2, mousey + 10);
        return;
    }
    export() {
        let chunkOutput = {};
        for (var [position, chunk] of this.storage.entries()) {
            let output = chunk.export();
            if (output) {
                chunkOutput[position] = output;
            }
        }
        let items = [];
        for (var item of this.items) {
            items.push(item.export());
        }
        var output = {
            chunks: chunkOutput,
            items: items,
            resources: this.resources,
            seed: this.seed
        };
        return output;
    }
}
class Chunk {
    constructor({ x, y, seed, parent }, data) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        let tweakedX = x == 0 ? 5850 : x;
        let tweakedY = y == 0 ? 9223 : y;
        this.chunkSeed = Math.abs((((tweakedX) ** 3) * (tweakedY ** 5) + 3850) % (2 ** 16));
        this.generator = pseudoRandom(this.chunkSeed);
        this.layers = [
            null,
            null,
            null
        ];
        this.layers[0] = [];
        for (let x = 0; x < Globals.CHUNK_SIZE; x++) {
            this.layers[0][x] = [];
            for (let z = 0; z < Globals.CHUNK_SIZE; z++) {
                this.layers[0][x].push(0xFF);
            }
        }
        this.layers[1] = [];
        for (let x = 0; x < Globals.CHUNK_SIZE; x++) {
            this.layers[1][x] = [];
            for (let z = 0; z < Globals.CHUNK_SIZE; z++) {
                this.layers[1][x].push(null);
            }
        }
        this.layers[2] = [];
        for (let x = 0; x < Globals.CHUNK_SIZE; x++) {
            this.layers[2][x] = [];
            for (let z = 0; z < Globals.CHUNK_SIZE; z++) {
                this.layers[2][x].push(null);
            }
        }
        if (data) {
            for (let y in data[0]) {
                for (let x in data[0][y]) {
                    let buildingData = data[0][y][x];
                    if (!buildingData)
                        continue;
                    let tempBuilding = new BuildingType[buildingData.id % 0x100](parseInt(x) + (Globals.CHUNK_SIZE * this.x), parseInt(y) + (Globals.CHUNK_SIZE * this.y), buildingData.id, this.parent);
                    if (buildingData.item) {
                        tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id, this.parent);
                        tempBuilding.item.grabbedBy = tempBuilding;
                    }
                    if (buildingData.inv) {
                        for (var itemData of buildingData.inv) {
                            let tempItem = new Item(itemData.x, itemData.y, itemData.id, this.parent);
                            tempItem.grabbedBy = tempBuilding;
                            tempBuilding.inventory.push(tempItem);
                        }
                    }
                    this.layers[1][y][x] = tempBuilding;
                }
            }
            for (let y in data[1]) {
                for (let x in data[1][y]) {
                    let buildingData = data[1][y][x];
                    if (!buildingData)
                        continue;
                    let tempBuilding = new Extractor(parseInt(x) + (Globals.CHUNK_SIZE * this.x), parseInt(y) + (Globals.CHUNK_SIZE * this.y), buildingData.id, this.parent);
                    if (buildingData.item) {
                        tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id, this.parent);
                        tempBuilding.item.grabbedBy = tempBuilding;
                    }
                    this.layers[2][y][x] = tempBuilding;
                }
            }
        }
        return this;
    }
    update() {
        for (let row of this.layers[1]) {
            for (let value of row) {
                if (typeof value?.["update"] == "function") {
                    value["update"]();
                }
            }
        }
        for (let row of this.layers[2]) {
            for (let value of row) {
                if (typeof value?.["update"] == "function") {
                    value["update"](undefined);
                }
            }
        }
        return this;
    }
    tileAt(tileX, tileY) {
        return this.layers[0]?.[tileY]?.[tileX] ?? null;
    }
    buildingAt(tileX, tileY) {
        return this.layers[1]?.[tileY]?.[tileX] ?? null;
    }
    extractorAt(tileX, tileY) {
        return this.layers[2]?.[tileY]?.[tileX] ?? null;
    }
    setTile(tileX, tileY, value) {
        if (this.tileAt(tileX, tileY) == null) {
            return false;
        }
        this.layers[0][tileY][tileX] = value;
        return true;
    }
    setBuilding(tileX, tileY, value) {
        if (this.tileAt(tileX, tileY) == null) {
            return false;
        }
        this.layers[1][tileY][tileX] = value;
        return true;
    }
    setExtractor(tileX, tileY, value) {
        if (this.tileAt(tileX, tileY) == null) {
            return false;
        }
        this.layers[2][tileY][tileX] = value;
        return true;
    }
    /**
     * @deprecated
     */
    displayToConsole() {
        console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
        console.table(this.layers[0]);
    }
    generate() {
        //This... needs to be refactored. Oh well.
        let isWet = false;
        let isHilly = false;
        let distanceFromSpawn = Math.sqrt(this.x ** 2 + this.y ** 2);
        let distanceBoost = constrain(Math.log((distanceFromSpawn / generation_consts.ore_scale) + 0.5) / 2, 0, 0.6);
        //A value added to the perlin noise on each tile to make the amount of stone/ore increase, scales as you go further out.
        if (this.generator.next().value < 0.07 && distanceFromSpawn > generation_consts.min_water_chunk_distance) {
            isWet = true;
        }
        else if (distanceBoost > generation_consts.hilly.terrain_cutoff) {
            isHilly = true;
        }
        if (isWet) { //Generator for wet chunks.
            for (var row in this.layers[0]) {
                for (var tile in this.layers[0][row]) {
                    //Choose the tile to be placed:
                    if (row == "0" || row == "15" || tile == "0" || tile == "15") {
                        this.layers[0][row][tile] = 0x02; //If on edge, place water
                    }
                    else if (row == "1" || row == "14" || tile == "1" || tile == "14") {
                        this.layers[0][row][tile] = this.generator.next().value > 0.5 ? 0x01 : 0x02; //If near edge, place 50-50 stone or water		
                    }
                    else {
                        this.layers[0][row][tile] =
                            this.generator.next().value < 0.1 ?
                                (this.generator.next().value < 0.3 ? 0x11 : 0x10)
                                : 0x01;
                        //Otherwise, stone, iron, or coal.
                    }
                }
            }
        }
        else if (isHilly) {
            //Hilly terrain generator:
            //Based on perlin noise.
            //Chooses which ore to generate based on RNG and ditance from spawn.
            let oreToGenerate = 0xFF;
            let oreRand = this.generator.next().value;
            if (distanceFromSpawn < generation_consts.hilly.min_iron_distance) {
                oreToGenerate = 0x10;
            }
            else if (distanceFromSpawn < generation_consts.hilly.min_copper_distance) {
                oreToGenerate = oreRand > 0.5 ? 0x10 : 0x11;
            }
            else {
                oreToGenerate = oreRand > 0.5 ? 0x10 : (oreRand > 0.25 ? 0x11 : 0x12);
            }
            for (var row in this.layers[0]) {
                for (var tile in this.layers[0][row]) {
                    //Choose the tile to be placed:
                    let noiseHeight = Math.abs(noise.perlin2(((this.x * Globals.CHUNK_SIZE) + +tile + this.parent.seed) / generation_consts.perlin_scale, ((this.y * Globals.CHUNK_SIZE) + +row + (this.parent.seed + generation_consts.y_offset)) / generation_consts.perlin_scale));
                    //This formula just finds the perlin noise value at a tile, but tweaked so it's different per seed and not mirrored diagonally.
                    if ((noiseHeight + distanceBoost / 2) > generation_consts.hilly.ore_threshold) {
                        this.layers[0][row][tile] = oreToGenerate;
                    }
                    else if ((noiseHeight + distanceBoost) > generation_consts.hilly.stone_threshold) {
                        this.layers[0][row][tile] = 0x01;
                    }
                    else {
                        this.layers[0][row][tile] = 0x00;
                    }
                }
            }
        }
        else {
            //Old terrain generation. I kept it, just only close to spawn.
            for (var row in this.layers[0]) {
                for (var tile in this.layers[0][row]) {
                    this.layers[0][row][tile] = 0x00;
                }
            }
            let oreToGenerate = 0xFF;
            if (distanceFromSpawn < 3) {
                oreToGenerate = 0x10;
            }
            else {
                oreToGenerate = (this.generator.next().value > 0.5) ? 0x11 : 0x10;
            }
            let hill_x = Math.floor(this.generator.next().value * 16);
            let hill_y = Math.floor(this.generator.next().value * 16);
            //Makes a "hill", with an ore node in the middle, stone on the sides, and maybe stone in the corners.
            this.setTile(hill_x, hill_y, oreToGenerate);
            this.setTile(hill_x + 1, hill_y, 0x01);
            this.setTile(hill_x - 1, hill_y, 0x01);
            this.setTile(hill_x, hill_y + 1, 0x01);
            this.setTile(hill_x, hill_y - 1, 0x01);
            this.setTile(hill_x + 1, hill_y + 1, (this.generator.next().value > 0.5) ? 0x01 : 0x00);
            this.setTile(hill_x + 1, hill_y - 1, (this.generator.next().value > 0.5) ? 0x01 : 0x00);
            this.setTile(hill_x - 1, hill_y + 1, (this.generator.next().value > 0.5) ? 0x01 : 0x00);
            this.setTile(hill_x - 1, hill_y - 1, (this.generator.next().value > 0.5) ? 0x01 : 0x00);
        }
        return this;
    }
    display(currentframe) {
        if ((Game.scroll.x * Globals.DISPLAY_SCALE) + this.x * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE > window.innerWidth + 1 ||
            (Game.scroll.x * Globals.DISPLAY_SCALE) + this.x * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE < -1 - Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE ||
            (Game.scroll.y * Globals.DISPLAY_SCALE) + this.y * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE > window.innerHeight + 1 ||
            (Game.scroll.y * Globals.DISPLAY_SCALE) + this.y * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE < -1 - Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE) {
            return;
        } //if offscreen return immediately
        currentframe.cps++;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        if (currentframe.redraw) {
            for (let y = 0; y < this.layers[0].length; y++) {
                for (let x = 0; x < this.layers[0][y].length; x++) {
                    this.displayTile(x, y, currentframe);
                }
            }
        }
        for (let y = 0; y < this.layers[1].length; y++) {
            for (let x = 0; x < this.layers[1][y].length; x++) {
                this.displayBuilding(x, y, this.buildingAt(tileToChunk(x), tileToChunk(y))?.id ?? 0xFFFF);
                this.layers[1][y][x]?.display?.(currentframe);
            }
        }
        for (let y = 0; y < this.layers[2].length; y++) {
            for (let x = 0; x < this.layers[2][y].length; x++) {
                if (this.layers[2][y][x]) {
                    this.displayL3(x, y, this.layers[2][y][x]?.id ?? 0xFFFF);
                    this.layers[2][y][x].display(currentframe);
                }
            }
        }
        if (currentframe.debug) {
            ctx4.strokeStyle = "#0000FF";
            ctx4.strokeRect(this.x * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE + (Game.scroll.x * Globals.DISPLAY_SCALE), this.y * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE + (Game.scroll.y * Globals.DISPLAY_SCALE), Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE, Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE);
        }
    }
    displayTile(x, y, currentframe) {
        currentframe.tps++;
        let pixelX = ((this.x * Globals.CHUNK_SIZE) + x) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.x * Globals.DISPLAY_SCALE);
        let pixelY = ((this.y * Globals.CHUNK_SIZE) + y) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.y * Globals.DISPLAY_SCALE);
        if (settings.graphics_mode || (this.tileAt(x, y) != 0x00)) {
            if (textures.get("t" + this.tileAt(x, y).toString())) {
                ctx.drawImage(textures.get("t" + this.tileAt(x, y).toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
            }
            else {
                ctx.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2);
                rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2);
                ctx.fillStyle = "#000000";
                rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2);
                rect(pixelX, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2);
                ctx.font = "15px sans-serif";
                ctx.fillStyle = "#00FF00";
                ctx.fillText(this.tileAt(x, y).toString(), pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2);
            }
        }
        else {
            ctx.fillStyle = "#00CC33";
            rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
        }
        if (currentframe.debug)
            ctx.strokeRect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
    }
    displayBuilding(x, y, buildingID, isGhost) {
        if (buildingID == 0xFFFF) {
            return;
        }
        let pixelX = ((this.x * Globals.CHUNK_SIZE) + x) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.x * Globals.DISPLAY_SCALE);
        let pixelY = ((this.y * Globals.CHUNK_SIZE) + y) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.y * Globals.DISPLAY_SCALE);
        let _ctx = isGhost ? ctx1 : ctx2;
        if (isGhost == 2) {
            _ctx.strokeStyle = "#FF0000";
            _ctx.fillStyle = "#FF0000";
            _ctx.lineWidth = 2;
        }
        else if (isGhost == 1) {
            _ctx.strokeStyle = "#444444";
            _ctx.fillStyle = "#444444";
            _ctx.lineWidth = 1;
        }
        else if (textures.get(buildingID.toString())) {
            return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
        }
        else if (settings.debug && false) {
            _ctx.fillStyle = "#FF00FF";
            rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.fillStyle = "#000000";
            rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.font = "15px sans-serif";
            _ctx.fillStyle = "#00FF00";
            _ctx.fillText(this.buildingAt(x, y).toString(), pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2);
        }
        switch (buildingID) { //TypeScript big dum dum
            case 0x0001:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.6, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.6, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0101:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.stroke();
                break;
            case 0x0201:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0301:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 0.4);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.4);
                _ctx.stroke();
                break;
            case 0x0401:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.6, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.6, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0501:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.6, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.6, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0601:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.stroke();
                break;
            case 0x0701:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.stroke();
                break;
            case 0x0801:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0901:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0A01:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 0.4);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.4);
                _ctx.stroke();
                break;
            case 0x0B01:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 0.4);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.4);
                _ctx.stroke();
                break;
            case 0x0002:
                rect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.6, rectMode.CENTER, _ctx);
                break;
            case 0x0003:
                rect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.6, rectMode.CENTER, _ctx);
                rect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1, Globals.DISPLAY_TILE_SIZE * 0.8, Globals.DISPLAY_TILE_SIZE * 0.1, rectMode.CORNER, _ctx);
                break;
            case 0x0004:
                rect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5, Globals.DISPLAY_TILE_SIZE * 0.8, Globals.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER, _ctx);
                _ctx.fillStyle = "#FFCC11";
                rect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5, Globals.DISPLAY_TILE_SIZE * 0.4, Globals.DISPLAY_TILE_SIZE * 0.4, rectMode.CENTER, _ctx);
                break;
            case 0x0005:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 1.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 1.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 1.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 1.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0105:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 1.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 1.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 1.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 1.1);
                _ctx.stroke();
                break;
            case 0x0205:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * -0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0305:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -0.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * -0.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -0.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * -0.1);
                _ctx.stroke();
                break;
            case 0x0405:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 2.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 2.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 2.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 2.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0505:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 2.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 2.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 2.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 2.1);
                _ctx.stroke();
                break;
            case 0x0605:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -1.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -1.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * -1.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -1.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0705:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -1.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * -1.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -1.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * -1.1);
                _ctx.stroke();
                break;
            case 0x0805:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 3.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 3.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 3.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 3.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0905:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 3.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 3.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 3.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 3.1);
                _ctx.stroke();
                break;
            case 0x0A05:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -2.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -2.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * -2.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -2.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0B05:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -2.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * -2.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -2.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * -2.1);
                _ctx.stroke();
                break;
            case 0x0006:
                rect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5, Globals.DISPLAY_TILE_SIZE * 0.8, Globals.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER, _ctx);
                _ctx.fillStyle = "#CCCCCC";
                rect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.45, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1, Globals.DISPLAY_TILE_SIZE * 0.1, Globals.DISPLAY_TILE_SIZE * 0.3, rectMode.CORNER, _ctx);
                break;
            case 0x0007:
                rect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5, Globals.DISPLAY_TILE_SIZE * 0.8, Globals.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER, _ctx);
                _ctx.fillStyle = "#FF0000";
                rect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5, Globals.DISPLAY_TILE_SIZE * 0.4, Globals.DISPLAY_TILE_SIZE * 0.4, rectMode.CENTER, _ctx);
                break;
            default:
                _ctx.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                _ctx.fillStyle = "#000000";
                rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                rect(pixelX, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                _ctx.font = "15px sans-serif";
                _ctx.fillStyle = "#00FF00";
                _ctx.fillText(buildingID.toString(), pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2);
                break;
        }
    }
    displayL3(x, y, buildingID, isGhost) {
        if (buildingID == 0xFFFF) {
            return;
        }
        let pixelX = ((this.x * Globals.CHUNK_SIZE) + x) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.x * Globals.DISPLAY_SCALE);
        let pixelY = ((this.y * Globals.CHUNK_SIZE) + y) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.y * Globals.DISPLAY_SCALE);
        let _ctx = isGhost ? ctx1 : ctx25;
        if (isGhost == 2) {
            _ctx.strokeStyle = "#FF0000";
            _ctx.fillStyle = "#FF0000";
            _ctx.lineWidth = 2;
        }
        else if (isGhost == 1) {
            _ctx.strokeStyle = "#444444";
            _ctx.fillStyle = "#444444";
            _ctx.lineWidth = 1;
        }
        else if (textures.get(buildingID.toString())) {
            switch (buildingID) {
                case 0x0005:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE);
                case 0x0105:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 2);
                case 0x0205:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX - Globals.DISPLAY_TILE_SIZE, pixelY, Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE);
                case 0x0305:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 2);
                case 0x0405:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE);
                case 0x0505:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 3);
                case 0x0605:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX - Globals.DISPLAY_TILE_SIZE * 2, pixelY, Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE);
                case 0x0705:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 3);
                case 0x0805:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 4, Globals.DISPLAY_TILE_SIZE);
                case 0x0905:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 4);
                case 0x0A05:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX - Globals.DISPLAY_TILE_SIZE * 3, pixelY, Globals.DISPLAY_TILE_SIZE * 4, Globals.DISPLAY_TILE_SIZE);
                case 0x0B05:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 4);
            }
        }
        else if (settings.debug && false) {
            _ctx.fillStyle = "#FF00FF";
            rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.fillStyle = "#000000";
            rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.font = "15px sans-serif";
            _ctx.fillStyle = "#00FF00";
            _ctx.fillText(this.buildingAt(x, y).toString(), pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2);
        }
        switch (buildingID) { //TypeScript big dum dum
            case 0x0005:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 1.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 1.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 1.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 1.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0105:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 1.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 1.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 1.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 1.1);
                _ctx.stroke();
                break;
            case 0x0205:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * -0.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0305:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -0.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * -0.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -0.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * -0.1);
                _ctx.stroke();
                break;
            case 0x0405:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 2.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 2.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 2.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 2.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0505:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 2.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 2.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 2.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 2.1);
                _ctx.stroke();
                break;
            case 0x0605:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -1.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -1.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * -1.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -1.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0705:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -1.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * -1.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -1.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * -1.1);
                _ctx.stroke();
                break;
            case 0x0805:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 3.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 3.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 3.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 3.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0905:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 3.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * 3.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 3.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 3.1);
                _ctx.stroke();
                break;
            case 0x0A05:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.2, Globals.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.9, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -2.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -2.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * -2.4, pixelY + Globals.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * -2.1, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0B05:
                _ctx.fillRect(pixelX + Globals.DISPLAY_TILE_SIZE * 0.2, pixelY + Globals.DISPLAY_TILE_SIZE * 0.7, Globals.DISPLAY_TILE_SIZE * 0.6, Globals.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -2.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.3, pixelY + Globals.DISPLAY_TILE_SIZE * -2.1);
                _ctx.moveTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.5, pixelY + Globals.DISPLAY_TILE_SIZE * -2.4);
                _ctx.lineTo(pixelX + Globals.DISPLAY_TILE_SIZE * 0.7, pixelY + Globals.DISPLAY_TILE_SIZE * -2.1);
                _ctx.stroke();
                break;
            default:
                _ctx.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                _ctx.fillStyle = "#000000";
                rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                rect(pixelX, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                _ctx.font = "15px sans-serif";
                _ctx.fillStyle = "#00FF00";
                _ctx.fillText(buildingID.toString(), pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2);
                break;
        }
    }
    export() {
        let exportDataL1 = [];
        var hasBuildings = false;
        for (let row of this.layers[1]) {
            let tempRow = [];
            for (let building of row) {
                if (building instanceof Building) {
                    hasBuildings = true;
                }
                tempRow.push(building?.export() ?? null);
            }
            exportDataL1.push(tempRow);
        }
        let exportDataL2 = [];
        for (let row of this.layers[2]) {
            let tempRow = [];
            for (let extractor of row) {
                if (extractor instanceof Extractor) {
                    hasBuildings = true;
                }
                tempRow.push(extractor?.export() ?? null);
            }
            exportDataL2.push(tempRow);
        }
        if (hasBuildings) {
            return [exportDataL1, exportDataL2];
        }
        else {
            return null;
        }
    }
}
class Item {
    constructor(x, y, id, level) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.level = level;
        this.grabbedBy = null;
        this.deleted = false;
        if (this.id == ItemID.base_null) {
            this.startX = x;
            this.startY = y;
        }
    }
    update(currentframe) {
        if (Game.tutorial.conveyor.beltchain && Game.persistent.tutorialenabled && ((Math.abs(this.startX - this.x) + 1 > Globals.TILE_SIZE * 2) || (Math.abs(this.startY - this.y) + 1 > Globals.TILE_SIZE * 2))) {
            _alert("Nice!\nConveyor belts are also the way to put items in machines.\nSpeaking of which, let's try automating coal: Place a Miner(2 key).");
            Game.tutorial.conveyor.beltchain = false;
        }
        if (this.deleted) {
            //do stuff
        }
    }
    display(currentframe) {
        if (Globals.DISPLAY_SCALE * (this.x + Game.scroll.x - 8) < 0 ||
            Globals.DISPLAY_SCALE * (this.x + Game.scroll.x - 8) > window.innerWidth ||
            Globals.DISPLAY_SCALE * (this.y + Game.scroll.y - 8) < 0 ||
            Globals.DISPLAY_SCALE * (this.y + Game.scroll.y - 8) > window.innerHeight) {
            return;
        } //if offscreen return immediately
        currentframe.ips++;
        ctx3.drawImage(textures.get("item_" + this.id), this.x * Globals.DISPLAY_SCALE + (Game.scroll.x * Globals.DISPLAY_SCALE) - 8 * Globals.DISPLAY_SCALE, this.y * Globals.DISPLAY_SCALE + (Game.scroll.y * Globals.DISPLAY_SCALE) - 8 * Globals.DISPLAY_SCALE, 16 * Globals.DISPLAY_SCALE, 16 * Globals.DISPLAY_SCALE);
        if (keysPressed.indexOf("Shift") != -1) {
            var x = (mouseX - (Game.scroll.x * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_SCALE;
            var y = (mouseY - (Game.scroll.y * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_SCALE;
            //alert(this.x + " " + this.y + "  " + x + " " + y);
            if (x > this.x - (8 * Globals.DISPLAY_SCALE) &&
                y > this.y - (8 * Globals.DISPLAY_SCALE) &&
                x < this.x + (8 * Globals.DISPLAY_SCALE) &&
                y < this.y + (8 * Globals.DISPLAY_SCALE)) {
                ctx4.font = "16px monospace";
                ctx4.fillStyle = "#0033CC";
                ctx4.fillRect(mouseX, mouseY, names.item[this.id].length * 10, 16);
                ctx4.strokeStyle = "#000000";
                ctx4.strokeRect(mouseX, mouseY, names.item[this.id].length * 10, 16);
                ctx4.fillStyle = "#FFFFFF";
                ctx4.fillText(names.item[this.id], mouseX + 2, mouseY + 10);
                if (currentframe?.tooltip) {
                    currentframe.tooltip = false;
                }
            }
        }
    }
    export() {
        if (this.deleted)
            return null;
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            grabbedBy: this.grabbedBy ? { x: this.grabbedBy.x, y: this.grabbedBy.y } : null
        };
    }
}
class Building {
    constructor(tileX, tileY, id, level) {
        this.x = tileX;
        this.y = tileY;
        this.id = id;
        this.level = level;
        this.inventory = null;
    }
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY) != 0x02;
    }
    break() {
        if (this.item) {
            this.item.grabbedBy = null;
        }
        if (this.inventory) {
            for (var item of this.inventory) {
                item.grabbedBy = null;
            }
        }
    }
    hasItem() {
        if (this.item)
            return this.item;
        if (this.inventory && this.inventory?.length != 0)
            return this.inventory[0];
        return null;
    }
    removeItem() {
        if (this.item) {
            var temp = this.item;
            this.item = null;
            return temp;
        }
        if (this.inventory?.length > 0) {
            return this.inventory.pop();
        }
        return null;
    }
    spawnItem(id) {
        id ??= "base_null";
        if ((this.level.buildingIDAtTile(this.x + 1, this.y) === 0x0001 ||
            this.level.buildingIDAtTile(this.x + 1, this.y) === 0x0701 ||
            this.level.buildingIDAtTile(this.x + 1, this.y) === 0x0B01) &&
            this.level.buildingAtTile(this.x + 1, this.y).item == null) {
            this.level.addItem(this.x * Globals.TILE_SIZE + Globals.TILE_SIZE * 1.1, this.y * Globals.TILE_SIZE + Globals.TILE_SIZE * 0.5, id);
        }
        else if ((this.level.buildingIDAtTile(this.x, this.y + 1) === 0x0101 ||
            this.level.buildingIDAtTile(this.x, this.y + 1) === 0x0501 ||
            this.level.buildingIDAtTile(this.x, this.y + 1) === 0x0901) &&
            this.level.buildingAtTile(this.x, this.y + 1).item == null) {
            this.level.addItem(this.x * Globals.TILE_SIZE + Globals.TILE_SIZE * 0.5, this.y * Globals.TILE_SIZE + Globals.TILE_SIZE * 1.1, id);
        }
        else if ((this.level.buildingIDAtTile(this.x - 1, this.y) === 0x0201 ||
            this.level.buildingIDAtTile(this.x - 1, this.y) === 0x0601 ||
            this.level.buildingIDAtTile(this.x - 1, this.y) === 0x0A01) &&
            this.level.buildingAtTile(this.x - 1, this.y).item == null) {
            this.level.addItem(this.x * Globals.TILE_SIZE - Globals.TILE_SIZE * 0.1, this.y * Globals.TILE_SIZE + Globals.TILE_SIZE * 0.5, id);
        }
        else if ((this.level.buildingIDAtTile(this.x, this.y - 1) === 0x0301 ||
            this.level.buildingIDAtTile(this.x, this.y - 1) === 0x0401 ||
            this.level.buildingIDAtTile(this.x, this.y - 1) === 0x0801) &&
            this.level.buildingAtTile(this.x, this.y - 1).item == null) {
            this.level.addItem(this.x * Globals.TILE_SIZE + Globals.TILE_SIZE * 0.5, this.y * Globals.TILE_SIZE - Globals.TILE_SIZE * 0.1, id);
        }
        else {
            return false;
        }
        if (Game.persistent.tutorialenabled && id == ItemID.base_coal && Game.tutorial.item.coal) {
            _alert("Congratulations! You just automated coal!");
            _alert(["Try doing the same thing for iron: Iron nodes are whiteish and are a bit further from the center of the map.\nUse WASD to scroll.", 3000]);
            Game.tutorial.item.coal = false;
        }
        if (Game.persistent.tutorialenabled && id == ItemID.base_ironIngot && Game.tutorial.item.iron) {
            _alert("Nice job!");
            Game.tutorial.item.iron = false;
            _alert(["The next automateable resource is steel.\nYou'll need to use the alloy smelter(slot 7), which needs two inputs(coal and iron).", 3000]);
        }
        return true;
    }
    grabItem(filter, callback, remove, grabDistance) {
        grabDistance ??= 0.5;
        filter ??= () => { return true; };
        for (var item in this.level.items) {
            if ((Math.abs(this.level.items[item].x - ((this.x + grabDistance) * Globals.TILE_SIZE)) <= Globals.TILE_SIZE * grabDistance) &&
                (Math.abs(this.level.items[item].y - ((this.y + grabDistance) * Globals.TILE_SIZE)) <= Globals.TILE_SIZE * grabDistance) &&
                filter(this.level.items[item])) {
                this.level.items[item].grabbedBy = this;
                callback(this.level.items[item]);
                let returnItem = this.level.items[item];
                if (remove) {
                    this.level.items.splice(parseInt(item), 1);
                }
                return returnItem;
            }
        }
        return null;
    }
    acceptItem(item) {
        if (this.item === null) {
            this.item = item;
        }
        else if (this.inventory?.length < this.inventory?.MAX_LENGTH) {
            this.inventory.push(item);
        }
        else {
            return false;
        }
        item.grabbedBy = this;
        return true;
    }
    export() {
        var inv = [];
        if (this.inventory) {
            for (var item of this.inventory) {
                inv.push(item.export());
            }
        }
        return {
            x: this.x,
            y: this.y,
            id: this.id,
            item: this.item?.export(),
            inv: inv
        };
    }
}
class Miner extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.timer = 61;
        this.miningItem = oreFor[level.tileAtByTile(tileX, tileY)];
    }
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY) >> 4 == 1;
    }
    update() {
        if (this.timer > 0) {
            this.timer--;
        }
        else {
            this.timer = 61;
            if (this.spawnItem(this.miningItem)) {
                if (Game.tutorial.miner.firstoutput && Game.persistent.tutorialenabled && this.miningItem == ItemID.base_coalOre) {
                    _alert("Nice!\nThis is just coal ore though, not coal. Try placing a furnace(4 key).\nOh also, remember you can scroll to zoom in on that beautiful coal ore texture.");
                    Game.tutorial.miner.firstoutput = false;
                }
            }
        }
    }
}
const oreFor = {
    0x10: ItemID.base_coalOre,
    0x11: ItemID.base_ironOre,
    0x12: ItemID.base_copperOre
};
function smeltFor(item) {
    switch (item instanceof Item ? item.id : item) {
        case ItemID.base_coalOre: return ItemID.base_coal;
        case ItemID.base_ironOre: return ItemID.base_ironIngot;
        case ItemID.base_copperOre: return ItemID.base_copperIngot;
    }
    return null;
}
class TrashCan extends Building {
    update() {
        this.grabItem(_ => { return true; }, item => { item.deleted = true; }, true);
    }
    acceptItem(item) {
        return true;
    }
}
class Furnace extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.timer = 29;
        this.item = null;
    }
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY) == 0x01;
    }
    update() {
        if (this.timer > 0 && this.item) {
            this.timer--;
        }
        else if (this.timer <= 0 && this.item) {
            if (this.spawnItem(smeltFor(this.item.id))) {
                this.timer = 30;
                this.item = null;
            }
        }
        else if (!this.item) {
            this.grabItem(smeltFor, (item) => {
                this.item = item;
            }, true);
        }
    }
}
class Conveyor extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.item = null;
    }
    break() {
        if (this.item instanceof Item) {
            this.level.items.push(this.item);
            if (this.item.grabbedBy === this) {
                this.item.grabbedBy = null;
            }
        }
        this.item = null;
    }
    display(currentFrame) {
        if (this.item instanceof Item) {
            this.item.display(currentFrame);
        }
    }
    update(currentframe, nograb) {
        if (this.item instanceof Item) {
            if (Math.floor(this.item.x / Globals.TILE_SIZE) != this.x || Math.floor(this.item.y / Globals.TILE_SIZE) != this.y) {
                let building = this.level.buildingAtTile(Math.floor(this.item.x / Globals.TILE_SIZE), Math.floor(this.item.y / Globals.TILE_SIZE));
                if (!building)
                    return;
                if (building.acceptItem(this.item)) {
                    this.item = null;
                }
                return;
            }
            switch (this.id >> 8) { //bit masks ftw, this just grabs the first byte
                //yes I know there's no need to write the ids in hex but why the heck not
                case 0x00:
                    this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    this.item.x += Globals.buildings.conveyor.SPEED;
                    break;
                case 0x01:
                    this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    this.item.y += Globals.buildings.conveyor.SPEED;
                    break;
                case 0x02:
                    this.item.x -= Globals.buildings.conveyor.SPEED;
                    this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    break;
                case 0x03:
                    this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    this.item.y -= Globals.buildings.conveyor.SPEED;
                    break;
                case 0x04:
                    if (pixelToTile(this.item.x) >= Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5) {
                        this.item.x++;
                        this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    }
                    else if (pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= Globals.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                        this.item.y--;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
                    }
                    break;
                case 0x05:
                    if (pixelToTile(this.item.x) >= Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5) {
                        this.item.x++;
                        this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    }
                    else if (pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= Globals.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                        this.item.y++;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
                    }
                    break;
                case 0x06:
                    if (pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= Globals.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                        this.item.y++;
                    }
                    else if (pixelToTile(this.item.x) > Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5) {
                        this.item.x--;
                        this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
                    }
                    break;
                case 0x07:
                    if (pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= Globals.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                        this.item.y++;
                    }
                    else if (pixelToTile(this.item.x) < Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5) {
                        this.item.x++;
                        this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
                    }
                    break;
                case 0x08:
                    if (pixelToTile(this.item.x) <= Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5) {
                        this.item.x--;
                        this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    }
                    else if (pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= Globals.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                        this.item.y--;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
                    }
                    break;
                case 0x09:
                    if (pixelToTile(this.item.x) <= Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5) {
                        this.item.x--;
                        this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    }
                    else if (pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= Globals.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                        this.item.y++;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
                    }
                    break;
                case 0x0A:
                    if (pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= Globals.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                        this.item.y--;
                    }
                    else if (pixelToTile(this.item.x) > Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5) {
                        this.item.x--;
                        this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
                    }
                    break;
                case 0x0B:
                    if (pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= Globals.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                        this.item.y--;
                    }
                    else if (pixelToTile(this.item.x) < Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5) {
                        this.item.x++;
                        this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE / 2;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
                    }
                    break;
            }
        }
        else if (!nograb) {
            this.grabItem(null, (item) => { this.item = item; }, true);
        }
    }
}
class Extractor extends Conveyor {
    constructor(x, y, id, level) {
        super(x, y, id, level);
    }
    display(currentFrame) {
        if (this.item instanceof Item) {
            this.item.display(currentFrame);
        }
    }
    grabItemFromTile(filter, callback, remove, grabDistance) {
        filter ??= (item) => { return item instanceof Item; };
        callback ??= () => { };
        if (this.level.buildingAtTile(this.x, this.y) instanceof Building &&
            this.level.buildingAtTile(this.x, this.y).hasItem() &&
            filter(this.level.buildingAtTile(this.x, this.y).hasItem())) {
            let item = this.level.buildingAtTile(this.x, this.y).removeItem();
            if (!(item instanceof Item))
                throw "what even";
            if (item.deleted)
                throw "wat?";
            this.item = item;
            this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
            this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
            item.grabbedBy = this;
            if (this.level.items.indexOf(item) != -1) {
                this.level.items.splice(this.level.items.indexOf(item), 1);
            }
        }
    }
    dropItem() {
        if (this.item instanceof Item) {
            if (this.level.buildingAtTile(tileAtPixel(this.item.x), tileAtPixel(this.item.y)) instanceof Conveyor && this.level.buildingAtTile(tileAtPixel(this.item.x), tileAtPixel(this.item.y)).item == null) {
                this.level.items.push(this.item);
                this.item = null;
            }
        }
        else {
            console.error(this);
            throw new Error(`no item to drop; extractor at ${this.x} ${this.y}`);
        }
    }
    update(currentFrame) {
        if (this.item instanceof Item) {
            if (this.item.grabbedBy != this || this.item.deleted) {
                console.error(this.item);
                console.error(this);
                throw new RangeError("ERR Item somehow grabbed or deleted from an extractor.");
            }
            switch (this.id) {
                case 0x0005:
                    if (this.item.x > (this.x + 1.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x++;
                    }
                    break;
                case 0x0105:
                    if (this.item.y > (this.y + 1.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y++;
                    }
                    break;
                case 0x0205:
                    if (this.item.x < (this.x - 0.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x--;
                    }
                    break;
                case 0x0305:
                    if (this.item.y < (this.y - 0.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y--;
                    }
                    break;
                case 0x0405:
                    if (this.item.x > (this.x + 2.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x++;
                    }
                    break;
                case 0x0505:
                    if (this.item.y > (this.y + 2.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y++;
                    }
                    break;
                case 0x0605:
                    if (this.item.x < (this.x - 1.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x--;
                    }
                    break;
                case 0x0705:
                    if (this.item.y < (this.y - 1.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y--;
                    }
                    break;
                case 0x0805:
                    if (this.item.x > (this.x + 3.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x++;
                    }
                    break;
                case 0x0905:
                    if (this.item.y > (this.y + 3.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y++;
                    }
                    break;
                case 0x0A05:
                    if (this.item.x < (this.x - 2.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x--;
                    }
                    break;
                case 0x0B05:
                    if (this.item.y < (this.y - 2.5) * Globals.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y--;
                    }
                    break;
            }
        }
        else {
            this.grabItemFromTile();
        }
    }
}
class StorageBuilding extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        let temp = [];
        temp.MAX_LENGTH = 64;
        this.inventory = temp;
    }
    update() {
        if (this.inventory.length < this.inventory.MAX_LENGTH) {
            this.grabItem(null, (item) => { this.inventory.push(item); }, true);
        }
    }
    grabItem(filter, callback, remove, grabDistance) {
        let item = super.grabItem(filter, callback, remove, grabDistance);
        if (item) {
            item.x = (this.x + 0.5) * Globals.TILE_SIZE;
            item.y = (this.y + 0.5) * Globals.TILE_SIZE;
            return item;
        }
        return null;
    }
}
let alloysFor = {
    "base_coal&base_ironIngot": "base_steelIngot",
    "base_ironIngot&base_coal": "base_steelIngot"
};
let totalAlloySmeltersRun = 0;
class AlloySmelter extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.timer = 240;
        this.item1 = null;
        this.item2 = null;
        this.processing = false;
        this.hasRunOnce = false;
    }
    acceptItem(item) {
        if (!this.item1) {
            this.item1 = item;
            return true;
        }
        if (!this.item2 && item.id != this.item1.id) {
            this.item2 = item;
            return true;
        }
        return false;
    }
    update() {
        if (!this.item1) {
            this.grabItem((item) => { return item.id != this.item2?.id; }, (item) => { this.item1 = item; }, true);
        }
        if (!this.item2) {
            this.grabItem((item) => { return item.id != this.item1?.id; }, (item) => { this.item2 = item; }, true);
        }
        if (this.item1 instanceof Item && this.item2 instanceof Item) {
            if (alloysFor[`${this.item1.id}&${this.item2.id}`]) {
                this.processing = true;
            }
        }
        if (this.processing) {
            if (this.timer > 0) {
                this.timer--;
            }
            else {
                if (!this.hasRunOnce) {
                    this.hasRunOnce = true;
                    totalAlloySmeltersRun++;
                    if (totalAlloySmeltersRun >= 4 && Game.persistent.tutorialenabled && Game.tutorial.multiplesteel) {
                        Game.tutorial.multiplesteel = false;
                        _alert("🎉🎉🎉🎉🎉🎉\nWell, that's all the content this game has to offer for now.\nCheck back later for more updates, especially once this game reaches beta.");
                    }
                }
                if (this.spawnItem(alloysFor[`${this.item1.id}&${this.item2.id}`])) {
                    if (Game.persistent.tutorialenabled && alloysFor[`${this.item1.id}&${this.item2.id}`] == ItemID["base_steelIngot"] && Game.tutorial.item.steel) {
                        _alert("Well done!\nThis game is in alpha, so steel isn't used for anything yet.");
                        Game.tutorial.item.steel = false;
                        _alert(["Hmm, that's REALLY slow.\nYou'll \"need\" more steel than that.\nParallelize!\nYou need to use the extractor(slot 5). It is special, because you can place it on top of other buildings.\nNote: use the comma and period keys to change the length of the extractor(you'll need to use this to make a bridge).\nGood luck!", 3000]);
                    }
                    this.timer = 240;
                    this.item1 = null;
                    this.item2 = null;
                    this.processing = false;
                }
            }
        }
    }
}
class ResourceAcceptor extends Building {
    acceptItem(item) {
        item.deleted = true;
        item.grabbedBy = null;
        if (!this.level.resources[item.id]) {
            this.level.resources[item.id] = 0;
        }
        this.level.resources[item.id]++;
        return true;
    }
    update() {
        this.grabItem(null, item => {
            item.deleted = true;
            item.grabbedBy = null;
            if (!this.level.resources[item.id]) {
                this.level.resources[item.id] = 0;
            }
            this.level.resources[item.id]++;
        }, true);
    }
}
const BuildingType = {
    0x01: Conveyor,
    0x02: Miner,
    0x03: TrashCan,
    0x04: Furnace,
    0x05: Extractor,
    0x06: StorageBuilding,
    0x07: AlloySmelter,
    0x08: ResourceAcceptor
};
