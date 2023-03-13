class ContentRegistry<K, T extends new (...args:any[]) => {}> {
	private contentMap = new Map<K, T>();
	constructor(){}
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


const recipes:Recipes = {
	base_mining: {
		type: "t-1",
		recipes: [
			{
				outputs: ["base_coalOre"],
				duration: 60,
				tile: "base_ore_coal"
			},{
				outputs: ["base_ironOre"],
				duration: 60,
				tile: "base_ore_iron"
			},{
				outputs: ["base_copperOre"],
				duration: 60,
				tile: "base_ore_copper"
			},
		]
	},
	base_smelting: {
		type: "1-1",
		recipes: [
			{
				inputs: ["base_coalOre"],
				outputs: ["base_coal"],
				duration: 60
			},{
				inputs: ["base_ironOre"],
				outputs: ["base_ironIngot"],
				duration: 60
			},{
				inputs: ["base_copperOre"],
				outputs: ["base_copperIngot"],
				duration: 60
			}
		]
	},
	base_alloying: {
		type: "2-1",
		recipes: [
			{
				inputs: ["base_coal", "base_ironIngot"],
				outputs: ["base_steelIngot"],
				duration: 240
			}
		]
	},
	base_wiremilling: {
		type: "1-1",
		recipes: [
			{
				inputs: ["base_copperIngot"],
				outputs: ["base_copperWire"],
				duration: 120
			}
		]
	},
	base_compressing: {
		type: "1-1",
		recipes: [
			{
				inputs: ["base_ironIngot"],
				outputs: ["base_ironPlate"],
				duration: 60
			},{
				inputs: ["base_steelIngot"],
				outputs: ["base_steelPlate"],
				duration: 60
			}
		]
	},
	base_lathing: {
		type: "1-1",
		recipes: [
			{
				inputs: ["base_ironIngot"],
				outputs: ["base_ironRod"],
				duration: 60
			},{
				inputs: ["base_steelIngot"],
				outputs: ["base_steelRod"],
				duration: 60
			}
		]
	},
	base_assembling: {
		type: "2-1",
		recipes: [
			{
				inputs: ["base_steelRod", "base_copperWire"],
				outputs: ["base_rotor"],
				duration: 120
			},{
				inputs: ["base_ironPlate", "base_copperWire"],
				outputs: ["base_stator"],
				duration: 120
			},{
				inputs: ["base_stator", "base_rotor"],
				outputs: ["base_motor"],
				duration: 30
			}
		]
	}
};
const Buildings = new ContentRegistry<RawBuildingID, typeof Building>();
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
