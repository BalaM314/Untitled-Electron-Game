'use strict';

// TODOS
// Improve performance by not redrawing everything everytime, but this will need multiple canvases
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 


let settings = {
	graphics_mode: 1,
	debug: true
};
let Game = {
	scroll: {
		x: 300,
		y: 300
	},
	pscroll: {
		x: 300,
		y: 300
	},
	persistent: {
		tutorialenabled: true
	},
	tutorial: {
		conveyor: {
			placedcorrectly: true,
			beltchain: true,
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
		},
		item: {
			coal: true,
			iron: true
		}
	}
};
var GAME_STATE = "title";

const ctx = (document.getElementById("layer1_canvas") as HTMLCanvasElement).getContext("2d");
const ctx2 = (document.getElementById("layer2_canvas") as HTMLCanvasElement).getContext("2d");
const overlayCtx = (document.getElementById("secondary_canvas") as HTMLCanvasElement).getContext("2d");




let level1 = new Level(3141);
level1.generateNecessaryChunks();

let fps = [0, 0, 0, 0, 0, 0];

function runLevel(level:Level){
	let startFrameTime = new Date();
	let currentFrame = {
		tooltip: true,
		debug: settings.debug,
		cps: 0,
		tps: 0,
		ee: 0,
		chunktime: []
	};
	level.generateNecessaryChunks();
	level.update(currentFrame);
	if(currentFrame.ee > 1) alert(currentFrame.ee);
	//display
	ctx.clearRect(0, 0, innerWidth, innerHeight);
	overlayCtx.clearRect(0, 0, innerWidth, innerHeight);
	level.display(currentFrame);

	level.displayGhostBuilding((mouseX - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, (mouseY - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, placedBuildingID);
	if(keysPressed.indexOf("Shift") != -1){
		level.displayTooltip(mouseX, mouseY, currentFrame);
	}
	
	//display overlays
	overlayCtx.font = "30px sans-serif";
	overlayCtx.fillStyle = "#000000";
	overlayCtx.fillText((Math.round(- (Game.scroll.x * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString() + ", " + Math.round(- (Game.scroll.y * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString()), 10, 100);
	let frameMS = (new Date()).getTime() - startFrameTime.getTime();
	fps.splice(0, 1);
	fps.push(frameMS);
	let avgFPS = Math.round(constrain(5000/(fps[0] + fps[1] + fps[2] + fps[3] + fps[4]), 0, 60));
	overlayCtx.fillText(avgFPS + " fps", 10, 50);
	if(settings.debug){
		overlayCtx.fillText("C: " + currentFrame.cps, 10, 150);
		overlayCtx.fillText("T: " + currentFrame.ee, 10, 200);
	}
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
		(document.getElementById("layer1_canvas") as HTMLCanvasElement).width = innerWidth;
		(document.getElementById("layer1_canvas") as HTMLCanvasElement).height = innerHeight;
		(document.getElementById("layer2_canvas") as HTMLCanvasElement).width = innerWidth;
		(document.getElementById("layer2_canvas") as HTMLCanvasElement).height = innerHeight;
		(document.getElementById("secondary_canvas") as HTMLCanvasElement).width = innerWidth;
		(document.getElementById("secondary_canvas") as HTMLCanvasElement).height = innerHeight;
		
		switch(GAME_STATE){
			case "title":
				runTitle();
				break;
			case "game":
				runLevel(level1);
				break;
			case "settings":
				runSettings();
				break;
			default:
				throw new Error(`Invalid game state "${GAME_STATE}"`);
		}
		if(mouseIsPressed){
			handleMouseDown(latestMouseEvent);
		}
		if(keysPressed.length > 0){
			handleKeysPressed();
		}
		if(alerts.length){
			mouseIsPressed = false;
			for(var __alert of alerts){
				if(alert instanceof Array){
					setTimeout(() => {
						_alert(alert[0]);
					}, alert[1]);
				} else {
					alert(__alert);//todo replace with a less annoying custom alert box
				}
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
	ctx.fillStyle = "#0033CC";
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
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 2;
	ctx.strokeRect(innerWidth/4, innerHeight * 0.5, innerWidth/2, innerHeight * 0.2);
	ctx.strokeRect(innerWidth/4, innerHeight * 0.75, innerWidth/2, innerHeight * 0.2);
	ctx.fillStyle = "#FFFFFF";
	ctx.font = "40px sans-serif";
	ctx.fillText("Play", innerWidth/2, innerHeight * 0.6);
	ctx.fillText("Settings", innerWidth/2, innerHeight * 0.85);
}

function runSettings(){
	ctx.fillStyle = "#0033CC";
	ctx.fillRect(0, 0, innerWidth, innerHeight);
	ctx.font = "70px sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "#000000";
	ctx.fillText("Settings", innerWidth / 2, innerHeight * 0.2);
	ctx.strokeStyle = "#000000";
	ctx.strokeRect(innerWidth * 0.9, innerHeight * 0.01, innerWidth * 0.09, innerHeight * 0.09);
	ctx.fillStyle = "#FF0000";
	ctx.font = "50px sans-serif";
	ctx.fillText("❌",innerWidth * 0.945, innerHeight * 0.055);
	ctx.strokeRect(innerWidth * 0.25, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2);
	ctx.strokeRect(innerWidth * 0.51, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2);
	ctx.fillStyle = "#0000FF";
	rect(innerWidth * 0.25, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2, rectMode.CORNER);
	rect(innerWidth * 0.51, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2, rectMode.CORNER);
	ctx.fillStyle = "#FFFFFF";
	ctx.fillText("Tutorial: " + Game.persistent.tutorialenabled, innerWidth * 0.375, innerHeight * 0.6);
	ctx.fillText("Debug: " + settings.debug, innerWidth * 0.625, innerHeight * 0.6);
};

function load(){
	GAME_STATE = "game";
	//possibly display an eror here if the textures haven't loaded?
	document.getElementById("toolbar").classList.remove("hidden");
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
				level1.addItem((e.x - (Game.scroll.x * consts.DISPLAY_SCALE))/consts.DISPLAY_SCALE, (e.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE, ItemID.base_null);
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
					if(Game.persistent.tutorialenabled){
						setTimeout(() => {
						alert(`
Welcome to Untitled Electron Game!
This is a game about... well I don't really know, but it has items, conveyor belts, and machines. Guess you could call it a factory game?

For now there's no real goal, but I suggest you automate iron and coal production.
>To get started, place a conveyor belt.<

Controls:
Click to place a building.
Use 1-4 to choose the type of building.
Use WASD to move around the map and mouse wheel to zoom.
						`);
					}, 500);
					}
				}
				if(e.y > innerHeight * 0.75 && e.y < innerHeight * 0.95){
					GAME_STATE = "settings";
				}
			}
			break;
		case "settings":
			if(e.y < innerHeight * 0.1 && e.y > innerHeight * 0.01 && e.x > innerWidth * 0.9 && e.x < innerWidth * 0.99){
				localStorage.setItem("persistentStorage", JSON.stringify(Game.persistent));
				GAME_STATE = "title";
			}
			if(e.y > innerHeight * 0.5 && e.y < innerHeight * 0.7 && e.x > innerWidth * 0.25 && e.x < innerWidth * 0.51){
				Game.persistent.tutorialenabled = !Game.persistent.tutorialenabled;
				mouseIsPressed = false;
			}
			if(e.y > innerHeight * 0.5 && e.y < innerHeight * 0.7 && e.x > innerWidth * 0.51 && e.x < innerWidth * 0.76){
				settings.debug = !settings.debug;
				mouseIsPressed = false;
			}
			break;
	}
}



try {
	assert(localStorage.getItem("persistentStorage"));
	Game.persistent = JSON.parse(localStorage.getItem("persistentStorage"));
} catch(err){
	console.warn("Invalid persistent settings!\nIf this is your first time visiting this site, nothing to worry about.");
	localStorage.setItem("persistentStorage", "{\"tutorialenabled\": true}");
}

main_loop();