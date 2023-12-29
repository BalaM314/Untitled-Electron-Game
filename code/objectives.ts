//this will contain the tech tree and the objective system, and maybe the events system too


class TechTreeNode {
	unlocked = false;
	children:TechTreeNode[] = [];
	constructor(
		public id:string,
		public cost:ItemStack[],
		public prerequisites:TechTreeNode[] = [],
	){}
	unlock(){
		this.unlocked = true;
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
			this.getOpt(node)?.unlock();
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
	constructor(
		public id:string,
		public prerequisites:Objective[] = [],
		public condition?:() => boolean, //Condition may be left blank for tasks such as "run a miner", where the objective is satisfied in the event handling for "build miner"
		public onComplete?:() => unknown
	){}
	update(){
		if(!this.satisfied && this.condition?.()){
			this.satisfied = true;
		}
		if(!this.completed && this.satisfied && this.prerequisites.every(o => o.completed)){
			this.completed = true;
			this.complete();
		}
	}
	complete(){
		this.onComplete?.();
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

class ResearchObjective extends Objective {
	constructor(id:string, prerequisites:Objective[], public node:TechTreeNode, onComplete?:() => unknown){
		super(id, prerequisites, () => node.unlocked, onComplete);
	}
}

class ObjectiveTree {
	objectives:Objective[] = [];
	objectivesByID:Record<string, Objective> = {};
	constructor(builder:(tree:ObjectiveTree) => unknown){
		builder(this);
	}
	
	objective(id:string, prerequisites:Objective[], condition?:() => boolean,  onComplete?:() => unknown):Objective {
		const node = new Objective(id, prerequisites, condition, onComplete);
		this.objectives.push(node);
		return node;
	}
	get(id:string):Objective {
		return this.objectivesByID[id] ?? crash(`Nonexistent objective ${id}`);
	}
	getOpt(id:string):Objective | null {
		return this.objectivesByID[id] ?? null;
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


const objectives = new ObjectiveTree(() => {
	const produceCoal = new Objective("produceCoal");
	const gatherCoal = new Objective("gatherCoal", [produceCoal], () => level1.resources["base_coal"] >= 10);
	//TODO stone
	//TODO tech tree system
	const researchStoneFurnace = new ResearchObjective("researchStoneFurnace", [gatherCoal], tech.get("building_furnace"));
});


