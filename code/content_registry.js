"use strict";
class ContentRegistry {
    constructor() {
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
const recipes = {
    base_mining: {
        type: "t-1",
        recipes: [
            {
                outputs: [ItemID.base_coalOre],
                duration: 60,
                tile: "base_ore_coal"
            }, {
                outputs: [ItemID.base_ironOre],
                duration: 60,
                tile: "base_ore_iron"
            }, {
                outputs: [ItemID.base_copperOre],
                duration: 60,
                tile: "base_ore_copper"
            },
        ]
    },
    base_smelting: {
        type: "1-1",
        recipes: [
            {
                inputs: [ItemID.base_coalOre],
                outputs: [ItemID.base_coal],
                duration: 60
            }, {
                inputs: [ItemID.base_ironOre],
                outputs: [ItemID.base_ironIngot],
                duration: 60
            }, {
                inputs: [ItemID.base_copperOre],
                outputs: [ItemID.base_copperIngot],
                duration: 60
            }
        ]
    },
    base_alloying: {
        type: "2-1",
        recipes: [
            {
                inputs: [ItemID.base_coal, ItemID.base_ironIngot],
                outputs: [ItemID.base_steelIngot],
                duration: 240
            }
        ]
    },
    base_wiremilling: {
        type: "1-1",
        recipes: [
            {
                inputs: [ItemID.base_copperIngot],
                outputs: [ItemID.base_copperWire],
                duration: 120
            }
        ]
    },
    base_compressing: {
        type: "1-1",
        recipes: [
            {
                inputs: [ItemID.base_ironIngot],
                outputs: [ItemID.base_ironPlate],
                duration: 60
            }, {
                inputs: [ItemID.base_steelIngot],
                outputs: [ItemID.base_steelPlate],
                duration: 60
            }
        ]
    },
    base_lathing: {
        type: "1-1",
        recipes: [
            {
                inputs: [ItemID.base_ironIngot],
                outputs: [ItemID.base_ironRod],
                duration: 60
            }, {
                inputs: [ItemID.base_steelIngot],
                outputs: [ItemID.base_steelRod],
                duration: 60
            }
        ]
    },
    base_assembling: {
        type: "2-1",
        recipes: [
            {
                inputs: [ItemID.base_steelRod, ItemID.base_copperWire],
                outputs: [ItemID.base_rotor],
                duration: 120
            }, {
                inputs: [ItemID.base_ironPlate, ItemID.base_copperWire],
                outputs: [ItemID.base_stator],
                duration: 120
            }, {
                inputs: [ItemID.base_stator, ItemID.base_rotor],
                outputs: [ItemID.base_motor],
                duration: 30
            }
        ]
    }
};
const Buildings = new ContentRegistry();
Buildings.register("base_conveyor", Conveyor);
Buildings.register("base_miner", Miner);
Buildings.register("base_trash_can", TrashCan);
Buildings.register("base_furnace", BuildingWithRecipe, { recipeType: recipes.base_smelting });
Buildings.register("base_extractor", Extractor);
Buildings.register("base_chest", StorageBuilding);
Buildings.register("base_resource_acceptor", ResourceAcceptor);
Buildings.register("base_alloy_smelter", BuildingWithRecipe, { recipeType: recipes.base_alloying });
Buildings.register("base_wiremill", BuildingWithRecipe, { recipeType: recipes.base_wiremilling });
Buildings.register("base_compressor", BuildingWithRecipe, { recipeType: recipes.base_compressing });
Buildings.register("base_lathe", BuildingWithRecipe, { recipeType: recipes.base_lathing });
Buildings.register("base_multiblock_secondary", MultiBlockSecondary);
Buildings.register("base_assembler", MultiBlockController, { recipeType: recipes.base_assembling, multiblockSize: [2, 2] });
