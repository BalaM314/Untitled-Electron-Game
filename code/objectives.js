"use strict";
class Objective {
    constructor(id, prerequisites = [], condition, onComplete) {
        this.id = id;
        this.prerequisites = prerequisites;
        this.condition = condition;
        this.onComplete = onComplete;
        this.completed = false;
        this.satisfied = false;
    }
    update() {
        if (!this.satisfied && this.condition?.()) {
            this.satisfied = true;
        }
        if (!this.completed && this.satisfied && this.prerequisites.every(o => o.completed)) {
            this.completed = true;
            this.complete();
        }
    }
    complete() {
        this.onComplete?.();
    }
    satisfy() {
        this.satisfied = true;
    }
    name() {
        return bundle.get(`objective.${this.name}.name`);
    }
    description() {
        return bundle.get(`objective.${this.name}.description`);
    }
}
class ResearchObjective extends Objective {
    constructor(id, prerequisites, node, onComplete) {
        super(id, prerequisites, () => node.unlocked, onComplete);
        this.node = node;
    }
}
class TechTreeNode {
    constructor(prerequisites = []) {
        this.prerequisites = prerequisites;
        this.unlocked = false;
    }
}
const objectives = (() => {
    const produceCoal = new Objective("produceCoal");
    const gatherCoal = new Objective("gatherCoal", [produceCoal], () => level1.resources["base_coal"] >= 10);
    const researchStoneFurnace = new ResearchObjective("researchStoneFurnace", [gatherCoal], TechTree.buildingFurnace);
});
