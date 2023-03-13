"use strict";
class Level {
    constructor(data) {
        this.storage = new Map();
        this.format = consts.VERSION;
        this.resources = {};
        if (typeof data != "object") {
            this.seed = data ?? 0;
            this.uuid = Math.random().toString().substring(2);
            this.generateNecessaryChunks();
            this.buildBuilding(0, 0, ["base_resource_acceptor", 0]);
            this.buildBuilding(0, -1, ["base_resource_acceptor", 0]);
            this.buildBuilding(-1, 0, ["base_resource_acceptor", 0]);
            this.buildBuilding(-1, -1, ["base_resource_acceptor", 0]);
        }
        else {
            let { chunks, resources, seed, version, uuid } = data;
            this.seed = seed;
            this.resources = resources;
            this.uuid = uuid;
            let position, chunkData;
            try {
                for ([position, chunkData] of Object.entries(chunks)) {
                    chunkData.version = version;
                    this.storage.set(position, new Chunk({
                        x: parseInt(position.split(",")[0]), y: parseInt(position.split(",")[1]),
                        seed: seed, parent: this
                    }, chunkData).generate());
                }
            }
            catch (err) {
                throw new Error(`Error loading chunk ${position}: ${parseError(err)}`);
            }
        }
    }
    hasChunk(tileX, tileY) {
        return !!this.storage.get(`${Pos.tileToChunk(tileX)},${Pos.tileToChunk(tileY)}`);
    }
    getChunk(tileX, tileY) {
        if (!this.hasChunk(tileX, tileY)) {
            this.generateChunk(Pos.tileToChunk(tileX), Pos.tileToChunk(tileY));
        }
        return this.storage.get(`${Pos.tileToChunk(tileX)},${Pos.tileToChunk(tileY)}`);
    }
    generateChunk(x, y) {
        if (this.storage.get(`${x},${y}`)) {
            return;
        }
        this.storage.set(`${x},${y}`, new Chunk({ x, y, seed: this.seed, parent: this })
            .generate());
    }
    generateNecessaryChunks() {
        let [chunkX, chunkY] = Camera.unproject(0, 0).map(Pos.pixelToChunk);
        const xOffsets = [0, 1, 2, 3, 4];
        const yOffsets = [0, 1, 2];
        for (const xOffset of xOffsets) {
            for (const yOffset of yOffsets) {
                this.generateChunk(chunkX + xOffset, chunkY + yOffset);
            }
        }
    }
    tileAtByPixel(pixelX, pixelY) {
        return this.getChunk(Pos.pixelToTile(pixelX), Pos.pixelToTile(pixelY)).tileAt(Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelX)), Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelY)));
    }
    tileAtByTile(tileX, tileY) {
        return this.getChunk(tileX, tileY).tileAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
    }
    setTileByTile(tileX, tileY, tile) {
        this.getChunk(tileX, tileY).setTile(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), tile);
        Game.forceRedraw = true;
        return true;
    }
    buildingAtTile(tileX, tileY) {
        return this.getChunk(tileX, tileY).buildingAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
    }
    buildingAtPixel(pixelX, pixelY) {
        return this.getChunk(Pos.pixelToTile(pixelX), Pos.pixelToTile(pixelY)).buildingAt(Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelX)), Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelY)));
    }
    buildingAtPos(pos) {
        return this.getChunk(pos.tileX, pos.tileY).buildingAt(pos.chunkOffsetXInTiles, pos.chunkOffsetYInTiles);
    }
    overlayBuildAtTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).overlayBuildAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
    }
    overlayBuildAtPos(pos) {
        return this.getChunk(pos.tileX, pos.tileY).overlayBuildAt(pos.chunkOffsetXInTiles, pos.chunkOffsetYInTiles);
    }
    writeBuilding(tileX, tileY, building) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setBuilding(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    writeOverlayBuild(tileX, tileY, building) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setOverlayBuild(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    displayGhostBuilding(tileX, tileY, buildingID, currentframe) {
        if (!this.hasChunk(tileX, tileY))
            return;
        Gfx.layer("ghostBuilds");
        if (keybinds.placement.break_building.isHeld()) {
            Gfx.alpha(0.9);
            Gfx.tImage(Gfx.texture("misc/invalidunderlay"), tileX, tileY, 1, 1);
            Gfx.alpha(1);
        }
        if (buildingID[0] == "base_null")
            return;
        let changedID = [buildingID[0], buildingID[1]];
        changedID[1] = Buildings.get(buildingID[0]).changeMeta(changedID[1], tileX, tileY, this);
        let textureSize = Buildings.get(buildingID[0]).textureSize(buildingID[1]);
        let isError = !Buildings.get(changedID[0]).canBuildAt(tileX, tileY, this);
        let underlayTextureSize = textureSize[0][0] == textureSize[0][1] ? textureSize : [[1, 1], [0, 0]];
        Gfx.tImage(isError ? Gfx.texture("misc/invalidunderlay") : Gfx.texture("misc/ghostunderlay"), tileX + underlayTextureSize[1][0], tileY + underlayTextureSize[1][1], underlayTextureSize[0][0], underlayTextureSize[0][1]);
        Gfx.alpha(0.7);
        Building.prototype.display.bind({
            pos: Pos.fromTileCoords(tileX, tileY, false),
            meta: changedID[1],
            level: this,
            block: {
                animated: false,
                id: changedID[0]
            },
            stringID: Building.prototype.stringID
        })(currentframe, "ghostBuilds");
        Gfx.alpha(1);
    }
    breakBuilding(tileX, tileY) {
        function safeBreak(build) {
            if (build && !build.block.immutable)
                build.break();
        }
        safeBreak(this.buildingAtTile(tileX, tileY));
        safeBreak(this.overlayBuildAtTile(tileX, tileY));
    }
    buildBuilding(tileX, tileY, buildingID) {
        if (this.buildingAtTile(tileX, tileY)?.block.immutable)
            return false;
        if (buildingID[0] == "base_null") {
            return true;
        }
        const block = Buildings.get(buildingID[0]);
        if (block.isOverlay) {
            if (this.overlayBuildAtTile(tileX, tileY)?.block.id == buildingID[0] && this.overlayBuildAtTile(tileX, tileY)?.meta == buildingID[1]) {
                if (!canOverwriteBuilding)
                    return false;
                canOverwriteBuilding = false;
            }
            this.overlayBuildAtTile(tileX, tileY)?.break();
        }
        else {
            if (this.buildingAtTile(tileX, tileY)?.block.id == buildingID[0] && this.buildingAtTile(tileX, tileY)?.meta == buildingID[1]) {
                if (!canOverwriteBuilding)
                    return false;
                canOverwriteBuilding = false;
            }
            this.buildingAtTile(tileX, tileY)?.break();
        }
        let tempBuilding;
        if (block.prototype instanceof MultiBlockController) {
            this.buildingAtTile(tileX + 1, tileY)?.break();
            this.buildingAtTile(tileX, tileY + 1)?.break();
            this.buildingAtTile(tileX + 1, tileY + 1)?.break();
            switch (buildingID[0]) {
                case "base_assembler":
                    let controller = new block(tileX, tileY, buildingID[1], this);
                    const multiblockSecondary = Buildings.get("base_multiblock_secondary");
                    let secondary1 = new multiblockSecondary(tileX + 1, tileY, 0, this);
                    let secondary2 = new multiblockSecondary(tileX, tileY + 1, 0, this);
                    let secondary3 = new multiblockSecondary(tileX + 1, tileY + 1, 0, this);
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
        if (block.canBuildAt(tileX, tileY, this)) {
            trigger(triggerType.placeBuilding, buildingID[0]);
            tempBuilding = new block(tileX, tileY, block.changeMeta(buildingID[1], tileX, tileY, this), this);
        }
        else {
            trigger(triggerType.placeBuildingFail, buildingID[0]);
            return false;
        }
        if (tempBuilding instanceof OverlayBuild) {
            return this.writeOverlayBuild(tileX, tileY, tempBuilding);
        }
        else {
            return this.writeBuilding(tileX, tileY, tempBuilding);
        }
    }
    update(currentFrame) {
        for (let chunk of this.storage.values()) {
            chunk.update(currentFrame);
        }
    }
    display(currentframe) {
        for (let chunk of this.storage.values()) {
            chunk.display(currentframe);
        }
    }
    displayTooltip(mousex, mousey, currentframe) {
        if (!currentframe.tooltip) {
            return;
        }
        const [x, y] = Camera.unproject(mousex, mousey);
        Gfx.layer("overlay");
        Gfx.font("16px monospace");
        let building = this.buildingAtPixel(x, y);
        if (building instanceof Building) {
            let buildingID = building.block.id;
            if (building.block.displaysItem && building.item) {
                let item = this.buildingAtPixel(x, y).item;
                if (item && (Math.abs(item.pos.pixelX - x) < consts.ITEM_SIZE / 2) && Math.abs(item.pos.pixelY - y) < consts.ITEM_SIZE / 2) {
                    Gfx.fillColor("#0033CC");
                    Gfx.rect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
                    Gfx.strokeColor("#000000");
                    Gfx.lineRect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
                    Gfx.fillColor("#FFFFFF");
                    Gfx.text((names.item[item.id] ?? item.id), mousex + 2, mousey + 10);
                    return;
                }
            }
            Gfx.fillColor("#0033CC");
            Gfx.rect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
            Gfx.strokeColor("#000000");
            Gfx.lineRect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
            Gfx.fillColor("#FFFFFF");
            Gfx.text((names.building[buildingID] ?? buildingID), mousex + 2, mousey + 10);
            return;
        }
        let tileID = this.tileAtByPixel(x, y);
        Gfx.fillColor("#0033CC");
        Gfx.rect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
        Gfx.strokeColor("#000000");
        Gfx.lineRect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
        Gfx.fillColor("#FFFFFF");
        Gfx.text((names.tile[tileID] ?? tileID), mousex + 2, mousey + 10);
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
        return {
            chunks: chunkOutput,
            resources: this.resources,
            seed: this.seed,
            version: consts.VERSION,
            uuid: this.uuid
        };
    }
}
class Chunk {
    constructor({ x, y, seed, parent }, data) {
        this.hasBuildings = false;
        this.x = x;
        this.y = y;
        this.parent = parent;
        let tweakedX = x == 0 ? 5850 : x;
        let tweakedY = y == 0 ? 9223 : y;
        this.chunkSeed = Math.abs((((tweakedX) ** 3) * (tweakedY ** 5) + 3850 + ((seed - 314) * 11)) % (2 ** 16));
        this._generator = pseudoRandom(this.chunkSeed);
        this.layers = [
            new Array(consts.CHUNK_SIZE),
            new Array(consts.CHUNK_SIZE),
            new Array(consts.CHUNK_SIZE)
        ];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[0][x] = new Array(consts.CHUNK_SIZE);
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[0][x][z] = "base_null";
            }
        }
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[1][x] = new Array(consts.CHUNK_SIZE);
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[1][x][z] = null;
            }
        }
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[2][x] = new Array(consts.CHUNK_SIZE);
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[2][x][z] = null;
            }
        }
        if (data) {
            if (+data.version.split(" ")[1].replaceAll(".", "") < 200) {
                data.layers = data;
            }
            for (let y in data.layers[0]) {
                for (let x in data.layers[0][y]) {
                    let _buildingData = data.layers[0][y][x];
                    if (!_buildingData)
                        continue;
                    this.hasBuildings = true;
                    let buildingData;
                    if (+data.version.split(" ")[1].replaceAll(".", "") <= 200) {
                        _buildingData.id = hex(_buildingData.id, 4);
                    }
                    if (+data.version.split(" ")[1].replaceAll(".", "") < 300) {
                        buildingData = {
                            ..._buildingData,
                            id: mapLegacyRawBuildingID(getLegacyRawBuildingID(_buildingData.id)),
                            meta: +_buildingData.id >> 8
                        };
                    }
                    else
                        buildingData = _buildingData;
                    let tempBuilding;
                    try {
                        tempBuilding = new (Buildings.get(buildingData.id))(parseInt(x) + (consts.CHUNK_SIZE * this.x), parseInt(y) + (consts.CHUNK_SIZE * this.y), buildingData.meta, this.parent);
                    }
                    catch (err) {
                        console.error(err);
                        throw new Error(`Failed to import building id ${stringifyMeta(buildingData.id, buildingData.meta)} at position ${x},${y} in chunk ${this.x},${this.y}. See console for more details.`);
                    }
                    if (buildingData.item) {
                        tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id);
                        tempBuilding.item.grabbedBy = tempBuilding;
                    }
                    if (buildingData.inv && tempBuilding instanceof StorageBuilding) {
                        for (let itemData of buildingData.inv) {
                            let tempItem = new Item(itemData.x, itemData.y, itemData.id);
                            tempItem.grabbedBy = tempBuilding;
                            tempBuilding.inventory.push(tempItem);
                        }
                    }
                    this.layers[1][y][x] = tempBuilding;
                }
            }
            for (let y in data.layers[1]) {
                for (let x in data.layers[1][y]) {
                    let _buildingData = data.layers[1][y][x];
                    if (!_buildingData)
                        continue;
                    this.hasBuildings = true;
                    let buildingData;
                    if (+data.version.split(" ")[1].replaceAll(".", "") <= 200) {
                        _buildingData.id = hex(_buildingData.id, 4);
                    }
                    if (+data.version.split(" ")[1].replaceAll(".", "") < 300) {
                        buildingData = {
                            ..._buildingData,
                            id: mapLegacyRawBuildingID(getLegacyRawBuildingID(_buildingData.id)),
                            meta: +_buildingData.id >> 8
                        };
                    }
                    else
                        buildingData = _buildingData;
                    let tempBuilding = new (Buildings.get(buildingData.id))(parseInt(x) + (consts.CHUNK_SIZE * this.x), parseInt(y) + (consts.CHUNK_SIZE * this.y), buildingData.meta, this.parent);
                    if (buildingData.item && +data.version.split(" ")[1].replaceAll(".", "") >= 130) {
                        tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id);
                        tempBuilding.item.grabbedBy = tempBuilding;
                    }
                    this.layers[2][y][x] = tempBuilding;
                }
            }
        }
        return this;
    }
    update(currentFrame) {
        if (!this.hasBuildings)
            return this;
        for (let i = 0; i < consts.CHUNK_SIZE; i++) {
            for (let j = 0; j < consts.CHUNK_SIZE; j++) {
                if (this.layers[1][i][j]) {
                    this.layers[1][i][j].update(currentFrame);
                }
            }
        }
        for (let i = 0; i < consts.CHUNK_SIZE; i++) {
            for (let j = 0; j < consts.CHUNK_SIZE; j++) {
                if (this.layers[2][i][j]) {
                    this.layers[2][i][j].update(currentFrame);
                }
            }
        }
        return this;
    }
    tileAt(tileX, tileY) {
        return this.layers[0][tileY]?.[tileX] ?? (() => { throw new Error(`Tile ${tileX}, ${tileY} does not exist!`); })();
    }
    buildingAt(tileX, tileY) {
        return this.layers[1][tileY]?.[tileX] ?? null;
    }
    overlayBuildAt(tileX, tileY) {
        return this.layers[2][tileY]?.[tileX] ?? null;
    }
    setTile(tileX, tileY, value) {
        try {
            this.tileAt(tileX, tileY);
        }
        catch (err) {
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
        if (value instanceof Building)
            this.hasBuildings = true;
        return true;
    }
    setOverlayBuild(tileX, tileY, value) {
        if (this.tileAt(tileX, tileY) == null) {
            return false;
        }
        this.layers[2][tileY][tileX] = value;
        if (value instanceof Building)
            this.hasBuildings = true;
        return true;
    }
    displayToConsole() {
        console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
        console.table(this.layers[0]);
    }
    generator() {
        return this._generator.next().value;
    }
    generate() {
        let isWet = false;
        let isHilly = false;
        let distanceFromSpawn = Math.sqrt(this.x ** 2 + this.y ** 2);
        let distanceBoost = constrain(Math.log((distanceFromSpawn / generation_consts.ore_scale) + 0.5) / 2, 0, 0.6);
        if (this.generator().chance(0.07) && distanceFromSpawn > generation_consts.min_water_chunk_distance) {
            isWet = true;
        }
        else if (distanceBoost > generation_consts.hilly.terrain_cutoff) {
            isHilly = true;
        }
        if (isWet) {
            for (let row in this.layers[0]) {
                for (let tile in this.layers[0][row]) {
                    if (row == "0" || row == "15" || tile == "0" || tile == "15") {
                        this.layers[0][row][tile] = "base_water";
                    }
                    else if (row == "1" || row == "14" || tile == "1" || tile == "14") {
                        this.layers[0][row][tile] = this.generator().chance(0.5) ? "base_water" : "base_stone";
                    }
                    else {
                        this.layers[0][row][tile] =
                            this.generator().chance(0.1) ?
                                (this.generator().chance(0.3) ? "base_ore_iron" : "base_ore_coal")
                                : "base_stone";
                    }
                }
            }
        }
        else if (isHilly) {
            let oreToGenerate;
            let oreRand = this.generator();
            if (distanceFromSpawn < generation_consts.hilly.min_iron_distance) {
                oreToGenerate = "base_ore_coal";
            }
            else if (distanceFromSpawn < generation_consts.hilly.min_copper_distance) {
                oreToGenerate = oreRand.chance(0.5) ? "base_ore_iron" : "base_ore_coal";
            }
            else {
                oreToGenerate = oreRand.chance(0.5) ? (oreRand.chance(0.25) ? "base_ore_copper" : "base_ore_iron") : "base_ore_coal";
            }
            for (let row in this.layers[0]) {
                for (let tile in this.layers[0][row]) {
                    let noiseHeight = Math.abs(noise.perlin2(((this.x * consts.CHUNK_SIZE) + +tile + this.parent.seed) / generation_consts.perlin_scale, ((this.y * consts.CHUNK_SIZE) + +row + (this.parent.seed + generation_consts.y_offset))
                        / generation_consts.perlin_scale));
                    if ((noiseHeight + distanceBoost / 2) > generation_consts.hilly.ore_threshold) {
                        this.layers[0][row][tile] = oreToGenerate;
                    }
                    else if ((noiseHeight + distanceBoost) > generation_consts.hilly.stone_threshold) {
                        this.layers[0][row][tile] = "base_stone";
                    }
                    else {
                        this.layers[0][row][tile] = "base_grass";
                    }
                }
            }
        }
        else {
            for (let row in this.layers[0]) {
                for (let tile in this.layers[0][row]) {
                    this.layers[0][row][tile] = "base_grass";
                }
            }
            let oreToGenerate;
            if (distanceFromSpawn < 3) {
                oreToGenerate = "base_ore_coal";
            }
            else {
                oreToGenerate = (this.generator().chance(0.5)) ? "base_ore_coal" : "base_ore_iron";
            }
            let hill_x = Math.floor(this.generator().value * 16);
            let hill_y = Math.floor(this.generator().value * 16);
            this.setTile(hill_x, hill_y, oreToGenerate);
            this.setTile(hill_x + 1, hill_y, "base_stone");
            this.setTile(hill_x - 1, hill_y, "base_stone");
            this.setTile(hill_x, hill_y + 1, "base_stone");
            this.setTile(hill_x, hill_y - 1, "base_stone");
            this.setTile(hill_x + 1, hill_y + 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
            this.setTile(hill_x + 1, hill_y - 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
            this.setTile(hill_x - 1, hill_y + 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
            this.setTile(hill_x - 1, hill_y - 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
        }
        return this;
    }
    display(currentframe) {
        if (!Camera.isVisible([
            Pos.chunkToPixel(this.x), Pos.chunkToPixel(this.y),
            Pos.chunkToPixel(1), Pos.chunkToPixel(1)
        ], consts.chunkCullingMargin))
            return;
        currentframe.cps++;
        if (currentframe.redraw) {
            Gfx.layer("tile");
            Gfx.strokeColor("#000000");
            Gfx.lineWidth(1);
            Gfx.layer("tile");
            for (let y = 0; y < this.layers[0].length; y++) {
                for (let x = 0; x < this.layers[0][y].length; x++) {
                    currentframe.tps++;
                    let tileX = (this.x * consts.CHUNK_SIZE) + x;
                    let tileY = (this.y * consts.CHUNK_SIZE) + y;
                    const tile = this.layers[0][y][x];
                    Gfx.tImage(Gfx.texture(`tile/${tile}`), tileX, tileY, 1, 1);
                    if (currentframe.debug)
                        Gfx.lineTRect(tileX, tileY, 1, 1);
                }
            }
        }
        for (let y = 0; y < this.layers[1].length; y++) {
            for (let x = 0; x < this.layers[1][y].length; x++) {
                this.layers[1][y][x]?.display(currentframe);
            }
        }
        for (let y = 0; y < this.layers[2].length; y++) {
            for (let x = 0; x < this.layers[2][y].length; x++) {
                this.layers[2][y][x]?.display(currentframe);
            }
        }
        if (currentframe.debug) {
            Gfx.layer("overlay");
            Gfx.strokeColor("#0000FF");
            Gfx.lineTRect(this.x * consts.CHUNK_SIZE, this.y * consts.CHUNK_SIZE, consts.CHUNK_SIZE, consts.CHUNK_SIZE);
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
            for (let overlayBuild of row) {
                if (overlayBuild instanceof Building) {
                    hasBuildings = true;
                }
                tempRow.push(overlayBuild?.export() ?? null);
            }
            exportDataL2.push(tempRow);
        }
        if (hasBuildings) {
            return {
                layers: [exportDataL1, exportDataL2],
                version: consts.VERSION,
            };
        }
        else {
            return null;
        }
    }
}
class Item {
    constructor(x, y, id) {
        this.id = id;
        this.grabbedBy = null;
        this.deleted = false;
        this.pos = Pos.fromPixelCoords(x, y);
    }
    update(currentframe) {
    }
    display(currentframe) {
        if (Camera.isPointVisible([this.pos.pixelX, this.pos.pixelY], consts.ITEM_SIZE)) {
            currentframe.ips++;
            Gfx.layer("items");
            Gfx.pImage(Gfx.texture(`item/${this.id}`), this.pos.pixelX, this.pos.pixelY, consts.ITEM_SIZE, consts.ITEM_SIZE, RectMode.CENTER);
        }
    }
    export() {
        if (this.deleted || !this.grabbedBy)
            return null;
        return {
            id: this.id,
            x: this.pos.pixelX,
            y: this.pos.pixelY,
            grabbedBy: { x: this.grabbedBy.pos.tileX, y: this.grabbedBy.pos.tileY },
        };
    }
}
class Building {
    constructor(x, y, meta, level) {
        this.meta = meta;
        this.level = level;
        this.item = null;
        this.block = this.constructor;
        this.pos = Pos.fromTileCoords(x, y, false);
    }
    static changeMeta(meta, tileX, tileY, level) {
        return meta;
    }
    static getID(type, direction, modifier) {
        return [type, 0];
    }
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY) != "base_water";
    }
    static textureSize(meta) {
        return [[1, 1], [0, 0]];
    }
    break() {
        if (this.item) {
            this.item.grabbedBy = null;
        }
        if (this.block.isOverlay)
            this.level.writeOverlayBuild(this.pos.tileX, this.pos.tileY, null);
        else
            this.level.writeBuilding(this.pos.tileX, this.pos.tileY, null);
    }
    update(currentFrame) {
        this.item?.update(currentFrame);
    }
    stringID() {
        return stringifyMeta(this.block.id, this.meta);
    }
    display(currentFrame, layer = this.block.isOverlay ? "overlayBuilds" : "ghostBuilds") {
        const textureSize = Buildings.get(this.block.id).textureSize(this.meta);
        Gfx.tImage(Gfx.texture(`building/${this.stringID()}`), this.pos.tileX + textureSize[1][0], this.pos.tileY + textureSize[1][1], ...textureSize[0], Gfx.layers[layer]);
        if (this.item instanceof Item && this.block.displaysItem) {
            this.item.display(currentFrame);
        }
    }
    hasItem() {
        if (this.item)
            return this.item;
        return null;
    }
    removeItem() {
        if (this.item) {
            let temp = this.item;
            this.item = null;
            return temp;
        }
        return null;
    }
    acceptsItemFromSide(side) {
        return true;
    }
    outputsItemToSide(side) {
        return true;
    }
    buildAt(direction) {
        switch (direction) {
            case Direction.right: return this.level.buildingAtTile(this.pos.tileX + 1, this.pos.tileY);
            case Direction.down: return this.level.buildingAtTile(this.pos.tileX, this.pos.tileY + 1);
            case Direction.left: return this.level.buildingAtTile(this.pos.tileX - 1, this.pos.tileY);
            case Direction.up: return this.level.buildingAtTile(this.pos.tileX, this.pos.tileY - 1);
        }
    }
    spawnItem(id) {
        id ?? (id = "base_null");
        if (this.buildAt(Direction.right) instanceof Conveyor &&
            this.buildAt(Direction.right).acceptsItemFromSide(Direction.left) &&
            this.buildAt(Direction.right).acceptItem(new Item((this.pos.tileX + 1.1) * consts.TILE_SIZE, (this.pos.tileY + 0.5) * consts.TILE_SIZE, id))) {
            return true;
        }
        else if (this.buildAt(Direction.down) instanceof Conveyor &&
            this.buildAt(Direction.down).acceptsItemFromSide(Direction.up) &&
            this.buildAt(Direction.down).acceptItem(new Item((this.pos.tileX + 0.5) * consts.TILE_SIZE, (this.pos.tileY + 1.1) * consts.TILE_SIZE, id))) {
            return true;
        }
        else if (this.buildAt(Direction.left) instanceof Conveyor &&
            this.buildAt(Direction.left).acceptsItemFromSide(Direction.right) &&
            this.buildAt(Direction.left).acceptItem(new Item((this.pos.tileX - 0.1) * consts.TILE_SIZE, (this.pos.tileY + 0.5) * consts.TILE_SIZE, id))) {
            return true;
        }
        else if (this.buildAt(Direction.up) instanceof Conveyor &&
            this.buildAt(Direction.up).acceptsItemFromSide(Direction.down) &&
            this.buildAt(Direction.up).acceptItem(new Item((this.pos.tileX + 0.5) * consts.TILE_SIZE, (this.pos.tileY - 0.1) * consts.TILE_SIZE, id))) {
            return true;
        }
        else {
            return false;
        }
    }
    acceptItem(item) {
        if (this.item === null) {
            this.item = item;
            item.grabbedBy = this;
            return true;
        }
        else {
            return false;
        }
    }
    export() {
        return {
            x: this.pos.tileX,
            y: this.pos.tileY,
            id: this.block.id,
            meta: this.meta,
            item: this.item?.export() ?? null,
            inv: []
        };
    }
}
Building.animated = false;
Building.outputsItems = false;
Building.immutable = false;
Building.isOverlay = false;
Building.displaysItem = false;
class BuildingWithRecipe extends Building {
    constructor(tileX, tileY, meta, level) {
        super(tileX, tileY, meta, level);
        this.timer = -1;
        this.recipe = null;
        this.items = [];
        if (this.constructor === BuildingWithRecipe)
            throw new Error("Cannot initialize abstract class BuildingWithRecipe");
    }
    acceptItem(item) {
        for (let i = 0; i < this.block.recipeMaxInputs; i++) {
            if (!this.items[i] && !this.items.map(item => item.id).includes(item.id)) {
                for (let recipe of this.block.recipeType.recipes) {
                    if (!recipe.inputs)
                        continue;
                    if (!this.items.map(item => recipe.inputs.includes(item.id)).includes(false) && recipe.inputs.includes(item.id)) {
                        this.items[i] = item;
                        item.grabbedBy = this;
                        if (recipe.inputs.length == i + 1) {
                            this.setRecipe(recipe);
                        }
                        return true;
                    }
                }
                return false;
            }
        }
        return false;
    }
    hasItem() {
        return null;
    }
    removeItem() {
        return null;
    }
    setRecipe(recipe) {
        if (!(recipe.inputs instanceof Array))
            throw new ShouldNotBePossibleError("tried to set invalid recipe");
        this.recipe = recipe;
        this.timer = recipe.duration;
    }
    update() {
        if (this.timer > 0) {
            this.timer--;
        }
        else if (this.timer == 0 && this.recipe) {
            if (this.spawnItem(this.recipe.outputs[0])) {
                this.timer = -1;
                this.items = [];
                this.recipe = null;
            }
        }
    }
}
BuildingWithRecipe.outputsItems = true;
BuildingWithRecipe.recipeMaxInputs = 3;
class Miner extends Building {
    constructor(tileX, tileY, meta, level) {
        super(tileX, tileY, meta, level);
        this.miningItem = null;
        this.timer = 61;
        for (let recipe of recipes.base_mining.recipes) {
            if (recipe.tile == level.tileAtByTile(tileX, tileY)) {
                this.miningItem = recipe.outputs[0];
                return;
            }
        }
        console.warn(`Miner cannot mine tile at ${tileX}, ${tileY}`);
    }
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY).split("_")[1] == "ore";
    }
    update() {
        if (!this.miningItem)
            return;
        if (this.timer > 0) {
            this.timer--;
        }
        else {
            if (this.spawnItem(this.miningItem)) {
                this.timer = 61;
                trigger(triggerType.buildingRun, this.block.id, this.miningItem);
            }
        }
    }
}
Miner.outputsItems = true;
class TrashCan extends Building {
    acceptItem(item) {
        return true;
    }
}
class Conveyor extends Building {
    acceptsItemFromSide(side) {
        switch (side) {
            case Direction.left: return [
                0x00, 0x07, 0x0B, 0x0C, 0x0D, 0x0F, 0x13, 0x15, 0x17, 0x18, 0x19, 0x1B,
            ].includes(this.meta);
            case Direction.up: return [
                0x01, 0x05, 0x09, 0x0D, 0x0E, 0x0F, 0x11, 0x14, 0x16, 0x18, 0x19, 0x1A,
            ].includes(this.meta);
            case Direction.right: return [
                0x02, 0x06, 0x0A, 0x0E, 0x10, 0x11, 0x12, 0x15, 0x17, 0x19, 0x1A, 0x1B,
            ].includes(this.meta);
            case Direction.down: return [
                0x03, 0x08, 0x04, 0x0C, 0x10, 0x12, 0x13, 0x14, 0x16, 0x18, 0x1A, 0x1B,
            ].includes(this.meta);
        }
    }
    outputsItemToSide(side) {
        switch (side) {
            case Direction.left: return [
                2, 8, 9, 16, 17, 22, 26
            ].includes(this.meta);
            case Direction.up: return [
                3, 10, 11, 18, 19, 23, 27
            ].includes(this.meta);
            case Direction.right: return [
                0, 4, 5, 12, 13, 20, 24
            ].includes(this.meta);
            case Direction.down: return [
                1, 6, 7, 14, 15, 21, 25
            ].includes(this.meta);
        }
    }
    static getID(type, direction, modifier) {
        return [type, direction];
    }
    static changeMeta(meta, tileX, tileY, level) {
        if (keybinds.placement.force_straight_conveyor.isHeld()) {
            return meta;
        }
        let hasLeftBuilding = level.buildingAtTile(tileX - 1, tileY)?.outputsItemToSide(Direction.right) ?? false;
        let hasTopBuilding = level.buildingAtTile(tileX, tileY - 1)?.outputsItemToSide(Direction.down) ?? false;
        let hasRightBuilding = level.buildingAtTile(tileX + 1, tileY)?.outputsItemToSide(Direction.left) ?? false;
        let hasBottomBuilding = level.buildingAtTile(tileX, tileY + 1)?.outputsItemToSide(Direction.up) ?? false;
        switch (meta) {
            case 0:
                if (hasLeftBuilding) {
                    if (hasTopBuilding && hasBottomBuilding)
                        return 0x18;
                    else if (hasTopBuilding)
                        return 0x0D;
                    else if (hasBottomBuilding)
                        return 0x0C;
                    else
                        return 0x00;
                }
                else {
                    if (hasTopBuilding && hasBottomBuilding)
                        return 0x14;
                    else if (hasTopBuilding)
                        return 0x05;
                    else if (hasBottomBuilding)
                        return 0x04;
                    else
                        return 0x00;
                }
            case 1:
                if (hasTopBuilding) {
                    if (hasLeftBuilding && hasRightBuilding)
                        return 0x19;
                    else if (hasLeftBuilding)
                        return 0x0F;
                    else if (hasRightBuilding)
                        return 0x0E;
                    else
                        return 0x01;
                }
                else {
                    if (hasLeftBuilding && hasRightBuilding)
                        return 0x15;
                    else if (hasLeftBuilding)
                        return 0x07;
                    else if (hasRightBuilding)
                        return 0x06;
                    else
                        return 0x01;
                }
            case 2:
                if (hasRightBuilding) {
                    if (hasTopBuilding && hasBottomBuilding)
                        return 0x1A;
                    else if (hasTopBuilding)
                        return 0x11;
                    else if (hasBottomBuilding)
                        return 0x10;
                    else
                        return 0x02;
                }
                else {
                    if (hasTopBuilding && hasBottomBuilding)
                        return 0x16;
                    else if (hasTopBuilding)
                        return 0x09;
                    else if (hasBottomBuilding)
                        return 0x08;
                    else
                        return 0x02;
                }
            case 3:
                if (hasBottomBuilding) {
                    if (hasLeftBuilding && hasRightBuilding)
                        return 0x1B;
                    else if (hasLeftBuilding)
                        return 0x13;
                    else if (hasRightBuilding)
                        return 0x12;
                    else
                        return 0x03;
                }
                else {
                    if (hasLeftBuilding && hasRightBuilding)
                        return 0x17;
                    else if (hasLeftBuilding)
                        return 0x0B;
                    else if (hasRightBuilding)
                        return 0x0A;
                    else
                        return 0x03;
                }
            default: return meta;
        }
    }
    update() {
        if (this.item instanceof Item) {
            if (this.item.pos.tileX != this.pos.tileX || this.item.pos.tileY != this.pos.tileY) {
                let building = this.level.buildingAtPos(this.item.pos);
                if (!building)
                    return;
                if (building.acceptItem(this.item)) {
                    this.item = null;
                }
                return;
            }
            switch (this.meta) {
                case 0x00:
                    if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    break;
                case 0x01:
                    if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY += this.block.speed;
                    break;
                case 0x02:
                    if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    break;
                case 0x03:
                    if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY -= this.block.speed;
                    break;
                case 0x04:
                    if (this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles > 0.5)
                        this.item.pos.pixelY -= this.block.speed;
                    break;
                case 0x05:
                    if (this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles < 0.5)
                        this.item.pos.pixelY += this.block.speed;
                    break;
                case 0x06:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
                        this.item.pos.pixelY += this.block.speed;
                    else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    break;
                case 0x07:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
                        this.item.pos.pixelY += this.block.speed;
                    else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    break;
                case 0x08:
                    if (this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
                        this.item.pos.pixelY -= this.block.speed;
                    break;
                case 0x09:
                    if (this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
                        this.item.pos.pixelY += this.block.speed;
                    break;
                case 0x0A:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
                        this.item.pos.pixelY -= this.block.speed;
                    else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    break;
                case 0x0B:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
                        this.item.pos.pixelY -= this.block.speed;
                    else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    break;
                case 0x0C:
                    if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
                        this.item.pos.pixelY -= this.block.speed;
                    break;
                case 0x0D:
                    if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
                        this.item.pos.pixelY += this.block.speed;
                    break;
                case 0x0E:
                    if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY += this.block.speed;
                    else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    break;
                case 0x0F:
                    if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY += this.block.speed;
                    else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    break;
                case 0x10:
                    if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
                        this.item.pos.pixelY -= this.block.speed;
                    break;
                case 0x11:
                    if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
                        this.item.pos.pixelY += this.block.speed;
                    break;
                case 0x12:
                    if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY -= this.block.speed;
                    else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    break;
                case 0x13:
                    if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY -= this.block.speed;
                    else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    break;
                case 0x14:
                    if (this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
                    break;
                case 0x15:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
                        this.item.pos.pixelY += this.block.speed;
                    else if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
                    break;
                case 0x16:
                    if (this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
                    break;
                case 0x17:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
                        this.item.pos.pixelY -= this.block.speed;
                    else if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
                    break;
                case 0x18:
                    if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
                    break;
                case 0x19:
                    if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY += this.block.speed;
                    else if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
                    break;
                case 0x1A:
                    if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX -= this.block.speed;
                    else if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
                    break;
                case 0x1B:
                    if (this.item.pos.tileOffsetXCentered)
                        this.item.pos.pixelY -= this.block.speed;
                    else if (this.item.pos.tileOffsetYCentered)
                        this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
                    break;
            }
        }
    }
    acceptItem(item) {
        if (item.pos.tileX != this.pos.tileX || item.pos.tileY != this.pos.tileY)
            return false;
        if (item.pos.tileOffsetXInTiles <= 0.1 && this.acceptsItemFromSide(Direction.left) ||
            item.pos.tileOffsetYInTiles <= 0.1 && this.acceptsItemFromSide(Direction.up) ||
            item.pos.tileOffsetXInTiles >= 0.9 && this.acceptsItemFromSide(Direction.right) ||
            item.pos.tileOffsetYInTiles >= 0.9 && this.acceptsItemFromSide(Direction.down) ||
            item.pos.tileOffsetXCentered && item.pos.tileOffsetYCentered) {
            return super.acceptItem(item);
        }
        else
            return false;
    }
}
Conveyor.displaysItem = true;
Conveyor.speed = 1;
class OverlayBuild extends Building {
    buildingUnder() {
        return this.level.buildingAtPos(this.pos);
    }
}
OverlayBuild.isOverlay = true;
class Extractor extends OverlayBuild {
    static textureSize(meta) {
        switch (meta) {
            case 0: return [[2, 1], [0, 0]];
            case 1: return [[1, 2], [0, 0]];
            case 2: return [[2, 1], [-1, 0]];
            case 3: return [[1, 2], [0, -1]];
            case 4: return [[3, 1], [0, 0]];
            case 5: return [[1, 3], [0, 0]];
            case 6: return [[3, 1], [-2, 0]];
            case 7: return [[1, 3], [0, -2]];
            case 8: return [[4, 1], [0, 0]];
            case 9: return [[1, 4], [0, 0]];
            case 10: return [[4, 1], [-3, 0]];
            case 11: return [[1, 4], [0, -3]];
            default: return [[1, 1], [0, 0]];
        }
    }
    static getID(type, direction, modifier) {
        return [type, (modifier * 4) + direction];
    }
    grabItemFromTile(filter = item => item instanceof Item) {
        if (this.buildingUnder() instanceof Building &&
            this.buildingUnder().hasItem() &&
            filter(this.buildingUnder().hasItem())) {
            let item = this.level.buildingAtPos(this.pos).removeItem();
            if (!(item instanceof Item))
                throw new ShouldNotBePossibleError("received invalid item");
            if (item.deleted)
                throw new ShouldNotBePossibleError("received deleted item");
            this.item = item;
            this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
            this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
            item.grabbedBy = this;
        }
    }
    dropItem() {
        if (this.item instanceof Item) {
            if (this.level.buildingAtPos(this.item.pos)?.acceptItem(this.item)) {
                this.item = null;
            }
        }
        else {
            console.error(this);
            throw new InvalidStateError(`no item to drop; extractor at ${this.pos.tileX} ${this.pos.tileY}`);
        }
    }
    update() {
        if (this.item instanceof Item) {
            if (this.item.grabbedBy != this || this.item.deleted) {
                console.error(this.item);
                console.error(this);
                throw new InvalidStateError("Item somehow grabbed or deleted from an extractor.");
            }
            switch (this.meta) {
                case 0x00:
                    if (this.item.pos.tileXExact >= this.pos.tileX + 1.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelX += this.block.speed;
                    break;
                case 0x01:
                    if (this.item.pos.tileYExact >= this.pos.tileY + 1.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelY += this.block.speed;
                    break;
                case 0x02:
                    if (this.item.pos.tileXExact <= this.pos.tileX - 0.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelX -= this.block.speed;
                    break;
                case 0x03:
                    if (this.item.pos.tileYExact <= this.pos.tileY - 0.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelY -= this.block.speed;
                    break;
                case 0x04:
                    if (this.item.pos.tileXExact >= this.pos.tileX + 2.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelX += this.block.speed;
                    break;
                case 0x05:
                    if (this.item.pos.tileYExact >= this.pos.tileY + 2.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelY += this.block.speed;
                    break;
                case 0x06:
                    if (this.item.pos.tileXExact <= this.pos.tileX - 1.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelX -= this.block.speed;
                    break;
                case 0x07:
                    if (this.item.pos.tileYExact <= this.pos.tileY - 1.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelY -= this.block.speed;
                    break;
                case 0x08:
                    if (this.item.pos.tileXExact >= this.pos.tileX + 3.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelX += this.block.speed;
                    break;
                case 0x09:
                    if (this.item.pos.tileYExact >= this.pos.tileY + 3.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelY += this.block.speed;
                    break;
                case 0x0A:
                    if (this.item.pos.tileXExact <= this.pos.tileX - 2.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelX -= this.block.speed;
                    break;
                case 0x0B:
                    if (this.item.pos.tileYExact <= this.pos.tileY - 2.5)
                        return this.dropItem();
                    else
                        this.item.pos.pixelY -= this.block.speed;
                    break;
            }
        }
        else {
            this.grabItemFromTile();
        }
    }
    acceptsItemFromSide(side) { return false; }
    acceptItem(item) { return false; }
}
Extractor.displaysItem = true;
Extractor.speed = 1;
class StorageBuilding extends Building {
    constructor() {
        super(...arguments);
        this.inventory = Object.assign([], { MAX_LENGTH: 64 });
    }
    break() {
        if (this.inventory) {
            for (let item of this.inventory) {
                item.grabbedBy = null;
            }
        }
        super.break();
    }
    hasItem() {
        if (this.inventory && this.inventory?.length != 0)
            return this.inventory[0];
        return super.hasItem();
    }
    removeItem() {
        if (this.inventory?.length > 0) {
            return this.inventory.pop();
        }
        return super.removeItem();
    }
    acceptItem(item) {
        if (this.inventory?.length < this.inventory?.MAX_LENGTH) {
            this.inventory.push(item);
            return true;
        }
        else
            return super.acceptItem(item);
    }
    export() {
        let inv = [];
        if (this.inventory) {
            for (let item of this.inventory) {
                const data = item.export();
                if (data)
                    inv.push(data);
            }
        }
        return {
            x: this.pos.tileX,
            y: this.pos.tileY,
            id: this.block.id,
            meta: this.meta,
            item: this.item?.export() ?? null,
            inv: inv
        };
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
}
ResourceAcceptor.immutable = true;
class MultiBlockController extends BuildingWithRecipe {
    constructor() {
        super(...arguments);
        this.secondaries = [];
    }
    static textureSize(meta) {
        return [this.multiblockSize, [0, 0]];
    }
    break() {
        this.secondaries.forEach(secondary => secondary.break(true));
        this.secondaries = [];
        super.break();
    }
    update() {
        if (this.secondaries.length != this.block.multiblockSize[0] * this.block.multiblockSize[1] - 1) {
            if (!this.resetSecondaries())
                this.break();
            console.warn("Multiblock disconnected from secondaries. If you just loaded a save, this is fine.");
        }
        super.update();
    }
    resetSecondaries() {
        let possibleSecondaries = [
            this.buildAt(Direction.right),
            this.buildAt(Direction.down),
            this.level.buildingAtTile(this.pos.tileX + 1, this.pos.tileY + 1)
        ];
        for (let possibleSecondary of possibleSecondaries) {
            if (possibleSecondary instanceof MultiBlockSecondary &&
                (possibleSecondary.controller == this || possibleSecondary.controller == undefined)) {
                possibleSecondary.controller = this;
                this.secondaries.push(possibleSecondary);
            }
            else {
                return false;
            }
        }
        return true;
    }
    spawnItem(id) {
        if (super.spawnItem(id)) {
            return true;
        }
        for (let secondary of this.secondaries) {
            if (secondary.spawnItem(id)) {
                return true;
            }
        }
        return false;
    }
}
MultiBlockController.multiblockSize = [2, 2];
MultiBlockController.outputsItems = true;
class MultiBlockSecondary extends Building {
    constructor() {
        super(...arguments);
        this.controller = null;
    }
    acceptItem(item) {
        return this.controller?.acceptItem(item) ?? false;
    }
    break(isRecursive) {
        if (!isRecursive) {
            this.controller?.break();
        }
        else {
            this.controller = null;
            super.break();
        }
    }
    display(currentFrame) {
    }
    update() {
        if (!(this.controller instanceof MultiBlockController)) {
            this.break();
        }
    }
}
MultiBlockSecondary.outputsItems = true;
