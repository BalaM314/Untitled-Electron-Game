"use strict";
class ContentRegistryC {
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
class ContentRegistryI {
    constructor() {
        this.stringContentMap = new Map();
        this.numberContentMap = [];
    }
    register(content) {
        this.stringContentMap.set(content.id, content);
        this.numberContentMap[content.nid] = content;
    }
    get(id) {
        if (typeof id == "number")
            return this.numberContentMap[id] ?? crash(`No content with id ${id} exists.`);
        else if (id == null)
            return null;
        else
            return this.stringContentMap.get(id) ?? crash(`No content with id ${id} exists.`);
    }
}
const recipes = {
    base_mining: {
        recipes: [
            {
                outputs: ["base_coal"],
                duration: 60,
                tile: "base_ore_coal"
            }, {
                outputs: ["base_ironOre"],
                duration: 60,
                tile: "base_ore_iron"
            }, {
                outputs: ["base_copperOre"],
                duration: 60,
                tile: "base_ore_copper"
            }, {
                outputs: ["base_stone"],
                duration: 60,
                tile: "base_stone"
            },
        ]
    },
    base_smelting: {
        recipes: [
            {
                inputs: ["base_ironOre"],
                outputs: ["base_ironIngot"],
                duration: 60
            }, {
                inputs: ["base_copperOre"],
                outputs: ["base_copperIngot"],
                duration: 60
            }, {
                inputs: ["base_stone"],
                outputs: ["base_stoneBrick"],
                duration: 60
            }
        ]
    },
    base_alloying: {
        recipes: [
            {
                inputs: ["base_coal", "base_ironIngot"],
                outputs: ["base_steelIngot"],
                duration: 240
            }
        ]
    },
    base_wiremilling: {
        recipes: [
            {
                inputs: ["base_copperIngot"],
                outputs: ["base_copperWire"],
                duration: 120
            }
        ]
    },
    base_compressing: {
        recipes: [
            {
                inputs: ["base_ironIngot"],
                outputs: ["base_ironPlate"],
                duration: 60
            }, {
                inputs: ["base_steelIngot"],
                outputs: ["base_steelPlate"],
                duration: 60
            }
        ]
    },
    base_lathing: {
        recipes: [
            {
                inputs: ["base_ironIngot"],
                outputs: ["base_ironRod"],
                duration: 60
            }, {
                inputs: ["base_steelIngot"],
                outputs: ["base_steelRod"],
                duration: 60
            }
        ]
    },
    base_assembling: {
        recipes: [
            {
                inputs: ["base_steelRod", "base_copperWire"],
                outputs: ["base_rotor"],
                duration: 120
            }, {
                inputs: ["base_ironPlate", "base_copperWire"],
                outputs: ["base_stator"],
                duration: 120
            }, {
                inputs: ["base_stator", "base_rotor"],
                outputs: ["base_motor"],
                duration: 30
            }
        ]
    },
    base_boiling: {
        recipes: [
            {
                inputs: ["base_coal"],
                fluidInputs: [["base_water", 5]],
                fluidOutputs: [["base_steam", 10]],
                duration: 30
            }
        ]
    },
    base_steam_generating: {
        recipes: [
            {
                fluidInputs: [["base_steam", 15]],
                duration: 30,
                powerProduction: 70
            }
        ]
    },
};
const Fluids = new ContentRegistryI();
Fluids.register(new Fluid("base_water", "blue"));
Fluids.register(new Fluid("base_steam", "white"));
const Buildings = new ContentRegistryC();
Buildings.register("base_conveyor", Conveyor, {
    buildCost: [["base_stone", 1]],
});
Buildings.register("base_miner", Miner, {
    buildCost: [["base_stone", 10]],
});
Buildings.register("base_trash_can", TrashCan, {
    buildCost: [["base_stone", 10]],
});
Buildings.register("base_furnace", BuildingWithRecipe, {
    recipeType: recipes.base_smelting,
    buildCost: [["base_stone", 15]],
    drawer: BuildingWithRecipe.makeDrawer((build, e) => {
        Gfx.fillColor(...Gfx.lerp([255, 127, 39], [255, 95, 29], e.sin()));
        Gfx.tRect(...build.centeredPos().tile, 0.5, 0.5, RectMode.CENTER);
    }, BuildingWithRecipe.progressDrawer()),
    craftEffect: [Fx.smoke, "#555"]
});
Buildings.register("base_extractor", Extractor, {
    buildCost: [["base_stone", 2], ["base_ironIngot", 2]]
});
Buildings.register("base_chest", StorageBuilding, {
    buildCost: [["base_ironIngot", 15], ["base_stoneBrick", 10]],
    capacity: 64
});
Buildings.register("base_resource_acceptor", ResourceAcceptor, {});
Buildings.register("base_alloy_smelter", BuildingWithRecipe, {
    buildCost: [["base_stoneBrick", 35], ["base_ironIngot", 20]],
    recipeType: recipes.base_alloying, drawer: BuildingWithRecipe.progressDrawer(), craftEffect: [Fx.smoke, "#222"]
});
Buildings.register("base_wiremill", BuildingWithRecipe, {
    buildCost: [["base_stoneBrick", 20], ["base_ironIngot", 35], ["base_copperIngot", 15]],
    recipeType: recipes.base_wiremilling, drawer: BuildingWithRecipe.progressDrawer()
});
Buildings.register("base_compressor", BuildingWithRecipe, {
    buildCost: [["base_stoneBrick", 25], ["base_ironIngot", 35], ["base_copperIngot", 10]],
    recipeType: recipes.base_compressing, drawer: BuildingWithRecipe.progressDrawer()
});
Buildings.register("base_lathe", BuildingWithRecipe, {
    buildCost: [["base_stoneBrick", 20], ["base_ironIngot", 35], ["base_copperIngot", 10]],
    recipeType: recipes.base_lathing, drawer: BuildingWithRecipe.progressDrawer(), runEffect: [Fx.spark, "#FFC", 20, 0.8]
});
Buildings.register("base_multiblock_secondary", MultiBlockSecondary, {});
Buildings.register("base_assembler", MultiBlockController, {
    buildCost: [["base_stoneBrick", 50], ["base_ironIngot", 35], ["base_copperIngot", 25], ["base_ironPlate", 25], ["base_ironRod", 10], ["base_copperWire", 10]],
    recipeType: recipes.base_assembling,
    multiblockSize: [2, 2],
    drawer: BuildingWithRecipe.progressDrawer(),
    secondary: Buildings.get("base_multiblock_secondary")
});
Buildings.register("base_arc_tower", ArcTower, {});
Buildings.register("base_power_source", PowerSource, {});
Buildings.register("base_pipe", Pipe, {
    buildCost: [["base_ironPlate", 1]],
});
Buildings.register("base_pump", Pump, {
    buildCost: [["base_ironPlate", 20], ["base_ironIngot", 15], ["base_stoneBrick", 25]],
    outputFluid: Fluids.get("base_water")
});
Buildings.register("base_tank", Tank, {
    buildCost: [["base_ironPlate", 15], ["base_stoneBrick", 15]]
});
Buildings.register("base_boiler", BuildingWithRecipe, {
    recipeType: recipes.base_boiling,
    fluidCapacity: 10,
    acceptsFluids: true,
    outputsFluids: true,
    fluidExtraPressure: 1,
    runEffect: [Fx.smoke, "#222", 30, 1],
    drawer: BuildingWithRecipe.combineDrawers(BuildingWithRecipe.drawFluid([0, -0.2], 0.8, 0.4), BuildingWithRecipe.drawLayer("building/base_boiler_fire", 1, 1, b => b.timer >= 0 ? map(b.timer, b.recipe?.duration ?? -1, 0, 1, 0.7) : 0))
});
Buildings.register("base_steam_generator", MultiBlockController, {
    recipeType: recipes.base_steam_generating,
    secondary: Buildings.get("base_multiblock_secondary"),
    multiblockSize: [2, 2],
    fluidCapacity: 30,
    acceptsFluids: true,
    producesPower: true,
    runEffect: [Fx.smoke, "#FFF", 30, 1],
    drawer: BuildingWithRecipe.makeDrawer((build, e) => {
        const numLines = 6;
        const vel = build.efficiency * 0.15;
        const spokeRadius = 0.8;
        const spokeWidth = 1;
        const pos = build.centeredPos().tile;
        build.num1 = (build.num1 + vel) % Mathf.TWO_PI;
        Gfx.lineWidth(Camera.zoomLevel * spokeWidth);
        Gfx.strokeColor("#DDD");
        for (let i = 0; i < numLines; i++) {
            const theta = (i / numLines) * Math.PI + build.num1;
            const offset = [spokeRadius * Math.cos(theta), spokeRadius * Math.sin(theta)];
            Gfx.tLine(...add(pos, offset), ...add(pos, mul(offset, -1)));
        }
    })
});
