"use strict";
class TechTreeNode {
    constructor(id, cost, prerequisites = []) {
        this.id = id;
        this.cost = cost;
        this.prerequisites = prerequisites;
        this.unlocked = false;
        this.children = [];
    }
    unlock() {
        this.unlocked = true;
    }
}
class TechTree {
    constructor(builder) {
        this.nodes = [];
        this.nodesByID = {};
        builder(this);
    }
    node(id, cost, prerequisites, unlocked = false) {
        const node = new TechTreeNode(id, cost, prerequisites);
        node.unlocked = unlocked;
        this.nodes.push(node);
        for (const prereq of prerequisites) {
            prereq.children.push(node);
        }
        return node;
    }
    get(id) {
        return this.nodesByID[id] ?? crash(`Nonexistent tech tree node ${id}`);
    }
    getOpt(id) {
        return this.nodesByID[id] ?? null;
    }
    display(offset) {
    }
    read(data) {
        const completedNodes = data.split(",");
        for (const node of completedNodes) {
            this.getOpt(node)?.unlock();
        }
    }
    write() {
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
        return bundle.get(`objective.${this.id}.name`);
    }
    description() {
        return bundle.get(`objective.${this.id}.description`);
    }
}
class ResearchObjective extends Objective {
    constructor(id, prerequisites, node, onComplete) {
        super(id, prerequisites, () => node.unlocked, onComplete);
        this.node = node;
    }
}
class ObjectiveTree {
    constructor(builder) {
        this.objectives = [];
        this.objectivesByID = {};
        builder(this);
    }
    objective(id, prerequisites, condition, onComplete) {
        const node = new Objective(id, prerequisites, condition, onComplete);
        this.objectives.push(node);
        return node;
    }
    get(id) {
        return this.objectivesByID[id] ?? crash(`Nonexistent objective ${id}`);
    }
    getOpt(id) {
        return this.objectivesByID[id] ?? null;
    }
    read(data) {
        const completedObjectives = data.split(",");
        for (const objective of completedObjectives) {
            if (this.getOpt(objective)) {
                this.get(objective).completed = true;
            }
        }
    }
    write() {
        return this.objectives.filter(n => n.completed).map(n => n.id).join(",");
    }
}
const objectives = new ObjectiveTree(() => {
    const produceCoal = new Objective("produceCoal");
    const gatherCoal = new Objective("gatherCoal", [produceCoal], () => level1.hasResources([["base_coal", 10]]));
    const researchStoneFurnace = new ResearchObjective("researchStoneFurnace", [gatherCoal], tech.get("building_furnace"));
});
