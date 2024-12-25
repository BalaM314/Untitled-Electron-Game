/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the quad tree data structures. */

import { Pos, Rect, Intersector } from "./geom.js";


export class QuadTree<T extends {pos: Pos}> {
	static maxItems = 64;
	static maxDepth = 8;
	elements: T[] = [];
	nodes: QuadTree<T>[] | null = null;
	constructor(public span:Rect, public depth:number = 1){}
	split(){
		//Convert to nodes
		this.nodes = [
			new QuadTree([this.span[0], this.span[1], this.span[2] / 2, this.span[3] / 2], this.depth + 1),
			new QuadTree([this.span[0], this.span[1] + this.span[3] / 2, this.span[2] / 2, this.span[3] / 2], this.depth + 1),
			new QuadTree([this.span[0] + this.span[2] / 2, this.span[1], this.span[2] / 2, this.span[3] / 2], this.depth + 1),
			new QuadTree([this.span[0] + this.span[2] / 2, this.span[1] + this.span[3] / 2, this.span[2] / 2, this.span[3] / 2], this.depth + 1),
		];
		for(const el of this.elements){
			this.add(el);
		}
		this.elements = [];
	}
	add(element:T):boolean {
		if(this.nodes){
			//Determine the correct subtree
			for(const node of this.nodes){ //is this fine? O(log n)
				if(node.contains(element)){
					node.add(element); return true;
				}
			}
			//if this for loop finishes, then this is the wrong quadtree
			return false;
		} else if(this.elements.length == QuadTree.maxItems && this.depth < QuadTree.maxDepth){
			this.split();
			this.add(element);
			return true;
		} else {
			this.elements.push(element);
			return true;
		}
	}
	delete(element:T):boolean {
		if(this.nodes){
			//Determine the correct subtree
			for(const node of this.nodes){ //is this fine? O(log n)
				if(node.contains(element)){
					return node.delete(element);
				}
			}
			return false; //wrong quadtree
		} else {
			const index = this.elements.indexOf(element);
			if(index == -1) return false;
			this.elements.splice(index, 1);
			return true;
		}
	}
	forEach(cons:(element:T) => unknown, thisArg?:any){
		if(this.nodes){
			this.nodes[0].forEach(cons, thisArg);
			this.nodes[1].forEach(cons, thisArg);
			this.nodes[2].forEach(cons, thisArg);
			this.nodes[3].forEach(cons, thisArg);
		} else {
			for(let i = 0; i < this.elements.length; i ++){
				cons.call(thisArg, this.elements[i]);
			}
		}
	}
	intersect(rect:Rect, cons:(element:T) => unknown){
		if(this.nodes){
			if(Intersector.rectsIntersect(this.nodes[0].span, rect)) this.nodes[0].intersect(rect, cons);
			if(Intersector.rectsIntersect(this.nodes[1].span, rect)) this.nodes[1].intersect(rect, cons);
			if(Intersector.rectsIntersect(this.nodes[2].span, rect)) this.nodes[2].intersect(rect, cons);
			if(Intersector.rectsIntersect(this.nodes[3].span, rect)) this.nodes[3].intersect(rect, cons);
		} else {
			for(let i = 0; i < this.elements.length; i ++){
				if(Intersector.pointInRect(this.elements[i].pos.pixel, rect)) cons(this.elements[i]);
			}
		}
	}
	contains(el:T){
		return Intersector.pointInRect(el.pos.pixel, this.span);
	}
	static async setShowcaseMode(){
		const [
			{ scenes }, { Game }, { Gfx }, { Input }
		] = await Promise.all([
			import("../ui/scenes.js"), import("../vars.js"), import("../ui/graphics.js"), import("../ui/input.js")
		]);
		const displayScale = 4;
		function display(node:QuadTree<{pos: Pos}>){
			Gfx.fillColor(`hsl(${(node.depth - 1) * 35}, 100%, 50%)`);
			Gfx.rect(...node.span.map(a => a * displayScale));
			Gfx.strokeColor("white");
			Gfx.lineRect(...node.span.map(a => a * displayScale));
			if(node.nodes){
				for(const n of node.nodes) display(n);
			} else {
				Gfx.fillColor("blue");
				for(const el of node.elements){
					Gfx.ellipse(...el.pos.pixel.map(a => a * displayScale), 2.5, 2.5);
				}
			}
		}
		let tree = new QuadTree([0, 0, 300, 180]);
		cancelAnimationFrame(Game.animationFrame);
		Gfx.layer("overlay");
		Gfx.fillColor("black");
		Gfx.rect(0, 0, innerWidth, innerHeight);
		display(tree);
		scenes[Game.sceneName].onmousedown = () => {
			tree.add({
				pos: Pos.fromPixelCoords(...Input.mouse.map(a => a / displayScale))
			});
			display(tree);
		}
	}
}

/** Quad tree infinite */
export class QuadTreeI<T extends {pos: Pos}> extends QuadTree<T> {
	static regionSize = [3840, 3840] as const; //8x8 chunks
	nodes: QuadTree<T>[] = []; //Note: all nodes are stored in an array, so this will cause slowness if there are a large number of nodes
	constructor(){
		super([-Infinity, -Infinity, Infinity, Infinity]);
	}
	static getRegion(pos:Pos):Rect {
		return [
			Math.floor(pos.pixelX / this.regionSize[0]) * this.regionSize[0],
			Math.floor(pos.pixelY / this.regionSize[1]) * this.regionSize[1],
			...this.regionSize
		];
	}
	add(element:T){
		if(super.add(element)) return true;
		//no existing nodes can contain the element, so make a new one
		const node = new QuadTree<T>(
			QuadTreeI.getRegion(element.pos), 1
		);
		this.nodes.push(node);
		return node.add(element);
	}
	forEach(cons:(element:T) => unknown, thisArg?:any){
		for(let i = 0; i < this.nodes.length; i ++){
			this.nodes[i].forEach(cons, thisArg);
		}
	}
	intersect(rect:Rect, cons:(element:T) => unknown){
		for(let i = 0; i < this.nodes.length; i ++){
			if(Intersector.rectsIntersect(this.nodes[i].span, rect))
				this.nodes[i].intersect(rect, cons);
		}
	}
}
