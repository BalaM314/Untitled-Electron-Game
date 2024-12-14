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
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
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
var _a;
class Level {
    constructor(seed, applyStartResources) {
        this.seed = seed;
        this.resources = Object.fromEntries(ItemIDs.map(id => [id, 0]));
        this.timeSinceStoneRanOut = Date.now();
        this.resourceDisplayData = Object.fromEntries(ItemIDs.map(id => [id, {
                shouldShowAlways: false,
                amountRequired: null,
                flashEffect: null,
                flashExpireTime: 0,
            }]));
        this.storage = new Map();
        this.grid = new PowerGrid();
        this.buildings = new Set();
        this.format = consts.VERSION;
        this.uuid = Math.random().toString().substring(2);
        if (applyStartResources) {
            for (const [id, amount] of Level.startResources) {
                this.resources[id] = amount;
            }
        }
    }
    static read(data) {
        let { chunks, resources, seed, version, uuid } = data;
        const level = new Level(seed, false);
        if (!Array.isArray(resources))
            resources = Object.entries(resources);
        for (const [item, amount] of resources) {
            if (!isNaN(amount))
                level.resources[item] = amount;
        }
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
        level.buildings.forEach(b => {
            if (b instanceof MultiBlockController) {
                b.resetSecondaries();
            }
        });
        return level;
    }
    generate() {
        this.generateNecessaryChunks();
        this.buildBuilding(-2, -2, ["base_resource_acceptor", 1]);
        for (const [x, y] of MultiBlockController.getOffsetsForSize(4, 4)) {
            this.buildBuilding(-2 + x, -2 + y, ["base_resource_acceptor", 0]);
        }
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
        const yOffsets = [0, 1, 2, 3];
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
        this.getChunk(tileX, tileY).setBuilding(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building);
    }
    writeOverlayBuild(tileX, tileY, building) {
        this.getChunk(tileX, tileY).setOverlayBuild(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building);
    }
    displayGhostBuilding(tileX, tileY, buildingID, currentFrame) {
        Gfx.layer("ghostBuilds");
        if (keybinds.placement.break_building.isHeld() || Input.rightMouseDown) {
            Gfx.alpha(0.9);
            Gfx.tImage(Gfx.texture("misc/breakunderlay"), tileX, tileY, 1, 1);
            Gfx.alpha(1);
            return;
        }
        if (buildingID[0] == "base_null")
            return;
        if (!this.hasChunk(tileX, tileY))
            return;
        const block = Buildings.get(buildingID[0]);
        let changedID = [buildingID[0], buildingID[1]];
        changedID[1] = block.changeMeta(changedID[1], tileX, tileY, this);
        let textureSize = block.textureSize(buildingID[1]);
        let isError = !this.hasResources(block.buildCost, 100) || !block.canBuildAt(tileX, tileY, this) || this.buildingAtTile(tileX, tileY)?.block.immutable;
        let underlayTextureSize = textureSize[0][0] == textureSize[0][1] ? textureSize : [[1, 1], [0, 0]];
        Gfx.tImage(Gfx.texture(isError ? "misc/invalidunderlay" : "misc/ghostunderlay"), tileX + underlayTextureSize[1][0], tileY + underlayTextureSize[1][1], ...underlayTextureSize[0]);
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
        buildingID = [buildingID[0], block.changeMeta(buildingID[1], tileX, tileY, this)];
        if (block.isOverlay) {
            if (this.overlayBuildAtTile(tileX, tileY)?.block.id == buildingID[0] &&
                this.overlayBuildAtTile(tileX, tileY)?.meta == buildingID[1] &&
                !Input.canOverwriteBuilding())
                return false;
            this.overlayBuildAtTile(tileX, tileY)?.break();
        }
        else {
            if (this.buildingAtTile(tileX, tileY)?.block.id == buildingID[0] &&
                this.buildingAtTile(tileX, tileY)?.meta == buildingID[1] &&
                !Input.canOverwriteBuilding())
                return false;
            this.buildingAtTile(tileX, tileY)?.break();
        }
        Input.buildingPlaced = true;
        if (block.canBuildAt(tileX, tileY, this)) {
            if (!this.hasResources(block.buildCost, 1500))
                return false;
            if (block.prototype instanceof MultiBlockController) {
                forceType(block);
                const offsets = MultiBlockController.getOffsetsForSize(...block.multiblockSize);
                for (const [xOffset, yOffset] of offsets) {
                    const buildUnder = this.buildingAtTile(tileX + xOffset, tileY + yOffset);
                    if (buildUnder?.block.immutable)
                        return false;
                    buildUnder?.break();
                }
                this.drainResources(block.buildCost);
                let controller = new block(tileX, tileY, buildingID[1], this);
                controller.secondaries = offsets.map(([x, y]) => new block.secondary(tileX + x, tileY + y, 0, this));
                controller.secondaries.forEach(secondary => secondary.controller = controller);
                this.buildings.add(controller);
                this.grid.addBuilding(controller);
                this.writeBuilding(tileX, tileY, controller);
                controller.secondaries.forEach(secondary => {
                    this.writeBuilding(secondary.pos.tileX, secondary.pos.tileY, secondary);
                    this.buildings.add(secondary);
                });
                trigger("placeBuilding", { building: controller });
                Input.lastBuilding = controller;
                return true;
            }
            else {
                this.drainResources(block.buildCost);
                const building = new block(tileX, tileY, buildingID[1], this);
                this.buildings.add(building);
                this.grid.addBuilding(building);
                trigger("placeBuilding", { building });
                if (building instanceof OverlayBuild)
                    this.writeOverlayBuild(tileX, tileY, building);
                else
                    this.writeBuilding(tileX, tileY, building);
                Input.lastBuilding = building;
                return true;
            }
        }
        else {
            trigger("placeBuildingFail", { pos: Pos.fromTileCoords(tileX, tileY, false), type: block });
            return false;
        }
    }
    resetResourceDisplayData() {
        Object.values(level1.resourceDisplayData).forEach(d => {
            d.flashEffect = null;
            d.flashExpireTime = 0;
            d.amountRequired = null;
        });
    }
    hasResources(items, flashTime = 0) {
        let sufficient = true;
        for (const [item, amount] of items) {
            if (flashTime > 0) {
                level1.resourceDisplayData[item].amountRequired = amount;
            }
            if (level1.resources[item] < amount) {
                sufficient = false;
                if (flashTime) {
                    level1.resourceDisplayData[item].flashExpireTime = Date.now() + flashTime;
                    level1.resourceDisplayData[item].flashEffect = "flashing";
                }
                else
                    break;
            }
        }
        return sufficient;
    }
    missingItemForResources(items) {
        return items.find(([item, amount]) => this.resources[item] < amount)?.[0] ?? null;
    }
    drainResources(items) {
        var _b;
        for (const [item, amount] of items) {
            (_b = level1.resources)[item] ?? (_b[item] = 0);
            level1.resources[item] -= amount;
        }
    }
    addResources(items) {
        var _b;
        for (const [item, amount] of items) {
            (_b = level1.resources)[item] ?? (_b[item] = 0);
            level1.resources[item] += amount;
        }
    }
    update(currentFrame) {
        this.buildings.forEach(b => b.preUpdate(currentFrame));
        this.grid.updatePower();
        this.buildings.forEach(b => b.update(currentFrame));
        for (let chunk of this.storage.values()) {
            chunk.update(currentFrame);
        }
        if (this.resources["base_stone"] == 0 && Date.now() - this.timeSinceStoneRanOut > 15000 && !Game.stats.stoneRunOutMessageShown) {
            Game.stats.stoneRunOutMessageShown = true;
            GUI.alert(`It looks like you have run out of stone. Break unnecessary buildings by holding Backspace and moving the cursor over them to recover resources.`);
        }
        else if (this.resources["base_stone"] > 0) {
            this.timeSinceStoneRanOut = Date.now();
        }
    }
    display(currentframe) {
        for (const chunk of this.storage.values()) {
            chunk.display(currentframe);
        }
    }
    getTooltip(x, y) {
        let building = this.buildingAtPixel(x, y);
        if (building instanceof Building) {
            if (building.block.displaysItem && building.item &&
                (Math.abs(building.item.pos.pixelX - x) < consts.ITEM_SIZE / 2) &&
                Math.abs(building.item.pos.pixelY - y) < consts.ITEM_SIZE / 2) {
                const id = building.item.id;
                return Item.getTooltip(id);
            }
            else
                return building.getTooltip();
        }
        else {
            const id = this.tileAtByPixel(x, y);
            return tooltip(bundle.get(`tile.${id}.name`), {
                _description: bundle.get(`tile.${id}.description`, ""),
                id: settings.showIDsInTooltips ? id : ""
            });
        }
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
            resources: Object.entries(this.resources).filter(([id, amount]) => amount > 0),
            seed: this.seed,
            version: consts.VERSION,
            uuid: this.uuid
        };
    }
}
Level.startResources = [["base_stone", 50]];
class Chunk {
    constructor(x, y, parent) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.hasBuildings = false;
        this.pixelX = Pos.chunkToPixel(this.x);
        this.pixelY = Pos.chunkToPixel(this.y);
        this.tileX = Pos.chunkToTile(this.x);
        this.tileY = Pos.chunkToTile(this.y);
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
                else if (numericVersion < 310 && _buildingData.fluid) {
                    const fluid = _buildingData.fluid;
                    buildingData = {
                        ..._buildingData,
                        fluid: [Fluids.get(fluid[0] - 1).id, fluid[1]]
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
        const generation_consts = {
            perlin_scale: 2 * Math.PI,
            y_offset: 2031,
            ore_scale: 3,
            min_water_chunk_distance: 3,
            ocean_distance: 160,
            river_distance: 140,
            sand_distance: 155,
            hilly: {
                terrain_cutoff: 0,
                stone_threshold: 0.7,
                ore_threshold: 0.8,
                water_threshold: -0.1,
                min_iron_distance: 4,
                min_copper_distance: 7
            }
        };
        let isLake = false;
        let isHilly = false;
        let distanceFromSpawn = Math.sqrt((this.x) ** 2 + (this.y) ** 2);
        let distanceBoost = constrain(Math.log(distanceFromSpawn + 1) / 3, 0, 0.6);
        if (distanceBoost > generation_consts.hilly.terrain_cutoff) {
            isHilly = true;
        }
        if (isLake) {
            for (let y = 0; y < consts.CHUNK_SIZE; y++) {
                for (let x = 0; x < consts.CHUNK_SIZE; x++) {
                    if (y == 0 || y == 15 || x == 0 || x == 15) {
                        this.layers[0][y][x] = "base_water";
                    }
                    else if (y == 1 || y == 14 || x == 1 || x == 14) {
                        this.layers[0][y][x] = this.generator().chance(0.5) ? "base_water" : "base_stone";
                    }
                    else {
                        this.layers[0][y][x] =
                            this.generator().chance(0.1) ?
                                (this.generator().chance(0.3) ? "base_ore_iron" : "base_ore_coal")
                                : "base_stone";
                    }
                }
            }
        }
        else if (isHilly) {
            let oreToGenerate;
            const oreRand = this.generator();
            if (distanceFromSpawn < generation_consts.hilly.min_iron_distance) {
                oreToGenerate = "base_ore_coal";
            }
            else if (Math.floor(distanceFromSpawn) == generation_consts.hilly.min_iron_distance) {
                oreToGenerate = "base_ore_iron";
            }
            else if (distanceFromSpawn < generation_consts.hilly.min_copper_distance) {
                oreToGenerate = oreRand.chance(0.5) ? "base_ore_coal" : "base_ore_iron";
            }
            else if (Math.floor(distanceFromSpawn) == generation_consts.hilly.min_copper_distance) {
                oreToGenerate = "base_ore_copper";
            }
            else {
                oreToGenerate = oreRand.chance(0.5) ? (oreRand.chance(0.25) ? "base_ore_copper" : "base_ore_iron") : "base_ore_coal";
            }
            for (let y = 0; y < consts.CHUNK_SIZE; y++) {
                for (let x = 0; x < consts.CHUNK_SIZE; x++) {
                    const dist = Math.sqrt(((this.x * consts.CHUNK_SIZE) + x) ** 2 + ((this.y * consts.CHUNK_SIZE) + y) ** 2);
                    if (dist > generation_consts.ocean_distance) {
                        this.layers[0][y][x] = "base_water";
                    }
                    else {
                        const noiseHeight = Math.abs(noise.perlin2(((this.x * consts.CHUNK_SIZE) + x + this.parent.seed) / generation_consts.perlin_scale, ((this.y * consts.CHUNK_SIZE) + y + (this.parent.seed + generation_consts.y_offset))
                            / generation_consts.perlin_scale));
                        if ((noiseHeight + distanceBoost / 2) > generation_consts.hilly.ore_threshold) {
                            this.layers[0][y][x] = oreToGenerate;
                        }
                        else if ((noiseHeight + distanceBoost) > generation_consts.hilly.stone_threshold) {
                            this.layers[0][y][x] = dist > generation_consts.sand_distance ? "base_sand" : "base_stone";
                        }
                        else if (dist > generation_consts.river_distance && noiseHeight - (distanceBoost / 5) < generation_consts.hilly.water_threshold) {
                            this.layers[0][y][x] = "base_water";
                        }
                        else {
                            this.layers[0][y][x] = "base_grass";
                        }
                    }
                }
            }
        }
        else {
            for (let y = 0; y < consts.CHUNK_SIZE; y++) {
                for (let x = 0; x < consts.CHUNK_SIZE; x++) {
                    this.layers[0][y][x] = "base_grass";
                }
            }
            this.setTile(10, 9, "base_stone");
            this.setTile(10, 10, "base_ore_coal");
            this.setTile(10, 11, "base_ore_coal");
            this.setTile(10, 12, "base_stone");
            this.setTile(11, 9, "base_stone");
            this.setTile(12, 10, "base_stone");
            this.setTile(11, 10, "base_stone");
            this.setTile(11, 11, "base_stone");
            this.setTile(11, 12, "base_stone");
            this.setTile(9, 9, "base_stone");
            this.setTile(9, 10, "base_stone");
            this.setTile(9, 11, "base_stone");
            this.setTile(9, 12, "base_stone");
        }
        return this;
    }
    display(currentframe) {
        if (!Camera.isVisible([
            this.pixelX, this.pixelY,
            consts.chunkSizeInPixels, consts.chunkSizeInPixels
        ], consts.chunkCullingMargin))
            return;
        currentframe.cps++;
        if (currentframe.redraw) {
            Gfx.strokeColor("#000000");
            Gfx.lineWidth(1);
            Gfx.layer("tile");
            currentframe.tps += 256;
            let tileX;
            let tileY;
            for (let y = 0; y < consts.CHUNK_SIZE; y++) {
                tileY = this.tileY + y;
                for (let x = 0; x < consts.CHUNK_SIZE; x++) {
                    tileX = this.tileX + x;
                    const tile = this.layers[0][y][x];
                    Gfx.tImageOneByOne(Gfx.texture(`tile/${tile}`), tileX, tileY);
                }
            }
            Gfx.layer("tileOver");
            if (settings.showTileBorders) {
                for (let i = 0; i < consts.CHUNK_SIZE; i++) {
                    Gfx.tLine(this.tileX + i, this.tileY, this.tileX + i, ((this.y + 1) * consts.CHUNK_SIZE));
                    Gfx.tLine(this.tileX, this.tileY + i, ((this.x + 1) * consts.CHUNK_SIZE), this.tileY + i);
                }
            }
        }
        for (let y = 0; y < this.layers[1].length; y++) {
            for (let x = 0; x < this.layers[1][y].length; x++) {
                this.layers[1][y][x]?.display(currentframe);
                this.layers[2][y][x]?.display(currentframe);
            }
        }
        if (settings.showChunkBorders) {
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
    static getTooltip(id) {
        return tooltip(bundle.get(`item.${id}.name`), {
            _description: bundle.get(`item.${id}.description`, ""),
            id: settings.showIDsInTooltips ? id : ""
        });
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
            this.fluidOut = null;
            this.cItemOut = 0;
            this.cFluidOut = 0;
            this.fluidThroughput = 0;
            this.grid = null;
            this.num1 = 0;
            this.powerLoad = 0;
            this.powerSatisfaction = 0;
            this.block = this.constructor;
            this.pos = Pos.fromTileCoords(x, y, false);
            if (this.block.fluidCapacity)
                this.fluid = [null, 0, this.block.fluidCapacity];
        }
        static unlocked() {
            return this.node?.unlocked ?? this.hidden;
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
        static canOutputFluidTo(building) {
            return building instanceof Pipe;
        }
        break() {
            this.level.buildings.delete(this);
            if (this.grid) {
                if (this.block.consumesPower)
                    this.grid.removeConsumer(this);
                if (this.block.producesPower)
                    this.grid.removeProducer(this);
            }
            if (this.block.isOverlay)
                this.level.writeOverlayBuild(this.pos.tileX, this.pos.tileY, null);
            else
                this.level.writeBuilding(this.pos.tileX, this.pos.tileY, null);
            this.level.addResources(this.block.buildCost);
        }
        preUpdate(currentFrame) { }
        update(currentFrame) {
            this.item?.update(currentFrame);
            if (this.block.outputsFluids)
                this.dumpFluid();
        }
        stringID() {
            return stringifyMeta(this.block.id, this.meta);
        }
        centeredPos() {
            return Pos.fromTileCoords(this.pos.tileX, this.pos.tileY, true);
        }
        static tooltip(...lines) {
            return tooltip(bundle.get(`building.${this.id}.name`), [
                bundle.get(`building.${this.id}.description`, ""),
                ...lines
            ]);
        }
        static display(id, pos, layer) {
            const block = Buildings.get(id[0]);
            const textureSize = block.textureSize(id[1]);
            layer ?? (layer = block.isOverlay ? "overlayBuilds" : "buildings");
            Gfx.tImage(Gfx.texture(`building/${stringifyMeta(...id)}`), pos.tileX + textureSize[1][0], pos.tileY + textureSize[1][1], ...textureSize[0], Gfx.layers[layer]);
        }
        displayName() {
            return bundle.get(`building.${this.block.id}.name`);
        }
        getTooltip() {
            return tooltip(this.displayName(), this.tooltipProperties());
        }
        tooltipProperties() {
            return {
                _description: bundle.get(`building.${this.block.id}.description`, ""),
                id: settings.showIDsInTooltips ? this.block.id : ""
            };
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
        acceptsFluidFromSide(side) {
            return this.block.acceptsFluids;
        }
        outputsFluidToSide(side) {
            return this.block.outputsFluids;
        }
        fluidExtraPressure() {
            return this.block.fluidExtraPressure;
        }
        fluidInputSpeed(from) {
            return this.block.fluidInputSpeed;
        }
        fluidOutputSpeed(to) {
            return this.block.fluidOutputSpeed * constrain((this.pressureOut() - to.pressureIn()) + this.fluidExtraPressure(), 0, 1);
        }
        getMaxPowerProduction() {
            throw new Error(`Function "getMaxPowerProduction" not implemented for base class Building.`);
        }
        canVaryPowerProduction() {
            return true;
        }
        getRequestedPower() {
            throw new Error(`Function "getRequestedPower" not implemented for base class Building.`);
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
        dumpFluid() {
            this.fluidThroughput = 0;
            const fluid = this.fluidOut ?? this.fluid;
            if (!fluid || fluid[0] == null || fluid[1] == 0)
                return;
            for (let i = 0; i < Direction.number; i++) {
                if (++this.cFluidOut > 3)
                    this.cFluidOut = 0;
                const direction = Direction.all[this.cFluidOut];
                const build = this.buildAt(direction);
                if (build && this.block.canOutputFluidTo(build) &&
                    this.outputsFluidToSide(direction) && build.acceptsFluidFromSide(direction.opposite)) {
                    this.fluidThroughput = build.acceptFluid(fluid, this.fluidOutputSpeed(build), this);
                    return;
                }
            }
        }
        acceptFluid(stack, maxThroughput, from) {
            if (this.fluid)
                return Fluid.merge(stack, this.fluid, Math.min(maxThroughput, this.fluidInputSpeed(from)));
            return null;
        }
        pressureOut() {
            const fluid = this.fluidOut ?? this.fluid;
            if (!fluid)
                return 0;
            const fillLevel = fluid[1] / this.block.fluidCapacity;
            return fillLevel;
        }
        pressureIn() {
            if (!this.fluid)
                return 0;
            const fillLevel = this.fluid[1] / this.block.fluidCapacity;
            return fillLevel;
        }
        export() {
            return {
                x: this.pos.tileX,
                y: this.pos.tileY,
                id: this.block.id,
                meta: this.meta,
                item: this.item?.export() ?? null,
                fluid: this.fluid ? [this.fluid[0]?.id ?? null, this.fluid[1]] : null,
            };
        }
        static read(buildingData, level) {
            const build = new this(buildingData.x, buildingData.y, buildingData.meta, level);
            if (buildingData.item)
                build.item = Item.read(buildingData.item);
            level.grid.addBuilding(build);
            if (buildingData.fluid && this.fluidCapacity)
                build.fluid = [Fluids.get(buildingData.fluid[0]), buildingData.fluid[1], this.fluidCapacity];
            return build;
        }
    };
    __setFunctionName(_classThis, "Building");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Building = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    _classThis.outputsItems = false;
    _classThis.acceptsItems = false;
    _classThis.outputsFluids = false;
    _classThis.acceptsFluids = false;
    _classThis.fluidCapacity = 100;
    _classThis.fluidInputSpeed = 1;
    _classThis.fluidOutputSpeed = 1;
    _classThis.fluidExtraPressure = 0;
    _classThis.immutable = false;
    _classThis.isOverlay = false;
    _classThis.displaysItem = false;
    _classThis.buildCost = [];
    _classThis.drawer = null;
    _classThis.node = null;
    _classThis.producesPower = false;
    _classThis.consumesPower = false;
    _classThis.hidden = false;
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Building = _classThis;
})();
let BuildingWithRecipe = (() => {
    let _classDecorators = [Abstract];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = Building;
    var BuildingWithRecipe = _classThis = class extends _classSuper {
        constructor(tileX, tileY, meta, level) {
            super(tileX, tileY, meta, level);
            this.timer = -1;
            this.runEffectTimer = -1;
            this.recipe = null;
            this.running = false;
            this.items = [];
            this.fluidOut = [null, 0, this.block.fluidCapacity];
            this.efficiency = 0;
            this.efficiencyp = 0;
        }
        acceptItem(item) {
            if (this.recipe) {
                if (!this.recipe.inputs)
                    return false;
                const required = this.recipe.inputs.find(i => i[0] == item.id);
                const existingStack = this.items.find(i => i[0] == item.id);
                if (!required || !existingStack)
                    return false;
                if (existingStack[1] < required[1]) {
                    existingStack[1]++;
                    if (this.recipe.inputs.every(([item, amount]) => this.items.some(([i, a]) => i == item && a >= amount))) {
                        this.running = true;
                    }
                    return true;
                }
            }
            else {
                for (let i = 0; i < this.block.recipeMaxInputs; i++) {
                    if (!this.items[i] && !this.items.map(item => item[0]).includes(item.id)) {
                        for (let recipe of this.block.recipeType.recipes) {
                            if (!recipe.inputs)
                                continue;
                            if (recipe.fluidInputs && (this.block.fluidCapacity == 0 || !this.block.acceptsFluids))
                                continue;
                            if (recipe.powerConsumption && !this.block.consumesPower)
                                continue;
                            if (this.items.every(item => recipe.inputs.some(([id, amount]) => id == item[0])) && recipe.inputs.some(([id, amount]) => id == item.id)) {
                                this.items[i] = [item.id, 1];
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
            return false;
        }
        hasItem() {
            return null;
        }
        removeItem() {
            return null;
        }
        setRecipe(recipe) {
            this.recipe = recipe;
            this.timer = recipe.duration;
            this.runEffectTimer = recipe.duration;
            if (!this.recipe.inputs || this.recipe.inputs.every(([item, amount]) => this.items.some(([i, a]) => i == item && a >= amount))) {
                this.running = true;
            }
        }
        update(currentFrame) {
            if (this.recipe && this.running) {
                if (this.timer > 0) {
                    let minSatisfaction = this.recipe.inputs?.length ? Math.min(this.timer, 1) : 1;
                    if (this.recipe.fluidInputs) {
                        for (const fluidInput of this.recipe.fluidInputs) {
                            const amountNeeded = fluidInput[1] / this.recipe.duration;
                            const amountDrained = Fluid.checkDrain(this.fluid, amountNeeded);
                            minSatisfaction = Math.min(amountDrained / amountNeeded, minSatisfaction);
                        }
                    }
                    if (this.block.consumesPower && this.recipe.powerConsumption) {
                        minSatisfaction = Math.min(minSatisfaction, this.powerSatisfaction);
                    }
                    this.efficiencyp = minSatisfaction;
                    if (this.block.producesPower && this.recipe.powerProduction) {
                        minSatisfaction = Math.min(minSatisfaction, this.powerLoad);
                    }
                    if (this.recipe.fluidInputs) {
                        for (const fluidInput of this.recipe.fluidInputs) {
                            const amountNeeded = fluidInput[1] / this.recipe.duration * minSatisfaction;
                            const amountDrained = Fluid.drain(this.fluid, amountNeeded);
                            if (amountDrained - amountNeeded > Number.EPSILON * 5)
                                throw new ShouldNotBePossibleError(`logic error when consuming fluids: needed ${amountNeeded}, got ${amountDrained}`);
                        }
                    }
                    this.efficiency = minSatisfaction;
                    this.timer -= minSatisfaction;
                    if (this.recipe.fluidOutputs && minSatisfaction > 0) {
                        for (const fluidOutput of this.recipe.fluidOutputs) {
                            Fluid.fill(this.fluidOut, Fluids.get(fluidOutput[0]), fluidOutput[1] / this.recipe.duration * minSatisfaction);
                        }
                    }
                }
                else if (this.timer > -1) {
                    if ((this.recipe.outputs && this.spawnItem(this.recipe.outputs[0][0])) || !this.recipe.outputs) {
                        if (this.block.craftEffect)
                            this.block.craftEffect[0].at(this.centeredPos(), this.block.craftEffect[1]);
                        this.timer = -1;
                        this.items = [];
                        this.recipe = null;
                        this.running = false;
                    }
                }
            }
            if (this.recipe == null && this.block.recipeType.recipes.length == 1 && (this.block.recipeType.recipes[0].inputs?.length ?? 0) == 0) {
                this.setRecipe(this.block.recipeType.recipes[0]);
            }
            super.update(currentFrame);
        }
        getMaxPowerProduction() {
            return (this.recipe?.powerProduction ?? 0) * this.efficiencyp;
        }
        getRequestedPower() {
            return (this.recipe?.powerConsumption ?? 0);
        }
        display(currentFrame, layer) {
            super.display(currentFrame, layer);
            if (this.block.runEffect &&
                this.timer > 0 &&
                this.timer <= this.runEffectTimer) {
                if (Math.random() < this.block.runEffect[3])
                    this.block.runEffect[0].at(this.centeredPos(), this.block.runEffect[1]);
                this.runEffectTimer -= this.block.runEffect[2];
            }
        }
        tooltipProperties() {
            return {
                ...super.tooltipProperties(),
                Progress: this.recipe ? `${round(this.recipe.duration - this.timer, 2).toFixed(2)} / ${this.recipe.duration}` : "",
                Efficiency: `${round(this.efficiency * 100, 2).toString()}%`,
                "Power Generation": this.recipe?.powerProduction ? `${(this.efficiency * this.recipe.powerProduction).toFixed(0)}/${(this.efficiencyp * this.recipe.powerProduction).toFixed(0)}` : undefined,
                "Power Usage": this.recipe?.powerConsumption ? `${(this.efficiency * this.recipe.powerConsumption).toFixed(0)}/${this.recipe.powerConsumption.toFixed(0)}` : undefined,
            };
        }
        export() {
            return {
                ...super.export(),
                items: this.items
            };
        }
        static read(buildingData, level) {
            const build = super.read(buildingData, level);
            for (const [item, amount] of buildingData.items ?? []) {
                if (ItemIDs.includes(item) && typeof amount == "number" && amount >= 0)
                    build.items.push([item, amount]);
            }
            const recipe = this.recipeType.recipes.find(r => r.inputs?.every(([item, amount]) => build.items.some(([i, a]) => item == i && a > 0)));
            if (recipe)
                build.setRecipe(recipe);
            return build;
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
        static combineDrawers(...drawers) {
            return ((build, currentFrame) => {
                Gfx.layer("buildings");
                drawers.forEach(d => d(build, currentFrame));
                BuildingWithRecipe.makeDrawer((build, e, currentFrame) => { build.recipe; });
            });
        }
        static progressDrawerOld() {
            return ((build, currentFrame) => {
                if (build.recipe) {
                    Gfx.layer("buildings");
                    Gfx.fillColor("blue");
                    Gfx.tEllipse(...build.centeredPos().tile, 0.3, 0.3, 0, 0, (1 - (build.timer) / build.recipe.duration) * 2 * Math.PI);
                }
            });
        }
        static progressDrawer() {
            return ((build, currentFrame) => {
                if (build.recipe) {
                    const [w, h] = build.block.textureSize(build.meta)[0];
                    Gfx.layer("buildings");
                    Gfx.fillColor("darkblue");
                    Gfx.tRect(build.pos.tileX + 0.125 * w, build.pos.tileY + 0.125 * h, 0.75 * w, 0.0625 * h, RectMode.CORNER);
                    Gfx.fillColor("cyan");
                    Gfx.tRect(build.pos.tileX + 0.125 * w, build.pos.tileY + 0.125 * h, (1 - build.timer / build.recipe.duration) * 0.75 * w, 0.0625 * h, RectMode.CORNER);
                }
            });
        }
        static outputDrawer() {
            return ((build, currentFrame) => {
                if (build.recipe?.outputs) {
                    Item.display(build.recipe.outputs[0][0], build.centeredPos());
                }
            });
        }
        static drawFluid(offset, width, height) {
            return ((build, currentFrame) => {
                if (!build.fluid[0])
                    return;
                Gfx.layer("buildingsUnder");
                Gfx.fillColor(build.fluid[0].color);
                Gfx.alpha(build.fluid[1] / build.block.fluidCapacity);
                Gfx.tRect(...add(build.pos.tileC, offset), width, height, RectMode.CENTER);
            });
        }
        static drawLayer(texture, width = 1, height = 1, getAlpha = () => 1) {
            return ((build, currentFrame) => {
                Gfx.layer("buildings");
                Gfx.alpha(getAlpha(build));
                Gfx.tImage(Gfx.texture(texture), ...build.pos.tile, width, height);
                Gfx.alpha(1);
            });
        }
    };
    __setFunctionName(_classThis, "BuildingWithRecipe");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BuildingWithRecipe = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    _classThis.outputsItems = true;
    _classThis.acceptsItems = true;
    _classThis.recipeMaxInputs = 3;
    _classThis.craftEffect = null;
    _classThis.runEffect = null;
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BuildingWithRecipe = _classThis;
})();
class Miner extends Building {
    constructor(tileX, tileY, meta, level) {
        super(tileX, tileY, meta, level);
        this.miningItem = null;
        this.ranOnce = false;
        this.timer = 61;
        const output = recipes.base_mining.recipes.find(r => r.tile == level.tileAtByTile(tileX, tileY))?.outputs[0][0];
        if (output) {
            this.miningItem = output;
            objectives.get("base_produceStone").satisfy();
        }
        else
            console.warn(`Miner cannot mine tile at ${tileX}, ${tileY}`);
    }
    static canBuildAt(tileX, tileY, level) {
        return recipes.base_mining.recipes.some(r => r.tile == level.tileAtByTile(tileX, tileY));
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
                if (!this.ranOnce) {
                    trigger("buildingFirstRun", { building: this });
                    this.ranOnce = true;
                }
            }
        }
    }
}
Miner.outputsItems = true;
class TrashCan extends Building {
    acceptItem(item) {
        return true;
    }
    acceptFluid(stack, maxThroughput, from) {
        return Fluid.drain(stack, maxThroughput);
    }
}
TrashCan.acceptsItems = true;
TrashCan.acceptsFluids = true;
class Conveyor extends Building {
    constructor() {
        super(...arguments);
        this.outputSide = Conveyor.outputSide(this.meta);
    }
    acceptsItemFromSide(side) {
        return Boolean(this.block.inputMapping[this.meta] & side.bitmask);
    }
    outputsItemToSide(side) {
        return this.block.outputMapping[this.meta] == side;
    }
    static outputSide(meta) {
        return this.outputMapping[meta] ?? crash(`Invalid meta ${meta}`);
    }
    static getID(type, direction, modifier) {
        return [type, direction.num];
    }
    static changeMeta(meta, tileX, tileY, level) {
        if (keybinds.placement.force_straight_conveyor.isHeld()) {
            return meta;
        }
        let hasLeft = level.buildingAtTile(tileX - 1, tileY)?.outputsItemToSide(Direction.right) ?? false;
        let hasUp = level.buildingAtTile(tileX, tileY - 1)?.outputsItemToSide(Direction.down) ?? false;
        let hasRight = level.buildingAtTile(tileX + 1, tileY)?.outputsItemToSide(Direction.left) ?? false;
        let hasDown = level.buildingAtTile(tileX, tileY + 1)?.outputsItemToSide(Direction.up) ?? false;
        switch (meta) {
            case 0:
                if (hasLeft) {
                    if (hasUp && hasDown)
                        return 0x18;
                    else if (hasUp)
                        return 0x0D;
                    else if (hasDown)
                        return 0x0C;
                    else
                        return 0x00;
                }
                else {
                    if (hasUp && hasDown)
                        return 0x14;
                    else if (hasUp)
                        return 0x05;
                    else if (hasDown)
                        return 0x04;
                    else
                        return 0x00;
                }
            case 1:
                if (hasUp) {
                    if (hasLeft && hasRight)
                        return 0x19;
                    else if (hasLeft)
                        return 0x0F;
                    else if (hasRight)
                        return 0x0E;
                    else
                        return 0x01;
                }
                else {
                    if (hasLeft && hasRight)
                        return 0x15;
                    else if (hasLeft)
                        return 0x07;
                    else if (hasRight)
                        return 0x06;
                    else
                        return 0x01;
                }
            case 2:
                if (hasRight) {
                    if (hasUp && hasDown)
                        return 0x1A;
                    else if (hasUp)
                        return 0x11;
                    else if (hasDown)
                        return 0x10;
                    else
                        return 0x02;
                }
                else {
                    if (hasUp && hasDown)
                        return 0x16;
                    else if (hasUp)
                        return 0x09;
                    else if (hasDown)
                        return 0x08;
                    else
                        return 0x02;
                }
            case 3:
                if (hasDown) {
                    if (hasLeft && hasRight)
                        return 0x1B;
                    else if (hasLeft)
                        return 0x13;
                    else if (hasRight)
                        return 0x12;
                    else
                        return 0x03;
                }
                else {
                    if (hasLeft && hasRight)
                        return 0x17;
                    else if (hasLeft)
                        return 0x0B;
                    else if (hasRight)
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
                if (this.buildAt(this.outputSide)?.acceptItem(this.item, this.outputSide.opposite))
                    this.item = null;
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
Conveyor.inputMapping = [
    0b0100,
    0b1000,
    0b0001,
    0b0010,
    0b0010,
    0b1000,
    0b0001,
    0b0100,
    0b0010,
    0b1000,
    0b0001,
    0b0100,
    0b0110,
    0b1100,
    0b1001,
    0b1100,
    0b0011,
    0b1001,
    0b0011,
    0b0110,
    0b1010,
    0b0101,
    0b1010,
    0b0101,
    0b1110,
    0b1101,
    0b1011,
    0b0111,
];
Conveyor.outputMapping = [
    Direction.right,
    Direction.down,
    Direction.left,
    Direction.up,
    Direction.right,
    Direction.right,
    Direction.down,
    Direction.down,
    Direction.left,
    Direction.left,
    Direction.up,
    Direction.up,
    Direction.right,
    Direction.right,
    Direction.down,
    Direction.down,
    Direction.left,
    Direction.left,
    Direction.up,
    Direction.up,
    Direction.right,
    Direction.down,
    Direction.left,
    Direction.up,
    Direction.right,
    Direction.down,
    Direction.left,
    Direction.up,
];
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
            case 8: return [3, 0];
            case 9: return [0, 3];
            case 10: return [-3, 0];
            case 11: return [0, -3];
            default: throw new Error(`Invalid meta ${meta}`);
        }
    }
    grabItemFromTile(filter = item => item instanceof Item) {
        if (this.buildingUnder() instanceof Building &&
            this.buildingUnder().hasItem() &&
            filter(this.buildingUnder().hasItem())) {
            this.item = this.buildingUnder().removeItem();
            switch (this.meta) {
                case 0:
                case 4:
                case 8:
                    this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    break;
                case 1:
                case 5:
                case 9:
                    this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                    break;
                case 2:
                case 6:
                case 10:
                    this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    break;
                case 3:
                case 7:
                case 11:
                    this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                    break;
            }
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
    tooltipProperties() {
        return {
            ...super.tooltipProperties(),
            Storage: `${this.inventory.length} / ${this.block.capacity}`
        };
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
    static textureSize(meta) {
        return [[4, 4], [0, 0]];
    }
    acceptItem(item) {
        this.level.resources[item.id]++;
        if (item.id == "base_stone") {
            this.level.timeSinceStoneRanOut = Date.now();
        }
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
    break(isRecursive = false) {
        if (this.controller && !isRecursive)
            this.controller.break();
        else {
            this.controller = null;
            super.break();
        }
    }
    display(currentFrame) {
    }
    displayName() {
        return bundle.get(`building.${this.controller?.block.id ?? this.block.id}.name`);
    }
    tooltipProperties() {
        return this.controller?.tooltipProperties() ?? {};
    }
    update() {
        if (!(this.controller instanceof MultiBlockController)) {
            this.break();
        }
    }
    acceptFluid(stack, maxThroughput, from) {
        return this.controller?.acceptFluid(stack, maxThroughput, from) ?? null;
    }
    pressureIn() {
        return this.controller?.pressureIn() ?? 1;
    }
    pressureOut() {
        return this.controller?.pressureOut() ?? 0;
    }
}
MultiBlockSecondary.outputsItems = true;
MultiBlockSecondary.acceptsItems = true;
MultiBlockSecondary.acceptsFluids = true;
MultiBlockSecondary.outputsFluids = true;
MultiBlockSecondary.hidden = true;
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
    update(currentFrame) {
        if (this.secondaries.length != this.block.multiblockSize[0] * this.block.multiblockSize[1] - 1) {
            if (!this.resetSecondaries())
                this.break();
        }
        super.update(currentFrame);
    }
    resetSecondaries() {
        let possibleSecondaries = _a.getOffsetsForSize(...this.block.multiblockSize)
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
        if (id == "base_stator")
            objectives.get("base_produceStators").satisfy();
        else if (id == "base_rotor")
            objectives.get("base_produceRotors").satisfy();
        else if (id == "base_motor")
            objectives.get("base_produceMotors").satisfy();
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
    dumpFluidAt(fluid, tileX, tileY, direction) {
        const build = this.level.buildingAtTile(tileX + direction.vec[0], tileY + direction.vec[1]);
        if (build && this.block.canOutputFluidTo(build) &&
            this.outputsFluidToSide(direction) && build.acceptsFluidFromSide(direction.opposite)) {
            this.fluidThroughput = build.acceptFluid(fluid, this.fluidOutputSpeed(build), this);
            return;
        }
    }
    dumpFluid() {
        this.fluidThroughput = 0;
        const fluid = this.fluidOut ?? this.fluid;
        if (!fluid || fluid[0] == null || fluid[1] == 0)
            return;
        const numDirections = 2 * (this.block.multiblockSize[0] + this.block.multiblockSize[1]);
        for (let i = 0; i < numDirections; i++) {
            this.dumpFluidAt(fluid, ...this.block.outputPositions[this.cFluidOut]);
            if (++this.cFluidOut >= numDirections)
                this.cFluidOut = 0;
        }
    }
}
_a = MultiBlockController;
MultiBlockController.multiblockSize = [2, 2];
MultiBlockController.outputPositions = [];
(() => {
    for (let y = 0; y < _a.multiblockSize[0]; y++) {
        _a.outputPositions.push([_a.multiblockSize[0] - 1, y, Direction.right]);
    }
    for (let x = _a.multiblockSize[0] - 1; x >= 0; x--) {
        _a.outputPositions.push([x, _a.multiblockSize[1] - 1, Direction.down]);
    }
    for (let y = _a.multiblockSize[0] - 1; y >= 0; y--) {
        _a.outputPositions.push([0, y, Direction.left]);
    }
    for (let x = 0; x < _a.multiblockSize[0]; x++) {
        _a.outputPositions.push([x, 0, Direction.up]);
    }
})();
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
        var _b, _c;
        const remainingSpace = this.maxCapacity - this.get(stack[0]);
        const amountTransferred = Math.max(0, Math.min(remainingSpace, stack[1]));
        (_b = this.storage)[_c = stack[0]] ?? (_b[_c] = 0);
        this.storage[stack[0]] += amountTransferred;
        return (stack[1] -= amountTransferred) <= 0;
    }
    removeTo(stack, maxCapacity = Infinity) {
        var _b, _c;
        const remainingSpace = maxCapacity - stack[1];
        const amountTransferred = Math.min(remainingSpace, this.get(stack[0]));
        (_b = this.storage)[_c = stack[0]] ?? (_b[_c] = 0);
        this.storage[stack[0]] -= amountTransferred;
        return (stack[1] += amountTransferred) == maxCapacity;
    }
    merge(from, to) {
    }
}
class Tank extends Building {
    pressureOut() {
        const fillLevel = this.fluid[1] / this.block.fluidCapacity;
        return constrain(map(fillLevel, 0, this.block.pressureOutMaxFill, 0, 1), this.block.pressureOutMin, 1);
    }
    pressureIn() {
        const fillLevel = this.fluid[1] / this.block.fluidCapacity;
        return constrain(map(fillLevel, this.block.pressureInMaxFill, 1, 0, 1), this.block.pressureInMin, 1);
    }
    tooltipProperties() {
        return {
            ...super.tooltipProperties(),
            Storage: `${round(this.fluid[1], 3)} / ${this.block.fluidCapacity}`,
            Fluid: this.fluid[0] ? bundle.get(`fluid.${this.fluid[0].id}.name`, "") : "Empty"
        };
    }
}
Tank.fluidCapacity = 600;
Tank.fluidOutputSpeed = 10;
Tank.fluidInputSpeed = 10;
Tank.pressureInMin = 0;
Tank.pressureInMaxFill = 0.8;
Tank.pressureOutMin = 0.05;
Tank.pressureOutMaxFill = 0.2;
Tank.acceptsFluids = true;
Tank.outputsFluids = true;
Tank.drawer = BuildingWithRecipe.drawFluid([0, 0], 0.8, 0.8);
class Pipe extends Building {
    constructor() {
        super(...arguments);
        this.outputSide = Pipe.outputSide(this.meta);
    }
    static getID(type, direction, modifier) {
        return [type, direction.num];
    }
    static outputSide(meta) {
        switch (meta) {
            case 0: return Direction.right;
            case 1: return Direction.down;
            case 2: return Direction.left;
            case 3: return Direction.up;
            default: crash(`Invalid meta ${meta}`);
        }
    }
    static canOutputFluidTo(building) {
        return true;
    }
    acceptsFluidFromSide(side) {
        return side != this.outputSide;
    }
    outputsFluidToSide(side) {
        return side === this.outputSide;
    }
    tooltipProperties() {
        return {
            ...super.tooltipProperties(),
            "Fill level": `${round(this.fluid[1], 3)} / ${this.block.fluidCapacity}`,
            Fluid: this.fluid[0] ? bundle.get(`fluid.${this.fluid[0].id}.name`, "") : "Empty",
            Throughput: round(this.fluidThroughput, 5).toString()
        };
    }
}
Pipe.fluidCapacity = 5;
Pipe.outputsFluids = true;
Pipe.acceptsFluids = true;
Pipe.fluidExtraPressure = 0.05;
Pipe.drawer = function (build, currentFrame) {
    if (!build.fluid[0])
        return;
    const fillFract = build.fluid[1] / build.block.fluidCapacity;
    Gfx.layer("buildingsUnder");
    Gfx.fillColor(build.fluid[0].color);
    Gfx.alpha(fillFract);
    Gfx.tRect(...build.pos.tileC, 0.65 + +build.outputSide.horizontal * 0.35, 0.65 + +build.outputSide.vertical * 0.35, RectMode.CENTER);
    Gfx.alpha(1);
    if (settings.showExtraPipeInfo) {
        const throughputFract = build.fluidThroughput / build.block.fluidOutputSpeed;
        if (build.outputSide.horizontal)
            Gfx.tRect(build.pos.tileX, build.pos.tileY + 0.9, fillFract, 0.1, RectMode.CORNER);
        else
            Gfx.tRect(build.pos.tileX, build.pos.tileY + 1 - fillFract, 0.1, fillFract, RectMode.CORNER);
        Gfx.fillColor("yellow");
        if (build.outputSide.horizontal)
            Gfx.tRect(build.pos.tileX, build.pos.tileY, throughputFract, 0.1, RectMode.CORNER);
        else
            Gfx.tRect(build.pos.tileX + 0.9, build.pos.tileY + 1 - throughputFract, 0.1, throughputFract, RectMode.CORNER);
    }
};
class Pump extends Building {
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY) == "base_water";
    }
    update(currentFrame) {
        Fluid.fill(this.fluid, this.block.outputFluid, this.block.productionSpeed);
        super.update(currentFrame);
    }
}
Pump.productionSpeed = 2;
Pump.fluidOutputSpeed = 10;
Pump.fluidCapacity = 100;
Pump.outputsFluids = true;
Pump.drawer = BuildingWithRecipe.drawFluid([0, 0], 0.4, 0.4);
class PowerGrid {
    constructor() {
        this.producers = [];
        this.consumers = [];
        this.powerRequested = 0;
        this.maxProduction = 0;
    }
    updatePower() {
        this.powerRequested = this.consumers.reduce((acc, p) => acc + p.getRequestedPower(), 0);
        let variablePower = 0, fixedPower = 0;
        for (const producer of this.producers) {
            if (producer.canVaryPowerProduction())
                variablePower += producer.getMaxPowerProduction();
            else
                fixedPower += producer.getMaxPowerProduction();
        }
        this.maxProduction = variablePower + fixedPower;
        const load = this.maxProduction == 0 ? 0 : constrain((this.powerRequested - fixedPower) / this.maxProduction, 0, 1);
        const satisfaction = this.powerRequested == 0 ? 0 : Math.min(this.maxProduction / this.powerRequested, 1);
        this.producers.forEach(p => p.powerLoad = load);
        this.consumers.forEach(c => c.powerSatisfaction = satisfaction);
    }
    addBuilding(build) {
        if (build.block.consumesPower)
            this.consumers.push(build);
        else if (build.block.producesPower)
            this.producers.push(build);
        else
            return false;
        build.grid = this;
        return true;
    }
    removeProducer(build) {
        const index = this.producers.indexOf(build);
        if (index == -1)
            return false;
        this.producers.splice(index, 1);
        build.powerLoad = 0;
    }
    removeConsumer(build) {
        const index = this.consumers.indexOf(build);
        if (index == -1)
            return false;
        this.consumers.splice(index, 1);
        build.powerSatisfaction = 0;
    }
}
class PowerSource extends Building {
    getMaxPowerProduction() {
        return this.block.production;
    }
}
PowerSource.production = 100;
PowerSource.producesPower = true;
PowerSource.drawer = function (build, currentFrame) {
    Gfx.layer("overlay");
    const flashRate = consts.ups / build.powerLoad;
    const sin = Math.sin(Mathf.TWO_PI * (currentFrame.frame % flashRate / flashRate));
    Gfx.fillColor("yellow");
    Gfx.tEllipse(...build.pos.tileC, 0.3 + 0.2 * sin, 0.3 + 0.2 * sin);
};
class ArcTower extends Building {
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
ArcTower.consumesPower = true;
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
    const rad = (build.block.primaryRadius + random(...build.block.primaryRadiusRange)) * build.powerSatisfaction;
    const arcPos = [rad * Math.cos(build.arcAngle) + build.pos.tileXCentered, rad * Math.sin(build.arcAngle) + build.pos.tileYCentered];
    const srad1 = (build.block.secondaryRadius + random(...build.block.secondaryRadiusRange)) * build.powerSatisfaction;
    const srad2 = (build.block.secondaryRadius + random(...build.block.secondaryRadiusRange)) * build.powerSatisfaction;
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
