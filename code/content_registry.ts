
/** Content registry where the content is a class. */
class ContentRegistryC<K, T extends new (...args:any[]) => {}> {
	private contentMap = new Map<K, T>();
	constructor(){}
	register<B extends T>(id:K, ctor:B, props:{ //TODO don't reimpl Partial<T>
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

/** Content registry for when the content is a class instance. */
class ContentRegistryI<K extends string, T extends Content<string>> {
	private stringContentMap = new Map<K, T>();
	private numberContentMap = [] as T[];
	register(content:T){
		this.stringContentMap.set(content.id as K, content);
		this.numberContentMap[content.nid] = content;
	}
	get(id:K):T;
	get(id:number):T;
	get(id:null):null;
	get(id:K | number | null):T | null;
	get(id:K | number | null):T | null {
		if(typeof id == "number") return this.numberContentMap[id] ?? crash(`No content with id ${id} exists.`);
		else if(id == null) return null;
		else return this.stringContentMap.get(id) ?? crash(`No content with id ${id} exists.`);
	}
}

const recipes:Recipes = {
	base_mining: {
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
			},{
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
			},{
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

const Fluids = new ContentRegistryI<FluidID, Fluid>();
Fluids.register(new Fluid("base_water"));

const Buildings = new ContentRegistryC<RawBuildingID, typeof Building>();
Buildings.register("base_conveyor", Conveyor);
Buildings.register("base_miner", Miner);
Buildings.register("base_trash_can", TrashCan);
Buildings.register("base_furnace", BuildingWithRecipe, { recipeType: recipes.base_smelting, drawer: BuildingWithRecipe.makeDrawer<BuildingWithRecipe>((build, e) => {
	Gfx.fillColor(...Gfx.lerp([255, 127, 39], [255, 95, 29], e.sin()));
	Gfx.tRect(...build.centeredPos().tile, 0.5, 0.5, RectMode.CENTER);
}, BuildingWithRecipe.progressDrawer()), craftEffect: Fx.smoke});
Buildings.register("base_extractor", Extractor);
Buildings.register("base_chest", StorageBuilding, { capacity: 64 });
Buildings.register("base_resource_acceptor", ResourceAcceptor);
Buildings.register("base_alloy_smelter", BuildingWithRecipe, { recipeType: recipes.base_alloying, drawer: BuildingWithRecipe.progressDrawer() });
Buildings.register("base_wiremill", BuildingWithRecipe, { recipeType: recipes.base_wiremilling, drawer: BuildingWithRecipe.progressDrawer() });
Buildings.register("base_compressor", BuildingWithRecipe, { recipeType: recipes.base_compressing, drawer: BuildingWithRecipe.progressDrawer() });
Buildings.register("base_lathe", BuildingWithRecipe, { recipeType: recipes.base_lathing, drawer: BuildingWithRecipe.progressDrawer() });
Buildings.register("base_multiblock_secondary", MultiBlockSecondary);
Buildings.register("base_assembler", MultiBlockController, { recipeType: recipes.base_assembling, multiblockSize: [2, 2], drawer: BuildingWithRecipe.progressDrawer(), secondary: Buildings.get("base_multiblock_secondary") as typeof MultiBlockSecondary });
Buildings.register("base_arc_tower", ArcTower);
Buildings.register("base_power_source", PowerSource);
Buildings.register("base_pipe", Pipe);
Buildings.register("base_pump", Pump, { outputFluid: Fluids.get("base_water") });
Buildings.register("base_tank", Tank);
