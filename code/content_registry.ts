class ContentRegistry<K, T extends new (...args:any[]) => {}> {
	private contentMap = new Map<K, T>();
	constructor(clazz:T, keys:K){} //Bizzare hack
	register<B extends T>(id:K, ctor:B, props:{
		[P in keyof B]?: B[P];
	} = {}) {
		let clazz = Object.assign(class extends ctor {}, {
			...props, id
		});
		this.contentMap.set(id, clazz);
		return clazz;
	}
	get(id:K):T {
		return this.contentMap.get(id) ?? (() => {throw new Error(`Object with id ${id} does not exist.`)})();
	}
}


let rawBuildingID = null! as RawBuildingID;//yes it really is bizzare
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
