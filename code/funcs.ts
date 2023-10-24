



Array.prototype.sort2 = function(callback){
	this.sort((value1, value2) => {
		let result1 = callback(value1);
		let result2 = callback(value2);
		if(result1 < result2){
			return -1;
		} else if(result1 > result2){
			return 1;
		} else {
			return 0;
		}
	});
};
Object.defineProperty(Array.prototype, "sort2", {
	enumerable: false
});

CanvasRenderingContext2D.prototype.clear = function(){
	// this.globalAlpha = 1.0;
	// this.fillStyle = "#000000";
	// this.strokeStyle = "#000000";
	(this as CanvasRenderingContext2D).clearRect(0, 0, this.canvas.width, this.canvas.height);
};
Object.defineProperty(CanvasRenderingContext2D.prototype, "clear", {
	enumerable: false
});

/**Returns the time passed since program start in milliseconds. */
function millis():number{
	return (new Date()).valueOf() - Game.startTime.valueOf();
}

/**Finds the greatest common divisor of two numbers */
function gcd(x:number, y:number){
	if((typeof x !== 'number') || (typeof y !== 'number')){
		return 1;
	}
	x = Math.abs(x);
	y = Math.abs(y);
	while(y) {
		let t = y;
		y = x % y;
		x = t;
	}
	return x;
}

function round(amount:number, places = 0):number {
	const tenEplaces = 10 ** places;
	return Math.round(amount * tenEplaces) / tenEplaces;
}
/** Displays a number as a percentage. */
function percentage(amount:number, places = 0):string {
	return `${round(amount * 100, places)}%`;
}
function random(max:number):number;
function random(min:number, max:number):number;
function random<T>(list:T[]):T;

/**Chooses a random number between min and max, or selects a random element from an array. */
function random(min:any, max?:any):any{
	if(typeof min == "number"){
		if(arguments.length > 2){
			throw new ArgumentError("Too many arguments for random");
		}
		if(arguments.length == 1){
			max = min;
			min = 0;
		}
		if(arguments.length == 0){
			min = 0;
			max = 1;
		}
		return Math.random()*(max-min) + min;
	} else if(min instanceof Array){
		return min[Math.floor(random(0, min.length))];
	}
}

function range(start:number, end:number){
	let temp = [];
	for(let i = start; i <= end; i ++){
		temp.push(i);
	}
	return temp;
}

function constrain(x:number, min:number, max:number){
	if(x > max) return max;
	if(x < min) return min;
	return x;
}


function assert(x:any){
	if(!x){
		throw new AssertionFailedError(x);
	}
}

function download(filename:string, text:string){
	//Self explanatory.
	let temp2 = document.createElement('a');
	temp2.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
	temp2.setAttribute('download', filename);
	temp2.style.display = 'none';
	document.body.appendChild(temp2);
	temp2.click();
	document.body.removeChild(temp2);
}

function parseError(err:unknown){
	if(err instanceof Error){
		return err.message;
	} else if(typeof err == "number" || typeof err == "string" || typeof err == "boolean"){
		return err.toString();
	} else return err;
}

//Yes I know this is a class.
class Button {
	declare x: number;
	declare y: number;
	declare width: number;
	declare height: number;
	declare label: string;
	//is this really the best way to solve this?
	color: string;
	font: string;
	onClick: (event:MouseEvent) => void
	constructor(config:{
		x: number | (() => number);
		y: number | (() => number);
		width: number | (() => number);
		height: number | (() => number);
		label: string | (() => string);
		color: string;
		font: string;
		onClick: (event:MouseEvent) => void;
	}){
		if(config.x instanceof Function)
			Object.defineProperty(this, "x", {get: config.x});
		else
			this.x = config.x ?? 300;
		
		if(config.y instanceof Function)
			Object.defineProperty(this, "y", {get: config.y});
		else
			this.y = config.y ?? 300;
		
		if(config.width instanceof Function)
			Object.defineProperty(this, "width", {get: config.width});
		else
			this.width = config.width ?? 300;
		
		if(config.height instanceof Function)
			Object.defineProperty(this, "height", {get: config.height});
		else
			this.height = config.height ?? 300;
		
		if(config.label instanceof Function)
			Object.defineProperty(this, "label", {get: config.label});
		else
			this.label = config.label ?? "Button";
		
		this.color = config.color ?? "#0000FF";
		this.font = config.font ?? "20px sans-serif";
		this.onClick = config.onClick ?? (()=>{});
	}
	display(_ctx:CanvasRenderingContext2D){
		_ctx.fillStyle = this.color;
		_ctx.strokeStyle = "#000000";
		_ctx.lineWidth = 2;
		_ctx.globalAlpha = 1.0;
		_ctx.fillRect(this.x, this.y, this.width, this.height);
		_ctx.strokeRect(this.x, this.y, this.width, this.height);
		if(this.isMouseInside()){
			_ctx.fillStyle = "#FFFFFF";
			if(Input.mouseDown){
				_ctx.globalAlpha = 0.4;
			} else {
				_ctx.globalAlpha = 0.2;
			}
			_ctx.lineWidth = 0;
			_ctx.fillRect(this.x, this.y, this.width, this.height);
		}
		_ctx.lineWidth = 1;
		_ctx.globalAlpha = 1.0;
		_ctx.font = this.font;
		_ctx.textAlign = "center";
		let tempBaseline = _ctx.textBaseline;
		_ctx.textBaseline = "middle";
		_ctx.fillStyle = "#FFFFFF";
		_ctx.fillText(this.label,this.x + this.width/2,this.y + this.height/2);
		_ctx.textBaseline = tempBaseline;
	}
	isMouseInside(){
		return Intersector.pointInRect([Input.mouseX, Input.mouseY], [this.x, this.y, this.width, this.height]);
	}
	handleMouseClick(e:MouseEvent){
		if(this.isMouseInside() && e.button == 0){
			this.onClick(e);
		}
	}
}

class Intersector {
	/** The bottom left edges of the rect are inclusive, but the top right edges are exclusive. */
	static pointInRect([x, y]:PosT, [rX, rY, rW, rH]:Rect){
		return x >= rX && x < (rX + rW) && y >= rY && y < (rY + rH);
	}
	/** All edges and corners of the rect are inclusive. */
	static rectsIntersect([aX, aY, aW, aH]:Rect, [bX, bY, bW, bH]:Rect){
		return bX <= aX + aW && aX <= bX + bW && bY <= aY + aH && aY <= bY + bH;
	}
}

/**
 * Keeps a running average of some data.
 */
class WindowedMean {
	/** Queue to hold the data. */
	data:number[];
	/** Index of the next place to insert an item into the queue. */
	queuei:number = 0;
	

	constructor(public maxWindowSize:number, fillValue = 0){
		this.data = new Array(maxWindowSize).fill(fillValue);
	}

	add(value:number){
		this.data[this.queuei++ % this.maxWindowSize] = value;
	}
	mean<T = null>(windowSize = this.maxWindowSize, notEnoughDataValue:T = null as T):number | T {
		if(this.queuei >= windowSize) return this.rawMean(windowSize);
		else return notEnoughDataValue;
	}
	rawMean(windowSize:number = this.maxWindowSize){
		if(windowSize > this.maxWindowSize) throw new Error(`Cannot get average over the last ${windowSize} values becaue only ${this.maxWindowSize} values are stored`);
		let total = 0;
		let wrappedQueueI = this.queuei % this.maxWindowSize;
		for(let i = wrappedQueueI - windowSize; i < wrappedQueueI; i ++){
			if(i >= 0) total += this.data[i];
			else total += this.data[this.maxWindowSize + i];
		}
		return total / windowSize;
	}

	standardDeviation<T = number>(windowSize = this.maxWindowSize, notEnoughDataValue:T = 0 as T):number | T {
		if(this.queuei < windowSize) return notEnoughDataValue;
		const mean = this.mean(windowSize)!;
		/** Σ(x-x̄)^2 */
		let sumXMinusMeanSquared = 0;
		let wrappedQueueI = this.queuei % this.maxWindowSize;
		for(let i = wrappedQueueI - windowSize; i < wrappedQueueI; i ++){
			sumXMinusMeanSquared += (((i >= 0)
			? this.data[i]
			: this.data[this.maxWindowSize + i]) - mean) ** 2;
		}
		return sumXMinusMeanSquared / windowSize;
	}

}

function Abstract<TClass extends new (...args:any[]) => any>(input:TClass, context:ClassDecoratorContext<TClass>):TClass {
	return class __temp extends input {
		constructor(...args:any[]){
			super(...args);
			if(this.constructor === __temp) throw new Error(`Cannot construct abstract class ${input.name}`);
		}
	}
}

/**
 * Drawing Functions
 * 
 */

enum RectMode {
	CENTER,
	CORNER
}

function* pseudoRandom(seed:number) {
	let value = seed + 11111111111111;
	while(true){
		value = value * 16807 % 16777216;
		let num = value / 16777216;
		yield {
			value: num,
			chance(amount:number){
				return num < amount;
			}
		}
	}
	//cursed hack to manipulate the return type
	return null! as never;
}
function getElement<T extends typeof HTMLElement>(id:string, type:T){
	const element = <unknown>document.getElementById(id);
	if(element instanceof type) return element as T["prototype"];
	else if(element instanceof HTMLElement) throw new Error(`Element with id was fetched as type ${type}, but was of type ${element.constructor.name}`);
	else throw new Error(`Element with id ${id} does not exist`);
}

/**
 * Game-related functions
 */

function trigger(type:triggerType, buildingID?:RawBuildingID, itemID?:ItemID){
	//nuked
}

function _alert(x:string){
	Game.alerts.list.push(x);
}

function closeAlert(){
	alertbox.classList.remove("active");
	Game.alerts.active = false;
}

function hex(num:number, length:number){
	return `0x${(Array(length).fill("0").join("") + num.toString(16)).toUpperCase().slice(-length)}`;
	//it just works
}

function stringifyMeta(buildingID:RawBuildingID, buildingMeta:BuildingMeta):StringBuildingID {
	return `${buildingID}:${buildingMeta}`;
}

function mapLegacyRawBuildingID(id:LegacyRawBuildingID):RawBuildingID {
	switch(id){
		case "0x01": return "base_conveyor";
		case "0x02": return "base_miner";
		case "0x03": return "base_trash_can";
		case "0x04": return "base_furnace";
		case "0x05": return "base_extractor";
		case "0x06": return "base_chest";
		case "0x07": return "base_alloy_smelter";
		case "0x08": return "base_resource_acceptor";
		case "0x09": return "base_wiremill";
		case "0x0A": return "base_compressor";
		case "0x0B": return "base_lathe";
		case "0x10": return "base_multiblock_secondary";
		case "0x11": return "base_assembler";
		case "0xFF": return "base_null";
	}
}
function getLegacyRawBuildingID(buildingID:LegacyBuildingID):LegacyRawBuildingID {
	return hex(+buildingID, 2) as LegacyRawBuildingID;
}


class Pos {
	private constructor(public pixelX:number, public pixelY:number){}
	static fromPixelCoords(x:number, y:number){
		return new Pos(x, y);
	}
	static fromTileCoords(x:number, y:number, centered:boolean){
		return new Pos(this.tileToPixel(x, centered), this.tileToPixel(y, centered));
	}
	get pixel():PosT {
		return [this.pixelX, this.pixelY];
	}
	get tile():PosT {
		return [this.tileXExact, this.tileYExact];
	}
	get tileC():PosT {
		return [this.tileXCentered, this.tileYCentered];
	}
	get pixelXCenteredInTile(){
		return Pos.tileToPixel(this.tileX, true);
	}
	get pixelYCenteredInTile(){
		return Pos.tileToPixel(this.tileY, true);
	}
	get tileX(){
		return Pos.pixelToTile(this.pixelX);
	}
	get tileY(){
		return Pos.pixelToTile(this.pixelY);
	}
	get tileXCentered(){
		return Pos.pixelToTile(this.pixelX) + 0.5;
	}
	get tileYCentered(){
		return Pos.pixelToTile(this.pixelY) + 0.5;
	}
	get tileXExact(){
		return Pos.pixelToTileExact(this.pixelX);
	}
	get tileYExact(){
		return Pos.pixelToTileExact(this.pixelY);
	}
	get tileOffsetXInPixels(){
		return Pos.tileOffsetInPixels(this.pixelX);
	}
	get tileOffsetYInPixels(){
		return Pos.tileOffsetInPixels(this.pixelY);
	}
	get tileOffsetXInTiles(){
		return Pos.tileOffsetInTiles(this.pixelX);
	}
	get tileOffsetYInTiles(){
		return Pos.tileOffsetInTiles(this.pixelY);
	}
	get tileOffsetXCentered(){
		return Pos.tileOffsetInTiles(this.pixelX) == 0.5;
	}
	get tileOffsetYCentered(){
		return Pos.tileOffsetInTiles(this.pixelY) == 0.5;
	}
	get chunkOffsetXInTiles(){
		return Pos.chunkOffsetInTiles(this.tileX);
	}
	get chunkOffsetYInTiles(){
		return Pos.chunkOffsetInTiles(this.tileY);
	}
	get chunkX(){
		return Pos.pixelToChunk(this.pixelX);
	}
	get chunkY(){
		return Pos.pixelToChunk(this.pixelY);
	}
	
	static pixelToTile(pixelCoord:number){
		return Math.floor(pixelCoord / consts.TILE_SIZE);
	}
	static pixelToTileExact(pixelCoord:number){
		return pixelCoord / consts.TILE_SIZE;
	}
	static tileToPixel(tileCoord:number, centered:boolean){
		return (tileCoord + <any>centered * 0.5) * consts.TILE_SIZE;
	}
	static chunkToTile(chunkCoord: number) {
		return chunkCoord * consts.CHUNK_SIZE;
	}
	static tileToChunk(tileCoord:number){
		return Math.floor(tileCoord / consts.CHUNK_SIZE);
	}
	static tileToChunkExact(tileCoord:number){
		return Math.floor(tileCoord / consts.CHUNK_SIZE);
	}
	static pixelToChunk(pixelCoord:number){
		return Math.floor(pixelCoord / (consts.TILE_SIZE * consts.CHUNK_SIZE));
	}
	static chunkToPixel(chunkCoord:number){
		return chunkCoord * consts.CHUNK_SIZE * consts.TILE_SIZE;
	}
	static tileOffsetInPixels(pixelCoord:number):number {
		pixelCoord = Math.floor(pixelCoord) % consts.TILE_SIZE;
		return pixelCoord + (pixelCoord < 0 ? consts.TILE_SIZE : 0);
	}
	static tileOffsetInTiles(pixelCoord:number):number {
		pixelCoord = Math.floor(pixelCoord) % consts.TILE_SIZE;
		return (pixelCoord + (pixelCoord < 0 ? consts.TILE_SIZE : 0)) / consts.TILE_SIZE;
	}
	static chunkOffsetInTiles(tileCoord:number):number {
		tileCoord = Math.floor(tileCoord) % consts.CHUNK_SIZE;
		return tileCoord + (tileCoord < 0 ? consts.CHUNK_SIZE : 0);
	}
}

class Keybind {
	mainKey: string;
	modifiers: string[];
	action: () => void;
	constructor(mainKey: string, modifiers?: string[], action?: () => void){
		this.mainKey = mainKey;
		this.modifiers = modifiers?.map(key => key.toLowerCase()) ?? [];
		this.action = action ?? (() => {});
	}
	isHeld(){
		let modifiersHeld = this.modifiers
			.filter(key => !key.startsWith("!"))
			.filter(key => !Input.keysHeld.has(key))
			.length == 0;
		let disallowedModifiersNotHeld = this.modifiers
			.filter(key => key.startsWith("!"))
			.map(key => key.split("!")[1])
			.filter(key => Input.keysHeld.has(key))
			.length == 0;
		//Array.filter and Array.map ftw
		//these functions have saved me so many for loops
		return Input.keysHeld.has(this.mainKey) && modifiersHeld && disallowedModifiersNotHeld;
	}
	check(e:KeyboardEvent){
		let modifiersHeld = this.modifiers
			.filter(key => !key.startsWith("!"))
			.filter(key => !Input.keysHeld.has(key))
			.length == 0;
		let disallowedModifiersNotHeld = this.modifiers
			.filter(key => key.startsWith("!"))
			.map(key => key.split("!")[1])
			.filter(key => Input.keysHeld.has(key))
			.length == 0;
		if(this.mainKey == e.key.toLowerCase() && modifiersHeld && disallowedModifiersNotHeld){
			e.preventDefault();
			this.action();
		}
	}
}

/**Returns if a thing is in an object. Useful to stop typescript complaining. */
function isKey<T extends string>(obj:Record<T, unknown>, thing:unknown):thing is T;
function isKey<T extends string>(obj:Map<T, unknown>, thing:unknown):thing is T;
function isKey<T extends string>(obj:Record<T, unknown> | Map<T, unknown>, thing:unknown):thing is T {
	if(obj instanceof Map)
		return obj.has(thing as T);
	else
		return (thing as string) in obj;
}

/**Sets a variable to be of a particular type. */
function forceType<T>(input:unknown): asserts input is T {
	//
}

function extend<Struct>() {
	return <T extends Struct>(data:T) => data;
}

function never():never {
	throw new Error(`Unreachable code was reached!`);
}

function makeRebindButton(y:number, buttonID: [string, string], buttonName:string, defaultKey: string){
	const keybind = (<any>keybinds)[buttonID[0]]?.[buttonID[1]] as Keybind | null;
	if(!keybind) throw new Error(`Invalid rebind button ${buttonID[0]}.${buttonID[1]}`);
	return new Button({
		x: () => innerWidth * 0.3,
		y: () => innerHeight * y,
		width: () => innerWidth * 0.4,
		height: () => innerHeight * 0.05,
		label: () => 
			`${buttonName}: ${
				keybind.modifiers
					.filter(key => !key.startsWith("!"))
					.map(el => el + " + ")
					.join("")
				//Get the list of modifiers, remove the ones that start with !, then add " + " to each one.
			}${
				keybind.mainKey
			}`,
		color: "#0000FF",
		font: "15px sans-serif",
		onClick: () => {
			keybind.mainKey =
				(prompt(`Rebind ${buttonName.toLowerCase()} to:`) ?? defaultKey).toLowerCase().substring(0,1);
		}
	})
}

function selectID(id:RawBuildingID){
	placedBuilding.type = id;
	const image = document.querySelector(`img#${id}`);
	if(image){
		toolbarIcons.forEach(i => i.classList.remove("selected"));
		image.classList.add("selected");
	}
}

class QuadTree<T extends {pos: Pos}> {
	static maxItems = 4;
	static maxDepth = 10;
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
			this.insert(el);
		}
		this.elements = [];
	}
	insert(element:T):boolean {
		if(this.nodes){
			//Determine the correct subtree
			for(const node of this.nodes){ //is this fine? O(log n)
				if(node.contains(element)){
					node.insert(element); return true;
				}
			}
			//if this for loop finishes, then this is the wrong quadtree
			return false;
		} else if(this.elements.length == QuadTree.maxItems && this.depth < QuadTree.maxDepth){
			this.split();
			this.insert(element);
			return true;
		} else {
			this.elements.push(element);
			return true;
		}
	}
	remove(element:T):boolean {
		if(this.nodes){
			//Determine the correct subtree
			for(const node of this.nodes){ //is this fine? O(log n)
				if(node.contains(element)){
					return node.remove(element);
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
	each(cons:(element:T) => unknown){
		if(this.nodes) this.nodes.forEach(n => n.each(cons));
		else this.elements.forEach(e => cons(e));
		//else, empty quadtree
	}
	intersect(rect:Rect, cons:(element:T) => unknown){
		if(this.nodes){
			for(const node of this.nodes){
				if(Intersector.rectsIntersect(node.span, rect)) node.intersect(rect, cons);
			}
		} else {
			for(const el of this.elements){
				if(Intersector.pointInRect(el.pos.pixel, rect)) cons(el);
			}
		}
	}
	contains(el:T){
		return Intersector.pointInRect(el.pos.pixel, this.span);
	}
	static displayScale = 4;
	display(){
		Gfx.fillColor(`hsl(${(this.depth - 1) * 35}, 100%, 50%)`);
		Gfx.rect(...this.span.map(a => a * QuadTree.displayScale));
		Gfx.strokeColor("white");
		Gfx.lineRect(...this.span.map(a => a * QuadTree.displayScale));
		if(this.nodes){
			for(const node of this.nodes) node.display();
		} else {
			Gfx.fillColor("blue");
			for(const el of this.elements){
				Gfx.ellipse(...el.pos.pixel.map(a => a * QuadTree.displayScale), 2.5, 2.5);
			}
		}
	}
	static setShowcaseMode(){
		let tree = new QuadTree([0, 0, 300, 180]);
		cancelAnimationFrame(Game.animationFrame);
		Gfx.layer("overlay");
		Gfx.fillColor("black");
		Gfx.rect(0, 0, innerWidth, innerHeight);
		tree.display();
		state[Game.state].onmousedown = () => {
			tree.insert({
				pos: Pos.fromPixelCoords(...Input.mouse.map(a => a / QuadTree.displayScale))
			});
			tree.display();
		}
	}
}

/** Quad tree infinite */
class QuadTreeI<T extends {pos: Pos}> extends QuadTree<T> {
	static regionSize = [7680, 7680] as const; //16x16 chunks
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
	insert(element:T){
		if(super.insert(element)) return true;
		//no existing nodes can contain the element, so make a new one
		const node = new QuadTree<T>(
			QuadTreeI.getRegion(element.pos), 1
		);
		this.nodes.push(node);
		return node.insert(element);
	}
}
