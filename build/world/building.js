/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
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
import { Buildings, Fluids } from "../content/content.js";
import { bundle } from "../content/i18n.js";
import { Fluid } from "../content/registry.js";
import { Gfx } from "../ui/graphics.js";
import { Direction } from "../util/direction.js";
import { Abstract, stringifyMeta, tooltip, constrain, crash } from "../util/funcs.js";
import { Pos } from "../util/geom.js";
import { settings, consts } from "../vars.js";
import { Item } from "./world.js";
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
        static changeMeta(meta, tileX, tileY, level, force_straight_conveyor) {
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
            return Boolean(building?.block.acceptsItemsFromAll);
        }
        static canOutputFluidTo(building) {
            return Boolean(building?.block.acceptsFluidsFromAll);
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
        preUpdate(currentFrame) {
        }
        update(currentFrame) {
            this.item?.update(currentFrame);
            if (this.block.outputsFluids)
                this.dumpFluid();
        }
        stringID() {
            return stringifyMeta(this.block.id, this.meta);
        }
        effectiveID() {
            return this.block.id;
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
            layer ??= block.isOverlay ? "overlayBuilds" : "buildings";
            Gfx.tImage(Gfx.texture(`building/${stringifyMeta(...id)}`), pos.tileX + textureSize[1][0], pos.tileY + textureSize[1][1], ...textureSize[0], Gfx.layers[layer]);
        }
        displayName() {
            return bundle.get(`building.${this.effectiveID()}.name`);
        }
        getTooltip() {
            return tooltip(this.displayName(), this.tooltipProperties());
        }
        tooltipProperties() {
            return {
                _description: bundle.get(`building.${this.effectiveID()}.description`, ""),
                id: settings.showIDsInTooltips ? this.effectiveID() : ""
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
                const temp = this.item;
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
            crash(`Function "getMaxPowerProduction" not implemented for base class Building.`);
        }
        canVaryPowerProduction() {
            return true;
        }
        getRequestedPower() {
            crash(`Function "getRequestedPower" not implemented for base class Building.`);
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
            if (fluid?.[0] == null || fluid[1] == 0)
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
    _classThis.acceptsItemsFromAll = false;
    _classThis.acceptsFluidsFromAll = false;
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
export { Building };
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
        const remainingSpace = this.maxCapacity - this.get(stack[0]);
        const amountTransferred = Math.max(0, Math.min(remainingSpace, stack[1]));
        this.storage[stack[0]] ??= 0;
        this.storage[stack[0]] += amountTransferred;
        return (stack[1] -= amountTransferred) <= 0;
    }
    removeTo(stack, maxCapacity = Infinity) {
        const remainingSpace = maxCapacity - stack[1];
        const amountTransferred = Math.min(remainingSpace, this.get(stack[0]));
        this.storage[stack[0]] ??= 0;
        this.storage[stack[0]] -= amountTransferred;
        return (stack[1] += amountTransferred) == maxCapacity;
    }
    merge(from, to) {
    }
}
export class PowerGrid {
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
