//this will contain the tech tree and the objective system, and maybe the events system too


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
        return bundle.get(`objective.${this.name}.name`);
    }
    description(){
        return bundle.get(`objective.${this.name}.description`);
    }
}

class ResearchObjective extends Objective {
    constructor(id:string, prerequisites:Objective[], public node:TechTreeNode, onComplete?:() => unknown){
        super(id, prerequisites, () => node.unlocked, onComplete);
    }
}

class TechTreeNode {
    unlocked = false;
    //??????????????????????
    constructor(
        public prerequisites:TechTreeNode[] = [],
    ){}
}

const objectives = (() => {
    const produceCoal = new Objective("produceCoal");
    const gatherCoal = new Objective("gatherCoal", [produceCoal], () => level1.resources["base_coal"] >= 10);
    //TODO stone
    //TODO tech tree system
    const researchStoneFurnace = new ResearchObjective("researchStoneFurnace", [gatherCoal], TechTree.buildingFurnace);
});


