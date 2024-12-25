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
var _a;
import { Fluids, ItemIDs, recipes } from "../content/content.js";
import { bundle } from "../content/i18n.js";
import { Fluid } from "../content/registry.js";
import { objectives } from "../objectives.js";
import { Gfx, getAnimationData, RectMode } from "../ui/graphics.js";
import { keybinds } from "../ui/input.js";
import { Direction } from "../util/direction.js";
import { Abstract, crash, round, constrain, linear_map } from "../util/funcs.js";
import { Rand } from "../util/random.js";
import { add, Pos } from "../util/geom.js";
import { Log } from "../util/log.js";
import { settings, consts, Mathf } from "../vars.js";
import { Building } from "./building.js";
import { Item } from "./world.js";
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
                                crash(`logic error when consuming fluids: needed ${amountNeeded}, got ${amountDrained}`);
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
                if (Rand.chance(this.block.runEffect[3]))
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
export { BuildingWithRecipe };
export class Miner extends Building {
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
            Log.warn(`Miner cannot mine tile at ${tileX}, ${tileY}`);
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
                this.ranOnce = true;
            }
        }
    }
}
Miner.outputsItems = true;
export class TrashCan extends Building {
    acceptItem(item) {
        return true;
    }
    acceptFluid(stack, maxThroughput, from) {
        return Fluid.drain(stack, maxThroughput);
    }
}
TrashCan.acceptsItems = true;
TrashCan.acceptsFluids = true;
export class Conveyor extends Building {
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
export class OverlayBuild extends Building {
    buildingUnder() {
        return this.level.buildingAtPos(this.pos);
    }
}
OverlayBuild.isOverlay = true;
export class Extractor extends OverlayBuild {
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
            default: crash(`Invalid meta ${meta}`);
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
            crash(`no item to drop; extractor at ${this.pos.tileX} ${this.pos.tileY}`);
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
export class StorageBuilding extends Building {
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
export class ResourceAcceptor extends Building {
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
export class MultiBlockSecondary extends Building {
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
export class MultiBlockController extends BuildingWithRecipe {
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
export class Tank extends Building {
    pressureOut() {
        const fillLevel = this.fluid[1] / this.block.fluidCapacity;
        return constrain(linear_map(fillLevel, 0, this.block.pressureOutMaxFill, 0, 1), this.block.pressureOutMin, 1);
    }
    pressureIn() {
        const fillLevel = this.fluid[1] / this.block.fluidCapacity;
        return constrain(linear_map(fillLevel, this.block.pressureInMaxFill, 1, 0, 1), this.block.pressureInMin, 1);
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
export class Pipe extends Building {
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
export class Pump extends Building {
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
export class PowerSource extends Building {
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
export class ArcTower extends Building {
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
        build.arcAAccel = Rand.num(-build.block.maxArcAAccel, build.block.maxArcAAccel);
    build.arcAVel = constrain(build.arcAVel + build.arcAAccel, -build.block.maxArcAVel, build.block.maxArcAVel);
    build.arcAngle = (build.arcAngle + build.arcAVel) % Mathf.TWO_PI;
    const rad = (build.block.primaryRadius + Rand.num(...build.block.primaryRadiusRange)) * build.powerSatisfaction;
    const arcPos = [rad * Math.cos(build.arcAngle) + build.pos.tileXCentered, rad * Math.sin(build.arcAngle) + build.pos.tileYCentered];
    const srad1 = (build.block.secondaryRadius + Rand.num(...build.block.secondaryRadiusRange)) * build.powerSatisfaction;
    const srad2 = (build.block.secondaryRadius + Rand.num(...build.block.secondaryRadiusRange)) * build.powerSatisfaction;
    const srad1Angle = build.arcAngle + Rand.num(-(Math.PI * 2 / 3), Math.PI * 2 / 3);
    const srad2Angle = build.arcAngle + Rand.num(-(Math.PI * 2 / 3), Math.PI * 2 / 3);
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
