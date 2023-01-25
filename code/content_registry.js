"use strict";
class ContentRegistry {
    constructor(clazz) {
        this.contentMap = new Map();
    }
    register(id, ctor, props) {
        let clazz = Object.assign(class extends ctor {
        }, {
            ...props, id
        });
        this.contentMap.set(id, clazz);
        return clazz;
    }
}
const Buildings = new ContentRegistry(Building);
Buildings.register("base_furnace", BuildingWithRecipe, { recipeType: registry.recipes.base_smelting });
