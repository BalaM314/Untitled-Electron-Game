let textures = new Map();
const names = {
    tile: {
        0x00: "Grass",
        0x01: "Stone",
        0x02: "Coal Ore Node",
        0x03: "Iron Ore Node",
        0x04: "Water"
    },
    building: {
        0x01: "Conveyor Belt",
        0x02: "Miner",
        0x03: "Trash Can",
        0x04: "Furnace",
        0x05: "Extractor",
        0x06: "Storage"
    },
    item: {
        "base_null": "Debug Item",
        "base_coalOre": "Coal Ore",
        "base_coal": "Coal",
        "base_ironOre": "Iron Ore",
        "base_ironIngot": "Iron Ingot"
    }
};
const ItemID = {
    "base_null": "base_null",
    "base_coalOre": "base_coalOre",
    "base_coal": "base_coal",
    "base_ironOre": "base_ironOre",
    "base_ironIngot": "base_ironIngot"
};
const rands = {
    x_prime: 1299689,
    y_prime: 1156709,
    hill_x: 89,
    hill_y: 11,
    ore_type: 103
};
const consts = {
    VERSION: "alpha 0.0.0",
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
class ChunkedDataStorage {
    constructor(seed, defaults) {
        this.storage = new Map();
        this.seed = seed ? seed : 0;
        this.defaults = defaults;
        this.format = consts.VERSION;
    }
    getChunk(tileX, tileY, dontGenerateChunk) {
        if (this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`)) {
            return this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`);
        }
        else if (!dontGenerateChunk) {
            return this.generateChunk(Math.floor(tileX / consts.CHUNK_SIZE), Math.floor(tileY / consts.CHUNK_SIZE));
        }
        else {
            return null;
        }
    }
    generateChunk(x, y) {
        if (this.storage.get(`${x},${y}`)) {
            return;
        }
        this.storage.set(`${x},${y}`, new Chunk(x, y, this.seed, this.defaults.layer1, this.defaults.layer2, this.defaults.layer3)
            .generate());
        console.log(`generated chunk ${x}, ${y}`);
        return this.storage.get(`${x},${y}`);
    }
    atLayer1ByPixel(pixelX, pixelY) {
        return this.getChunk(Math.floor(pixelX / consts.TILE_SIZE), Math.floor(pixelY / consts.TILE_SIZE)).atLayer1(tileToChunk(pixelX / consts.TILE_SIZE), tileToChunk(pixelY / consts.TILE_SIZE));
    }
    atLayer1ByTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).atLayer1(tileToChunk(tileX), tileToChunk(tileY));
    }
    writeTile(tileX, tileY, tile) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setLayer1(tileToChunk(tileX), tileToChunk(tileY), tile);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    generateNecessaryChunks() {
        var xOffset = -Math.floor((Game.scroll.x * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
        var yOffset = -Math.floor((Game.scroll.y * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
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
    }
}
class Level extends ChunkedDataStorage {
    constructor(seed) {
        super(seed, {
            layer1: 0x00,
            layer2: null,
            layer3: null
        });
        this.items = [];
    }
    buildingIDAtPixel(pixelX, pixelY) {
        return this.getChunk(Math.floor(pixelX / consts.TILE_SIZE), Math.floor(pixelY / consts.TILE_SIZE)).atLayer2(tileToChunk(pixelX / consts.TILE_SIZE), tileToChunk(pixelY / consts.TILE_SIZE))?.id ?? 0xFFFF;
    }
    buildingIDAtTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).atLayer2(tileToChunk(tileX), tileToChunk(tileY))?.id ?? 0xFFFF;
    }
    buildingAt(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).atLayer2(tileToChunk(tileX), tileToChunk(tileY));
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
        topConveyor = topConveyor == 0x0101 || topConveyor == 0x0601 || topConveyor == 0x0701;
        let rightConveyor = this.buildingIDAtTile(tileX + 1, tileY);
        rightConveyor = rightConveyor == 0x0201 || rightConveyor == 0x0801 || rightConveyor == 0x0901;
        let leftConveyor = this.buildingIDAtTile(tileX - 1, tileY);
        leftConveyor = leftConveyor == 0x0001 || leftConveyor == 0x0401 || leftConveyor == 0x0501;
        let bottomConveyor = this.buildingIDAtTile(tileX, tileY + 1);
        bottomConveyor = bottomConveyor == 0x0301 || bottomConveyor == 0x0A01 || bottomConveyor == 0x0B01;
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
            this.getChunk(tileX, tileY).setLayer2(tileToChunk(tileX), tileToChunk(tileY), building);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    writeBuildingToL3(tileX, tileY, building) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setLayer3(tileToChunk(tileX), tileToChunk(tileY), building);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    buildBuilding(tileX, tileY, building) {
        if (this.buildingIDAtTile(tileX, tileY) % 0x100 == building % 0x100) {
            this.buildingAt(tileX, tileY)?.break();
        }
        var tempBuilding;
        switch (building) {
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
                    _alert("The Furnace converts raw ores into their smelted forms. Simply point a conveyor belt carrying ores at it and \n>provide another belt<\n for it to output onto.");
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
                        _alert("The Miner can only be placed on a resource node.");
                        Game.tutorial.miner.cantbeplacedongrass = false;
                    }
                    return;
                }
                ;
                tempBuilding = new Miner(tileX, tileY, 0x0002, this);
                if (Game.tutorial.miner.placedcorrectly && Game.persistent.tutorialenabled) {
                    _alert("🎉🎉\nThe Miner mines ore nodes, producing one ore per second. \n>It auto-outputs to adjacent conveyor belts.<\nAlso, ore nodes are infinite.\nBe warned, the miner will continue producing ore forever, which could lead to lag.");
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
                    _alert("Conveyors are the way to move items around. \nYou can use the arrow keys to change the direction of placed belts. \nTry making a belt chain, then putting a debug item on it with Ctrl+click.");
                    Game.tutorial.conveyor.placedcorrectly = false;
                }
                tempBuilding = new Conveyor(tileX, tileY, this.getTurnedConveyor(tileX, tileY, building >> 8), this);
                break;
            default:
                return this.writeBuilding(tileX, tileY, new Building(tileX, tileY, building, this));
                break;
        }
        if (tempBuilding instanceof Extractor) {
            this.writeBuildingToL3(tileX, tileY, tempBuilding);
        }
        this.writeBuilding(tileX, tileY, tempBuilding);
        return true;
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
        var x = (mousex - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
        var y = (mousey - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
        ctx4.font = "16px monospace";
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
        let tileID = this.atLayer1ByPixel(x, y);
        ctx4.fillStyle = "#0033CC";
        ctx4.fillRect(mousex, mousey, names.tile[tileID].length * 10, 16);
        ctx4.strokeStyle = "#000000";
        ctx4.strokeRect(mousex, mousey, names.tile[tileID].length * 10, 16);
        ctx4.fillStyle = "#FFFFFF";
        ctx4.fillText(names.tile[tileID], mousex + 2, mousey + 10);
        return;
    }
}
class Chunk {
    constructor(x, y, seed, defaultValue1, defaultValue2, defaultValue3) {
        this.x = x;
        this.y = y;
        this.chunkSeed = Math.abs(Math.round(seed * (x ? x : 23) * rands.x_prime +
            seed * (y ? y : 133) * rands.y_prime +
            Math.pow((Math.abs(x + y) % 10) + 10, (seed % 10) + 10) +
            123456789)) % 2147483648;
        this.layers = [
            null,
            null,
            null //Reserved
        ];
        this.layers[0] = [];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[0][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[0][x].push(defaultValue1);
            }
        }
        this.layers[1] = [];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[1][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[1][x].push(defaultValue2);
            }
        }
        this.layers[2] = [];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[2][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[2][x].push(defaultValue3);
            }
        }
        return this;
    }
    generate() {
        //Put down the base
        this.isWet = this.chunkSeed < 134217728 && Math.abs(this.x) > 3 && Math.abs(this.y) > 3;
        for (var row in this.layers[0]) {
            for (var tile in this.layers[0][row]) {
                this.layers[0][row][tile] = (this.isWet ? 0x04 : 0x00); //TODO: somehow fix this, any bad
            }
        }
        if (!this.isWet) {
            this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, (((this.chunkSeed - rands.ore_type) % 3) > 1 && (Math.abs(this.x) > 1 || Math.abs(this.y) > 1)) ? 0x03 : 0x02);
            this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
            this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
            this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, 0x01);
            this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, 0x01);
            this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 4 > 1) ? 0x01 : 0x00);
            this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 8 > 3) ? 0x01 : 0x00);
            this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 16 > 7) ? 0x01 : 0x00);
            this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 32 > 15) ? 0x01 : 0x00);
        }
        if (this.isWet) {
            this.setLayer1(7, 7, 0x02);
            this.setLayer1(8, 7, 0x03);
            this.setLayer1(7, 8, 0x03);
            this.setLayer1(8, 8, 0x02);
            this.setLayer1(6, 7, 0x01);
            this.setLayer1(7, 6, 0x01);
            this.setLayer1(6, 8, 0x01);
            this.setLayer1(8, 6, 0x01);
            this.setLayer1(8, 9, 0x01);
            this.setLayer1(9, 8, 0x01);
            this.setLayer1(7, 9, 0x01);
            this.setLayer1(9, 7, 0x01);
        }
        return this;
    }
    update() {
        for (var row of this.layers[1]) {
            for (var value of row) {
                if (typeof value?.update == "function") {
                    value.update();
                }
            }
        }
        for (var row of this.layers[2]) {
            for (var value of row) {
                if (typeof value?.update == "function") {
                    value.update();
                }
            }
        }
        return this;
    }
    atLayer1(tileX, tileY) {
        return this.layers[0]?.[tileY]?.[tileX] ?? null;
    }
    atLayer2(x, y) {
        return this.layers[1]?.[y]?.[x] ?? null;
    }
    setLayer1(x, y, value) {
        if (this.atLayer1(x, y) == null) {
            return false;
        }
        this.layers[0][y][x] = value;
        return true;
    }
    setLayer2(x, y, value) {
        if (this.atLayer1(x, y) == null) {
            return false;
        }
        this.layers[1][y][x] = value;
        return true;
    }
    setLayer3(x, y, value) {
        if (this.atLayer1(x, y) == null) {
            return false;
        }
        this.layers[2][y][x] = value;
        return true;
    }
    /**
     * @deprecated
     */
    displayToConsole() {
        console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
        console.table(this.layers[0]);
    }
    display(currentframe) {
        if ((Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerWidth + 1 ||
            (Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE ||
            (Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerHeight + 1 ||
            (Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE) {
            return false;
        } //if offscreen return immediately
        currentframe.cps++;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        if (currentframe.redraw) {
            for (let y = 0; y < this.layers[0].length; y++) {
                for (let x = 0; x < this.layers[0][y].length; x++) {
                    this.displayTile(x, y, currentframe); //todo fix, any bad
                }
            }
            for (let y = 0; y < this.layers[0].length; y++) {
                for (let x = 0; x < this.layers[0][y].length; x++) {
                    this.displayBuilding(x, y, this.atLayer2(tileToChunk(x), tileToChunk(y))?.id ?? 0xFFFF); //todo fix, any bad
                }
            }
        }
        if (currentframe.debug) {
            ctx4.strokeStyle = "#0000FF";
            ctx4.strokeRect(this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE), this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE), consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE, consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE);
        }
    }
    displayTile(x, y, currentframe) {
        currentframe.tps++;
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
        if (settings.graphics_mode || this.atLayer1(x, y) != 0x00) {
            if (textures.get("t" + this.atLayer1(x, y).toString())) {
                ctx.drawImage(textures.get("t" + this.atLayer1(x, y).toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
            }
            else {
                ctx.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.fillStyle = "#000000";
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.font = "15px sans-serif";
                ctx.fillStyle = "#00FF00";
                ctx.fillText(this.atLayer1(x, y).toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
            }
        }
        else {
            ctx.fillStyle = "#00CC33";
            rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        }
        /*switch(this.tileAt(x, y)){
            case 0x00:
                ctx.fillStyle = "#00CC33";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                break;
            case 0x01:
                ctx.fillStyle = "#999999";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                break;
            case 0x02:
                ctx.fillStyle = "#666666";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                ctx.fillStyle = "#000000";
                ellipse(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.25, consts.DISPLAY_TILE_SIZE * 0.25);
                break;
            case 0x03:
                ctx.fillStyle = "#666666";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                ctx.fillStyle = "#CBCDCD";
                ellipse(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.25, consts.DISPLAY_TILE_SIZE * 0.25);
                break;
            case 0x04:
                ctx.fillStyle = "#0033CC";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                break;
            case 0xFF:
                ctx.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.fillStyle = "#000000";
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                break;
            default:
                ctx.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.fillStyle = "#000000";
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.font = "15px sans-serif";
                ctx.fillStyle = "#00FF00";
                ctx.fillText(this.tileAt(x, y).toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
        }
        */
        if (currentframe.debug)
            ctx.strokeRect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
    }
    displayBuilding(x, y, buildingID, isGhost) {
        if (buildingID == 0xFFFF) {
            return;
        }
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
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
            return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        }
        else if (settings.debug && false) {
            _ctx.fillStyle = "#FF00FF";
            rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.fillStyle = "#000000";
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.font = "15px sans-serif";
            _ctx.fillStyle = "#00FF00";
            _ctx.fillText(this.atLayer2(x, y).toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
        }
        switch (buildingID) { //TypeScript big dum dum
            case 0x0001:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0101:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.stroke();
                break;
            case 0x0201:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0301:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
                _ctx.stroke();
                break;
            case 0x0401:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0501:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0601:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.stroke();
                break;
            case 0x0701:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.stroke();
                break;
            case 0x0801:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0901:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0A01:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
                _ctx.stroke();
                break;
            case 0x0B01:
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
                _ctx.stroke();
                break;
            case 0x0002:
                rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.6, rectMode.CENTER, _ctx);
                break;
            case 0x0003:
                rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.6, rectMode.CENTER, _ctx);
                rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.1, rectMode.CORNER, _ctx);
                break;
            case 0x0004:
                rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER, _ctx);
                _ctx.fillStyle = "#FFCC11";
                rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.4, consts.DISPLAY_TILE_SIZE * 0.4, rectMode.CENTER, _ctx);
                break;
            case 0x0005:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 1.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 1.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 1.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 1.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0105:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.2, pixelY + consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 1.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 1.1);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 1.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 1.1);
                _ctx.stroke();
                break;
            case 0x0205:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * -0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * -0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * -0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * -0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0305:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.2, pixelY + consts.DISPLAY_TILE_SIZE * 0.7, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * -0.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * -0.1);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * -0.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * -0.1);
                _ctx.stroke();
                break;
            case 0x0405:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 2.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 2.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 2.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 2.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0505:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.2, pixelY + consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 2.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 2.1);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 2.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 2.1);
                _ctx.stroke();
                break;
            case 0x0605:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * -1.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * -1.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * -1.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * -1.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0705:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.2, pixelY + consts.DISPLAY_TILE_SIZE * 0.7, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * -1.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * -1.1);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * -1.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * -1.1);
                _ctx.stroke();
                break;
            case 0x0805:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 3.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 3.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 3.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 3.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0905:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.2, pixelY + consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 3.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 3.1);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 3.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 3.1);
                _ctx.stroke();
                break;
            case 0x0A05:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.2, consts.DISPLAY_TILE_SIZE * 0.6);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * -2.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * -2.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * -2.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * -2.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                _ctx.stroke();
                break;
            case 0x0B05:
                _ctx.fillRect(pixelX + consts.DISPLAY_TILE_SIZE * 0.2, pixelY + consts.DISPLAY_TILE_SIZE * 0.7, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.2);
                _ctx.beginPath();
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * -2.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * -2.1);
                _ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * -2.4);
                _ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * -2.1);
                _ctx.stroke();
                break;
            case 0x0006:
                rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER, _ctx);
                _ctx.fillStyle = "#CCCCCC";
                rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.45, pixelY + consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.3, rectMode.CORNER, _ctx);
                break;
            case 0x0007:
                rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER, _ctx);
                _ctx.fillStyle = "#FF0000";
                rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.4, consts.DISPLAY_TILE_SIZE * 0.4, rectMode.CENTER, _ctx);
                break;
            default:
                _ctx.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                _ctx.fillStyle = "#000000";
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
                _ctx.font = "15px sans-serif";
                _ctx.fillStyle = "#00FF00";
                _ctx.fillText(buildingID.toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
                break;
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
        if (Game.tutorial.conveyor.beltchain && Game.persistent.tutorialenabled && ((Math.abs(this.startX - this.x) + 1 > consts.TILE_SIZE * 2) || (Math.abs(this.startY - this.y) + 1 > consts.TILE_SIZE * 2))) {
            _alert("Nice!\nConveyor belts are also the way to put items in machines.\nSpeaking of which, let's try automating coal: Place a Miner(2 key).");
            Game.tutorial.conveyor.beltchain = false;
        }
        if (this.deleted) {
            //do stuff
        }
    }
    display(currentframe) {
        ctx3.drawImage(textures.get("item_" + this.id), this.x * consts.DISPLAY_SCALE + (Game.scroll.x * consts.DISPLAY_SCALE) - 8 * consts.DISPLAY_SCALE, this.y * consts.DISPLAY_SCALE + (Game.scroll.y * consts.DISPLAY_SCALE) - 8 * consts.DISPLAY_SCALE, 16 * consts.DISPLAY_SCALE, 16 * consts.DISPLAY_SCALE);
        if (keysPressed.indexOf("Shift") != -1) {
            var x = (mouseX - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
            var y = (mouseY - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
            //alert(this.x + " " + this.y + "  " + x + " " + y);
            if (x > this.x - (8 * consts.DISPLAY_SCALE) &&
                y > this.y - (8 * consts.DISPLAY_SCALE) &&
                x < this.x + (8 * consts.DISPLAY_SCALE) &&
                y < this.y + (8 * consts.DISPLAY_SCALE)) {
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
}
class Building {
    constructor(tileX, tileY, id, level) {
        this.x = tileX;
        this.y = tileY;
        this.id = id;
        this.level = level;
        this.item = null;
        this.inventory = null;
    }
    static canBuildAt(tileX, tileY, level) {
        return level.atLayer1ByTile(tileX, tileY) != 0x04;
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
        if (this.inventory?.length == 0) {
        }
        return null;
    }
    spawnItem(id) {
        id ??= "base_null";
        if (this.level.buildingIDAtTile(this.x + 1, this.y) % 0x100 === 0x01 &&
            this.level.buildingIDAtTile(this.x + 1, this.y) !== 0x0201 &&
            this.level.buildingIDAtTile(this.x + 1, this.y) !== 0x0801 &&
            this.level.buildingIDAtTile(this.x + 1, this.y) !== 0x0901 &&
            this.level.buildingAt(this.x + 1, this.y).item == null) {
            this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, id);
        }
        else if (this.level.buildingIDAtTile(this.x, this.y + 1) % 0x100 === 0x01 &&
            this.level.buildingIDAtTile(this.x, this.y + 1) !== 0x0301 &&
            this.level.buildingIDAtTile(this.x, this.y + 1) !== 0x0A01 &&
            this.level.buildingIDAtTile(this.x, this.y + 1) !== 0x0B01 &&
            this.level.buildingAt(this.x, this.y + 1).item == null) {
            this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, id);
        }
        else if (this.level.buildingIDAtTile(this.x - 1, this.y) % 0x100 === 0x01 &&
            this.level.buildingIDAtTile(this.x - 1, this.y) !== 0x0001 &&
            this.level.buildingIDAtTile(this.x - 1, this.y) !== 0x0401 &&
            this.level.buildingIDAtTile(this.x - 1, this.y) !== 0x0501 &&
            this.level.buildingAt(this.x - 1, this.y).item == null) {
            this.level.addItem(this.x * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, id);
        }
        else if (this.level.buildingIDAtTile(this.x, this.y - 1) % 0x100 === 0x01 &&
            this.level.buildingIDAtTile(this.x, this.y - 1) !== 0x0101 &&
            this.level.buildingIDAtTile(this.x, this.y - 1) !== 0x0601 &&
            this.level.buildingIDAtTile(this.x, this.y - 1) !== 0x0701 &&
            this.level.buildingAt(this.x, this.y - 1).item == null) {
            this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, id);
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
            _alert("Nice job!\nWell, that's all the content this game has to offer right now. I would tell you to automate steel, but it doesn't exist yet.\nThis game is currently in alpha, check back later for more updates!");
            Game.tutorial.item.iron = false;
            _alert(["Oh, also, you technically beat the game. Just saying.", 3000]);
        }
        return true;
    }
    grabItem(filter, callback, remove, grabDistance) {
        grabDistance ??= 0.5;
        filter ??= () => { return true; };
        for (var item in this.level.items) {
            if ((Math.abs(this.level.items[item].x - ((this.x + grabDistance) * consts.TILE_SIZE)) <= consts.TILE_SIZE * grabDistance) &&
                (Math.abs(this.level.items[item].y - ((this.y + grabDistance) * consts.TILE_SIZE)) <= consts.TILE_SIZE * grabDistance) &&
                filter(this.level.items[item])) {
                this.level.items[item].grabbedBy = this;
                callback(this.level.items[item]);
                if (remove) {
                    this.level.items.splice(parseInt(item), 1);
                }
                return;
            }
        }
    }
}
class Miner extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.timer = 61;
        this.miningItem = oreFor[level.atLayer1ByTile(tileX, tileY)];
    }
    static canBuildAt(tileX, tileY, level) {
        return level.atLayer1ByTile(tileX, tileY) == 0x02 || level.atLayer1ByTile(tileX, tileY) == 0x03;
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
    0x02: ItemID.base_coalOre,
    0x03: ItemID.base_ironOre
};
function smeltFor(item) {
    switch (item instanceof Item ? item.id : item) {
        case ItemID.base_coalOre: return ItemID.base_coal;
        case ItemID.base_ironOre: return ItemID.base_ironIngot;
    }
    return null;
}
class TrashCan extends Building {
    update() {
        this.grabItem(_ => { return true; }, item => { item.deleted = true; }, true);
    }
}
class Furnace extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.timer = 29;
    }
    static canBuildAt(tileX, tileY, level) {
        return level.atLayer1ByTile(tileX, tileY) == 0x01;
    }
    update() {
        if (this.timer > 0 && this.processingItem) {
            this.timer--;
        }
        else if (this.timer <= 0 && this.processingItem) {
            if (this.spawnItem(smeltFor(this.processingItem.id))) {
                this.timer = 30;
                this.processingItem = null;
            }
        }
        else if (!this.processingItem) {
            this.grabItem(smeltFor, (item) => {
                this.processingItem = item;
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
        if (this.item instanceof Item && this.item.grabbedBy == this) {
            this.item.grabbedBy = null;
        }
        this.item = null;
    }
    update(currentframe, nograb) {
        if (this.item instanceof Item) {
            if (Math.floor(this.item.x / consts.TILE_SIZE) != this.x || Math.floor(this.item.y / consts.TILE_SIZE) != this.y) {
                if (this.item.grabbedBy != this || this.item.deleted) {
                    this.item = null;
                }
                return;
            }
            switch (this.id >> 8) { //bit masks ftw, this just grabs the first byte
                //yes I know there's no need to write the ids in hex but why the heck not
                case 0x00:
                    this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    this.item.x += consts.buildings.conveyor.SPEED;
                    break;
                case 0x01:
                    this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    this.item.y += consts.buildings.conveyor.SPEED;
                    break;
                case 0x02:
                    this.item.x -= consts.buildings.conveyor.SPEED;
                    this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    break;
                case 0x03:
                    this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    this.item.y -= consts.buildings.conveyor.SPEED;
                    break;
                case 0x04:
                    if (pixelToTile(this.item.x) >= consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5) {
                        this.item.x++;
                        this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    }
                    else if (pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= consts.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                        this.item.y--;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                    }
                    break;
                case 0x05:
                    if (pixelToTile(this.item.x) >= consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5) {
                        this.item.x++;
                        this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    }
                    else if (pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= consts.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                        this.item.y++;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                    }
                    break;
                case 0x06:
                    if (pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= consts.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                        this.item.y++;
                    }
                    else if (pixelToTile(this.item.x) > consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5) {
                        this.item.x--;
                        this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                    }
                    break;
                case 0x07:
                    if (pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= consts.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                        this.item.y++;
                    }
                    else if (pixelToTile(this.item.x) < consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5) {
                        this.item.x++;
                        this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                    }
                    break;
                case 0x08:
                    if (pixelToTile(this.item.x) <= consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5) {
                        this.item.x--;
                        this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    }
                    else if (pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= consts.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                        this.item.y--;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                    }
                    break;
                case 0x09:
                    if (pixelToTile(this.item.x) <= consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5) {
                        this.item.x--;
                        this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    }
                    else if (pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= consts.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                        this.item.y++;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                    }
                    break;
                case 0x0A:
                    if (pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= consts.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                        this.item.y--;
                    }
                    else if (pixelToTile(this.item.x) > consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5) {
                        this.item.x--;
                        this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                    }
                    break;
                case 0x0B:
                    if (pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= consts.TILE_SIZE * 0.5) {
                        this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                        this.item.y--;
                    }
                    else if (pixelToTile(this.item.x) < consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5) {
                        this.item.x++;
                        this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    }
                    else {
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                    }
                    break;
            }
        }
        else if (!nograb) {
            this.grabItem(null, (item) => { this.item = item; }, false);
        }
    }
    static canBuildAt(tileX, tileY, level) {
        return level.atLayer1ByTile(tileX, tileY) != 0x04;
    }
}
class Extractor extends Conveyor {
    constructor(x, y, id, level) {
        super(x, y, id, level);
    }
    // update(currentFrame){
    // 	//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa
    // 	//TODO: make this more readable, probably rewrite with a switch statement
    // 	if(!this.item){
    // 		if(
    // 			this.id == 0x0005 &&
    // 			(this.level.buildingAt(this.x - 1, this.y)?.id % 0x100 == 1 || this.level.buildingAt(this.x - 1, this.y) instanceof StorageBuilding) &&
    // 			((this.level.buildingAt(this.x - 1, this.y) as StorageBuilding).inventory?.length > 0 || (this.level.buildingAt(this.x - 1, this.y) as Conveyor).item)
    // 		){
    // 			this.item = (this.level.buildingAt(this.x - 1, this.y) as StorageBuilding | Conveyor).removeItem();
    // 			this.item.x = (this.x) * consts.TILE_SIZE;
    // 			this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
    // 		} else if(
    // 			this.id == 0x0105 &&
    // 			(this.level.buildingAt(this.x, this.y - 1)?.id % 0x100 == 1 || this.level.buildingAt(this.x, this.y - 1) instanceof StorageBuilding) &&
    // 			((this.level.buildingAt(this.x, this.y - 1) as StorageBuilding).inventory?.length > 0 || (this.level.buildingAt(this.x, this.y - 1) as Conveyor).item)
    // 		){
    // 			this.item = (this.level.buildingAt(this.x, this.y - 1) as StorageBuilding | Conveyor).removeItem();
    // 			this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
    // 			this.item.y = (this.y) * consts.TILE_SIZE;
    // 		} else if(
    // 			this.id == 0x0205 &&
    // 			(this.level.buildingAt(this.x + 1, this.y)?.id % 0x100 == 1 || this.level.buildingAt(this.x + 1, this.y) instanceof StorageBuilding) &&
    // 			((this.level.buildingAt(this.x + 1, this.y) as StorageBuilding).inventory?.length > 0 || (this.level.buildingAt(this.x + 1, this.y) as Conveyor).item)
    // 		){
    // 			this.item = (this.level.buildingAt(this.x + 1, this.y) as StorageBuilding | Conveyor).removeItem();
    // 			this.item.x = (this.x + 0.9) * consts.TILE_SIZE;
    // 			this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
    // 		} else if(
    // 			this.id == 0x0305 &&
    // 			(this.level.buildingAt(this.x, this.y + 1)?.id % 0x100 == 1 || this.level.buildingAt(this.x, this.y + 1) instanceof StorageBuilding) &&
    // 			((this.level.buildingAt(this.x, this.y + 1) as StorageBuilding).inventory?.length > 0 || (this.level.buildingAt(this.x, this.y + 1) as Conveyor).item)
    // 		){
    // 			this.item = (this.level.buildingAt(this.x, this.y + 1) as StorageBuilding | Conveyor).removeItem();
    // 			this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
    // 			this.item.y = (this.y + 0.9) * consts.TILE_SIZE;
    // 		} else {
    // 			return super.update(currentFrame, false);
    // 		}
    // 		this.item.grabbedBy = this;
    // 		this.level.items.push(this.item);
    // 	}
    // 	super.update(currentFrame, true);
    // }
    /*
        grabItem(filter?:((item:Item) => any) | null, callback?:(item:Item) => void, remove?:boolean, grabDistance?:number){
            filter ??= () => {return true;};
            callback ??= () => {};
            remove = true;
    
            switch(Math.floor(this.id / 0x100) % 4){
                case 0:
                    if(
                        ((this.level.buildingAt(this.x - 1, this.y) as any)?.item ||
                        (this.level.buildingAt(this.x - 1, this.y) as any)?.inventory?.length) &&
                        filter((this.level.buildingAt(this.x - 1, this.y) as any).removeItem(1))
                    ){
                        this.item = (this.level.buildingAt(this.x - 1, this.y) as Conveyor | StorageBuilding).removeItem();
                        this.item.grabbedBy = this;
                        this.item.x = (this.x + 0.0) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                        callback(this.item);
                    }
                    break;
                case 1:
                    if(
                        ((this.level.buildingAt(this.x, this.y - 1) as any)?.item ||
                        (this.level.buildingAt(this.x, this.y - 1) as any)?.inventory?.length) &&
                        filter((this.level.buildingAt(this.x, this.y - 1) as any).removeItem(1))
                    ){
                        this.item = (this.level.buildingAt(this.x, this.y - 1) as Conveyor | StorageBuilding).removeItem();
                        this.item.grabbedBy = this;
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.0) * consts.TILE_SIZE;
                        callback(this.item);
                    }
                    break;
                case 2:
                    if(
                        ((this.level.buildingAt(this.x + 1, this.y) as any)?.item ||
                        (this.level.buildingAt(this.x + 1, this.y) as any)?.inventory?.length) &&
                        filter((this.level.buildingAt(this.x + 1, this.y) as any).removeItem(1))
                    ){
                        this.item = (this.level.buildingAt(this.x + 1, this.y) as Conveyor | StorageBuilding).removeItem();
                        this.item.grabbedBy = this;
                        this.item.x = (this.x + 0.9) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
                        callback(this.item);
                    }
                    break;
                case 3:
                    if(
                        ((this.level.buildingAt(this.x, this.y + 1) as any)?.item ||
                        (this.level.buildingAt(this.x, this.y + 1) as any)?.inventory?.length) &&
                        filter((this.level.buildingAt(this.x, this.y + 1) as any).removeItem(1))
                    ){
                        this.item = (this.level.buildingAt(this.x, this.y + 1) as Conveyor | StorageBuilding).removeItem();
                        this.item.grabbedBy = this;
                        this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
                        this.item.y = (this.y + 0.9) * consts.TILE_SIZE;
                        callback(this.item);
                    }
                    break;
            }
    
            
            //return super.grabItem(filter, callback, remove, grabDistance);
        }
        */
    grabItemFromTile(filter, callback, remove, grabDistance) {
        filter ??= (item) => { return item instanceof Item; };
        callback ??= () => { };
        if (this.level.buildingAt(this.x, this.y) instanceof Building &&
            this.level.buildingAt(this.x, this.y).hasItem() &&
            filter(this.level.buildingAt(this.x, this.y).hasItem())) {
            let item = this.level.buildingAt(this.x, this.y).removeItem();
            if (item.deleted)
                throw "wat?";
            item.grabbedBy = this;
        }
    }
    dropItem() {
        if (this.item instanceof Item) {
            this.level.items.push(this.item);
            this.item = null;
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
                    if (this.item.x > (this.x + 1.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x++;
                    }
                    break;
                case 0x0105:
                    if (this.item.y > (this.y + 1.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y++;
                    }
                    break;
                case 0x0205:
                    if (this.item.x < (this.x - 1.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x--;
                    }
                    break;
                case 0x0305:
                    if (this.item.y < (this.y - 1.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y--;
                    }
                    break;
                case 0x0405:
                    if (this.item.x > (this.x + 2.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x++;
                    }
                    break;
                case 0x0505:
                    if (this.item.y > (this.y + 2.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y++;
                    }
                    break;
                case 0x0605:
                    if (this.item.x < (this.x - 2.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x--;
                    }
                    break;
                case 0x0705:
                    if (this.item.y < (this.y - 2.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y--;
                    }
                    break;
                case 0x0805:
                    if (this.item.x > (this.x + 3.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x++;
                    }
                    break;
                case 0x0905:
                    if (this.item.y > (this.y + 3.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.y++;
                    }
                    break;
                case 0x0A05:
                    if (this.item.x < (this.x - 3.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x--;
                    }
                    break;
                case 0x0B05:
                    if (this.item.y < (this.y - 3.5) * consts.TILE_SIZE) {
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
}
let alloysFor = {
    "base_coal&base_ironIngot": "base_steelIngot",
    "base_ironIngot&base_coal": "base_steelIngot"
};
class AlloySmelter extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.timer = 240;
        this.item1 = null;
        this.item2 = null;
        this.processing = false;
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
                if (this.spawnItem(alloysFor[`${this.item1.id}&${this.item2.id}`])) {
                    this.timer = 240;
                    this.item1 = null;
                    this.item2 = null;
                    this.processing = false;
                }
            }
        }
    }
}
