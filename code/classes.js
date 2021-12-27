import { assert, tileToChunk, trigger, triggerType, pseudoRandom, constrain, rect, rectMode, _alert, pixelToTile } from "./funcs";
import { noise } from "./types";
import { names, ItemID, generation_consts, consts, recipes, mouse, keysPressed, settings, Game, ctx, ShouldNotBePossibleError, InvalidStateError, textures } from "./vars";
export class Level {
    constructor(data) {
        this.storage = new Map();
        this.format = consts.VERSION;
        this.items = [];
        this.resources = {};
        if (typeof data != "object") {
            this.seed = data ? data : 0;
        }
        else {
            let { chunks, items, resources, seed, version } = data;
            this.seed = seed;
            this.resources = resources;
            try {
                for (var [position, chunkData] of Object.entries(chunks)) {
                    this.storage.set(position, new Chunk({
                        x: parseInt(position.split(",")[0]), y: parseInt(position.split(",")[1]),
                        seed: seed, parent: this
                    }, chunkData).generate());
                }
            }
            catch (err) {
                throw new Error(`Error loading chunk ${position}: ${err.message}`);
            }
            if (version !== "alpha 0.0.0") {
                for (let item of items) {
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
        this.storage.set(`${x},${y}`, new Chunk({ x: x, y: y, seed: this.seed, parent: this })
            .generate());
        return this.storage.get(`${x},${y}`);
    }
    tileAtByPixel(pixelX, pixelY) {
        return this.getChunk(Math.floor(pixelX / consts.TILE_SIZE), Math.floor(pixelY / consts.TILE_SIZE)).tileAt(tileToChunk(pixelX / consts.TILE_SIZE), tileToChunk(pixelY / consts.TILE_SIZE));
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
        let xOffset = -Math.floor((Game.scroll.x * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
        let yOffset = -Math.floor((Game.scroll.y * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
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
    buildingIDAtPixel(pixelX, pixelY) {
        return this.getChunk(Math.floor(pixelX / consts.TILE_SIZE), Math.floor(pixelY / consts.TILE_SIZE)).buildingAt(tileToChunk(pixelX / consts.TILE_SIZE), tileToChunk(pixelY / consts.TILE_SIZE))?.id ?? 0xFFFF;
    }
    buildingIDAtTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).buildingAt(tileToChunk(tileX), tileToChunk(tileY))?.id ?? 0xFFFF;
    }
    buildingAtTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).buildingAt(tileToChunk(tileX), tileToChunk(tileY));
    }
    buildingAtPixel(pixelX, pixelY) {
        return this.getChunk(Math.floor(pixelX / consts.TILE_SIZE), Math.floor(pixelY / consts.TILE_SIZE)).buildingAt(tileToChunk(pixelX / consts.TILE_SIZE), tileToChunk(pixelY / consts.TILE_SIZE));
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
        for (let item of this.items) {
            item.update(currentframe);
        }
        for (let chunk of this.storage.values()) {
            chunk.update();
        }
    }
    displayGhostBuilding(tileX, tileY, buildingID) {
        tileX = Math.floor(tileX);
        tileY = Math.floor(tileY);
        if (this.getChunk(tileX, tileY, true) == null) {
            return;
        }
        switch (buildingID % 0x100) {
            case 0x01:
                this.getChunk(tileX, tileY).displayGhostBuilding(tileToChunk(tileX), tileToChunk(tileY), this.getTurnedConveyor(tileX, tileY, buildingID >> 8), !Conveyor.canBuildAt(tileX, tileY, this));
                break;
            case 0xFF:
                break;
            default:
                this.getChunk(tileX, tileY).displayGhostBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, !BuildingType[buildingID % 0x100]?.canBuildAt(tileX, tileY, this));
                break;
        }
    }
    getTurnedConveyor(tileX, tileY, conveyorType) {
        tileX = Math.floor(tileX);
        tileY = Math.floor(tileY);
        let topConveyor = this.buildingIDAtTile(tileX, tileY - 1);
        topConveyor = topConveyor == 0x0101 || topConveyor == 0x0601 || topConveyor == 0x0701 || topConveyor == 0x0002 || topConveyor == 0x0004 || topConveyor == 0x0007 || topConveyor == 0x0009 || topConveyor == 0x000A || topConveyor == 0x000B || topConveyor == 0x0011;
        let rightConveyor = this.buildingIDAtTile(tileX + 1, tileY);
        rightConveyor = rightConveyor == 0x0201 || rightConveyor == 0x0801 || rightConveyor == 0x0901 || rightConveyor == 0x0002 || rightConveyor == 0x0004 || rightConveyor == 0x0007 || rightConveyor == 0x0009 || rightConveyor == 0x000A || rightConveyor == 0x000B || rightConveyor == 0x0011;
        let leftConveyor = this.buildingIDAtTile(tileX - 1, tileY);
        leftConveyor = leftConveyor == 0x0001 || leftConveyor == 0x0401 || leftConveyor == 0x0501 || leftConveyor == 0x0002 || leftConveyor == 0x0004 || leftConveyor == 0x0007 || leftConveyor == 0x0009 || leftConveyor == 0x000A || leftConveyor == 0x000B || leftConveyor == 0x0011;
        let bottomConveyor = this.buildingIDAtTile(tileX, tileY + 1);
        bottomConveyor = bottomConveyor == 0x0301 || bottomConveyor == 0x0A01 || bottomConveyor == 0x0B01 || bottomConveyor == 0x0002 || bottomConveyor == 0x0004 || bottomConveyor == 0x0007 || bottomConveyor == 0x0009 || bottomConveyor == 0x000A || bottomConveyor == 0x000B || bottomConveyor == 0x0011;
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
            if (!Game.canOverwriteBuilding) {
                return false;
            }
        }
        Game.canOverwriteBuilding = false;
        this.buildingAtTile(tileX, tileY)?.break();
        let tempBuilding;
        if (building == 0xFFFF) {
            this.writeExtractor(tileX, tileY, null);
            this.writeBuilding(tileX, tileY, null);
            return true;
        }
        if ((building % 0x100) >> 4 == 0x1) {
            this.buildingAtTile(tileX + 1, tileY)?.break();
            this.buildingAtTile(tileX, tileY + 1)?.break();
            this.buildingAtTile(tileX + 1, tileY + 1)?.break();
            switch (building % 0x100) {
                case 0x11:
                    let controller = new BuildingType[building % 0x100](tileX, tileY, building, this);
                    let secondary1 = new MultiBlockSecondary(tileX + 1, tileY, 0x0010, this);
                    let secondary2 = new MultiBlockSecondary(tileX, tileY + 1, 0x0010, this);
                    let secondary3 = new MultiBlockSecondary(tileX + 1, tileY + 1, 0x0010, this);
                    controller.secondaries = [secondary1, secondary2, secondary3];
                    [secondary1, secondary2, secondary3].forEach(secondary => secondary.controller = controller);
                    this.writeBuilding(tileX, tileY, controller);
                    this.writeBuilding(tileX + 1, tileY, secondary1);
                    this.writeBuilding(tileX, tileY + 1, secondary2);
                    this.writeBuilding(tileX + 1, tileY + 1, secondary3);
                    break;
                default:
                    return false;
            }
            return true;
        }
        if (BuildingType[building % 0x100]?.canBuildAt(tileX, tileY, this)) {
            trigger(triggerType.placeBuilding, building % 0x100);
            if (building % 0x100 == 0x01) {
                tempBuilding = new BuildingType[building % 0x100](tileX, tileY, this.getTurnedConveyor(tileX, tileY, building >> 8), this);
            }
            else {
                tempBuilding = new BuildingType[building % 0x100](tileX, tileY, building, this);
            }
        }
        else {
            trigger(triggerType.placeBuildingFail, building % 0x100);
            return;
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
        for (let chunk of this.storage.values()) {
            chunk.display(currentframe);
        }
    }
    displayTooltip(mousex, mousey, currentframe) {
        if (!currentframe.tooltip) {
            return;
        }
        let x = (mousex - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
        let y = (mousey - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
        ctx.overlays.font = "16px monospace";
        for (let item of this.items) {
            if ((Math.abs(item.x - x) < 16) && Math.abs(item.y - y) < 16) {
                ctx.overlays.fillStyle = "#0033CC";
                ctx.overlays.fillRect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
                ctx.overlays.strokeStyle = "#000000";
                ctx.overlays.strokeRect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
                ctx.overlays.fillStyle = "#FFFFFF";
                ctx.overlays.fillText((names.item[item.id] ?? item.id), mousex + 2, mousey + 10);
                return;
            }
        }
        if (this.buildingAtPixel(x, y) instanceof Building) {
            let buildingID = this.buildingAtPixel(x, y).id % 0x100;
            ctx.overlays.fillStyle = "#0033CC";
            ctx.overlays.fillRect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
            ctx.overlays.strokeStyle = "#000000";
            ctx.overlays.strokeRect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
            ctx.overlays.fillStyle = "#FFFFFF";
            ctx.overlays.fillText((names.building[buildingID] ?? buildingID), mousex + 2, mousey + 10);
            return;
        }
        let tileID = this.tileAtByPixel(x, y);
        ctx.overlays.fillStyle = "#0033CC";
        ctx.overlays.fillRect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
        ctx.overlays.strokeStyle = "#000000";
        ctx.overlays.strokeRect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
        ctx.overlays.fillStyle = "#FFFFFF";
        ctx.overlays.fillText((names.tile[tileID] ?? tileID), mousex + 2, mousey + 10);
        return;
    }
    export() {
        let chunkOutput = {};
        for (let [position, chunk] of this.storage.entries()) {
            let output = chunk.export();
            if (output) {
                chunkOutput[position] = output;
            }
        }
        let items = [];
        for (let item of this.items) {
            items.push(item.export());
        }
        return {
            chunks: chunkOutput,
            items: items,
            resources: this.resources,
            seed: this.seed
        };
    }
}
export class Chunk {
    constructor({ x, y, seed, parent }, data) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        let tweakedX = x == 0 ? 5850 : x;
        let tweakedY = y == 0 ? 9223 : y;
        this.chunkSeed = Math.abs((((tweakedX) ** 3) * (tweakedY ** 5) + 3850 + ((seed - 314) * 11)) % (2 ** 16));
        this.generator = pseudoRandom(this.chunkSeed);
        this.layers = [
            null,
            null,
            null
        ];
        this.layers[0] = [];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[0][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[0][x].push(0xFF);
            }
        }
        this.layers[1] = [];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[1][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[1][x].push(null);
            }
        }
        this.layers[2] = [];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[2][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[2][x].push(null);
            }
        }
        if (data) {
            for (let y in data[0]) {
                for (let x in data[0][y]) {
                    let buildingData = data[0][y][x];
                    if (!buildingData)
                        continue;
                    let tempBuilding;
                    try {
                        tempBuilding = new BuildingType[buildingData.id % 0x100](parseInt(x) + (consts.CHUNK_SIZE * this.x), parseInt(y) + (consts.CHUNK_SIZE * this.y), buildingData.id, this.parent);
                    }
                    catch (err) {
                        console.warn(`Failed to import building id ${buildingData.id} at position ${x},${y} in chunk ${this.x},${this.y}`);
                        continue;
                    }
                    if (buildingData.item) {
                        tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id, this.parent);
                        tempBuilding.item.grabbedBy = tempBuilding;
                    }
                    if (buildingData.inv) {
                        for (let itemData of buildingData.inv) {
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
                    let tempBuilding = new Extractor(parseInt(x) + (consts.CHUNK_SIZE * this.x), parseInt(y) + (consts.CHUNK_SIZE * this.y), buildingData.id, this.parent);
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
                value?.update?.();
            }
        }
        for (let row of this.layers[2]) {
            for (let value of row) {
                value?.update?.(undefined);
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
    displayToConsole() {
        console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
        console.table(this.layers[0]);
    }
    generate() {
        let isWet = false;
        let isHilly = false;
        let distanceFromSpawn = Math.sqrt(this.x ** 2 + this.y ** 2);
        let distanceBoost = constrain(Math.log((distanceFromSpawn / generation_consts.ore_scale) + 0.5) / 2, 0, 0.6);
        if (this.generator.next().value < 0.07 && distanceFromSpawn > generation_consts.min_water_chunk_distance) {
            isWet = true;
        }
        else if (distanceBoost > generation_consts.hilly.terrain_cutoff) {
            isHilly = true;
        }
        if (isWet) {
            for (let row in this.layers[0]) {
                for (let tile in this.layers[0][row]) {
                    if (row == "0" || row == "15" || tile == "0" || tile == "15") {
                        this.layers[0][row][tile] = 0x02;
                    }
                    else if (row == "1" || row == "14" || tile == "1" || tile == "14") {
                        this.layers[0][row][tile] = this.generator.next().value > 0.5 ? 0x01 : 0x02;
                    }
                    else {
                        this.layers[0][row][tile] =
                            this.generator.next().value < 0.1 ?
                                (this.generator.next().value < 0.3 ? 0x11 : 0x10)
                                : 0x01;
                    }
                }
            }
        }
        else if (isHilly) {
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
            for (let row in this.layers[0]) {
                for (let tile in this.layers[0][row]) {
                    let noiseHeight = Math.abs(noise.perlin2(((this.x * consts.CHUNK_SIZE) + +tile + this.parent.seed) / generation_consts.perlin_scale, ((this.y * consts.CHUNK_SIZE) + +row + (this.parent.seed + generation_consts.y_offset)) / generation_consts.perlin_scale));
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
            for (let row in this.layers[0]) {
                for (let tile in this.layers[0][row]) {
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
        if ((Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerWidth + 1 ||
            (Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE ||
            (Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerHeight + 1 ||
            (Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE) {
            return;
        }
        currentframe.cps++;
        ctx.tiles.strokeStyle = "#000000";
        ctx.tiles.lineWidth = 1;
        if (currentframe.redraw) {
            for (let y = 0; y < this.layers[0].length; y++) {
                for (let x = 0; x < this.layers[0][y].length; x++) {
                    this.displayTile(x, y, currentframe);
                }
            }
        }
        for (let y = 0; y < this.layers[1].length; y++) {
            for (let x = 0; x < this.layers[1][y].length; x++) {
                if (this.layers[1][y][x] instanceof Building) {
                    this.layers[1][y][x].display(currentframe);
                }
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
            ctx.overlays.strokeStyle = "#0000FF";
            ctx.overlays.strokeRect(this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE), this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE), consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE, consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE);
        }
    }
    displayTile(x, y, currentframe) {
        currentframe.tps++;
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
        if (settings.graphics_mode || (this.tileAt(x, y) != 0x00)) {
            if (textures.get("t" + this.tileAt(x, y).toString())) {
                ctx.tiles.drawImage(textures.get("t" + this.tileAt(x, y).toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
            }
            else {
                ctx.tiles.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.tiles.fillStyle = "#000000";
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.tiles.font = "15px sans-serif";
                ctx.tiles.fillStyle = "#00FF00";
                ctx.tiles.fillText(this.tileAt(x, y).toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
            }
        }
        else {
            ctx.tiles.fillStyle = "#00CC33";
            rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        }
        if (currentframe.debug)
            ctx.tiles.strokeRect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
    }
    displayGhostBuilding(x, y, buildingID, isError) {
        if (buildingID == 0xFFFF) {
            return;
        }
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
        let _ctx = ctx.ghostbuildings;
        if (isError) {
            _ctx.globalAlpha = 0.9;
            _ctx.drawImage(textures.get("invalidunderlay"), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
            _ctx.globalAlpha = buildingID % 0x100 == 0x01 ? 0.3 : 0.7;
        }
        else {
            _ctx.globalAlpha = 0.9;
            if ((buildingID & 0x00F0) == 0x10) {
                _ctx.drawImage(textures.get("ghostunderlay"), pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE * 2);
            }
            else {
                _ctx.drawImage(textures.get("ghostunderlay"), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
            }
            _ctx.globalAlpha = buildingID % 0x100 == 0x01 ? 0.3 : 0.7;
        }
        if (textures.get(buildingID.toString())) {
            switch (buildingID) {
                case 0x0005:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                    break;
                case 0x0105:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                    break;
                case 0x0205:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX - consts.DISPLAY_TILE_SIZE, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                    break;
                case 0x0305:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                    break;
                case 0x0405:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                    break;
                case 0x0505:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                    break;
                case 0x0605:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX - consts.DISPLAY_TILE_SIZE * 2, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                    break;
                case 0x0705:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                    break;
                case 0x0805:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                    break;
                case 0x0905:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
                    break;
                case 0x0A05:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX - consts.DISPLAY_TILE_SIZE * 3, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                    break;
                case 0x0B05:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
                    break;
                case 0x0011:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE * 2);
                    break;
                default:
                    _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                    break;
            }
            _ctx.globalAlpha = 1.0;
        }
        else {
            _ctx.fillStyle = "#FF00FF";
            rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.fillStyle = "#000000";
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.font = "15px sans-serif";
            _ctx.fillStyle = "#00FF00";
            _ctx.fillText(buildingID.toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
        }
    }
    displayL3(x, y, buildingID, isGhost) {
        if (buildingID == 0xFFFF) {
            return;
        }
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
        let _ctx = ctx.extractors;
        if (textures.get(buildingID.toString())) {
            switch (buildingID) {
                case 0x0005:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                case 0x0105:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                case 0x0205:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX - consts.DISPLAY_TILE_SIZE, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                case 0x0305:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                case 0x0405:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                case 0x0505:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                case 0x0605:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX - consts.DISPLAY_TILE_SIZE * 2, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                case 0x0705:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                case 0x0805:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                case 0x0905:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
                case 0x0A05:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX - consts.DISPLAY_TILE_SIZE * 3, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                case 0x0B05:
                    return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
            }
        }
        else {
            _ctx.fillStyle = "#FF00FF";
            rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.fillStyle = "#000000";
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.font = "15px sans-serif";
            _ctx.fillStyle = "#00FF00";
            _ctx.fillText(this.buildingAt(x, y).toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
        }
    }
    export() {
        let exportDataL1 = [];
        let hasBuildings = false;
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
export class Item {
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
        }
    }
    display(currentframe) {
        if (consts.DISPLAY_SCALE * (this.x + Game.scroll.x - 8) < 0 ||
            consts.DISPLAY_SCALE * (this.x + Game.scroll.x - 8) > window.innerWidth ||
            consts.DISPLAY_SCALE * (this.y + Game.scroll.y - 8) < 0 ||
            consts.DISPLAY_SCALE * (this.y + Game.scroll.y - 8) > window.innerHeight) {
            return;
        }
        currentframe.ips++;
        ctx.items.drawImage(textures.get("item_" + this.id), this.x * consts.DISPLAY_SCALE + (Game.scroll.x * consts.DISPLAY_SCALE) - 8 * consts.DISPLAY_SCALE, this.y * consts.DISPLAY_SCALE + (Game.scroll.y * consts.DISPLAY_SCALE) - 8 * consts.DISPLAY_SCALE, 16 * consts.DISPLAY_SCALE, 16 * consts.DISPLAY_SCALE);
        if (keysPressed.contains("Shift")) {
            let x = (mouse.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
            let y = (mouse.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
            if (x > this.x - (8 * consts.DISPLAY_SCALE) &&
                y > this.y - (8 * consts.DISPLAY_SCALE) &&
                x < this.x + (8 * consts.DISPLAY_SCALE) &&
                y < this.y + (8 * consts.DISPLAY_SCALE)) {
                ctx.overlays.font = "16px monospace";
                ctx.overlays.fillStyle = "#0033CC";
                ctx.overlays.fillRect(mouse.x, mouse.y, (names.item[this.id] ?? this.id).length * 10, 16);
                ctx.overlays.strokeStyle = "#000000";
                ctx.overlays.strokeRect(mouse.x, mouse.y, (names.item[this.id] ?? this.id).length * 10, 16);
                ctx.overlays.fillStyle = "#FFFFFF";
                ctx.overlays.fillText((names.item[this.id] ?? this.id), mouse.x + 2, mouse.y + 10);
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
export class Building {
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
            for (let item of this.inventory) {
                item.grabbedBy = null;
            }
        }
        this.level.writeBuilding(this.x, this.y, null);
    }
    update(...any) {
    }
    display(currentFrame) {
        let pixelX = this.x * consts.DISPLAY_TILE_SIZE + Game.scroll.x * consts.DISPLAY_SCALE;
        let pixelY = this.y * consts.DISPLAY_TILE_SIZE + Game.scroll.y * consts.DISPLAY_SCALE;
        let _ctx = ctx.buildings;
        let texture = textures.get(this.id.toString());
        if (texture) {
            if (this.id % 0x100 == 5) {
                switch (this.id) {
                    case 0x0005:
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                        break;
                    case 0x0105:
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                        break;
                    case 0x0205:
                        _ctx.drawImage(texture, pixelX - consts.DISPLAY_TILE_SIZE, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                        break;
                    case 0x0305:
                        _ctx.drawImage(texture, pixelX, pixelY - consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                        break;
                    case 0x0405:
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                        break;
                    case 0x0505:
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                        break;
                    case 0x0605:
                        _ctx.drawImage(texture, pixelX - consts.DISPLAY_TILE_SIZE * 2, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                        break;
                    case 0x0705:
                        _ctx.drawImage(texture, pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                        break;
                    case 0x0805:
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                        break;
                    case 0x0905:
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
                        break;
                    case 0x0A05:
                        _ctx.drawImage(texture, pixelX - consts.DISPLAY_TILE_SIZE * 3, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                        break;
                    case 0x0B05:
                        _ctx.drawImage(texture, pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
                        break;
                }
            }
            else if ((this.id & 0x00F0) == 0x10) {
                _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE * 2);
            }
            else {
                _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                if (this.constructor.animated) {
                }
            }
        }
        else {
            _ctx.fillStyle = "#FF00FF";
            rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.fillStyle = "#000000";
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.font = "15px sans-serif";
            _ctx.fillStyle = "#00FF00";
            _ctx.fillText(this.id.toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
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
            let temp = this.item;
            this.item = null;
            return temp;
        }
        if (this.inventory?.length > 0) {
            return this.inventory.pop();
        }
        return null;
    }
    spawnItem(id) {
        id ?? (id = "base_null");
        if ((this.level.buildingIDAtTile(this.x + 1, this.y) === 0x0001 ||
            this.level.buildingIDAtTile(this.x + 1, this.y) === 0x0701 ||
            this.level.buildingIDAtTile(this.x + 1, this.y) === 0x0B01) &&
            this.level.buildingAtTile(this.x + 1, this.y).item == null) {
            this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, id);
        }
        else if ((this.level.buildingIDAtTile(this.x, this.y + 1) === 0x0101 ||
            this.level.buildingIDAtTile(this.x, this.y + 1) === 0x0501 ||
            this.level.buildingIDAtTile(this.x, this.y + 1) === 0x0901) &&
            this.level.buildingAtTile(this.x, this.y + 1).item == null) {
            this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, id);
        }
        else if ((this.level.buildingIDAtTile(this.x - 1, this.y) === 0x0201 ||
            this.level.buildingIDAtTile(this.x - 1, this.y) === 0x0601 ||
            this.level.buildingIDAtTile(this.x - 1, this.y) === 0x0A01) &&
            this.level.buildingAtTile(this.x - 1, this.y).item == null) {
            this.level.addItem(this.x * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, id);
        }
        else if ((this.level.buildingIDAtTile(this.x, this.y - 1) === 0x0301 ||
            this.level.buildingIDAtTile(this.x, this.y - 1) === 0x0401 ||
            this.level.buildingIDAtTile(this.x, this.y - 1) === 0x0801) &&
            this.level.buildingAtTile(this.x, this.y - 1).item == null) {
            this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, id);
        }
        else {
            return false;
        }
        return true;
    }
    grabItem(filter, callback, remove, grabDistance) {
        grabDistance ?? (grabDistance = 0.5);
        filter ?? (filter = () => { return true; });
        for (let item in this.level.items) {
            if ((Math.abs(this.level.items[item].x - ((this.x + grabDistance) * consts.TILE_SIZE)) <= consts.TILE_SIZE * grabDistance) &&
                (Math.abs(this.level.items[item].y - ((this.y + grabDistance) * consts.TILE_SIZE)) <= consts.TILE_SIZE * grabDistance) &&
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
        let inv = [];
        if (this.inventory) {
            for (let item of this.inventory) {
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
Building.animated = false;
export class BuildingWithRecipe extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        if (this.constructor === BuildingWithRecipe)
            throw new Error("Cannot initialize abstract class BuildingWithRecipe");
        this.timer = -1;
        this.items = [];
    }
    acceptItem(item) {
        for (let i = 0; i < recipes.maxInputs; i++) {
            if (!this.items[i] && !this.items.map(item => item.id).contains(item.id)) {
                for (let recipe of this.constructor.recipeType.recipes) {
                    if (!this.items.map(item => recipe.inputs.contains(item.id)).contains(false) && recipe.inputs.contains(item.id)) {
                        this.items[i] = item;
                        if (recipe.inputs.length == i + 1) {
                            this.setRecipe(recipe);
                        }
                        return true;
                    }
                }
                return false;
            }
        }
    }
    hasItem() {
        return null;
    }
    removeItem() {
        return null;
    }
    setRecipe(recipe) {
        if (!(recipe?.inputs instanceof Array))
            return;
        this.recipe = recipe;
        this.timer = recipe.duration;
    }
    update() {
        if (!this.items[0]) {
            this.grabItem(this.acceptItem.bind(this), null, true);
        }
        if (!this.items[1]) {
            this.grabItem(this.acceptItem.bind(this).bind(this), null, true);
        }
        if (this.timer > 0) {
            this.timer--;
        }
        else if (this.timer == 0) {
            if (this.spawnItem(this.recipe.outputs[0])) {
                this.timer = -1;
                this.items = [];
                this.recipe = null;
            }
        }
    }
}
export class Miner extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.timer = 61;
        for (let recipe of recipes.base_mining.recipes) {
            if (recipe.tile == level.tileAtByTile(tileX, tileY)) {
                this.miningItem = recipe.outputs[0];
            }
        }
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
                trigger(triggerType.buildingRun, this.id % 0x100, this.miningItem);
            }
        }
    }
}
export class TrashCan extends Building {
    update() {
        this.grabItem(_ => { return true; }, item => { item.deleted = true; }, true);
    }
    acceptItem(item) {
        return true;
    }
}
export class Furnace extends BuildingWithRecipe {
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY) == 0x01;
    }
}
Furnace.recipeType = recipes.base_smelting;
Furnace.animated = true;
export class Conveyor extends Building {
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
        super.break();
    }
    display(currentFrame) {
        super.display(currentFrame);
        if (this.item instanceof Item) {
            this.item.display(currentFrame);
        }
    }
    update(currentframe, nograb) {
        if (this.item instanceof Item) {
            if (Math.floor(this.item.x / consts.TILE_SIZE) != this.x || Math.floor(this.item.y / consts.TILE_SIZE) != this.y) {
                let building = this.level.buildingAtTile(Math.floor(this.item.x / consts.TILE_SIZE), Math.floor(this.item.y / consts.TILE_SIZE));
                if (!building)
                    return;
                if (building.acceptItem(this.item)) {
                    this.item = null;
                }
                return;
            }
            switch (this.id >> 8) {
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
            this.grabItem(null, (item) => { this.item = item; }, true);
        }
    }
}
export class Extractor extends Conveyor {
    constructor(x, y, id, level) {
        super(x, y, id, level);
    }
    display(currentFrame) {
        super.display(currentFrame);
        if (this.item instanceof Item) {
            this.item.display(currentFrame);
        }
    }
    grabItemFromTile(filter, callback, remove, grabDistance) {
        filter ?? (filter = (item) => { return item instanceof Item; });
        callback ?? (callback = () => { });
        if (this.level.buildingAtTile(this.x, this.y) instanceof Building &&
            filter(this.level.buildingAtTile(this.x, this.y).hasItem())) {
            let item = this.level.buildingAtTile(this.x, this.y).removeItem();
            if (!(item instanceof Item))
                throw new ShouldNotBePossibleError("received invalid item");
            if (item.deleted)
                throw new ShouldNotBePossibleError("received deleted item");
            this.item = item;
            this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
            this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
            item.grabbedBy = this;
            if (this.level.items.contains(item)) {
                this.level.items.splice(this.level.items.indexOf(item), 1);
            }
        }
    }
    dropItem() {
        if (this.item instanceof Item) {
            if (this.level.buildingAtPixel(this.item.x, this.item.y)?.acceptItem(this.item)) {
                this.item = null;
            }
        }
        else {
            console.error(this);
            throw new InvalidStateError(`no item to drop; extractor at ${this.x} ${this.y}`);
        }
    }
    update(currentFrame) {
        if (this.item instanceof Item) {
            if (this.item.grabbedBy != this || this.item.deleted) {
                console.error(this.item);
                console.error(this);
                throw new InvalidStateError("Item somehow grabbed or deleted from an extractor.");
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
                    if (this.item.x < (this.x - 0.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x--;
                    }
                    break;
                case 0x0305:
                    if (this.item.y < (this.y - 0.5) * consts.TILE_SIZE) {
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
                    if (this.item.x < (this.x - 1.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x--;
                    }
                    break;
                case 0x0705:
                    if (this.item.y < (this.y - 1.5) * consts.TILE_SIZE) {
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
                    if (this.item.x < (this.x - 2.5) * consts.TILE_SIZE) {
                        return this.dropItem();
                    }
                    else {
                        this.item.x--;
                    }
                    break;
                case 0x0B05:
                    if (this.item.y < (this.y - 2.5) * consts.TILE_SIZE) {
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
export class StorageBuilding extends Building {
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
            item.x = (this.x + 0.5) * consts.TILE_SIZE;
            item.y = (this.y + 0.5) * consts.TILE_SIZE;
            return item;
        }
        return null;
    }
}
export class ResourceAcceptor extends Building {
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
export class AlloySmelter extends BuildingWithRecipe {
}
AlloySmelter.animated = true;
AlloySmelter.recipeType = recipes.base_alloying;
export class Wiremill extends BuildingWithRecipe {
}
Wiremill.recipeType = recipes.base_wiremilling;
export class Compressor extends BuildingWithRecipe {
}
Compressor.recipeType = recipes.base_compressing;
export class Lathe extends BuildingWithRecipe {
}
Lathe.recipeType = recipes.base_lathing;
export class MultiBlockController extends BuildingWithRecipe {
    break() {
        this.secondaries.forEach(secondary => secondary.break(true));
        this.secondaries = [];
        super.break();
    }
    update() {
        if (this.secondaries.length != this.constructor.size[0] * this.constructor.size[1] - 1) {
            this.break();
        }
        super.update();
    }
}
MultiBlockController.size = [1, 1];
export class MultiBlockSecondary extends Building {
    acceptItem(item) {
        return this.controller.acceptItem(item);
    }
    break(isRecursive) {
        if (!isRecursive) {
            this.controller?.break();
        }
        else {
            this.controller = null;
            console.log("aight imma head out");
            super.break();
        }
    }
    display(currentFrame) { }
    update() {
        if (!(this.controller instanceof MultiBlockController)) {
            this.break();
        }
    }
}
export class Assembler extends MultiBlockController {
}
Assembler.recipeType = recipes.base_assembling;
Assembler.size = [2, 2];
export const BuildingType = {
    0x01: Conveyor,
    0x02: Miner,
    0x03: TrashCan,
    0x04: Furnace,
    0x05: Extractor,
    0x06: StorageBuilding,
    0x07: AlloySmelter,
    0x08: ResourceAcceptor,
    0x09: Wiremill,
    0x0A: Compressor,
    0x0B: Lathe,
    0x10: MultiBlockSecondary,
    0x11: Assembler
};
