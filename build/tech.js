import { DOM } from "./ui/dom";
import { Input } from "./ui/input";
import { crash, sort2 } from "./util/funcs";
import { Game } from "./vars";
export class TechTreeNode {
    constructor(level, id, cost, prerequisites = []) {
        this.level = level;
        this.id = id;
        this.cost = cost;
        this.prerequisites = prerequisites;
        this.unlocked = false;
        this.children = [];
        this.depth = Math.max(-1, ...this.prerequisites.map(p => p.depth)) + 1;
    }
    tryUnlock() {
        if (this.unlocked)
            return true;
        if (!this.prerequisites.every(p => p.unlocked))
            return false;
        if (!this.level().hasResources(this.cost, 2000))
            return false;
        this.level().drainResources(this.cost);
        this.unlocked = true;
        return true;
    }
    showCost() {
        this.level().hasResources(this.cost, 100);
    }
    hasCost() {
        return this.level().hasResources(this.cost);
    }
    missingItem() {
        return this.level().missingItemForResources(this.cost);
    }
    imageURL() {
        if (this.id.startsWith("building_"))
            return `assets/textures/building/${this.id.split("building_")[1]}!0.png`;
        else
            return `assets/textures/misc/${this.id}.png`;
    }
    status() {
        if (this.unlocked)
            return "unlocked";
        else if (this.prerequisites.every(p => p.unlocked))
            return "locked";
        else
            return "inaccessible";
    }
}
export class TechTree {
    constructor(level, builder) {
        this.level = level;
        this.nodes = [];
        this.nodesByID = {};
        this.menuVisible = false;
        builder(this);
        this.root = this.nodes.find(n => n.prerequisites.length == 0) ?? crash(`No root node`);
        this.nodes.forEach(n => sort2(n.children, n => n.children.length));
    }
    node(id, cost, prerequisites, unlocked = false) {
        const node = new TechTreeNode(this.level, id, cost, prerequisites);
        node.unlocked = unlocked;
        this.nodes.push(node);
        this.nodesByID[id] = node;
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
    tryUnlock(id) {
        this.getOpt(id)?.tryUnlock();
        this.resetTree();
    }
    displayNode(node) {
        return `<div class="research-tree-node ${node.status()}" style="--depth: ${node.depth};${node.prerequisites.length == 0 ? "--right-offset: 1000;" : ""}"><img src="${node.imageURL()}" id="research_${node.id}" onclick="tech.tryUnlock('${node.id}')"></div>`;
    }
    displayTree(node) {
        if (node.children.length == 0)
            return this.displayNode(node);
        else
            return `<div class="research-tree-inner">${this.displayNode(node)}${node.children.map(c => this.displayTree(c)).join("\n")}</div>`;
    }
    display() {
        if (DOM.researchTree.children.length == 0) {
            this.resetTree();
        }
        if (this.menuVisible) {
            Input.placedBuilding.type = "base_null";
        }
    }
    showMenu() {
        if (!this.menuVisible) {
            this.resetTree();
            this.menuVisible = true;
            DOM.researchMenu.classList.remove("hidden");
            DOM.resourcesEl.style.backgroundColor = "#111";
        }
    }
    hideMenu() {
        if (this.menuVisible) {
            this.menuVisible = false;
            DOM.researchMenu.classList.add("hidden");
            DOM.resourcesEl.style.removeProperty("background-color");
        }
    }
    resetTree() {
        DOM.researchTree.innerHTML = this.displayTree(this.root);
        DOM.researchTree.style.setProperty("--nodes", this.nodes.length.toString());
    }
    read(data) {
        let numRead = 0;
        for (const node of data.split(",")) {
            if (this.getOpt(node)) {
                this.get(node).unlocked = true;
                numRead++;
            }
        }
        return numRead;
    }
    write() {
        return this.nodes.filter(n => n.unlocked).map(n => n.id).join(",");
    }
}
export const tech = new TechTree(() => Game.level1, tree => {
    const conveyor = tree.node("building_base_conveyor", [], [], true);
    const miner = tree.node("building_base_miner", [], [conveyor], true);
    const trash_can = tree.node("building_base_trash_can", [["base_ironIngot", 20], ["base_stone", 20]], [conveyor]);
    const furnace = tree.node("building_base_furnace", [["base_coal", 20], ["base_stone", 40]], [miner]);
    const extractor = tree.node("building_base_extractor", [["base_ironIngot", 20], ["base_stone", 20]], [conveyor]);
    const chest = tree.node("building_base_chest", [["base_ironIngot", 20], ["base_stoneBrick", 20]], [conveyor]);
    const alloy_smelter = tree.node("building_base_alloy_smelter", [["base_stoneBrick", 50], ["base_ironIngot", 50], ["base_coal", 50]], [furnace]);
    const stirling_generator = tree.node("building_base_stirling_generator", [["base_ironIngot", 50], ["base_copperIngot", 30]], [alloy_smelter]);
    const compressor = tree.node("building_base_compressor", [["base_ironIngot", 50], ["base_copperIngot", 50]], [stirling_generator]);
    const lathe = tree.node("building_base_lathe", [["base_ironIngot", 50], ["base_copperIngot", 50]], [stirling_generator]);
    const wiremill = tree.node("building_base_wiremill", [["base_ironIngot", 50], ["base_copperIngot", 50]], [stirling_generator]);
    const pipe = tree.node("building_base_pipe", [["base_ironPlate", 10]], [compressor]);
    const pump = tree.node("building_base_pump", [["base_ironIngot", 50], ["base_ironPlate", 50], ["base_copperIngot", 30]], [pipe]);
    const tank = tree.node("building_base_tank", [["base_steelIngot", 50], ["base_ironPlate", 50], ["base_stoneBrick", 50]], [pipe]);
    const boiler = tree.node("building_base_boiler", [["base_ironIngot", 50], ["base_steelIngot", 50], ["base_ironPlate", 50], ["base_coal", 20]], [pipe]);
    const steam_generator = tree.node("building_base_steam_generator", [["base_ironIngot", 50], ["base_steelIngot", 50], ["base_ironPlate", 50], ["base_copperIngot", 30], ["base_copperWire", 30]], [boiler]);
    const assembler = tree.node("building_base_assembler", [["base_ironIngot", 200], ["base_steelIngot", 50], ["base_ironPlate", 50], ["base_copperIngot", 200], ["base_copperWire", 100]], [steam_generator]);
    const boat = tree.node("base_boat", [["base_steelPlate", 500], ["base_steelIngot", 100], ["base_steelRod", 100], ["base_ironIngot", 300], ["base_ironPlate", 100], ["base_ironRod", 100], ["base_copperWire", 300], ["base_copperIngot", 15], ["base_motor", 50]], [assembler]);
});
