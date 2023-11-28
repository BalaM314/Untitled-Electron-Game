//this will contain the tech tree and the objective system, and maybe the events system too


class Objective {
    completed = false;
    satisfied = false;
    prerequisites:Objective[] = [];
    constructor(
        public name:string,
        public description:string,
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
}

class ResearchObjective extends Objective {
    constructor(name:string, description:string, public node:TechTreeNode, onComplete?:() => unknown){
        super(name, description, () => node.unlocked, onComplete);
    }
}

class TechTreeNode {
    unlocked = false;
    
}

const objectives = (() => {
    const produceCoal = new Objective(`Produce coal`, `Build a Miner on a coal ore node to produce coal.`);
    const gatherCoal = new Objective(`Gather 10 coal`, `Get 10 coal to the Center using conveyor belts.`, () => level1.resources["base_coal"] >= 10);
    //TODO stone
    //TODO tech tree system
    const researchStoneFurnace = new ResearchObjective(`Research a furnace`, `Coal can be used as fuel for many buildings, including furnaces, which can purify iron ore. Building one out of nothing but raw stone will not be easy; it may take a few tries...`, TechTree.buildingFurnace);
});


