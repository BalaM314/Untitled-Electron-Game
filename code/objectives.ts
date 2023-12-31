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
		if(!level1.hasResources(this.cost)) return false;
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
	const conveyor = tree.node("building_base_conveyor", [], [], true);
	const miner = tree.node("building_base_miner", [], [], true);
	const trash_can = tree.node("building_base_trash_can", [["base_ironIngot", 20], ["base_stone", 20]], [conveyor]);
	const furnace = tree.node("building_base_furnace", [["base_coal", 20], ["base_stone", 10]], [conveyor, miner]);
	const extractor = tree.node("building_base_extractor", [["base_ironIngot", 20], ["base_stone", 20]], [conveyor]);
	const chest = tree.node("building_base_chest", [["base_ironIngot", 20], ["base_stone", 20]], [conveyor]);
	const alloy_smelter = tree.node("building_base_alloy_smelter", [["base_stoneBrick", 50], ["base_ironIngot", 50]], [furnace]);
	const stirling_generator = tree.node("building_base_stirling_generator", [["base_ironIngot", 50], ["base_copperIngot", 30]], [alloy_smelter]);
	const pipe = tree.node("building_base_pipe", [["base_ironIngot", 10]], [conveyor]);
	const pump = tree.node("building_base_pump", [["base_ironIngot", 50], ["base_copperIngot", 30]], [pipe]);
	const tank = tree.node("building_base_tank", [["base_ironIngot", 50], ["base_stone", 50]], [pipe]);
	const boiler = tree.node("building_base_boiler", [["base_ironIngot", 50], ["base_copperIngot", 30], ["base_coal", 20]], [furnace, pipe]);
	const steam_generator = tree.node("building_base_steam_generator", [["base_ironIngot", 50], ["base_copperIngot", 30]], [boiler]);
	const wiremill = tree.node("building_base_wiremill", [["base_ironIngot", 50], ["base_copperIngot", 50]], [steam_generator]);
	const compressor = tree.node("building_base_compressor", [["base_ironIngot", 50], ["base_copperIngot", 50]], [steam_generator]);
	const lathe = tree.node("building_base_lathe", [["base_ironIngot", 50], ["base_copperIngot", 50]], [steam_generator]);
	const assembler = tree.node("building_base_assembler", [["base_ironIngot", 200], ["base_copperIngot", 200]], [steam_generator, wiremill, compressor, lathe]);
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

class SpecialObjective extends Objective {
	name(){
		return bundle.get(`objective.${this.id}${this.satisfied ? "_satisfied" : ""}.name`);
	}
	description(){
		return bundle.get(`objective.${this.id}${this.satisfied ? "_satisfied" : ""}.description`);
	}
}

const objectives = new ObjectiveList(() => {
	const leave = new SpecialObjective("base_leave", [], () => Camera.scrollLimited, () => Camera.scrollTo(0, 0));
	const produceStone = new Objective("base_produceStone");
	const gatherStone = new GatherObjective("base_gatherStone", [produceStone], [["base_stone", 70]]);
	const gatherCoal = new GatherObjective("base_gatherCoal", [gatherStone], [["base_coal", 20]]);
	const researchStoneFurnace = new ResearchBuildingObjective("base_researchStoneFurnace", [gatherCoal], "furnace");
	const gatherIronIngot = new GatherObjective("base_gatherIronIngot", [researchStoneFurnace], [["base_ironIngot", 25]]);
	const gatherCopperIngot = new GatherObjective("base_gatherCopperIngot", [researchStoneFurnace], [["base_copperIngot", 25]]);
	const researchExtractor = new ResearchBuildingObjective("base_researchExtractor", [gatherIronIngot], "extractor");	
	const gatherStoneBrick = new GatherObjective("base_gatherStoneBrick", [researchStoneFurnace], [["base_stoneBrick", 25]]);
	const researchAlloySmelter = new ResearchBuildingObjective("base_researchAlloySmelter", [gatherStoneBrick, gatherIronIngot], "alloy_smelter");
	const gatherSteelIngot = new GatherObjective("base_gatherSteelIngot", [researchAlloySmelter], [["base_steelIngot", 25]]);
	const researchStirlingGenerator = new ResearchBuildingObjective("base_researchStirlingGenerator", [gatherCopperIngot, gatherSteelIngot], "stirling_generator");
	const producePower = new Objective("base_producePower", [researchStirlingGenerator], () => level1.grid.maxProduction > 0);
	const researchCompressor = new ResearchBuildingObjective("base_researchCompressor", [producePower], "compressor");
	const researchWiremill = new ResearchBuildingObjective("base_researchWiremill", [producePower], "wiremill");
	const researchLathe = new ResearchBuildingObjective("base_researchLathe", [producePower], "lathe");
	const gatherIronPlate = new GatherObjective("base_gatherIronPlate", [researchCompressor], [["base_ironPlate", 25]]);
	const researchPipe = new ResearchBuildingObjective("base_researchPipe", [gatherIronPlate], "pipe");
	const researchPump = new ResearchBuildingObjective("base_researchPump", [researchPipe], "pump");
	const researchBoiler = new ResearchBuildingObjective("base_researchBoiler", [researchPump], "boiler");
	const researchSteamGenerator = new ResearchBuildingObjective("base_researchSteamGenerator", [researchBoiler], "steam_generator");
	const activateSteamGenerator = new Objective("base_activateSteamGenerator", [researchSteamGenerator], () => level1.grid.producers.some(p => p.block === Buildings.get("base_steam_generator") && (p as BuildingWithRecipe).efficiencyp > 0));
	//all the way to the boat
});


