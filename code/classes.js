"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.push(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.push(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
class Level {
    constructor(seed) {
        this.seed = seed;
        this.resources = {};
        this.storage = new Map();
        this.grid = new PowerGrid();
        this.buildings = new Set();
        this.format = consts.VERSION;
        this.uuid = Math.random().toString().substring(2);
    }
    static read(data) {
        const { chunks, resources, seed, version, uuid } = data;
        const level = new Level(seed);
        level.resources = resources;
        level.uuid = uuid;
        let position, chunkData;
        try {
            for ([position, chunkData] of Object.entries(chunks)) {
                chunkData.version = version;
                level.storage.set(position, Chunk.read(parseInt(position.split(",")[0]), parseInt(position.split(",")[1]), level, chunkData));
            }
        }
        catch (err) {
            throw new Error(`Error loading chunk ${position}: ${parseError(err)}`);
        }
        return level;
    }
    generate() {
        this.generateNecessaryChunks();
        this.buildBuilding(0, 0, ["base_resource_acceptor", 0]);
        this.buildBuilding(0, -1, ["base_resource_acceptor", 0]);
        this.buildBuilding(-1, 0, ["base_resource_acceptor", 0]);
        this.buildBuilding(-1, -1, ["base_resource_acceptor", 0]);
        return this;
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
        this.storage.set(`${x},${y}`, new Chunk(x, y, this).generate());
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
        let isError = !Buildings.get(changedID[0]).canBuildAt(tileX, tileY, this) || this.buildingAtTile(tileX, tileY)?.block.immutable;
        let underlayTextureSize = textureSize[0][0] == textureSize[0][1] ? textureSize : [[1, 1], [0, 0]];
        Gfx.tImage(isError ? Gfx.texture("misc/invalidunderlay") : Gfx.texture("misc/ghostunderlay"), tileX + underlayTextureSize[1][0], tileY + underlayTextureSize[1][1], underlayTextureSize[0][0], underlayTextureSize[0][1]);
        Gfx.alpha(0.7);
        Building.display(changedID, Pos.fromTileCoords(tileX, tileY, false), "ghostBuilds");
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
        if (block.canBuildAt(tileX, tileY, this)) {
            trigger(triggerType.placeBuilding, buildingID[0]);
            if (block.prototype instanceof MultiBlockController) {
                forceType(block);
                const offsets = MultiBlockController.getOffsetsForSize(...block.multiblockSize);
                for (const [xOffset, yOffset] of offsets) {
                    const buildUnder = this.buildingAtTile(tileX + xOffset, tileY + yOffset);
                    buildUnder?.break();
                }
                let controller = new block(tileX, tileY, buildingID[1], this);
                controller.secondaries = offsets.map(([x, y]) => new block.secondary(tileX + x, tileY + y, 0, this));
                controller.secondaries.forEach(secondary => secondary.controller = controller);
                this.writeBuilding(tileX, tileY, controller);
                this.buildings.add(controller);
                controller.secondaries.forEach(secondary => {
                    this.writeBuilding(secondary.pos.tileX, secondary.pos.tileY, secondary);
                    this.buildings.add(secondary);
                });
                return true;
            }
            else {
                const building = new block(tileX, tileY, block.changeMeta(buildingID[1], tileX, tileY, this), this);
                this.buildings.add(building);
                if (building instanceof PowerBuilding)
                    this.grid.addBuild(building);
                if (building instanceof OverlayBuild) {
                    return this.writeOverlayBuild(tileX, tileY, building);
                }
                else {
                    return this.writeBuilding(tileX, tileY, building);
                }
            }
        }
        else {
            trigger(triggerType.placeBuildingFail, buildingID[0]);
            return false;
        }
    }
    update(currentFrame) {
        this.buildings.forEach(b => b.preUpdate(currentFrame));
        this.grid.updatePower();
        this.buildings.forEach(b => b.update(currentFrame));
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
    constructor(x, y, parent) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.hasBuildings = false;
        let tweakedX = x == 0 ? 5850 : x;
        let tweakedY = y == 0 ? 9223 : y;
        this.chunkSeed = Math.abs((((tweakedX) ** 3) * (tweakedY ** 5) + 3850 + ((parent.seed - 314) * 11)) % (2 ** 16));
        this._generator = pseudoRandom(this.chunkSeed);
        this.layers = Chunk.initializeLayers();
        return this;
    }
    static initializeLayers() {
        const layers = [
            new Array(consts.CHUNK_SIZE),
            new Array(consts.CHUNK_SIZE),
            new Array(consts.CHUNK_SIZE)
        ];
        for (let i = 0; i < consts.CHUNK_SIZE; i++) {
            layers[0][i] = new Array(consts.CHUNK_SIZE).fill("base_null");
            layers[1][i] = new Array(consts.CHUNK_SIZE).fill(null);
            layers[2][i] = new Array(consts.CHUNK_SIZE).fill(null);
        }
        return layers;
    }
    static read(chunkX, chunkY, level, data) {
        const chunk = new Chunk(chunkX, chunkY, level);
        const numericVersion = +data.version.split(" ")[1].replaceAll(".", "");
        if (numericVersion < 200) {
            data.layers = data;
        }
        for (let y in data.layers[0]) {
            for (let x in data.layers[0][y]) {
                let _buildingData = data.layers[0][y][x];
                if (!_buildingData)
                    continue;
                chunk.hasBuildings = true;
                let buildingData;
                if (numericVersion <= 200) {
                    _buildingData.id = hex(_buildingData.id, 4);
                }
                if (numericVersion < 300) {
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
                    tempBuilding = Buildings.get(buildingData.id).read(buildingData, level);
                }
                catch (err) {
                    console.error(err);
                    throw new Error(`Failed to import building id ${stringifyMeta(buildingData.id, buildingData.meta)} at position ${x},${y} in chunk ${chunkX},${chunkY}. See console for more details.`);
                }
                level.buildings.add(tempBuilding);
                chunk.layers[1][y][x] = tempBuilding;
            }
        }
        for (let y in data.layers[1]) {
            for (let x in data.layers[1][y]) {
                let _buildingData = data.layers[1][y][x];
                if (!_buildingData)
                    continue;
                chunk.hasBuildings = true;
                let buildingData;
                if (numericVersion <= 200) {
                    _buildingData.id = hex(_buildingData.id, 4);
                }
                if (numericVersion < 300) {
                    buildingData = {
                        ..._buildingData,
                        id: mapLegacyRawBuildingID(getLegacyRawBuildingID(_buildingData.id)),
                        meta: +_buildingData.id >> 8
                    };
                }
                else
                    buildingData = _buildingData;
                let tempBuilding = new (Buildings.get(buildingData.id))(parseInt(x) + (consts.CHUNK_SIZE * chunkX), parseInt(y) + (consts.CHUNK_SIZE * chunkY), buildingData.meta, level);
                if (buildingData.item && numericVersion >= 130) {
                    tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id);
                }
                level.buildings.add(tempBuilding);
                chunk.layers[2][y][x] = tempBuilding;
            }
        }
        chunk.generate();
        return chunk;
    }
    update(currentFrame) {
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
        if (tileX < 0 || tileX >= consts.CHUNK_SIZE || tileY < 0 || tileY >= consts.CHUNK_SIZE)
            return false;
        this.layers[0][tileY][tileX] = value;
        return true;
    }
    setBuilding(tileX, tileY, value) {
        if (tileX < 0 || tileX >= consts.CHUNK_SIZE || tileY < 0 || tileY >= consts.CHUNK_SIZE)
            return false;
        this.layers[1][tileY][tileX] = value;
        if (value instanceof Building)
            this.hasBuildings = true;
        return true;
    }
    setOverlayBuild(tileX, tileY, value) {
        if (tileX < 0 || tileX >= consts.CHUNK_SIZE || tileY < 0 || tileY >= consts.CHUNK_SIZE)
            return false;
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
            Gfx.strokeColor("#000000");
            Gfx.lineWidth(1);
            Gfx.layer("tile");
            for (let y = 0; y < consts.CHUNK_SIZE; y++) {
                for (let x = 0; x < consts.CHUNK_SIZE; x++) {
                    currentframe.tps++;
                    let tileX = (this.x * consts.CHUNK_SIZE) + x;
                    let tileY = (this.y * consts.CHUNK_SIZE) + y;
                    const tile = this.layers[0][y][x];
                    Gfx.tImage(Gfx.texture(`tile/${tile}`), tileX, tileY, 1, 1);
                }
            }
            if (currentframe.debug) {
                for (let i = 1; i < consts.CHUNK_SIZE; i++) {
                    Gfx.tLine((this.x * consts.CHUNK_SIZE) + i, (this.y * consts.CHUNK_SIZE), (this.x * consts.CHUNK_SIZE) + i, ((this.y + 1) * consts.CHUNK_SIZE));
                    Gfx.tLine((this.x * consts.CHUNK_SIZE), (this.y * consts.CHUNK_SIZE) + i, ((this.x + 1) * consts.CHUNK_SIZE), (this.y * consts.CHUNK_SIZE) + i);
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
            Gfx.lineWidth(1);
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
        this.pos = Pos.fromPixelCoords(x, y);
    }
    update(currentframe) {
    }
    static display(id, pos) {
        Gfx.layer("items");
        Gfx.pImage(Gfx.texture(`item/${id}`), pos.pixelX, pos.pixelY, consts.ITEM_SIZE, consts.ITEM_SIZE, RectMode.CENTER);
    }
    display(currentframe) {
        if (Camera.isPointVisible([this.pos.pixelX, this.pos.pixelY], consts.ITEM_SIZE)) {
            currentframe.ips++;
            Item.display(this.id, this.pos);
        }
    }
    export() {
        return {
            id: this.id,
            x: this.pos.pixelX,
            y: this.pos.pixelY,
        };
    }
    static read(data) {
        return new this(data.x, data.y, data.id);
    }
}
let Building = (() => {
    let _classDecorators = [Abstract];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Building = _classThis = class {
        constructor(x, y, meta, level) {
            this.meta = meta;
            this.level = level;
            this.item = null;
            this.fluid = null;
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
        static canOutputTo(building) {
            return building instanceof Conveyor;
        }
        break() {
            this.level.buildings.delete(this);
            if (this.block.isOverlay)
                this.level.writeOverlayBuild(this.pos.tileX, this.pos.tileY, null);
            else
                this.level.writeBuilding(this.pos.tileX, this.pos.tileY, null);
        }
        preUpdate(currentFrame) { }
        update(currentFrame) {
            this.item?.update(currentFrame);
        }
        stringID() {
            return stringifyMeta(this.block.id, this.meta);
        }
        centeredPos() {
            return Pos.fromTileCoords(this.pos.tileX, this.pos.tileY, true);
        }
        static display(id, pos, layer) {
            const block = Buildings.get(id[0]);
            const textureSize = block.textureSize(id[1]);
            layer ?? (layer = block.isOverlay ? "overlayBuilds" : "buildings");
            Gfx.tImage(Gfx.texture(`building/${stringifyMeta(...id)}`), pos.tileX + textureSize[1][0], pos.tileY + textureSize[1][1], ...textureSize[0], Gfx.layers[layer]);
        }
        display(currentFrame, layer = this.block.isOverlay ? "overlayBuilds" : "buildings") {
            Gfx.layer(layer);
            Building.display([this.block.id, this.meta], this.pos, layer);
            this.block.drawer?.(this, currentFrame);
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
            return this.block.acceptsItems;
        }
        outputsItemToSide(side) {
            return this.block.outputsItems;
        }
        buildAt(direction) {
            return this.level.buildingAtTile(this.pos.tileX + direction.vec[0], this.pos.tileY + direction.vec[1]);
        }
        buildAtOffset(offset) {
            return this.level.buildingAtTile(this.pos.tileX + offset[0], this.pos.tileY + offset[1]);
        }
        spawnItem(id) {
            for (const direction of Direction) {
                const build = this.buildAt(direction);
                if (build && this.block.canOutputTo(build) &&
                    this.outputsItemToSide(direction) && build.acceptsItemFromSide(direction.opposite) && build.acceptItem(new Item((this.pos.tileX + 0.5 + direction.vec[0] * 0.6) * consts.TILE_SIZE, (this.pos.tileY + 0.5 + direction.vec[1] * 0.6) * consts.TILE_SIZE, id), direction.opposite))
                    return true;
            }
            return false;
        }
        acceptItem(item, side) {
            if (this.item === null && this.block.acceptsItems && (side == null || this.acceptsItemFromSide(side))) {
                this.item = item;
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
                item: this.item?.export() ?? null
            };
        }
        static read(buildingData, level) {
            const build = new this(buildingData.x, buildingData.y, buildingData.meta, level);
            if (buildingData.item)
                build.item = Item.read(buildingData.item);
            if (build instanceof PowerBuilding)
                level.grid.addBuild(build);
            return build;
        }
    };
    __setFunctionName(_classThis, "Building");
    (() => {
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name }, null, _classExtraInitializers);
        Building = _classThis = _classDescriptor.value;
    })();
    _classThis.outputsItems = false;
    _classThis.acceptsItems = false;
    _classThis.immutable = false;
    _classThis.isOverlay = false;
    _classThis.displaysItem = false;
    _classThis.drawer = null;
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Building = _classThis;
})();
let BuildingWithRecipe = (() => {
    let _classDecorators_1 = [Abstract];
    let _classDescriptor_1;
    let _classExtraInitializers_1 = [];
    let _classThis_1;
    var BuildingWithRecipe = _classThis_1 = class extends Building {
        constructor(tileX, tileY, meta, level) {
            super(tileX, tileY, meta, level);
            this.timer = -1;
            this.recipe = null;
            this.items = [];
        }
        acceptItem(item) {
            for (let i = 0; i < this.block.recipeMaxInputs; i++) {
                if (!this.items[i] && !this.items.map(item => item.id).includes(item.id)) {
                    for (let recipe of this.block.recipeType.recipes) {
                        if (!recipe.inputs)
                            continue;
                        if (!this.items.map(item => recipe.inputs.includes(item.id)).includes(false) && recipe.inputs.includes(item.id)) {
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
        static makeDrawer(drawer, ...drawers) {
            return ((build, currentFrame) => {
                if (build.recipe) {
                    Gfx.layer("buildings");
                    drawer(build, getAnimationData(1 - (build.timer) / build.recipe.duration), currentFrame);
                }
                drawers.forEach(d => d(build, currentFrame));
                BuildingWithRecipe.makeDrawer((build, e, currentFrame) => { build.recipe; });
            });
        }
        static progressDrawer() {
            return ((build, currentFrame) => {
                if (build.recipe) {
                    Gfx.layer("buildings");
                    Gfx.fillColor("blue");
                    Gfx.tEllipse(...build.centeredPos().tile, 0.3, 0.3, 0, 0, (1 - (build.timer) / build.recipe.duration) * 2 * Math.PI);
                }
            });
        }
        static outputDrawer() {
            return ((build, currentFrame) => {
                if (build.recipe) {
                    Item.display(build.recipe.outputs[0], build.centeredPos());
                }
            });
        }
    };
    __setFunctionName(_classThis_1, "BuildingWithRecipe");
    (() => {
        __esDecorate(null, _classDescriptor_1 = { value: _classThis_1 }, _classDecorators_1, { kind: "class", name: _classThis_1.name }, null, _classExtraInitializers_1);
        BuildingWithRecipe = _classThis_1 = _classDescriptor_1.value;
    })();
    _classThis_1.outputsItems = true;
    _classThis_1.acceptsItems = true;
    _classThis_1.recipeMaxInputs = 3;
    (() => {
        __runInitializers(_classThis_1, _classExtraInitializers_1);
    })();
    return BuildingWithRecipe = _classThis_1;
})();
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
TrashCan.acceptsItems = true;
class Conveyor extends Building {
    constructor() {
        super(...arguments);
        this.outputSide = Conveyor.outputSide(this.meta);
    }
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
            default: crash();
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
            default: crash();
        }
    }
    static outputSide(meta) {
        if ([2, 8, 9, 16, 17, 22, 26].includes(meta))
            return Direction.left;
        if ([3, 10, 11, 18, 19, 23, 27].includes(meta))
            return Direction.up;
        if ([0, 4, 5, 12, 13, 20, 24].includes(meta))
            return Direction.right;
        if ([1, 6, 7, 14, 15, 21, 25].includes(meta))
            return Direction.down;
        throw new Error(`Invalid meta ${meta}`);
    }
    static getID(type, direction, modifier) {
        return [type, direction.num];
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
                let building = this.buildAt(this.outputSide);
                if (!building)
                    return;
                if (building.acceptItem(this.item, this.outputSide.opposite)) {
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
}
Conveyor.displaysItem = true;
Conveyor.acceptsItems = true;
Conveyor.outputsItems = true;
Conveyor.speed = 1;
class OverlayBuild extends Building {
    buildingUnder() {
        return this.level.buildingAtPos(this.pos);
    }
}
OverlayBuild.isOverlay = true;
class Extractor extends OverlayBuild {
    constructor() {
        super(...arguments);
        this.outputOffset = this.block.getOutputTile(this.meta);
    }
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
        return [type, (modifier * 4) + direction.num];
    }
    static getOutputTile(meta) {
        switch (meta) {
            case 0: return [1, 0];
            case 1: return [0, 1];
            case 2: return [-1, 0];
            case 3: return [0, -1];
            case 4: return [2, 0];
            case 5: return [0, 2];
            case 6: return [-2, 0];
            case 7: return [0, -2];
            case 8: return [2, 0];
            case 9: return [0, 2];
            case 10: return [-2, 0];
            case 11: return [0, -2];
            default: throw new Error(`Invalid meta ${meta}`);
        }
    }
    grabItemFromTile(filter = item => item instanceof Item) {
        if (this.buildingUnder() instanceof Building &&
            this.buildingUnder().hasItem() &&
            filter(this.buildingUnder().hasItem())) {
            this.item = this.buildingUnder().removeItem();
            this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
            this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
        }
    }
    dropItem() {
        if (this.item instanceof Item) {
            if (this.buildAtOffset(this.outputOffset)?.acceptItem(this.item, null)) {
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
Extractor.outputsItems = true;
class StorageBuilding extends Building {
    constructor() {
        super(...arguments);
        this.inventory = [];
    }
    hasItem() {
        if (this.inventory.length != 0)
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
        if (this.inventory.length < this.block.capacity) {
            this.inventory.push(item);
            return true;
        }
        else
            return false;
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
            item: null,
            inv: inv
        };
    }
    static read(buildingData, level) {
        const build = super.read(buildingData, level);
        if (buildingData.inv) {
            for (const itemData of buildingData.inv) {
                build.inventory.push(Item.read(itemData));
            }
        }
        return build;
    }
}
StorageBuilding.capacity = 64;
StorageBuilding.acceptsItems = true;
class ResourceAcceptor extends Building {
    acceptItem(item) {
        var _a, _b;
        (_a = this.level.resources)[_b = item.id] ?? (_a[_b] = 0);
        this.level.resources[item.id]++;
        return true;
    }
}
ResourceAcceptor.immutable = true;
ResourceAcceptor.acceptsItems = true;
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
MultiBlockSecondary.acceptsItems = true;
class MultiBlockController extends BuildingWithRecipe {
    constructor() {
        super(...arguments);
        this.secondaries = [];
    }
    static textureSize(meta) {
        return [this.multiblockSize, [0, 0]];
    }
    static getOffsetsForSize(width, height) {
        let offsets = [];
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                if (i == 0 && j == 0)
                    continue;
                offsets.push([i, j]);
            }
        }
        return offsets;
    }
    centeredPos() {
        return Pos.fromTileCoords(this.pos.tileX + this.block.multiblockSize[0] / 2, this.pos.tileY + this.block.multiblockSize[1] / 2, false);
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
        }
        super.update();
    }
    resetSecondaries() {
        let possibleSecondaries = MultiBlockController.getOffsetsForSize(...this.block.multiblockSize)
            .map(([xOffset, yOffset]) => this.level.buildingAtTile(this.pos.tileX + xOffset, this.pos.tileY + yOffset));
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
class ItemModule {
    constructor(maxCapacity = 10) {
        this.maxCapacity = maxCapacity;
        this.storage = {};
    }
    get(id) {
        return this.storage[id] ?? 0;
    }
    has(id) {
        return this.storage[id] === 0 || this.storage[id] === undefined;
    }
    addFrom(stack) {
        var _a, _b;
        const remainingSpace = this.maxCapacity - this.get(stack[0]);
        const amountTransferred = Math.max(0, Math.min(remainingSpace, stack[1]));
        (_a = this.storage)[_b = stack[0]] ?? (_a[_b] = 0);
        this.storage[stack[0]] += amountTransferred;
        return (stack[1] -= amountTransferred) <= 0;
    }
    removeTo(stack, maxCapacity = Infinity) {
        var _a, _b;
        const remainingSpace = maxCapacity - stack[1];
        const amountTransferred = Math.min(remainingSpace, this.get(stack[0]));
        (_a = this.storage)[_b = stack[0]] ?? (_a[_b] = 0);
        this.storage[stack[0]] -= amountTransferred;
        return (stack[1] += amountTransferred) == maxCapacity;
    }
    merge(from, to) {
    }
}
class Fluid {
    constructor(name) {
        this.name = name;
        this.id = Fluid._id++;
        Fluid.all[this.id] = this;
    }
    static merge(from, to) {
        if (from[0] == null || from[1] == 0)
            return 0;
        if (to[0] === null)
            to[0] = from[0];
        else if (from[0] !== to[0])
            return 0;
        const remainingSpace = to[2] - to[1];
        const amountTransferred = Math.min(remainingSpace, from[1]);
        from[1] -= amountTransferred;
        to[1] += amountTransferred;
        return amountTransferred;
    }
}
Fluid.water = new Fluid("water");
Fluid._id = 1;
Fluid.all = [];
class PowerGrid {
    constructor() {
        this.producers = [];
        this.consumers = [];
    }
    updatePower() {
        const powerRequested = this.consumers.reduce((acc, p) => acc + p.getRequestedPower(), 0);
        const maxProduction = this.producers.reduce((acc, p) => acc + p.getMaxPowerProduction(), 0);
        const load = Math.min(powerRequested / maxProduction, 1);
        const satisfaction = Math.min(maxProduction / powerRequested, 1);
        this.producers.forEach(p => p.load = load);
        this.consumers.forEach(c => c.satisfaction = satisfaction);
    }
    addBuild(build) {
        if (build instanceof PowerConsumer)
            this.consumers.push(build);
        else if (build instanceof PowerProducer)
            this.producers.push(build);
        build.grid = this;
    }
    removeProducer(build) {
        const index = this.producers.indexOf(build);
        if (index == -1)
            return false;
        this.producers.splice(index, 1);
        build.load = 0;
    }
    removeConsumer(build) {
        const index = this.consumers.indexOf(build);
        if (index == -1)
            return false;
        this.consumers.splice(index, 1);
        build.satisfaction = 0;
    }
}
class PowerBuilding extends Building {
    constructor() {
        super(...arguments);
        this.grid = null;
    }
}
class PowerProducer extends PowerBuilding {
    constructor() {
        super(...arguments);
        this.load = 0;
    }
    break() {
        super.break();
        this.grid?.removeProducer(this);
    }
}
class PowerConsumer extends PowerBuilding {
    constructor() {
        super(...arguments);
        this.satisfaction = 0;
    }
    break() {
        super.break();
        this.grid?.removeConsumer(this);
    }
}
class PowerSource extends PowerProducer {
    getMaxPowerProduction() {
        return this.block.production;
    }
}
PowerSource.production = 100;
PowerSource.drawer = function (build, currentFrame) {
    Gfx.layer("overlay");
    const flashRate = consts.ups / build.load;
    const sin = Math.sin(Mathf.TWO_PI * (currentFrame.frame % flashRate / flashRate));
    Gfx.fillColor("yellow");
    Gfx.tEllipse(...build.pos.tileC, 0.3 + 0.2 * sin, 0.3 + 0.2 * sin);
};
class ArcTower extends PowerConsumer {
    constructor() {
        super(...arguments);
        this.arcAngle = 0;
        this.arcAVel = 0;
        this.arcAAccel = 0;
    }
    getRequestedPower() {
        return this.block.consumption;
    }
}
ArcTower.maxArcAAccel = 0.05;
ArcTower.maxArcAVel = 0.15;
ArcTower.consumption = 100;
ArcTower.primaryRadius = 4;
ArcTower.secondaryRadius = 1.5;
ArcTower.primaryRadiusRange = [-1, 1];
ArcTower.secondaryRadiusRange = [-0.25, 0.5];
ArcTower.color = "white";
ArcTower.drawer = function (build, currentFrame) {
    if (currentFrame.frame % 10 == 0)
        build.arcAAccel = random(-build.block.maxArcAAccel, build.block.maxArcAAccel);
    build.arcAVel = constrain(build.arcAVel + build.arcAAccel, -build.block.maxArcAVel, build.block.maxArcAVel);
    build.arcAngle = (build.arcAngle + build.arcAVel) % Mathf.TWO_PI;
    const rad = (build.block.primaryRadius + random(...build.block.primaryRadiusRange)) * build.satisfaction;
    const arcPos = [rad * Math.cos(build.arcAngle) + build.pos.tileXCentered, rad * Math.sin(build.arcAngle) + build.pos.tileYCentered];
    const srad1 = (build.block.secondaryRadius + random(...build.block.secondaryRadiusRange)) * build.satisfaction;
    const srad2 = (build.block.secondaryRadius + random(...build.block.secondaryRadiusRange)) * build.satisfaction;
    const srad1Angle = build.arcAngle + random(-(Math.PI * 2 / 3), Math.PI * 2 / 3);
    const srad2Angle = build.arcAngle + random(-(Math.PI * 2 / 3), Math.PI * 2 / 3);
    const sArc1Pos = [arcPos[0] + srad1 * Math.cos(srad1Angle), arcPos[1] + srad1 * Math.sin(srad1Angle)];
    const sArc2Pos = [arcPos[0] + srad2 * Math.cos(srad2Angle), arcPos[1] + srad2 * Math.sin(srad2Angle)];
    Gfx.layer("overlay");
    Gfx.strokeColor(build.block.color);
    Gfx.lineWidth(5);
    Gfx.alpha(0.5);
    Gfx.tLine(...build.pos.tileC, ...arcPos);
    Gfx.tLine(...arcPos, ...sArc1Pos);
    Gfx.tLine(...arcPos, ...sArc2Pos);
    Gfx.lineWidth(3);
    Gfx.alpha(1);
    Gfx.tLine(...build.pos.tileC, ...arcPos);
    Gfx.tLine(...arcPos, ...sArc1Pos);
    Gfx.tLine(...arcPos, ...sArc2Pos);
};
class Pump extends Building {
    constructor(tileX, tileY, meta, level) {
        super(tileX, tileY, meta, level);
    }
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY) == "base_water";
    }
    update() {
    }
}
Pump.productionSpeed = 1;
