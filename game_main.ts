

let settings = {
	graphics_mode: 1,
	debug: true
};
let Game = {
	scroll: {
		x: 300,
		y: 300
	},
	tutorial: {
		conveyor: {
			placedcorrectly: true,
			cantbeplacedonwater: true
		},
		miner: {
			cantbeplacedongrass: true,
			placedcorrectly: true,
			firstoutput: true
		},
		trashcan: {
			placedcorrectly: true
		},
		furnace: {
			cantbeplacedongrass: true,
			placedcorrectly: true
		}
	}
};
var GAME_STATE = "title";

const ctx = (document.getElementById("main_canvas") as HTMLCanvasElement).getContext("2d");
const overlayCtx = (document.getElementById("secondary_canvas") as HTMLCanvasElement).getContext("2d");




let level1 = new Level(3141);
level1.generateNecessaryChunks();


function runLevel(level){
	let startFrameTime = new Date();

	(document.getElementById("main_canvas") as HTMLCanvasElement).width = innerWidth;
	(document.getElementById("main_canvas") as HTMLCanvasElement).height = innerHeight;
	(document.getElementById("secondary_canvas") as HTMLCanvasElement).width = innerWidth;
	(document.getElementById("secondary_canvas") as HTMLCanvasElement).height = innerHeight;
	level.generateNecessaryChunks();
	level.update();

	//display
	ctx.clearRect(0, 0, innerWidth, innerHeight);
	overlayCtx.clearRect(0, 0, innerWidth, innerHeight);
	level.display(settings.debug);

	level.displayGhostBuilding((mouseX - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, (mouseY - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, placedBuildingID);
	
	let frameMS = (new Date()).getTime() - startFrameTime.getTime();

	//display overlays
	overlayCtx.font = "30px sans-serif";
	overlayCtx.fillText(Math.round(constrain(1000/frameMS, 0, 60)) + " fps", 10, 50);
	overlayCtx.fillText((Math.round(- (Game.scroll.x * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString() + ", " + Math.round(- (Game.scroll.y * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString()), 10, 100);
}

function handleKeysPressed(){
	if(keysPressed.indexOf("w") != -1){
		Game.scroll.y += 5;
	}
	if(keysPressed.indexOf("a") != -1){
		Game.scroll.x += 5;
	}
	if(keysPressed.indexOf("s") != -1){
		Game.scroll.y -= 5;
	}
	if(keysPressed.indexOf("d") != -1){
		Game.scroll.x -= 5;
	}
}

function main_loop(){
	
	try {
		(document.getElementById("main_canvas") as HTMLCanvasElement).width = innerWidth;
		(document.getElementById("main_canvas") as HTMLCanvasElement).height = innerHeight;
		(document.getElementById("secondary_canvas") as HTMLCanvasElement).width = innerWidth;
		(document.getElementById("secondary_canvas") as HTMLCanvasElement).height = innerHeight;
		
		switch(GAME_STATE){
			case "title":
				runTitle();
				break;
			case "game":
				runLevel(level1);
				break;
			default:
				throw new Error(GAME_STATE);
		}
		if(mouseIsPressed){
			handleMouseDown(latestMouseEvent);
		}
		if(keysPressed.length > 0){
			handleKeysPressed();
		}
		if(alerts.length){
			for(var _alert of alerts){
				alert(_alert);//todo replace with a less annoying custom alert box
			}
			alerts = [];
		}
		requestAnimationFrame(main_loop);
	} catch(err){
		//todo: display an error screen
		throw err;
	}


}

function runTitle(){
	ctx.fillStyle = "#0033FF";
	ctx.fillRect(0, 0, innerWidth, innerHeight);
	ctx.font = "70px sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "#000000";
	ctx.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
	ctx.font = "20px sans-serif";
	ctx.fillText("Title Screen Soon™", innerWidth / 2, innerHeight * 0.35);
	ctx.fillStyle = "#0000FF";
	rect(innerWidth/4, innerHeight * 0.5, innerWidth/2, innerHeight * 0.2, rectMode.CORNER);
	rect(innerWidth/4, innerHeight * 0.75, innerWidth/2, innerHeight * 0.2, rectMode.CORNER);
	ctx.fillStyle = "#FFFFFF";
	ctx.font = "40px sans-serif";
	ctx.fillText("Play", innerWidth/2, innerHeight * 0.6);
	ctx.fillText("Settings", innerWidth/2, innerHeight * 0.85);
}

function load(){
	GAME_STATE = "game";
	//possibly display an eror here?
	loadTextures();
	checkload();
}

let loadedtextures = 0;

function checkload(){
	if(loadedtextures == document.getElementById("textures").children.length){
		runLevel(level1);
	} else {
		setTimeout(checkload, 100);
	}
}

let placedBuildingID:BuildingID = 0x0001;
let handleMouseDown = (e:MouseEvent) => {
	switch(GAME_STATE){
		case "game":
			if(e.ctrlKey){
				level1.addItem((e.x / consts.DISPLAY_SCALE) - (Game.scroll.x * consts.DISPLAY_SCALE), (e.y / consts.DISPLAY_SCALE) - (Game.scroll.y * consts.DISPLAY_SCALE), ItemID.base_null);
				mouseIsPressed = false;
			} else {
				level1.buildBuilding(Math.floor((e.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), Math.floor((e.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), placedBuildingID);
			}
			break;
		case "title":
			if(e.x > innerWidth / 4 && e.x < innerWidth * 0.75){
				if(e.y > innerHeight / 2 && e.y < innerHeight * 0.7){
					mouseIsPressed = false;
					load();
					setTimeout(() => {
						alert(`
Welcome to Untitled Electron Game!
This is a game about... well I don't really know, but it has items, conveyor belts, and machines. Guess you could call it a factory game?
Click to place a building.
Use 1-4 to choose the type of building.
Use arrow keys to change the direction of placed belts
Ctrl+click to place an item.(For debug)
Use WASD to scroll.

For now there's no real goal, but I suggest you automate iron and coal production.
To get started, place a conveyor belt.
						`);
					}, 500);
				}
				if(e.y > innerHeight * 0.75 && e.y < innerHeight * 0.95){
					alert("Not yet implemented");
				}
			}
			break;
	}
}



window.onkeypress = (e:KeyboardEvent) => {
	switch(e.key){
		case "ArrowRight":
			placedBuildingID = 0x0001; break;
		case "ArrowDown":
			placedBuildingID = 0x0101; break;
		case "ArrowLeft":
			placedBuildingID = 0x0201; break;
		case "ArrowUp":
			placedBuildingID = 0x0301; break;
		case "2":
			placedBuildingID = 0x0002; break;
		case "3":
			placedBuildingID = 0x0003; break;
		case "4":
			placedBuildingID = 0x0004; break;
		case "0":
			placedBuildingID = 0xFFFF; break;		
	}
}

main_loop();