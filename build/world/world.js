/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { ItemIDs, Buildings, Fluids } from "../content/content.js";
import { bundle } from "../content/i18n.js";
import { Camera, Gfx, RectMode } from "../ui/graphics.js";
import { GUI } from "../ui/gui.js";
import { keybinds, Input } from "../ui/input.js";
import { crash, parseError, forceType, tooltip, pseudoRandom, hex, mapLegacyRawBuildingID, getLegacyRawBuildingID, stringifyMeta, constrain } from "../util/funcs.js";
import { Pos, add } from "../util/geom.js";
import { consts, Game, settings } from "../vars.js";
import { Building, PowerGrid } from "./building.js";
import { MultiBlockController, OverlayBuild } from "./building-types.js";
import { perlin2 } from "../util/perlin.js";
export class Level {
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
            crash(`Error loading chunk ${position}: ${parseError(err)}`);
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
        const isError = !this.hasResources(block.buildCost, 100) ||
            !block.canBuildAt(tileX, tileY, this) ||
            !this.canBuildBuilding([tileX, tileY], block);
        const underlayTextureSize = textureSize[0][0] == textureSize[0][1] ? textureSize : [[1, 1], [0, 0]];
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
    canBuildBuilding(tile, block) {
        const size = block.prototype instanceof MultiBlockController ? block.multiblockSize : [1, 1];
        for (const [x, y] of MultiBlockController.getOffsetsForSize(...size)
            .concat([[0, 0]])
            .map(pos => add(pos, tile))) {
            const build = this.buildingAtTile(x, y);
            if (build?.block.immutable)
                return false;
        }
        return true;
    }
    buildBuilding(tileX, tileY, buildingID) {
        if (buildingID[0] == "base_null")
            return true;
        const block = Buildings.get(buildingID[0]);
        if (!this.canBuildBuilding([tileX, tileY], block))
            return false;
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
        if (!block.canBuildAt(tileX, tileY, this))
            return false;
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
            Input.lastBuilding = controller;
            return true;
        }
        else {
            this.drainResources(block.buildCost);
            const building = new block(tileX, tileY, buildingID[1], this);
            this.buildings.add(building);
            this.grid.addBuilding(building);
            if (building instanceof OverlayBuild)
                this.writeOverlayBuild(tileX, tileY, building);
            else
                this.writeBuilding(tileX, tileY, building);
            Input.lastBuilding = building;
            return true;
        }
    }
    resetResourceDisplayData() {
        Object.values(this.resourceDisplayData).forEach(d => {
            d.flashEffect = null;
            d.flashExpireTime = 0;
            d.amountRequired = null;
        });
    }
    hasResources(items, flashTime = 0) {
        let sufficient = true;
        for (const [item, amount] of items) {
            if (flashTime > 0) {
                this.resourceDisplayData[item].amountRequired = amount;
            }
            if (this.resources[item] < amount) {
                sufficient = false;
                if (flashTime) {
                    this.resourceDisplayData[item].flashExpireTime = Date.now() + flashTime;
                    this.resourceDisplayData[item].flashEffect = "flashing";
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
        for (const [item, amount] of items) {
            this.resources[item] ??= 0;
            this.resources[item] -= amount;
        }
    }
    addResources(items) {
        for (const [item, amount] of items) {
            this.resources[item] ??= 0;
            this.resources[item] += amount;
        }
    }
    update(currentFrame) {
        this.buildings.forEach(b => b.preUpdate(currentFrame));
        this.grid.updatePower();
        this.buildings.forEach(b => b.update(currentFrame));
        for (let chunk of this.storage.values()) {
            chunk.update(currentFrame);
        }
        if (this.resources["base_stone"] == 0 && Date.now() - this.timeSinceStoneRanOut > 15000 && !Game.transientStats.stoneRunOutMessageShown) {
            Game.transientStats.stoneRunOutMessageShown = true;
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
export class Chunk {
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
                    crash(`Failed to import building id ${stringifyMeta(buildingData.id, buildingData.meta)} at position ${x},${y} in chunk ${chunkX},${chunkY}. See console for more details.`);
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
        return this.layers[0][tileY]?.[tileX] ?? crash(`Tile ${tileX}, ${tileY} does not exist!`);
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
                        const noiseHeight = Math.abs(perlin2(((this.x * consts.CHUNK_SIZE) + x + this.parent.seed) / generation_consts.perlin_scale, ((this.y * consts.CHUNK_SIZE) + y + (this.parent.seed + generation_consts.y_offset))
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
export class Item {
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
