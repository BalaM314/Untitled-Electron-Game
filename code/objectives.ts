//this will contain the tech tree and the objective system, and maybe the events system too


class TechTreeNode {
	unlocked = false;
	children:TechTreeNode[] = [];
	constructor(
		public id:string,
		public cost:ItemStack[],
		public prerequisites:TechTreeNode[] = [],
	){}
	tryUnlock():boolean {
		if(!this.prerequisites.every(p => p.unlocked)) return false;
		if(!level1.hasResources(this.cost, 2000)) return false;
		level1.drainResources(this.cost);
		this.unlocked = true;
		return true;
	}
}

class TechTree {
	nodes:TechTreeNode[] = [];
	nodesByID:Record<string, TechTreeNode> = {};
	constructor(builder:(tree:TechTree) => unknown){
		builder(this);
	}
	
	node(id:string, cost:ItemStack[], prerequisites:TechTreeNode[], unlocked = false):TechTreeNode {
		const node = new TechTreeNode(id, cost, prerequisites);
		node.unlocked = unlocked;
		this.nodes.push(node);
		this.nodesByID[id] = node;
		for(const prereq of prerequisites){
			prereq.children.push(node);
		}
		return node;
	}
	get(id:string):TechTreeNode {
		return this.nodesByID[id] ?? crash(`Nonexistent tech tree node ${id}`);
	}
	getOpt(id:string):TechTreeNode | null {
		return this.nodesByID[id] ?? null;
	}



	display(offset:PosT){
		//this is gonna be kinda painful
	}
	read(data:string){
		const completedNodes = data.split(",");
		for(const node of completedNodes){
			if(this.getOpt(node)){
				this.get(node).unlocked = true;
			}
		}
	}
	write():string {
		return this.nodes.filter(n => n.unlocked).map(n => n.id).join(",");
	}
}

const tech = new TechTree(tree => {
	//TODO tune research costs and building costs
	const conveyor = tree.node("building_base_conveyor", [], [], true);
	const miner = tree.node("building_base_miner", [], [], true);
	const trash_can = tree.node("building_base_trash_can", [["base_ironIngot", 20], ["base_stone", 20]], [conveyor]);
	const furnace = tree.node("building_base_furnace", [["base_coal", 20], ["base_stone", 10]], [conveyor, miner]);
	const extractor = tree.node("building_base_extractor", [["base_ironIngot", 20], ["base_stone", 20]], [conveyor]);
	const chest = tree.node("building_base_chest", [["base_ironIngot", 20], ["base_stoneBrick", 20]], [conveyor]);
	const alloy_smelter = tree.node("building_base_alloy_smelter", [["base_stoneBrick", 50], ["base_ironIngot", 50], ["base_coal", 50]], [furnace]);
	const stirling_generator = tree.node("building_base_stirling_generator", [["base_ironIngot", 50], ["base_copperIngot", 30]], [alloy_smelter]);
	const compressor = tree.node("building_base_compressor", [["base_ironIngot", 50], ["base_copperIngot", 50]], [stirling_generator]);
	const lathe = tree.node("building_base_lathe", [["base_ironIngot", 50], ["base_copperIngot", 50]], [stirling_generator]);
	const wiremill = tree.node("building_base_wiremill", [["base_ironIngot", 50], ["base_copperIngot", 50]], [stirling_generator]);
	const pipe = tree.node("building_base_pipe", [["base_ironPlate", 10]], [conveyor]);
	const pump = tree.node("building_base_pump", [["base_ironIngot", 50], ["base_ironPlate", 50], ["base_copperIngot", 30]], [pipe]);
	const tank = tree.node("building_base_tank", [["base_steelIngot", 50], ["base_ironPlate", 50], ["base_stoneBrick", 50]], [pipe]);
	const boiler = tree.node("building_base_boiler", [["base_ironIngot", 50], ["base_steelIngot", 50], ["base_ironPlate", 50], ["base_coal", 20]], [furnace, pipe]);
	const steam_generator = tree.node("building_base_steam_generator", [["base_ironIngot", 50], ["base_steelIngot", 50], ["base_ironPlate", 50], ["base_copperIngot", 30], ["base_copperWire", 30]], [boiler]);
	const assembler = tree.node("building_base_assembler", [["base_ironIngot", 200], ["base_steelIngot", 50], ["base_ironPlate", 50], ["base_copperIngot", 200], ["base_copperWire", 100]], [steam_generator, lathe]);
});


class Objective {
	completed = false;
	satisfied = false;
	static tree:ObjectiveList | null = null;
	constructor(
		public id:string,
		public prerequisites:Objective[] = [],
		public condition?:() => boolean, //Condition may be left blank for tasks such as "run a miner", where the objective is satisfied in the event handling for "build miner"
		public onComplete?:() => unknown
	){
		if(Objective.tree){
			Objective.tree.objectives.push(this);
			Objective.tree.objectivesByID[id] = this;
		}
	}
	update(){
		if(!this.satisfied && this.condition?.()){
			this.satisfied = true;
		}
	}
	complete(){
		this.completed = true;
		this.onComplete?.();
	}
	tryComplete(){
		if(!this.completed && this.satisfied && this.prerequisites.every(o => o.completed)){
			this.complete();
		}
	}
	satisfy(){
		this.satisfied = true;
	}
	name(){
		return bundle.get(`objective.${this.id}.name`);
	}
	description(){
		return bundle.get(`objective.${this.id}.description`);
	}
}

class ResearchBuildingObjective extends Objective {
	constructor(id:string, prerequisites:Objective[], nodeID:string, onComplete?:() => unknown){
		const node = tech.get("building_base_" + nodeID);
		super(id, prerequisites, () => node.unlocked, onComplete);
	}
}

class GatherObjective extends Objective {
	constructor(id:string, prerequisites:Objective[], public items:ItemStack[], onComplete?:() => unknown){
		super(id, prerequisites, () => level1.hasResources(items), onComplete);
	}
	name(){
		return super.name() + ` (${level1.resources[this.items[0][0]]}/${this.items[0][1]})`;
	}
}

class ObjectiveList {
	objectives:Objective[] = [];
	objectivesByID:Record<string, Objective> = {};
	constructor(builder:() => unknown){
		Objective.tree = this;
		builder();
		Objective.tree = null;
	}
	get(id:string):Objective {
		return this.objectivesByID[id] ?? crash(`Nonexistent objective ${id}`);
	}
	getOpt(id:string):Objective | null {
		return this.objectivesByID[id] ?? null;
	}

	update(){
		this.objectives.forEach(o => o.update());
	}

	read(data:string){
		const completedObjectives = data.split(",");
		for(const objective of completedObjectives){
			if(this.getOpt(objective)){
				this.get(objective).completed = true;
			}
		}
	}
	write():string {
		return this.objectives.filter(n => n.completed).map(n => n.id).join(",");
	}
}

class ChangingObjective extends Objective {
	name(){
		return bundle.get(`objective.${this.id}${this.satisfied ? "_satisfied" : ""}.name`);
	}
	description(){
		return bundle.get(`objective.${this.id}${this.satisfied ? "_satisfied" : ""}.description`);
	}
}

const objectives = new ObjectiveList(() => {
	const leave = new ChangingObjective("base_leave", [], () => Camera.scrollLimited, () => Camera.scrollTo(0, 0));
	const tooltips = new Objective("base_tooltips", [], () => Game.stats.objectiveHovered);
	const produceStone = new Objective("base_produceStone");
	const gatherStone = new GatherObjective("base_gatherStone", [produceStone], [["base_stone", 70]]);
	const gatherCoal = new GatherObjective("base_gatherCoal", [gatherStone], [["base_coal", 20]]);
	const researchStoneFurnace = new ResearchBuildingObjective("base_researchStoneFurnace", [gatherCoal], "furnace");
	const gatherStoneBrick = new GatherObjective("base_gatherStoneBrick", [researchStoneFurnace], [["base_stoneBrick", 25]]);
	const gatherIronIngot = new GatherObjective("base_gatherIronIngot", [researchStoneFurnace], [["base_ironIngot", 25]]);
	const researchExtractor = new ResearchBuildingObjective("base_researchExtractor", [gatherIronIngot], "extractor");
	const researchAlloySmelter = new ResearchBuildingObjective("base_researchAlloySmelter", [gatherStoneBrick, gatherIronIngot], "alloy_smelter");
	const gatherSteelIngot = new GatherObjective("base_gatherSteelIngot", [researchAlloySmelter], [["base_steelIngot", 25]]);
	// const gatherCopperIngot = new GatherObjective("base_gatherCopperIngot", [researchStoneFurnace], [["base_copperIngot", 25]]);
	const researchStirlingGenerator = new ResearchBuildingObjective("base_researchStirlingGenerator", [gatherSteelIngot], "stirling_generator");
	const producePower = new Objective("base_producePower", [researchStirlingGenerator], () => level1.grid.maxProduction > 0);
	const researchCompressor = new ResearchBuildingObjective("base_researchCompressor", [producePower], "compressor");
	const gatherIronPlate = new GatherObjective("base_gatherIronPlate", [researchCompressor], [["base_ironPlate", 25]]);
	const researchPipe = new ResearchBuildingObjective("base_researchPipe", [gatherIronPlate], "pipe");
	const researchPump = new ResearchBuildingObjective("base_researchPump", [researchPipe], "pump");
	const researchBoiler = new ResearchBuildingObjective("base_researchBoiler", [researchPump], "boiler");
	const researchWiremill = new ResearchBuildingObjective("base_researchWiremill", [producePower], "wiremill");
	const researchSteamGenerator = new ResearchBuildingObjective("base_researchSteamGenerator", [researchBoiler], "steam_generator");
	const activateSteamGenerator = new Objective("base_activateSteamGenerator", [researchSteamGenerator], () => level1.grid.producers.some(p => p.block === Buildings.get("base_steam_generator") && (p as BuildingWithRecipe).efficiencyp > 0));
	const researchLathe = new ResearchBuildingObjective("base_researchLathe", [producePower], "lathe");
	//all the way to the boat
});


