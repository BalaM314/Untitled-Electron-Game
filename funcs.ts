


/**
 * Library stuff
 */

declare var noise: {
	seed: (seed:number) => void;
	perlin2: (x:number, y:number) => number;
	simplex2: (x:number, y:number) => number;
	perlin3: (x:number, y:number, z:number) => number;
	simplex3: (x:number, y:number, z:number) => number;
};
noise.seed(1);


/**
 * Utility Functions
 * 
 * 
 */



let mouseX = 0;
let mouseY = 0;
let mouseIsPressed = false;
let latestMouseEvent = null;
window.onmousemove = (e:MouseEvent) => {
	mouseX = e.x;
	mouseY = e.y;
	latestMouseEvent = e;
}
let keysPressed:string[] = [];
window.onkeydown = (e:KeyboardEvent) => {
	if(parseInt(e.key)){
		for(var x of document.getElementById("toolbar").children){
			x.classList.remove("selected");
		}
		(document.getElementById("toolbar").children?.[parseInt(e.key) - 1] as HTMLElement)?.classList.add("selected");
	}
	if(parseInt(e.key[1])){
		for(var x of document.getElementById("toolbar").children){
			x.classList.remove("selected");
		}
		(document.getElementById("toolbar").children?.[parseInt(e.key[1]) + 8] as HTMLElement)?.classList.add("selected");
	}
	if(keysPressed.indexOf(e.key.toLowerCase()) == -1){
		keysPressed.push(e.key.toLowerCase());
	}
	if(e.ctrlKey){
		switch(e.key){
			case "s":
				exportData(); e.preventDefault(); break;
			case "o":
				uploadButton.click(); e.preventDefault(); break;
		}
	} else {
		switch(e.key){
			case "ArrowRight":
				placedBuilding.direction = 0x000; break;
			case "ArrowDown":
				placedBuilding.direction = 0x100; break;
			case "ArrowLeft":
				placedBuilding.direction = 0x200; break;
			case "ArrowUp":
				placedBuilding.direction = 0x300; break;
			case ",":
				placedBuilding.modifier = 0x000; break;
			case ".":
				placedBuilding.modifier = 0x400; break;
			case "/":
				placedBuilding.modifier = 0x800; e.preventDefault(); break;
			case "1":
				placedBuilding.type = 0x0001; break;
			case "2":
				placedBuilding.type = 0x0002; break;
			case "3":
				placedBuilding.type = 0x0003; break;
			case "4":
				placedBuilding.type = 0x0004; break;
			case "5":
				placedBuilding.type = 0x0005; break;
			case "6":
				placedBuilding.type = 0x0006; break;
			case "7":
				placedBuilding.type = 0x0007; break;
			case "8":
				placedBuilding.type = 0x0009; break;
			case "9":
				placedBuilding.type = 0x000A; break;
			case "F1":
				placedBuilding.type = 0x000B; e.preventDefault(); break;
			case "F2":
				placedBuilding.type = 0x000C; e.preventDefault(); break;
			case "0":
				placedBuilding.type = 0xFF; break;
		}
	}
}
window.onkeyup = (e:KeyboardEvent) => {
	if(keysPressed.indexOf(e.key.toLowerCase()) != -1){
		keysPressed.splice(keysPressed.indexOf(e.key.toLowerCase()), 1);
	}
}

window.onmousedown = (e:MouseEvent) => {mouseIsPressed = true; latestMouseEvent = e; canOverwriteBuilding = true;}
window.onmouseup = (e:MouseEvent) => {mouseIsPressed = false; latestMouseEvent = e; canOverwriteBuilding = true;}



//general functions
function sq(x:number):number{
	return x * x;
}
const programStart = new Date();
function millis():number{
	return (new Date()).valueOf() - programStart.valueOf();
}

function gcd(x:number, y:number):any{
	if((typeof x !== 'number') || (typeof y !== 'number')){
		return false;
	}
	x = Math.abs(x);
	y = Math.abs(y);
	while(y) {
		var t = y;
		y = x % y;
		x = t;
	}
	return x;
}
function random(min:number|any[],max:number):number{
	if(typeof min == "number"){
		if(arguments.length > 2){
			throw new Error("Too many arguments for random");
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
		throw new Error(x);
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

let uploadButton = document.getElementById('uploadButton')! as HTMLInputElement;
uploadButton.onchange = function(event:any){
  let file = event.target.files[0];
  let reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(readerEvent){
    let content = readerEvent.target.result.toString();
    importData(content);
  }
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
	if(!_ctx) _ctx = ctx;
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
let alerts = [];
function _alert(x:string | [string,number]){
	alerts.push(x);
}
function loadTextures(){
	for(var element of document.getElementById("textures").children){
		textures.set(element.id, element);
	}
};


function zoom(scaleFactor){
	scaleFactor = constrain(scaleFactor, 0.9, 1.1);
	if(Globals.DISPLAY_SCALE * scaleFactor < 1){
		scaleFactor = 1 / Globals.DISPLAY_SCALE;
	} else if(Globals.DISPLAY_SCALE * scaleFactor > 5){
		scaleFactor = 5 / Globals.DISPLAY_SCALE;
	}
	if((Globals.DISPLAY_SCALE <= 1 && scaleFactor <= 1)||(Globals.DISPLAY_SCALE >= 5 && scaleFactor >= 1)){
		return;
	}
	Game.forceRedraw = true;
	Globals.DISPLAY_SCALE *= scaleFactor;
	Game.scroll.x -= (innerWidth * 0.5 * (scaleFactor - 1))/Globals.DISPLAY_SCALE;
	Game.scroll.y -= (innerHeight * 0.5 * (scaleFactor - 1))/Globals.DISPLAY_SCALE;
}

window.onwheel = (e:WheelEvent) => {
	zoom(Math.pow(1.001, -e.deltaY));
}

function tileToChunk(tileCoord:number):number {
	tileCoord = Math.floor(tileCoord) % Globals.CHUNK_SIZE;
	return tileCoord + (tileCoord < 0 ? Globals.CHUNK_SIZE : 0);
}

function pixelToTile(pixelCoord:number):number {
	pixelCoord = Math.floor(pixelCoord) % Globals.TILE_SIZE;
	return pixelCoord + (pixelCoord < 0 ? Globals.TILE_SIZE : 0);
}
function tileAtPixel(pixelCoord:number):number {
	return Math.floor(pixelCoord / Globals.TILE_SIZE);
}

var interval1;

function onConsoleOpen(){
	console.log("%c Hey there! It looks like you're checking out the console.\nIf you want to view the source code, *please do it at* https://github.com/BalaM314/Untitled-Electron-Game \n Make sure to view the .ts files as the .js files are compiled and thus look weird.", "color: blue; font-size: 30px;")
	cancelAnimationFrame(interval1);
}

function isConsoleOpen(){
	interval1 = requestAnimationFrame(_ => {
		let x = /lol/;
		x.toString = function(){
			onConsoleOpen();
			return "[object TestingConsoleOpen]";
		};
		//yes really. This is **probably** a bug.
		console.log({e: x});
	});
}

isConsoleOpen();
