"use strict";
class ContentRegistry {
    constructor(clazz, keys) {
        this.contentMap = new Map();
    }
    register(id, ctor, props = {}) {
        let clazz = Object.assign(class extends ctor {
        }, {
            ...props, id
        });
        this.contentMap.set(id, clazz);
        return clazz;
    }
    get(id) {
        return this.contentMap.get(id) ?? (() => { throw new Error(`Object with id ${id} does not exist.`); })();
    }
}
let rawBuildingID = null;
const Buildings = new ContentRegistry(Building, rawBuildingID);
Buildings.register("base_conveyor", Conveyor);
Buildings.register("base_miner", Miner);
Buildings.register("base_trash_can", TrashCan);
Buildings.register("base_furnace", BuildingWithRecipe, { recipeType: registry.recipes.base_smelting });
Buildings.register("base_extractor", Extractor);
Buildings.register("base_chest", StorageBuilding);
Buildings.register("base_resource_acceptor", ResourceAcceptor);
Buildings.register("base_alloy_smelter", BuildingWithRecipe, { recipeType: registry.recipes.base_alloying });
Buildings.register("base_wiremill", BuildingWithRecipe, { recipeType: registry.recipes.base_wiremilling });
Buildings.register("base_compressor", BuildingWithRecipe, { recipeType: registry.recipes.base_compressing });
Buildings.register("base_lathe", BuildingWithRecipe, { recipeType: registry.recipes.base_lathing });
Buildings.register("base_multiblock_secondary", MultiBlockSecondary);
Buildings.register("base_assembler", MultiBlockController, { recipeType: registry.recipes.base_assembling, multiblockSize: [2, 2] });
