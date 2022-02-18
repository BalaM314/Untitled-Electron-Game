
function registerEventHandlers(){

	//Update mouse position
	window.onmousemove = (e:MouseEvent) => {
		mouse.x = e.x;
		mouse.y = e.y;
		mouse.latestEvent = e;
	}

	let clickcapture = document.getElementById("clickcapture");
	clickcapture.onmousedown = (e:MouseEvent) => {
		if(e.button) return e.preventDefault();//right click bad
		mouse.held = true;
		mouse.latestEvent = e;
		if(state[Game.state]){
			state[Game.state]?.onclick?.(e);
		}
	}
	clickcapture.onmouseup = (e:MouseEvent) => {
		mouse.held = false;
		mouse.latestEvent = e;
	}

	//For touch screens
	clickcapture.addEventListener("touchstart", (e:any) => {
		e.x = e.touches[0].clientX;
		e.y = e.touches[0].clientY;
		clickcapture.onmousedown(e);
	});
	clickcapture.addEventListener("touchend", (e:any) => {
		//When the screen is tapped, touchend is fired immediately after touchstart, leaving no time for buildings to be placed.
		//Delays by 500ms
		setTimeout(() => {
			mouse.held = false;
		}, 500);
	});
	clickcapture.addEventListener("touchmove", (e:any) => {
		e.x = e.touches[0].clientX;
		e.y = e.touches[0].clientY;
		window.onmousemove(e);
	});

	clickcapture.oncontextmenu = (e) => {
		//right click bad
		e.preventDefault();
	}

	//Do stuff when a key is pressed(not held).
	window.onkeydown = (e:KeyboardEvent) => {

		//If you pressed a number or function key, draw a box around the building you selected.
		if(!isNaN(parseInt(e.key))){
			for(let x of document.getElementById("toolbar").children){
				x.classList.remove("selected");
			}
			(document.getElementById("toolbar").children?.[parseInt(e.key) - 1] as HTMLElement)?.classList.add("selected");
		}
		if(!isNaN(parseInt(e.key[1]))){
			for(let x of document.getElementById("toolbar").children){
				x.classList.remove("selected");
			}
			(document.getElementById("toolbar").children?.[parseInt(e.key[1]) + 8] as HTMLElement)?.classList.add("selected");
		}

		//Easter egg
		if(e.key == "Enter" && lastKeysPressed.join(", ") == 
			["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"].join(", ")
			){
			window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
			for(var [key, value] of Object.entries(level1.resources)){
				level1.resources[key] = Infinity;
			}
		}

		//Push key to keysHeld
		if(keysHeld.indexOf(e.key.toLowerCase()) == -1){
			keysHeld.push(e.key.toLowerCase());
		}

		//Push key to lastKeysPressed
		lastKeysPressed.push(e.key);
		lastKeysPressed.splice(0,1);

		//Handle keybinds
		for(let section of Object.values(registry.keybinds)){
			for(let keybind of Object.values(section)){
				keybind.check(e);
			}
		}

		if(e.ctrlKey && e.key.match(/^[w]$/) || e.key.match(/^[ertuni1-9]$/i) || e.key.match(/^f[5]$/i)){
			return;
			//If you pressed one of these key combos, return
		}
		//Otherwise prevent default
		e.preventDefault();

	}
	window.onkeyup = (e:KeyboardEvent) => {
		//Remove key from list of held keys
		if(keysHeld.includes(e.key.toLowerCase())){
			keysHeld.splice(keysHeld.indexOf(e.key.toLowerCase()), 1);
		}
	}
	


	uploadButton.onchange = function(event:any){
		//Load a save file
		let file = event.target.files[0];
		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function(readerEvent){
			let content = readerEvent.target.result.toString();
			importData(content);
		}
	}

	window.onwheel = (e:WheelEvent) => {
		zoom(Math.pow(1.001, -e.deltaY));
	}

	//When the window loses focus, clear the list of held keys and set mousePressed to false.
	window.onblur = () => {
		keysHeld = [];
		mouse.held = false;
		//call pause here once I add it
	}

	window.onbeforeunload = (e:BeforeUnloadEvent) => {
		if(Game.state != "game"){
			return;
		}
		if(!localStorage.getItem("save1") || JSON.parse(localStorage.getItem("save1"))?.metadata?.uuid == level1?.uuid){
			localStorage.setItem("save1", JSON.stringify(exportData()));
		} else {
			e.preventDefault();
			e.returnValue = "";
			localStorage.setItem("save-recovered", JSON.stringify(exportData()));
			setTimeout(() => {
				if(confirm("Could not save automatically on page exit because your current world is unrelated to your saved world.\nWould you like to save anyway? This will overwrite your current save!")){
					localStorage.setItem('save1', JSON.stringify(exportData()));
					localStorage.removeItem("save-recovered");
				}
			}, 1);
		}
	}

}







let fps = [0, 0, 0, 0, 0, 0];
let state: {
	[P in typeof Game.state]: {
		buttons: Button[],
		update: Function,
		display: Function,
		onclick?: Function,
		onmouseheld?: Function,
		onkeyheld?: Function
	}
} = {
	loading: {
		buttons: [],
		update: function(){
			if(Game.loadedTextures == getTotalTextures()){
				Game.state = "title";
			} else if(Game.loadedTextures > getTotalTextures()){
				throw new ShouldNotBePossibleError("Somehow loaded more textures than exist.");
			}
		},
		display: function(currentFrame:CurrentFrame){
			ctx.clearRect(-1, -1, 10000, 10000);
			ctx.fillStyle = "#0033CC";
			ctx.fillRect(0, 0, innerWidth, innerHeight);
			ctx.font = "70px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000000";
			ctx.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
			ctx.fillStyle = "#000000";
			ctx.font = `40px sans-serif`;
			ctx.fillText(`Loading... ${Game.loadedTextures}/${getTotalTextures()}`, innerWidth / 2, innerHeight * 0.35);
		}
	},
	title: {
		buttons: [
			new Button({
				x: () => innerWidth/4,
				y: () => innerHeight/2,
				width: () => innerWidth/2,
				height: () => innerHeight/5,
				label: "Play",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {mouse.held = false;load();}
			}),
			new Button({
				x: () => innerWidth/4,
				y: () => innerHeight * 0.75,
				width: () => innerWidth/2,
				height: () => innerHeight/5,
				label: "Settings",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Game.state = "settings";}
			}),
		],
		update: function(){},
		display: function(currentFrame:CurrentFrame){
			ctx.clearRect(-1, -1, 10000, 10000);
			ctx.fillStyle = "#0033CC";
			ctx.fillRect(0, 0, innerWidth, innerHeight);
			ctx.font = "70px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000000";
			ctx.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
			ctx.fillStyle = "#cccc00";
			ctx.font = `${20 + 5*Math[Game.title.splashbehavior](millis() / 400)}px sans-serif`;
			ctx.fillText(Game.title.splashtext ?? "splash not found! this is actually an error pls report", innerWidth / 2, innerHeight * 0.35);
			state.title.buttons.forEach(button => button.display(ctx));
		},
		onclick(e:MouseEvent){
			state.title.buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	settings: {
		buttons: [
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.5,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Tutorial: " + settings.tutorial,
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {settings.tutorial = !settings.tutorial;}
			}),
			new Button({
				x: () => innerWidth * 0.51,
				y: () => innerHeight * 0.5,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Debug: " + settings.debug,
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {settings.debug = !settings.debug;}
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.66,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Always load save: " + settings.alwaysLoadSave,
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {settings.alwaysLoadSave = !settings.alwaysLoadSave;}
			}),
			new Button({
				x: () => innerWidth * 0.51,
				y: () => innerHeight * 0.66,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Autosave: " + settings.autoSave,
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {settings.autoSave = !settings.autoSave;}
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.82,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: "Controls",
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {Game.state = "settings.keybinds"}
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Game.state = "title"; localStorage.setItem("settings", JSON.stringify(settings));}
			}),
		],
		update: function(){},
		display: function(currentFrame:CurrentFrame){
			ctx.clearRect(-1, -1, 10000, 10000);
			ctx.fillStyle = "#0033CC";
			ctx.fillRect(0, 0, innerWidth, innerHeight);
			ctx.font = "70px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000000";
			ctx.fillText("Settings", innerWidth / 2, innerHeight * 0.2);
			state.settings.buttons.forEach(button => button.display(ctx));
		},
		onclick: function(e:MouseEvent){
			state.settings.buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	"settings.keybinds": {
		buttons: [
			new Button({
				x: () => innerWidth * 0.3,
				y: () => innerHeight * 0.3,
				width: () => innerWidth * 0.4,
				height: () => innerHeight * 0.05,
				label: () => `Move up: ${registry.keybinds.move.up.modifiers.filter(key => !key.startsWith("!")).join(" + ")}${registry.keybinds.move.up.mainKey}`,
				color: "#0000FF",
				font: "15px sans-serif",
				onClick: () => {registry.keybinds.move.up.mainKey = prompt("Rebind move up to:");}
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Game.state = "settings";}
			}),
		],
		update: function(){},
		display: function(currentFrame:CurrentFrame){
			ctx.clearRect(-1, -1, 10000, 10000);
			ctx.fillStyle = "#0033CC";
			ctx.fillRect(0, 0, innerWidth, innerHeight);
			ctx.font = "60px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000000";
			ctx.fillText("Keybinds", innerWidth / 2, innerHeight * 0.2);
			state["settings.keybinds"].buttons.forEach(button => button.display(ctx));
		},
		onclick: function(e:MouseEvent){
			state["settings.keybinds"].buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	game: {
		buttons: [],
		update: function(currentFrame:CurrentFrame, level:Level){
			level ??= level1;
			level.generateNecessaryChunks();
			if(registry.keybinds.move.scroll_faster.isHeld()){
				Game.scroll.speed = 20;
			} else {
				Game.scroll.speed = 5;
			}
			try {
				level.update(currentFrame);
			} catch(err){
				console.error(err);
				throw new Error(`Error updating world: ${err.message}`);
			}			
		},
		display: function(currentFrame:CurrentFrame, level:Level){
			level ??= level1;
			//display
			if(currentFrame.redraw){
				ctx.clearRect(0, 0, innerWidth, innerHeight);
			}
			ctx1.clearRect(0, 0, innerWidth, innerHeight);
			ctx2.clearRect(0, 0, innerWidth, innerHeight);
			ctx25.clearRect(0, 0, innerWidth, innerHeight);
			ctx3.clearRect(0, 0, innerWidth, innerHeight);
			ctx4.clearRect(0, 0, innerWidth, innerHeight);
		
			level.display(currentFrame);
		
			
			level.displayGhostBuilding((mouse.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, (mouse.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, placedBuilding.ID);
			if(registry.keybinds.display.show_tooltip.isHeld()){
				level.displayTooltip(mouse.x, mouse.y, currentFrame);
			}
			
			//display overlays
			ctx4.font = "30px sans-serif";
			ctx4.fillStyle = "#000000";
			ctx4.fillText((Math.round(- (Game.scroll.x * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString() + ", " + Math.round(- (Game.scroll.y * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString()), 10, 100);
			
			if(settings.debug){
				ctx4.fillText("C: " + currentFrame.cps, 10, 150);
				ctx4.fillText("I: " + currentFrame.ips, 10, 200);
			}
		
			for(let item of (<HTMLDivElement>document.getElementById("resources")!).children){
				(item as HTMLSpanElement).innerText = (level1.resources[item.id] ?? 0).toString();
			}
		},
		onclick: function(e:MouseEvent){
			if(e.ctrlKey){
				level1.buildingAtPixel(
					(e.x  / consts.DISPLAY_SCALE - Game.scroll.x),
					(e.y  / consts.DISPLAY_SCALE - Game.scroll.y)
				).acceptItem(new Item(
					(Math.floor((e.x  / consts.DISPLAY_SCALE - Game.scroll.x) / consts.TILE_SIZE) + 0.5) * consts.TILE_SIZE,
					(Math.floor((e.y  / consts.DISPLAY_SCALE - Game.scroll.y) / consts.TILE_SIZE) + 0.5) * consts.TILE_SIZE,
					ItemID.base_null,
					level1
				))
			}
		},
		onmouseheld: function(){
			let e = mouse.latestEvent;
			if(!(keysHeld.includes("control") || registry.keybinds.placement.break_building.isHeld()) && placedBuilding.ID != "0xFFFF"){
				level1.buildBuilding(Math.floor((e.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), Math.floor((e.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), placedBuilding.ID);
			}
		},
		onkeyheld: function(currentframe:CurrentFrame){
			if(registry.keybinds.move.up.isHeld()){
				Game.scroll.y += Game.scroll.speed;
				currentframe.redraw = true;
			}
			if(registry.keybinds.move.left.isHeld()){
				Game.scroll.x += Game.scroll.speed;
				currentframe.redraw = true;
			}
			if(registry.keybinds.move.down.isHeld()){
				Game.scroll.y -= Game.scroll.speed;
				currentframe.redraw = true;
			}
			if(registry.keybinds.move.right.isHeld()){
				Game.scroll.x -= Game.scroll.speed;
				currentframe.redraw = true;
			}
			if(registry.keybinds.placement.break_building.isHeld()){
				currentframe.redraw = true;
				level1.buildBuilding(Math.floor((mouse.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), Math.floor((mouse.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), "0xFFFF");
			}
		}
	}
};


//Unlike the onkeydown function, this one needs to run based on keys being held.

function fixSizes(){
	for(let x of ctxs){
		if(x.canvas.width != window.innerWidth){
			x.canvas.width = window.innerWidth;
			Game.forceRedraw = true;
		}
		if(x.canvas.height != window.innerHeight){
			x.canvas.height = window.innerHeight;
			Game.forceRedraw = true;
		}
	}
}

function handleAlerts(){
	if(alerts.list.length && alerts.active == false){
		mouse.held = false;
		alertmessage.innerText = alerts.list.shift();
		alertmessage.style.setProperty("--text-length", alertmessage.innerText.length.toString());
		alertbox.classList.add("active");
		alerts.active = true;
	}
}



let cancel = null;
function main_loop(){
	try {
		let startFrameTime = new Date();
		let currentFrame:CurrentFrame = {
			tooltip: true,
			debug: settings.debug,
			cps: 0,
			tps: 0,
			ips: 0,
			redraw: Game.forceRedraw
		};
		Game.forceRedraw = false;
		fixSizes();
		window.getSelection().empty();
		
		let currentState = state[Game.state];
		if(!currentState){
			throw new InvalidStateError(`Invalid game state "${Game.state}"`);
		}

		if(mouse.held){
			currentState.onmouseheld?.(currentFrame);
		}
		if(keysHeld.length != 0){
			currentState.onkeyheld?.(currentFrame);
		}

		currentState.update(currentFrame);
		currentState.display(currentFrame);
		
		if(Game.state == "game"){
			let frameMS = (new Date()).getTime() - startFrameTime.getTime();
			fps.splice(0, 1);
			fps.push(frameMS);
			let avgFPS = Math.round(constrain(5000/(fps[0] + fps[1] + fps[2] + fps[3] + fps[4]), 0, 60));
			ctx4.fillText(avgFPS + " fps", 10, 50);
		}

		handleAlerts();

	} catch(err){
		alert("An error has occurred! Oopsie.\nPlease create an issue on this project's GitHub so I can fix it.\nError message: " + err.message);
		if(err.message.startsWith("Error updating world:")){

		}
		ctxs.forEach((ctx) => {ctx.clearRect(0,0,innerWidth,innerHeight)});
		throw err;
	}
	cancel = requestAnimationFrame(main_loop);
}


function load(){
	loadTexturesIntoMemory();
	level1 = new Level(314);

	
	if(!localStorage.firstload){
		localStorage.firstload = true;
		_alert(`Welcome to Untitled Electron Game!
This is a game about building a factory. It's still in early alpha, so there's not much content.
There's no good in game tutorial, so to get started check the wiki page: https://github.com/BalaM314/Untitled-Electron-Game/wiki/Quickstart-Guide`);
	}

	if(localStorage.getItem("save1") && (settings.alwaysLoadSave || confirm("Would you like to load your save?"))){
		importData(localStorage.getItem("save1"));
	}

	Game.state = "game";
	Game.forceRedraw = true;
	document.getElementById("toolbar").classList.remove("hidden");
	document.getElementById("resources").classList.remove("hidden");

	if(settings.tutorial){
		setTimeout(() => {
			alert(`
Welcome to Untitled Electron Game!
This is a game about... well I don't really know, but it has items, conveyor belts, and machines. Guess you could call it a factory game?

For now there's no real goal, but I suggest you automate iron and coal production.
To get started, place a conveyor belt.

Basic controls:
Click to place a building.
Use the number keys to choose the type of building.
Press 0 to "place air"(delete buildings).
Use WASD to move around the map and mouse wheel to zoom.
Press Shift to move faster and for tooltips.`
			);
		}, 500);
	}
	if(settings.autoSave){
		if(!localStorage.getItem("save1") || JSON.parse(localStorage.getItem("save1"))?.metadata?.uuid == level1.uuid){
			setInterval(() => {
				localStorage.setItem("save1", JSON.stringify(exportData()));
				console.log("Autosaved.");
				Game.lastSaved = millis();
			}, 30000);
		} else {
			alert("It looks like your current world isn't the same world as your save. Autosaving has been disabled to avoid overwriting it.");
		}
	}
}

let level1:Level;





function exportData():SaveData {
	return {
		UntitledElectronGame: {
			metadata: {
				validationCode: "esrdtfgvczdsret56u7yhgvfcesrythgvfd!",
				id: level1?.uuid ?? Math.random().toString().substring(2),
				version: consts.VERSION,
				timeCreated: new Date().getTime().toString()
			},
			level1: level1.export()
		}
	};
}

function importData(rawData:string){
	let tempLevel:Level;
	try {
		let data:SaveData = JSON.parse(rawData);
		assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
		
		let levelData = data.UntitledElectronGame.level1;
		levelData.version = data.UntitledElectronGame.metadata.version;
		assert(levelData.chunks instanceof Object);
		assert(levelData.items instanceof Array);



		tempLevel = new Level(levelData);
		level1 = tempLevel;

	} catch(err){
		console.error("Import failed.", err);
		alert("Import failed! " + err.message);
	}
}


let placedBuilding: {
	type: RawBuildingID
	direction: 0x000 | 0x100 | 0x200 | 0x300;
	ID: BuildingID;
	modifier: 0x000 | 0x400 | 0x800
} = {
	type: "0x01",
	direction: 0x100,
	modifier: 0x000,
	get ID(){
		if(this.type == 0x05){
			return hex(+this.type + this.direction + this.modifier, 4) as BuildingID;
		} else if(this.type == 0x01){
			return hex(+this.type + this.direction, 4) as BuildingID;
		} else if(this.type == 0xFF){
			return hex(0xFFFF, 4) as BuildingID;
		} else {
			return hex(+this.type, 4) as BuildingID;
		}
	}
};



try {
	assert(localStorage.getItem("settings"));
	settings = JSON.parse(localStorage.getItem("settings"));
} catch(err){
	console.warn("Invalid persistent settings!\nIf this is your first time visiting this site, nothing to worry about.");
	localStorage.setItem("settings", JSON.stringify(settings));
}

console.log("%c Hey there! It looks like you're checking out the console.\nIf you want to view the source code, *please do it at* https://github.com/BalaM314/Untitled-Electron-Game \n Make sure to view the .ts files as the .js files are compiled and thus look weird.", "color: blue; font-size: 30px;")

noise.seed(1);
loadTexturesIntoPage();


registerEventHandlers();

if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
  alert("It looks like you're trying to play on a phone. Unfortunately, mobile devices are not currently supported.");
}

Game.title.splashtext = Math.random() < 0.95 ? splashes[Math.ceil(Math.random() * (splashes.length - 1))] : raresplashes[Math.ceil(Math.random() * (raresplashes.length - 1))];
Game.title.splashbehavior = Math.random() < 0.9 ? "sin" : "tan";

main_loop();

