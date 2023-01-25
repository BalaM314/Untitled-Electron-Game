class ContentRegistry<T extends new (...args:any[]) => {}> {
	private contentMap = new Map<string, T>();
	constructor(clazz:T){}
	register<B extends T>(id:string, ctor:B, props:{
		[P in keyof B]?: B[P];
	}) {
		let clazz = Object.assign(class extends ctor {}, {
			...props, id
		});
		this.contentMap.set(id, clazz);
		return clazz;
	}
}



const Buildings = new ContentRegistry(Building);
Buildings.register("base_furnace", BuildingWithRecipe, { recipeType: registry.recipes.base_smelting });