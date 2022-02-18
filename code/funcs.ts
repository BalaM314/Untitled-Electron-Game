



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


//general functions
function sq(x:number):number{
	return x * x;
}

function millis():number{
	return (new Date()).valueOf() - Game.startTime.valueOf();
}

function gcd(x:number, y:number):any{
	if((typeof x !== 'number') || (typeof y !== 'number')){
		return false;
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
function random(min:number|any[],max:number):number{
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
		return min[Math.floor(random(0, min.length + 1))];
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

function download(filename, text){
  //Self explanatory.
  let temp2 = document.createElement('a');
  temp2.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
  temp2.setAttribute('download', filename);
  temp2.style.display = 'none';
  document.body.appendChild(temp2);
  temp2.click();
  document.body.removeChild(temp2);
}

//Yes I know this is a class. There's nothing you can do about it.
class Button {
	x: number;
	y: number;
	width: number;
	height: number;
	label: string;
	color: string;
	font: string;
	onClick: (event:MouseEvent) => {}
  constructor(config){
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
		
		this.color = config.color || "#0000FF";
		this.font = config.font || "20px sans-serif";
		this.onClick = config.onClick || (()=>{});
  };
  display(_ctx:CanvasRenderingContext2D){
		_ctx.fillStyle = this.color;
		_ctx.strokeStyle = "#000000";
		_ctx.lineWidth = 2;
		_ctx.globalAlpha = 1.0;
		_ctx.fillRect(this.x, this.y, this.width, this.height);
		_ctx.strokeRect(this.x, this.y, this.width, this.height);
		if(this.isMouseInside()){
			_ctx.fillStyle = "#FFFFFF";
			if(mouse.held){
				_ctx.globalAlpha = 0.4;
			} else {
				_ctx.globalAlpha = 0.2;
			}
			_ctx.lineWidth = 0;
			_ctx.fillRect(this.x, this.y, this.width, this.height);
		}
		_ctx.lineWidth = 1;
		_ctx.globalAlpha = 1.0;
		ctx.font = this.font;
		ctx.textAlign = "center";
		let tempBaseline = ctx.textBaseline;
		ctx.textBaseline = "middle";
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText(this.label,this.x + this.width/2,this.y + this.height/2);
		ctx.textBaseline = tempBaseline;
  };
  isMouseInside(){
		return mouse.x > this.x &&
			mouse.x < this.x + this.width &&
			mouse.y > this.y &&
			mouse.y < this.y + this.height;
  };
  handleMouseClick(e:MouseEvent){
		if(this.isMouseInside()) {
			this.onClick(e);
		}
  };
}


/**
 * Drawing Functions
 * 
 */

enum rectMode {
	CENTER,
	CORNER
}

function rect(x:number, y:number, w:number, h:number, mode?:rectMode, _ctx?:CanvasRenderingContext2D){
	_ctx ??= ctx;
	if(mode == rectMode.CENTER){
		_ctx.fillRect(x - w/2, y - w/2, w, h);
	} else {
		_ctx.fillRect(x, y, w, h);
	}
}

function ellipse(x, y, w, h){
	ctx.beginPath();
	ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
	ctx.fill();
}

function* pseudoRandom(seed){
	let value = seed + 11111111111111;
	while(true){
		value = value * 16807 % 16777216;
		yield value / 16777216;
	}
}



/**
 * Game-related functions
 */

 function trigger(type:triggerType, buildingID?:RawBuildingID, itemID?:ItemID){
	//Used to handle tutorial, and maybe achievements.
	switch(type){
		case triggerType.placeBuilding:
			switch(buildingID){
				case "0x04":
					if(Game.tutorial.furnace.placed && settings.tutorial){
						_alert("The Furnace converts raw ores into their smelted forms. Simply point a conveyor belt carrying ores at it and provide another belt for it to output onto.");
						Game.tutorial.furnace.placed = false;
					}
				break;
				case "0x03":
					if(Game.tutorial.trashcan.placed && settings.tutorial){
						_alert("The Trash Can is pretty simple: it deletes all items it receives.");
						Game.tutorial.trashcan.placed = false;
					}
				break;
				case "0x02":
					if(Game.tutorial.miner.placed && settings.tutorial){
						_alert("The Miner mines ore nodes, producing one ore per second. \nIt auto-outputs to adjacent conveyor belts.\nAlso, ore nodes are infinite.");
						Game.tutorial.miner.placed = false;
					}
				break;
				case "0x01":
					if(Game.tutorial.conveyor.placed && settings.tutorial){
						_alert("Conveyors are the way to move items around. \nYou can use the arrow keys to change the direction of placed belts. \nTry making a belt chain, then putting a debug item on it with Ctrl+click.\nYou can drag-click to build multiple of the same building.");
						Game.tutorial.conveyor.placed = false;
					}
				break;
			}
			break;


		case triggerType.placeBuildingFail:
			switch(buildingID){
				case "0x04":
					if(Game.tutorial.furnace.placefail && settings.tutorial){
						_alert("The Furnace generates a lot of heat and is pretty heavy, so you can only place it on stone.");
						Game.tutorial.furnace.placefail = false;
					}
				break;
				case "0x03":

				break;
				case "0x02":
					if(Game.tutorial.miner.placefail && settings.tutorial){
						_alert("The Miner can only be placed on a resource node(the colored circles).");
						Game.tutorial.miner.placefail = false;
					}
				break;
				case "0x01":
					if(Game.tutorial.conveyor.placefail && settings.tutorial){
						_alert("Conveyors don't float!\nYes, I know, then water chunks are useless... I'll add pontoons in a future update.");
						Game.tutorial.conveyor.placefail = false;
					}
				break;
			}
			break;


		case triggerType.spawnItem:
			switch(itemID){
				case ItemID.base_coal:
					if(Game.tutorial.item.coal){
						_alert("Congratulations! You just automated coal!");
						//_alert(["Try doing the same thing for iron: Iron nodes are whiteish and are a bit further from the center of the map.\nUse WASD to scroll.", 3000]);
						Game.tutorial.item.coal = false;
					}
					break;
				case ItemID.base_ironIngot:
					if(Game.tutorial.item.iron){
						_alert("Nice job!");
						//_alert(["The next automateable resource is steel.\nYou'll need to use the alloy smelter(slot 7), which needs two inputs(coal and iron).", 3000]);
						Game.tutorial.item.iron = false;
					}
					break;
			}
			break;


		case triggerType.buildingRun:
			switch(buildingID){
				case "0x02":
					if(Game.tutorial.miner.coaloutput && settings.tutorial && itemID == ItemID.base_coalOre){
						_alert("Nice!\nThis is just coal ore though, not coal. Try placing a furnace(4 key).\nOh also, remember you can scroll to zoom in on that beautiful coal ore texture.");
						Game.tutorial.miner.coaloutput = false;
					}
					break;
				case "0x07":

					break;
			}
			break;
	}

}

function _alert(x:string){
	alerts.list.push(x);
}
function loadTexturesIntoMemory():boolean {
	for(let imageElement of document.getElementById("item").children as any as HTMLImageElement[]){//typescript is dum
		if(!imageElement.complete){
			return false;
		}
		registry.textures.item[imageElement.src.match(/(?<=assets\/textures\/item\/).*(?=\.png)/)[0]] = imageElement;
	}
	for(let imageElement of document.getElementById("building").children as any as HTMLImageElement[]){//typescript is dum
		if(!imageElement.complete){
			return false;
		}
		registry.textures.building[imageElement.src.match(/(?<=assets\/textures\/building\/).*(?=\.png)/)[0]] = imageElement;
	}
	for(let imageElement of document.getElementById("tile").children as any as HTMLImageElement[]){//typescript is dum
		if(!imageElement.complete){
			return false;
		}
		registry.textures.tile[imageElement.src.match(/(?<=assets\/textures\/tile\/).*(?=\.png)/)[0]] = imageElement;
	}
	for(let imageElement of document.getElementById("misc").children as any as HTMLImageElement[]){//typescript is dum
		if(!imageElement.complete){
			return false;
		}
		registry.textures.misc[imageElement.src.match(/(?<=assets\/textures\/misc\/).*(?=\.png)/)[0]] = imageElement;
	}
}
function loadTexturesIntoPage(){
	for(let buildingID of registry.buildingIDs){
		let img = document.createElement("img");
		img.setAttribute("src", `assets/textures/building/${buildingID}.png`);
		img.addEventListener("load", () => {
			Game.loadedTextures ++;
		});
		img.addEventListener("error", (err) => {
			alert("Failed to load texture " + (err.target as HTMLImageElement).src.split("assets/textures/")[1]);
			throw err;
		});
		document.getElementById("building").appendChild(img);
	}
	for(let itemID of Object.values(registry.itemIDs)){
		let img = document.createElement("img");
		img.setAttribute("src", `assets/textures/item/${itemID}.png`);
		img.addEventListener("load", () => {
			Game.loadedTextures ++;
		});
		img.addEventListener("error", (err) => {
			alert("Failed to load texture " + (err.target as HTMLImageElement).src.split("assets/textures/")[1]);
			throw err;
		});
		document.getElementById("item").appendChild(img);
	}
	for(let tileID of registry.tileIDs){
		let img = document.createElement("img");
		img.setAttribute("src", `assets/textures/tile/${tileID}.png`);
		img.addEventListener("load", () => {
			Game.loadedTextures ++;
		});
		img.addEventListener("error", (err) => {
			alert("Failed to load texture " + (err.target as HTMLImageElement).src.split("assets/textures/")[1]);
			throw err;
		});
		document.getElementById("tile").appendChild(img);
	}
	for(let textureID of registry.miscTextures){
		let img = document.createElement("img");
		img.setAttribute("src", `assets/textures/misc/${textureID}.png`);
		img.addEventListener("load", () => {
			Game.loadedTextures ++;
		});
		img.addEventListener("error", (err) => {
			alert("Failed to load texture " + (err.target as HTMLImageElement).src.split("assets/textures/")[1]);
			throw err;
		});
		document.getElementById("misc").appendChild(img);
	}
}

function getTotalTextures(){
	return registry.buildingIDs.length + Object.values(registry.itemIDs).length + registry.tileIDs.length + registry.miscTextures.length;
}

function hex(num:number, length:number){
	return `0x${(Array(length).fill("0").join("") + num.toString(16)).toUpperCase().slice(-length)}`;
	//it just works
}

function zoom(scaleFactor){
	scaleFactor = constrain(scaleFactor, 0.9, 1.1);
	if(consts.DISPLAY_SCALE * scaleFactor < 1){
		scaleFactor = 1 / consts.DISPLAY_SCALE;
	} else if(consts.DISPLAY_SCALE * scaleFactor > 5){
		scaleFactor = 5 / consts.DISPLAY_SCALE;
	}
	if((consts.DISPLAY_SCALE <= 1 && scaleFactor <= 1)||(consts.DISPLAY_SCALE >= 5 && scaleFactor >= 1)){
		return;
	}
	Game.forceRedraw = true;
	consts.DISPLAY_SCALE *= scaleFactor;
	Game.scroll.x -= (innerWidth * 0.5 * (scaleFactor - 1))/consts.DISPLAY_SCALE;
	Game.scroll.y -= (innerHeight * 0.5 * (scaleFactor - 1))/consts.DISPLAY_SCALE;
}

function tileOffsetInChunk(tileCoord:number):number {
	tileCoord = Math.floor(tileCoord) % consts.CHUNK_SIZE;
	return tileCoord + (tileCoord < 0 ? consts.CHUNK_SIZE : 0);
}

function pixelOffsetInTile(pixelCoord:number):number {
	pixelCoord = Math.floor(pixelCoord) % consts.TILE_SIZE;
	return pixelCoord + (pixelCoord < 0 ? consts.TILE_SIZE : 0);
}
function tileAtPixel(pixelCoord:number):number {
	return Math.floor(pixelCoord / consts.TILE_SIZE);
}

function getRawBuildingID(buildingID: BuildingID):RawBuildingID {
	return hex(+buildingID, 2) as RawBuildingID;
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
			.filter(key => !keysHeld.includes(key))
			.length == 0;
		let disallowedModifiersNotHeld = this.modifiers
			.filter(key => key.startsWith("!"))
			.map(key => key.split("!")[1])
			.filter(key => keysHeld.includes(key))
			.length == 0;
		//Array.filter and Array.map ftw
		//these functions have saved me so many for loops
		return keysHeld.includes(this.mainKey) && modifiersHeld && disallowedModifiersNotHeld;
	}
	check(e:KeyboardEvent){
		let modifiersHeld = this.modifiers
			.filter(key => !key.startsWith("!"))
			.filter(key => !keysHeld.includes(key))
			.length == 0;
		let disallowedModifiersNotHeld = this.modifiers
			.filter(key => key.startsWith("!"))
			.map(key => key.split("!")[1])
			.filter(key => keysHeld.includes(key))
			.length == 0;
		if(this.mainKey == e.key.toLowerCase() && modifiersHeld && disallowedModifiersNotHeld){
			e.preventDefault();
			this.action();
		}
	}
}
