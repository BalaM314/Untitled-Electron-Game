/* Copyright © BalaM314, 2024. MIT License. */



Object.defineProperty(Array.prototype, "sort2", {
	enumerable: false,
	value: function(this:unknown[], func){
		this.sort((a, b) => func(a) - func(b));
	} satisfies typeof Array.prototype.sort2,
});
if(!Array.prototype.at){
	Array.prototype.at = function(index){
		return this[index < 0 ? index + this.length : index];
	}
	Object.defineProperty(Array.prototype, "at", {
		enumerable: false
	});
}

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

function delay(time:number):Promise<void> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
}

function until(predicate:() => boolean, checkInterval = 100):Promise<void> {
	return new Promise((resolve, reject) => {
		const id = setInterval(() => {
			if(predicate()){
				clearInterval(id);
				resolve();
			}
		}, checkInterval);
	})
}

function round(amount:number, places = 0):number {
	const tenEplaces = 10 ** places;
	return Math.round(amount * tenEplaces) / tenEplaces;
}
/** Displays a number as a percentage. */
function percentage(amount:number, places = 0):string {
	return `${round(amount * 100, places)}%`;
}

/** Inclusive. */
function range(start:number, end:number, step = 1){
	return Array.from(
		{length: Math.floor((end - start + step) / step)},
		(_, i) => start + i * step
	);
}

function constrain(x:number, min:number, max:number){
	if(x > max) return max;
	if(x < min) return min;
	return x;
}

function linear_map(value:number, from1:number, from2:number, to1:number, to2:number){
	return ((value - from1) / (from2 - from1)) * (to2 - to1) + to1;
}


function assert(x:unknown, message?:string){
	if(!x) crash(message ? `Assertion failed: ${message}` : message);
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
	declare label: string | Texture;
	//is this really the best way to solve this?
	color: string;
	font: string;
	onClick: (event:MouseEvent) => void
	constructor(config:{
		x: number | (() => number);
		y: number | (() => number);
		width: number | (() => number);
		height: number | (() => number);
		label: string | (() => string | Texture) | Texture;
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
		if(typeof this.label == "string"){
			_ctx.fillText(this.label,this.x + this.width/2,this.y + this.height/2);
		} else {
			_ctx.drawImage(this.label.image, this.x, this.y, this.width, this.height);
		}
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
	mean(windowSize?:number):number | null;
	mean<T>(windowSize:number, notEnoughDataValue:T):number | T;
	mean<T>(windowSize = this.maxWindowSize, notEnoughDataValue?:T):number | T {
		if(this.queuei >= windowSize) return this.rawMean(windowSize);
		else return (notEnoughDataValue ?? null) as any; //overload 1
	}
	rawMean(windowSize:number = this.maxWindowSize):number {
		if(windowSize > this.maxWindowSize)
			crash(`Cannot get average over the last ${windowSize} values becaue only ${this.maxWindowSize} values are stored`);
		let total = 0;
		let wrappedQueueI = this.queuei % this.maxWindowSize;
		for(let i = wrappedQueueI - windowSize; i < wrappedQueueI; i ++){
			if(i >= 0) total += this.data[i];
			else total += this.data[this.maxWindowSize + i];
		}
		return total / windowSize;
	}
	standardDeviation(windowSize?:number):number;
	standardDeviation<T>(windowSize:number, notEnoughDataValue:T):number | T;
	standardDeviation<T>(windowSize = this.maxWindowSize, notEnoughDataValue?:T):number | T {
		if(this.queuei < windowSize) return notEnoughDataValue ?? 0;
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
			if(this.constructor === __temp) crash(`Cannot construct abstract class ${input.name}`);
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
	else if(element instanceof HTMLElement) crash(`Element with id ${id} was fetched as type ${type.name}, but was of type ${element.constructor.name}`);
	else crash(`Element with id ${id} does not exist`);
}

function add(a:PosT, b:PosT):PosT {
	return [a[0] + b[0], a[1] + b[1]];
}
function mul(a:PosT, amount:number):PosT {
	return [a[0] * amount, a[1] * amount];
}

/**
 * Game-related functions
 */

function saveExists(){
	return localStorage.getItem("save1") != null;
}

function safeToSave():boolean {
	if(!saveExists()) return true;
	try {
		const data = JSON.parse(localStorage.getItem("save1")!) as SaveData;
		assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
		return data.UntitledElectronGame.metadata.uuid == level1.uuid || (data.UntitledElectronGame.metadata as any).id == level1.uuid;
	} catch(err){
		return true;
	}
}

function saveToLocalStorage(){
	localStorage.setItem("save1", JSON.stringify(exportData()));
	localStorage.setItem("untitled-electron-game:tech-tree", tech.write());
	localStorage.setItem("untitled-electron-game:objectives", objectives.write());
	Game.lastSaved = Date.now();
}

function trigger<T extends keyof Triggers>(key:T, data:Triggers[T]){
	switch(key){
		case "buildingFirstRun":
			break;
	}
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
		return Math.floor(pixelCoord / consts.chunkSizeInPixels);
	}
	static chunkToPixel(chunkCoord:number){
		return chunkCoord * consts.chunkSizeInPixels;
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
	constructor(
		public mainKey: string,
		public modifiers: string[] = [],
		public action: () => void = () => {}
	){
		this.modifiers = modifiers.map(key => key.toLowerCase());
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
	toString(){
		let key = this.mainKey;
		if(this.mainKey == " ") key = "Space";
		return this.modifiers.map(m => m + "+").join("") + key;
	}
}

/**Sets a variable to be of a particular type. */
function forceType<T>(input:unknown): asserts input is T {
	//
}

function crash(message = `Unreachable code was reached!`):never {
	throw new Error(message);
}

/** @returns formatted HTML */
function tooltip(title:string, properties:Partial<Record<string, string>> | string[]):string {
	const props:string[] = [];
	if(Array.isArray(properties)){
		props.push(...properties);
	} else {
		for(const [k, v] of Object.entries(properties)){
			if(v && v.trim().length > 0){
				if(k.startsWith("_")) props.push(v.trim());
				else props.push(`${k}: ${v.trim()}`);
			}
		}
	}
	return `${title}<div style="font-size: 70%;">${props.join("<br/>")}</div>`;
}

/**
 * Helper function to display a popup on first use of a feature. Do not overuse as getting spammed with alert() is annoying.
 * @param key Gets "untitled-electron-game-" prepended to it.
 * @param message Message displayed in the alert box.
 * @param callback Called if it is not the first use.
 */
function firstUsePopup(key:string, message:string, callback?:() => unknown, runCallbackAfterMessage = false){
	const lsKey = `untitled-electron-game-${key}`;
	if(localStorage.getItem(lsKey) != null){
		callback?.();
	} else {
		alert(message);
		localStorage.setItem(lsKey, "true");
		if(runCallbackAfterMessage) callback?.();
	}
}

/** Generates a tag template processor from a function that processes one value at a time. */
function f(stringChunks:readonly string[], ...varChunks:readonly string[]):string {
	return String.raw({raw: stringChunks}, ...varChunks).replaceAll(/[\s\S]\u0008/g, "");
}


function makeRebindButton(
	y: number,
	keybind: Keybind,
	buttonName: string,
	defaultKey: string
){
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
			}${keybind.mainKey}`,
		color: "#08F",
		font: "15px sans-serif",
		onClick: () => {
			keybind.mainKey =
				(prompt(`Rebind ${buttonName.toLowerCase()} to:`) ?? defaultKey).toLowerCase().substring(0,1);
		}
	})
}

function selectID(id:RawBuildingID){
	const block = Buildings.getOpt(id);
	if(block && !block.unlocked()) id = "base_null";
	placedBuilding.type = id;
	const image = document.querySelector(`img#toolbar_${id}`);
	for(const icon of toolbarEl.children){
		icon.classList.remove("selected")
	}
	if(image) image.classList.add("selected");
}

class QuadTree<T extends {pos: Pos}> {
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
		scenes[Game.sceneName].onmousedown = () => {
			tree.add({
				pos: Pos.fromPixelCoords(...Input.mouse.map(a => a / QuadTree.displayScale))
			});
			tree.display();
		}
	}
}

/** Quad tree infinite */
class QuadTreeI<T extends {pos: Pos}> extends QuadTree<T> {
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

class Random {
	constructor(public _rand:() => number){}
	/** Returns a random integer between 0 and `max` inclusive. */
	int(max:number):number;
	/** Returns a random integer between `min` and `max` inclusive. */
	int(min:number, max:number):number;
	int(arg0:number, arg1?:number){
		if(arg1)
			return Math.floor(this._rand() * (arg1 + 1 - arg0) + arg0);
		else
			return Math.floor(this._rand() * (arg0 + 1));
	}
	/** Returns a random number between 0 and `max` inclusive. */
	num(max:number):number;
	/** Returns a random number between `min` and `max` inclusive. */
	num(min:number, max:number):number;
	num(arg0:number, arg1?:number){
		if(arg1)
			return this._rand() * (arg1 - arg0) + arg0;
		else
			return this._rand() * arg0;
	}
	chance(probability:number){
		return this._rand() < probability;
	}
	vec(length:number):PosT {
		const theta = this.num(Mathf.TWO_PI);
		return [length * Math.cos(theta), length * Math.sin(theta)];
	}
	item<T>(input:T[]){
		return input[Math.floor(this._rand() * input.length)];
	}
}
class PseudoRandom extends Random {
	value:number;
	constructor(public seed:number){
		super(null!);
		this.value = seed + 11111111111111;
		this._rand = () => {
			this.value = this.value * 16807 % 16777216;
			return this.value / 16777216;
		};
	}
	reset(){
		this.value = this.seed + 11111111111111;
	}
}
const Rand = new Random(Math.random);

const Log = (() => {
	const styles = {
		UEG: `color: #0033CC; font-weight: bolder;`,
		caution: "color: yellow;",
		warn: "color: orange;",
		error: "color: red; font-weight: bolder;",
	};
	const prefixes = {
		info: [
			`%c[UEG]%c `,
			styles.UEG,
			"",
		],
		caution: [
			`%c[UEG]%c ⚠️ `,
			styles.UEG,
			styles.caution,
		],
		warn: [
			`%c[UEG]%c ⚠️ `,
			styles.UEG,
			styles.warn,
		],
		error: [
			`%c[UEG]%c 🛑 `,
			styles.UEG,
			styles.error,
		] as const,
	} as const;
	const ColorTag = Symbol("ColorTag");
	function isColorTagged(x:unknown):x is ColorTagged {
		return x instanceof Object && ColorTag in x;
	}
	function processObject(input:Record<string, string>):string {
		return Object.entries(input).map(([k, v]) => `${k}: ${v};`).join(" ");
	}
	function style(input:string | readonly string[] | Record<string, string>, ...rest:Record<string, string>[]):ColorTagged {
		return Object.assign(
			new String(
				Array.isArray(input) ? input[0] :
				typeof input === "object" ? processObject(Object.assign({}, input, ...rest)) :
				input
			),
			{ [ColorTag]: true as const }
		);
	};
	const raw = function(stringChunks, ...varChunks){
		console.log(
			String.raw({raw: stringChunks}, ...varChunks.map(c =>
				isColorTagged(c) ? `%c` : c
			)),
			...varChunks.filter(isColorTagged)
		);
	} satisfies TagFunction<string | number | ColorTagged, void>;
	type ColorTagged = String & {
		[ColorTag]: true;
	};

	return {
		prefixes,
		...Object.fromEntries(Object.entries(prefixes).map(
			([name, [prefix, ...colors]]) => [name, (message:string, ...data:unknown[]) => {
				console.log(prefix + message, ...colors, ...data);
			}] as const
		)),
		ColorTag,
		group(message:string, callback:() => unknown, collapsed = false){
			console[collapsed ? "groupCollapsed" : "group"](prefixes.info[0] + message, prefixes.info[1], prefixes.info[2]);
			callback();
			console.groupEnd();
		},
		style: Object.assign(style, {
			[ColorTag]: true,
			toString(){
				return "";
			}
		}, Object.fromEntries(Object.entries(styles).map(
			([key, val]) => [key, style(val)] as const
		))),
		raw,
		showBanner(){
			const text = "Untitled Electron Game";
			const fontStyle = {
				"font-family": "monospace",
				"text-shadow": "2px 2px 2px black;",
			};
			const fontStyleLarge = {
				"font-size": "200%",
			}
			const fontStyleSmall = {
				"font-size": "100%",
			}
			const fontStyleSpace = {
				"font-family": "monospace",
				"color": "#0000",
				"background-color": "#0033CC",
			};
			const gradient = {
				"background-image": `linear-gradient(to right, ${range(225, 225 + 360, 30).map(i => `hsl(${i}deg, 100%, 40%)`).join(", ")})`
			};
			const subtitleLine = {
				"background-color": "#0033CC",
			};
			const subtitleStyle = {
				"background-color": "#315541",
			};
			const subtitle = " by BalaM314 ";
			raw`\
${style(fontStyleSmall, fontStyleSpace)}${" ".repeat(3 * 2)}${text.repeat(2)}${" ".repeat(3 * 2)}
${style(fontStyleLarge, fontStyleSpace)}${style(fontStyleLarge, fontStyle, gradient)}   ${text} ${style(fontStyleLarge, fontStyleSpace)}  
${style(fontStyleSmall, fontStyle, subtitleLine)}${" ".repeat((6 + text.length) * 2 - subtitle.length - 2)}${style(fontStyleSmall, fontStyle, subtitleStyle)}${subtitle}${style(fontStyleSmall, fontStyle, subtitleLine)}${" ".repeat(2)}
${style(fontStyleSmall, fontStyleSpace)}${" ".repeat(3 * 2)}${text.repeat(2)}${" ".repeat(3 * 2)}`
		},
	};
})();
