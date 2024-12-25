/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the tech tree and the objective system. */

import { Buildings } from "./content/content.js";
import { bundle } from "./content/i18n.js";
import type { ItemStack } from "./content/registry.js";
import type { ItemID } from "./types.js";
import { showCredits } from "./ui/cutscenes.js";
import { DOM } from "./ui/dom.js";
import { Camera } from "./ui/graphics.js";
import { Input } from "./ui/input.js";
import { crash, sort2 } from "./util/funcs.js";
import { NonEmptyArray } from "./util/types.js";
import { Game } from "./vars.js";
import type { BuildingWithRecipe } from "./world/building-types.js";
import type { Level } from "./world/world.js";



export class TechTreeNode {
	unlocked = false;
	children:TechTreeNode[] = [];
	/** Zero-based index */
	depth:number;
	constructor(
		public level:Level,
		public id:string,
		public cost:ItemStack[],
		public prerequisites:TechTreeNode[] = [],
	){
		this.depth = Math.max(-1, ...this.prerequisites.map(p => p.depth)) + 1;
	}
	tryUnlock():boolean {
		if(this.unlocked) return true;
		if(!this.prerequisites.every(p => p.unlocked)) return false;
		if(!this.level.hasResources(this.cost, 2000)) return false;
		this.level.drainResources(this.cost);
		this.unlocked = true;
		return true;
	}
	showCost(){
		this.level.hasResources(this.cost, 100);
	}
	hasCost(){
		return this.level.hasResources(this.cost);
	}
	missingItem():ItemID | null {
		return this.level.missingItemForResources(this.cost);
	}
	imageURL(){
		//TODO not generic
		if(this.id.startsWith("building_"))
			return `assets/textures/building/${this.id.split("building_")[1]}!0.png`;
		else
			return `assets/textures/misc/${this.id}.png`;
	}
	status(){
		if(this.unlocked) return "unlocked";
		else if(this.prerequisites.every(p => p.unlocked)) return "locked";
		else return "inaccessible";
	}
}

export class TechTree {
	nodes:TechTreeNode[] = [];
	nodesByID:Record<string, TechTreeNode> = {}
	root:TechTreeNode;
	menuVisible = false;
	constructor(
		public level:Level,
		builder:(tree:TechTree) => unknown
	){
		builder(this);
		this.root = this.nodes.find(n => n.prerequisites.length == 0) ?? crash(`No root node`);
		this.nodes.forEach(n => sort2(n.children, n => n.children.length))
	}
	
	node(id:string, cost:ItemStack[], prerequisites:TechTreeNode[], unlocked = false):TechTreeNode {
		const node = new TechTreeNode(this.level, id, cost, prerequisites);
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

	tryUnlock(id:string){
		this.getOpt(id)?.tryUnlock();
		this.resetTree();
	}
	displayNode(node:TechTreeNode):string {
		return `<div class="research-tree-node ${node.status()}" style="--depth: ${node.depth};${node.prerequisites.length == 0 ? "--right-offset: 1000;" : ""}"><img src="${node.imageURL()}" id="research_${node.id}" onclick="tech.tryUnlock('${node.id}')"></div>`;
	}
	displayTree(node:TechTreeNode):string {
		if(node.children.length == 0) return this.displayNode(node);
		else return `<div class="research-tree-inner">${this.displayNode(node)}${node.children.map(c => this.displayTree(c)).join("\n")}</div>`;
	}
	display(){
		if(DOM.researchTree.children.length == 0){
			this.resetTree();
		}
		if(this.menuVisible){
			Input.placedBuilding.type = "base_null";
		}
	}
	showMenu(){
		if(!this.menuVisible){
			this.resetTree();
			this.menuVisible = true;
			DOM.researchMenu.classList.remove("hidden");
			//TODO bad
			DOM.resourcesEl.style.backgroundColor = "#111";
		}
	}
	hideMenu(){
		if(this.menuVisible){
			this.menuVisible = false;
			DOM.researchMenu.classList.add("hidden");
			DOM.resourcesEl.style.removeProperty("background-color");
		}
	}
	resetTree(){
		DOM.researchTree.innerHTML = this.displayTree(this.root);
		DOM.researchTree.style.setProperty("--nodes", this.nodes.length.toString());
	}
	read(data:string){
		let numRead = 0;
		for(const node of data.split(",")){
			if(this.getOpt(node)){
				this.get(node).unlocked = true;
				numRead ++;
			}
		}
		return numRead;
	}
	write():string {
		return this.nodes.filter(n => n.unlocked).map(n => n.id).join(",");
	}
}

export const tech = new TechTree(Game.level1, tree => {
	//TODO tune research costs and building costs
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


export class Objective {
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
		if(!this.completed){
			this.completed = true;
			this.onComplete?.();
		}
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

export class ResearchObjective extends Objective {
	constructor(id:string, prerequisites:Objective[], nodeID:string, onComplete?:() => unknown){
		const node = tech.get(nodeID);
		super(id, prerequisites, () => node.unlocked, onComplete);
	}
}

export class ResearchBuildingObjective extends Objective {
	constructor(id:string, prerequisites:Objective[], nodeID:string, onComplete?:() => unknown){
		const node = tech.get("building_base_" + nodeID);
		super(id, prerequisites, () => node.unlocked, onComplete);
	}
}

export class GatherObjective extends Objective {
	constructor(id:string, prerequisites:Objective[], public items:NonEmptyArray<ItemStack>, onComplete?:() => unknown){
		super(id, prerequisites, () => Game.level1.hasResources(items), onComplete);
	}
	name(){
		return super.name() + ` (${Game.level1.resources[this.items[0][0]]}/${this.items[0][1]})`;
	}
}

export class ObjectiveList {
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

	read(data:string):number {
		let numRead = 0;
		const completedObjectives = data.split(",");
		for(const objective of completedObjectives){
			if(this.getOpt(objective)){
				this.get(objective).completed = true;
				numRead ++;
			}
		}
		return numRead;
	}
	write():string {
		return this.objectives.filter(n => n.completed).map(n => n.id).join(",");
	}
}

export class ChangingObjective extends Objective {
	name(){
		return bundle.get(`objective.${this.id}${this.satisfied ? "_satisfied" : ""}.name`);
	}
	description(){
		return bundle.get(`objective.${this.id}${this.satisfied ? "_satisfied" : ""}.description`);
	}
}

export const objectives = new ObjectiveList(() => {
	const leave = new ChangingObjective("base_leave", [], () => Camera.scrollLimited, () => Camera.scrollTo(0, 0));
	const tooltips = new Objective("base_tooltips", [], () => Game.transientStats.objectiveHovered);
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
	const producePower = new Objective("base_producePower", [researchStirlingGenerator], () => Game.level1.grid.maxProduction > 0);
	const researchCompressor = new ResearchBuildingObjective("base_researchCompressor", [producePower], "compressor");
	const gatherIronPlate = new GatherObjective("base_gatherIronPlate", [researchCompressor], [["base_ironPlate", 25]]);
	const researchPipe = new ResearchBuildingObjective("base_researchPipe", [gatherIronPlate], "pipe");
	const researchPump = new ResearchBuildingObjective("base_researchPump", [researchPipe], "pump");
	const researchBoiler = new ResearchBuildingObjective("base_researchBoiler", [researchPump], "boiler");
	const researchWiremill = new ResearchBuildingObjective("base_researchWiremill", [producePower], "wiremill");
	const researchSteamGenerator = new ResearchBuildingObjective("base_researchSteamGenerator", [researchBoiler], "steam_generator");
	const activateSteamGenerator = new Objective("base_activateSteamGenerator", [researchSteamGenerator], () => Game.level1.grid.producers.some(p => p.block === Buildings.get("base_steam_generator") && (p as BuildingWithRecipe).efficiencyp > 0));
	const researchLathe = new ResearchBuildingObjective("base_researchLathe", [producePower], "lathe");
	const researchAssembler = new ResearchBuildingObjective("base_researchAssembler", [researchLathe], "assembler");
	const produceStators = new Objective("base_produceStators", [researchAssembler]);
	const produceRotors = new Objective("base_produceRotors", [researchAssembler]);
	const produceMotors = new Objective("base_produceMotors", [produceStators, produceRotors]);
	const researchBoat = new ResearchObjective("base_researchBoat", [produceMotors], "base_boat", () => showCredits());
	//all the way to the boat
});


