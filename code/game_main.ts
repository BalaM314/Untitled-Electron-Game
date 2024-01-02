
/**Registers event handlers, called once on page load. */
function registerEventHandlers(){

	//Update mouse position
	window.onmousemove = (e:MouseEvent) => {
		Input.mouseX = e.x;
		Input.mouseY = e.y;
		Input.latestMouseEvent = e;
	}

	clickcapture.onmousedown = (e:MouseEvent) => {
		Input.mouseX = e.x;
		Input.mouseY = e.y;
		Input.latestMouseEvent = e;
		//The default action is to bring up a context menu or the scroller thing, not desirable
		if(e.button) e.preventDefault();
		if(e.button === 0){
			Input.mouseDown = true;
		}
		Input.buildingPlaced = false;
		if(scenes[Game.sceneName]){
			scenes[Game.sceneName]?.onmousedown?.(e);
		}
	}
	window.onmouseup = (e:MouseEvent) => {
		Input.mouseX = e.x;
		Input.mouseY = e.y;
		Input.latestMouseEvent = e;
		if(e.button == 0){
			Input.mouseDown = false;
		}
		Input.buildingPlaced = false;
	}

	//For touch screens
	clickcapture.addEventListener("touchstart", (e:any) => {
		e.x = e.touches[0].clientX;
		e.y = e.touches[0].clientY;
		e.button = 0;
		clickcapture.onmousedown?.(e);
	});
	clickcapture.addEventListener("touchend", (e:any) => {
		//When the screen is tapped, touchend is fired immediately after touchstart, leaving no time for buildings to be placed.
		//Delays by 250ms
		e.x = e.changedTouches[0].clientX;
		e.y = e.changedTouches[0].clientY;
		e.button = 0;
		setTimeout(() => {
			clickcapture.onmouseup?.(e);
		}, 250);
	});
	clickcapture.addEventListener("touchmove", (e:any) => {
		e.x = e.touches[0].clientX;
		e.y = e.touches[0].clientY;
		window.onmousemove?.(e);
	});

	clickcapture.oncontextmenu = (e) => {
		//Prevent the menu from showing
		e.preventDefault();
	}

	//Do stuff when a key is pressed(not held).
	window.onkeydown = (e:KeyboardEvent) => {

		if((e.ctrlKey && e.key.match(/^[wertuniWERTUNIK1234567890!@#$%^&*()]$/)) || e.key.match(/^f(5|11)$/i)){
			return;
			//If you pressed one of these key combos, return
		}
		e.preventDefault();

		//Add key to keysHeld
		Input.keysHeld.add(e.key.toLowerCase());

		//Push key to lastKeysPressed
		Input.lastKeysPressed.push(e.key);
		Input.lastKeysPressed.shift();
		//Only the last 10 keypresses are logged

		//Handle keybinds
		for(let section of Object.values(keybinds)){
			for(let keybind of Object.values(section)){
				keybind.check(e);
			}
		}

		if(scenes[Game.sceneName]){
			scenes[Game.sceneName]?.onkeydown?.(e);
		}

		//Otherwise prevent default

	}
	window.onkeyup = (e:KeyboardEvent) => {
		//Remove key from list of held keys
		Input.keysHeld.delete(e.key.toLowerCase());
	}
	

	//When file uploaded
	uploadButton.onchange = (event:Event) => {
		//Load a save file
		let file = ((event.target as any)?.files?.[0] ?? null) as Blob | null;
		if(file == null) return;
		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = e => {
			let content = e.target?.result?.toString();
			if(content == null) return;
			importData(content);
		}
	}

	window.onwheel = (e:WheelEvent) => {
		Camera.zoom(Math.pow(1.001, -e.deltaY));
	}

	//When the window loses focus, clear the list of held keys and set mousePressed to false.
	window.onblur = () => {
		Input.keysHeld.clear();
		Input.mouseDown = false;
		//call pause here once I add it
	}

	window.onbeforeunload = (e:BeforeUnloadEvent) => {
		//Page is about to close
		if(Game.sceneName != "game"){
			return;
			//If you aren't in-game, just exit
		}

		if(safeToSave()){
			//If there's nothing in save1 or the uuid of save1 and the current level are the same, save
			saveToLocalStorage();
		} else {
			//Try to cancel page close
			e.preventDefault();
			e.returnValue = "";
			localStorage.setItem("save-recovered", JSON.stringify(exportData()));
			setTimeout(() => {
				if(confirm("Could not save automatically on page exit because your current world is unrelated to your saved world.\nWould you like to save anyway? This will overwrite your current save!")){
					saveToLocalStorage();
					localStorage.removeItem("save-recovered");
				}
			}, 1);
		}
	}
	for(const block of Buildings){
		if(block.hidden) continue;
		const img = document.createElement("img");
		img.src = `assets/textures/building/${block.id}%230.png`;
		img.id = "toolbar_" + block.id;
		img.addEventListener("drag", () => {
			_alert(`Place a building by clicking it in the toolbar, then clicking again where you want the building to go.`);
		});
		img.title = f`${bundle.get(`building.${block.id}.name`)}\n${bundle.get(`building.${block.id}.description`, "\b")}`;
		img.addEventListener("click", () => {
			selectID(block.id);
			Input.mouseDown = false;
		});
		toolbarEl.appendChild(img);
	}


	objectiveText.addEventListener("click", () => {
		const objective = objectives.objectives.find(o => o.satisfied && !o.completed);
		objective?.tryComplete();
	});

	alertexit.onclick = closeAlert;
}



/** Object to manage HUD elements (text box, resources, objective, toolbar) */
const GUI = {
	elements: [hudtextEl, resourcesEl, objectiveEl, toolbarEl, buttonsPane],
	hidden: true,
	hide(){
		this.hidden = true;
		this.updateVisibility();
	},
	show(){
		this.hidden = false;
		this.updateVisibility();
	},
	updateVisibility(){
		if(this.hidden) this.elements.forEach(e => e.classList.add("hidden"));
		else this.elements.forEach(e => e.classList.remove("hidden"));
	},
	toggle(){
		this.hidden = !this.hidden;
	},
	closeDialog(){
		if(Game.alerts.active) closeAlert();
		else if(tech.menuVisible) tech.hideMenu();
	},
	toggleResearchMenu(){
		if(tech.menuVisible) tech.hideMenu();
		else tech.showMenu();
	},
	updateTooltipPosition(){
		tooltipbox.style.setProperty("--x", `${Math.min(Input.mouseX, window.innerWidth - 200)}px`);
		tooltipbox.style.setProperty("--y", `${Math.min(Input.mouseY, window.innerHeight - 50)}px`);
	},
	updateTooltip(){
		const hovered = Input.latestMouseEvent?.target;
		if(!(hovered instanceof HTMLElement)) return;
		if(hovered.id.startsWith("research_")){
			const hoveredID = hovered.id.split("research_")[1]!;
			const node = tech.get(hoveredID);
			const block = Buildings.getOpt(hoveredID.split("building_")[1] as RawBuildingID | undefined);
			this.updateTooltipPosition();
			const message = node.missingItem() ? `<span style="color:#FAA"> Missing item: ${bundle.get(`item.${node.missingItem()}.name`)}</span>` : "Click to research!";
			if(node.status() == "inaccessible"){
				tooltipbox.innerHTML = "?";
			} else if(node.status() == "locked"){
				tooltipbox.innerHTML = block?.tooltip(message) ?? 
					tooltip(bundle.get(`research.${hoveredID}.name`), [
						bundle.get(`research.${hoveredID}.description`),
						message,
					]);
				node.showCost();
			} else {
				tooltipbox.innerHTML = block?.tooltip() ?? 
					tooltip(bundle.get(`research.${hoveredID}.name`), [
						bundle.get(`research.${hoveredID}.description`),
					]);
			}
		} else if(keybinds.display.show_tooltip.isHeld()){
			this.updateTooltipPosition();
			if(!hovered || hovered == clickcapture){
				//Mouse is over the main canvas
				//css pointer-events:none is used to prevent the event target from being the tooltip box itself, or some other unwanted element
				tooltipbox.innerHTML = level1.getTooltip(...Camera.unproject(...Input.mouse));
			} else if(hovered instanceof HTMLElement){
				if(hovered instanceof HTMLImageElement && hovered.parentElement == toolbarEl){
					//toolbar
					const block = Buildings.getOpt((hovered.id.split("toolbar_")[1] ?? "") as RawBuildingID);
					if(block){
						if(block.unlocked()){
							tooltipbox.innerHTML = block.tooltip();
						} else {
							tooltipbox.innerHTML = tooltip("Not yet unlocked", ["Research this building to unlock it."]);
						}
					}
				} else if(hovered === hudtextEl){
					tooltipbox.innerHTML = tooltip("Hud Text", ["This area displays useful information, like the current FPS, cursor position, and power grid status."]);
				} else if(hovered === resourcesEl){
					tooltipbox.innerHTML = tooltip("Resources", ["These items can be used to construct buildings, or research new ones."]);
				} else if(hovered instanceof HTMLSpanElement && hovered.parentElement == resourcesEl){
					tooltipbox.innerHTML = Item.getTooltip(hovered.id as ItemID);
				} else if(
					hovered === objectiveEl || hovered === objectiveTitle ||
					hovered === objectiveText || hovered === objectiveDescription ||
					hovered === objectiveNextButton
				){
					tooltipbox.innerHTML = tooltip("Objective", ["This box shows the current objective. It may also contain tips and useful information."]);
					Game.stats.objectiveHovered = true;
				} else if(hovered.id == "research-header-text" || hovered.id == "research-header" || hovered.id == "research-exit-button" || hovered.id == "research-menu" || hovered.className == "research-tree-inner"){
					tooltipbox.innerHTML = tooltip("Research", ["This menu allows you to research new buildings."])
				} else {
					tooltipbox.innerHTML = `???${hovered.id}`;
				}
			} else {
				tooltipbox.innerHTML = "[unknown]";
			}
		} else {
			tooltipbox.innerHTML = "";
			tooltipbox.style.setProperty("--x", "-1000px");
			tooltipbox.style.setProperty("--y", "-1000px");
		}
	},
	updateHudText(currentFrame:CurrentFrame){
	
		const mousePosition = "Mouse position: " + Camera.unproject(...Input.mouse).map(Pos.pixelToTile).join(",");
	
		const frameMSLast10 = Game.stats.frameTimes.mean(10, null);
		const frameMSLast120 = Game.stats.frameTimes.mean(120, null);
		//TODO repeated code
		const fpsLast10 = frameMSLast10 ? Math.min(consts.ups, round(1000 / frameMSLast10, 1)) : "...";
		const fpsLast120 = frameMSLast120 ? Math.min(consts.ups, round(1000 / frameMSLast120, 1)) : "...";
		const fpsText = `FPS: ${fpsLast10}/${fpsLast120}`;
	
		const debugText = settings.debug ? `C:${currentFrame.cps} T:${currentFrame.tps} I:${currentFrame.ips} MS:${frameMSLast10}` : "";
	
		const gridSatisfaction = level1.grid.powerRequested == 0 ? 1 : level1.grid.maxProduction / level1.grid.powerRequested;
		const powergridText = level1.grid.maxProduction == 0 && level1.grid.powerRequested == 0 ? "" :
			`Power: <span style="color: ${
				gridSatisfaction < 0.3 ? "red" :
				gridSatisfaction < 0.7 ? "orange" :
				gridSatisfaction < 1 ? "yellow" :
				"lime"
			};">${Math.floor(level1.grid.powerRequested)}/${Math.floor(level1.grid.maxProduction)}</span>`;
		const powerLowText = gridSatisfaction < 1 ? `<span style="color:red;">Insufficient power!</span>` : "&nbsp;";

		hudtextEl.innerHTML = [mousePosition, fpsText, debugText, powergridText, powerLowText].filter(s => s.length > 0).join("<br>\n");
	},
	updateResources(){
		for(const [id, amount] of Object.entries(level1.resources as Record<ItemID, number>)){
			const data = level1.resourceDisplayData[id];
			const shouldDisplay = data.shouldShowAlways || amount > 0 || data.amountRequired != null || (data.flashEffect != null && data.flashExpireTime > Date.now());
			if(shouldDisplay){
				resourcesItems[id]?.style.removeProperty("display");
				resourcesItems[id] ??= (() => {
					const el = document.createElement("span");
					el.id = id;
					el.style.setProperty("--image-url", `url("assets/textures/item/${id}.png")`);
					el.title = f`${bundle.get(`item.${id}.name`)}\n${bundle.get(`item.${id}.description`, "\b")}`;
					resourcesEl.appendChild(el);
					return el;
				})();
				resourcesItems[id].innerText = data.amountRequired ? `${amount.toString()}/${data.amountRequired}` : amount.toString();
				if(data.flashEffect && data.flashExpireTime > Date.now()) resourcesItems[id].classList.add(data.flashEffect);
				else resourcesItems[id].classList.forEach(c => resourcesItems[id].classList.remove(c));
			} else {
				resourcesItems[id]?.style.setProperty("display", "none");
			}
		}
	},
	updateObjective(){
		const objective = objectives.objectives.find(o => !o.completed);
		if(objective){
			objectiveText.innerText = objective.name();
			objectiveDescription.innerText = objective.description();
			objectiveEl.classList[objective.satisfied ? "add" : "remove"]("complete");
		} else {
			objectiveEl.classList.add("hidden");
		}
	},
	updateToolbar(){
		for(const block of Buildings){
			const img = document.querySelector(`#toolbar img#toolbar_${block.id}`) as HTMLImageElement;
			if(!img) continue;
			if(block.unlocked()){
				img.classList.remove("locked");
				//img.title = f`${bundle.get(`building.${block.id}.name`)}\n${bundle.get(`building.${block.id}.description`, "\b")}`;
			} else {
				img.classList.add("locked");
				//img.title = `Not yet researched`;
			}
		}
	},
	display(currentFrame:CurrentFrame){
		tech.display();
		this.updateTooltip();
		this.updateHudText(currentFrame);
		this.updateResources();
		this.updateObjective();
		this.updateToolbar();
		this.updateVisibility();
	},
};
for(const k of (Object.keys(GUI) as (keyof typeof GUI)[])){
	if(typeof GUI[k] == "function"){
		GUI[k] = (GUI[k] as any).bind(GUI);
	}
}


//todo fix this VV probably repeating myself a lot
/**Holds all the function that do things in each game state. */
const scenes: {
	[P in typeof Game.sceneName]: {
		buttons: Button[],
		update: (currentFrame:CurrentFrame) => void;
		display: (currentFrame:CurrentFrame) => void;
		onmousedown?: (e:MouseEvent) => void;
		onmouseheld?: (currentFrame:CurrentFrame) => void;
		onkeydown?: (e:KeyboardEvent) => void;
		onkeyheld?: (currentFrame:CurrentFrame) => void;
	}
} = {
	loading: {
		buttons: [],
		update(){
			if(Game.texturesReady) Game.sceneName = "title";
		},
		display(currentFrame:CurrentFrame){
			ctxOverlays.clear();
			ctxOverlays.fillStyle = "#0033CC";
			ctxOverlays.fillRect(0, 0, innerWidth, innerHeight);
			ctxOverlays.font = "70px sans-serif";
			ctxOverlays.textAlign = "center";
			ctxOverlays.textBaseline = "middle";
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.font = `40px sans-serif`;
			ctxOverlays.fillText(`Loading... ${Game.loadedTextures}/${textureIDs.length}`, innerWidth / 2, innerHeight * 0.35);
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
				onClick: () => {Input.mouseDown = false;load();}
			}),
			new Button({
				x: () => innerWidth/4,
				y: () => innerHeight * 0.75,
				width: () => innerWidth/2,
				height: () => innerHeight/5,
				label: "Settings",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Game.sceneName = "settings";}
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.5,
				width: () => Math.min(innerWidth, innerHeight) * 0.1,
				height: () => Math.min(innerWidth, innerHeight) * 0.1,
				label: () => Gfx.texture("misc/github-60x60"),
				color: "#0000FF",
				font: "30px sans-serif",
				onClick: () => {window.open("https://github.com/BalaM314/Untitled-Electron-Game/");}
			}),
		],
		update(){},
		display(currentFrame:CurrentFrame){
			ctxOverlays.clear();
			ctxOverlays.fillStyle = "#0033CC";
			ctxOverlays.fillRect(0, 0, innerWidth, innerHeight);
			ctxOverlays.font = "70px sans-serif";
			ctxOverlays.textAlign = "center";
			ctxOverlays.textBaseline = "middle";
			ctxOverlays.fillStyle = "#FFFFFF";
			ctxOverlays.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
			ctxOverlays.font = "20px sans-serif";
			ctxOverlays.fillText("Version Beta 1.0.0", innerWidth / 2, innerHeight * 0.25);
			ctxOverlays.fillStyle = "#cccc00";
			ctxOverlays.font = `${20 + 5*Game.splash.bounceFunc(millis() / 400)}px sans-serif`;
			ctxOverlays.fillText(Game.splash.text ?? "splash not found! this is actually an error pls report", innerWidth / 2, innerHeight * 0.35);
			scenes.title.buttons.forEach(button => button.display(ctxOverlays));
		},
		onmousedown(e:MouseEvent){
			scenes.title.buttons.forEach(button => button.handleMouseClick(e));
			if(Intersector.pointInRect(Input.mouse, [innerWidth * 0.4, innerHeight * 0.3, innerWidth * 0.2, innerHeight * 0.1]))
				Game.splash.clickBehavior();
		}
	},
	settings: {
		buttons: [
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
				y: () => innerHeight * 0.5,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: "Controls",
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {Game.sceneName = "settings.keybinds"}
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Game.sceneName = "title"; localStorage.setItem("settings", JSON.stringify(settings));}
			}),
		],
		update(){},
		display(currentFrame:CurrentFrame){
			ctxOverlays.clear();
			ctxOverlays.fillStyle = "#0033CC";
			ctxOverlays.fillRect(0, 0, innerWidth, innerHeight);
			ctxOverlays.font = "70px sans-serif";
			ctxOverlays.textAlign = "center";
			ctxOverlays.textBaseline = "middle";
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.fillText("Settings", innerWidth / 2, innerHeight * 0.2);
			scenes.settings.buttons.forEach(button => button.display(ctxOverlays));
		},
		onmousedown(e:MouseEvent){
			scenes.settings.buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	"settings.keybinds": {
		buttons: [
			makeRebindButton(0.3, ["move", "up"], "Move up", "w"),
			makeRebindButton(0.35, ["move", "left"], "Move left", "a"),
			makeRebindButton(0.4, ["move", "down"], "Move down", "s"),
			makeRebindButton(0.45, ["move", "right"], "Move right", "d"),
			makeRebindButton(0.5, ["move", "scroll_faster"], "Scroll faster", "shift"),
			makeRebindButton(0.55, ["saves", "save_to_file"], "Save to file", "s"),
			makeRebindButton(0.6, ["saves", "save"], "Save to browser", "s"),
			makeRebindButton(0.65, ["saves", "load_from_file"], "Load from file", "o"),
			makeRebindButton(0.7, ["placement", "break_building"], "Break building", "backspace"),
			makeRebindButton(0.75, ["placement", "force_straight_conveyor"], "Force straight conveyor", "shift"),
			makeRebindButton(0.8, ["display", "show_tooltip"], "Show tooltips", "shift"),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Game.sceneName = "settings";}
			}),
		],
		update(){},
		display(currentFrame:CurrentFrame){
			ctxOverlays.clear();
			ctxOverlays.fillStyle = "#0033CC";
			ctxOverlays.fillRect(0, 0, innerWidth, innerHeight);
			ctxOverlays.font = "60px sans-serif";
			ctxOverlays.textAlign = "center";
			ctxOverlays.textBaseline = "middle";
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.fillText("Keybinds", innerWidth / 2, innerHeight * 0.2);
			this.buttons.forEach(button => button.display(ctxOverlays));
		},
		onmousedown(e:MouseEvent){
			this.buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	game: {
		buttons: [],
		update(currentFrame:CurrentFrame){
			if(Game.paused) return;
			try {
				level1.generateNecessaryChunks();
				level1.update(currentFrame);
				objectives.update();
			} catch(err){
				console.error(err);
				throw new Error(`Error updating world: ${parseError(err)}`);
			}
		},
		display(currentFrame:CurrentFrame){
			//display

			if(Game.paused){
				Gfx.layer("overlay");
				Gfx.font("72px sans-serif");
				Gfx.fillColor("#3333FF");
				Gfx.textAlign("center");
				Gfx.lineWidth(1);
				Gfx.strokeColor("#0000AA");
				Gfx.textOutline("Game paused", innerWidth * 0.5, innerHeight * 0.19);
				Gfx.font("36px sans-serif");
				Gfx.fillColor("#0000AA");
				Gfx.text(`Press ${keybinds.misc.pause.toString()} to unpause`, innerWidth * 0.5, innerHeight * 0.26);
				Game.forceRedraw = true;
				return;
			}

			for(const ctx of ctxs){
				if(ctx == ctxTiles || ctx == ctxTilesOver){
					if(currentFrame.redraw) ctx.clear(); //Only clear the tiles ctx if redrawing
				} else ctx.clear();
			}
			level1.resetResourceDisplayData();
		
			level1.display(currentFrame);
			ParticleEffect.displayAll();
			level1.displayGhostBuilding(
				...(Camera.unproject(...Input.mouse).map(Pos.pixelToTile)),
				placedBuilding.ID, currentFrame
			);

			
			
			GUI.display(currentFrame);

		},
		onmousedown(e:MouseEvent){
			if(Game.paused) return;
			if(e.ctrlKey && e.button == 0){
				level1.buildingAtPixel(
					...(Camera.unproject(e.x, e.y))
				)?.acceptItem(new Item(
					...(Camera.unproject(e.x, e.y).map(c => Pos.tileToPixel(Pos.pixelToTile(c), true))),
					"base_null"
				), null);
			}
		},
		onmouseheld(){
			if(Game.paused) return;
			if(!Input.latestMouseEvent) return;
			if(!(Input.ctrl() || keybinds.placement.break_building.isHeld()) && placedBuilding.ID[0] != "base_null"){
				level1.buildBuilding(
					...(Camera.unproject(Input.latestMouseEvent.x, Input.latestMouseEvent.y).map(Pos.pixelToTile)),
					placedBuilding.ID
				);
			}
		},
		//Unlike the onkeydown function, this one needs to run based on keys being held.
		onkeyheld(currentframe:CurrentFrame){
			if(Game.paused) return;
			const scrollSpeed = keybinds.move.scroll_faster.isHeld() ? consts.fastScrollSpeed : consts.scrollSpeed;
			if(keybinds.move.up.isHeld()) Camera.scroll(0, -scrollSpeed);
			if(keybinds.move.left.isHeld()) Camera.scroll(-scrollSpeed, 0);
			if(keybinds.move.down.isHeld()) Camera.scroll(0, scrollSpeed);
			if(keybinds.move.right.isHeld()) Camera.scroll(scrollSpeed, 0);
			if(keybinds.placement.break_building.isHeld()){
				level1.breakBuilding(
					...Camera.unproject(...Input.mouse).map(Pos.pixelToTile)
				);
			}
		},
		onkeydown(e){
			//Easter egg
			if(e.key == "Enter" && Input.lastKeysPressed.join(", ") == 
				["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a", "Enter"].join(", ")
			){
				window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ"); //this is fine
				for(let [key, value] of Object.entries(level1.resources) as [ItemID, number][]){
					level1.resources[key] = 999999;
				}
				tech.nodes.forEach(n => n.unlocked = true);
			}
		}
	}
};


/**Sets the canvas sizes to the window size. */
function fixSizes(){
	//This has to be done dynamically because for some reason setting a canvas to width:100% height:100% makes it glitch out.
	for(const ctx of ctxs){
		if(ctx.canvas.width != window.innerWidth){
			ctx.canvas.width = window.innerWidth;
			Game.forceRedraw = true;
		}
		if(ctx.canvas.height != window.innerHeight){
			ctx.canvas.height = window.innerHeight;
			Game.forceRedraw = true;
		}
	}
	Camera.update();
}


function handleAlerts(){
	if(Game.alerts.list.length && !Game.alerts.active){
		Input.mouseDown = false;
		alertmessage.innerHTML = Game.alerts.list[0].replaceAll("\n", "<br>");
		alertmessage.style.setProperty("--text-length", alertmessage.innerText.length.toString());
		alertbox.classList.add("active");
		Game.alerts.active = true;
	}
}



/**The main loop! Called once per frame. */
function main_loop(){
	try {
		let startFrameTime = Date.now();
		let currentFrame:CurrentFrame = {
			tooltip: true,
			debug: settings.debug,
			cps: 0,
			tps: 0,
			ips: 0,
			redraw: Game.forceRedraw,
			frame: Game.frames
		};
		Game.forceRedraw = false;
		fixSizes();
		window.getSelection()?.empty();

		let currentState = scenes[Game.sceneName];
		if(!currentState){
			throw new InvalidStateError(`Invalid game state "${Game.sceneName}"`);
		}

		if(Input.mouseDown){
			currentState.onmouseheld?.(currentFrame);
		}
		if(Input.keysHeld.size > 0){
			currentState.onkeyheld?.(currentFrame);
		}

		currentState.update(currentFrame);
		currentState.display(currentFrame);
		let frameMS = Date.now() - startFrameTime;
		Game.stats.frameTimes.add(frameMS);

		handleAlerts();
		Game.frames ++;

	} catch(err){
		alert("An error has occurred! Oopsie.\nPlease create an issue on this project's GitHub so I can fix it.\nError message: " + parseError(err));
		ctxs.forEach((ctx) => {ctx.clear();});
		errorBackground.style.zIndex = "99999";
		gameBackground.classList.add("hidden");
		throw err;
	}
	Game.animationFrame = requestAnimationFrame(main_loop);
}

/**Called when switching to gamestate "game". */
function load(){
	
	
	
	if(!localStorage.firstload){
		localStorage.firstload = true;
		_alert(
`Welcome to Untitled Electron Game!
This is a game about building a factory.
To get started, follow the objectives in the top right.`
		);
	}
	
	if(
		saveExists() &&
		(settings.alwaysLoadSave || confirm("Would you like to load your save?"))
	) importData(localStorage.getItem("save1")!);
	else level1 = new Level(Rand.int(0, 10000), true).generate();

	Game.sceneName = "game";
	Game.forceRedraw = true;
	GUI.show();

	if(settings.autoSave){
		if(safeToSave()){
			setInterval(() => {
				saveToLocalStorage();
				console.log("Autosaved.");
			}, 30000);
		} else {
			_alert("It looks like your current world isn't the same world as your save. Autosaving has been disabled to avoid overwriting it.");
		}
	}
}


function showCredits(){
	_alert("you win!"); //todo not yet implemented
	//plan:
	//fade to black, remove camera control
	//set position to at the edge of the island, show a boat
	//over 10-15 seconds, accelerate the boat away from the island
	//fade to black again and roll credits

}

/**Exports an Untitled Electron Game save, as an object. */
function exportData():SaveData {
	return {
		UntitledElectronGame: {
			metadata: {
				validationCode: "esrdtfgvczdsret56u7yhgvfcesrythgvfd!",
				uuid: level1?.uuid ?? Math.random().toString().substring(2),
				version: consts.VERSION,
				timeCreated: new Date().getTime().toString()
			},
			level1: level1.export(),
			techTree: tech.write(),
			objectives: objectives.write(),
		}
	};
}

/**Imports an Untitled Electron Game save. */
function importData(rawData:string){
	let tempLevel:Level;
	try {
		let data:SaveData = JSON.parse(rawData);
		assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
		
		let levelData = data.UntitledElectronGame.level1;
		levelData.version = data.UntitledElectronGame.metadata.version;
		levelData.uuid = data.UntitledElectronGame.metadata.uuid ?? (<any>data.UntitledElectronGame.metadata).id;
		assert(levelData.chunks instanceof Object);



		tempLevel = Level.read(levelData);
		level1 = tempLevel;

		if(data.UntitledElectronGame.techTree) tech.read(data.UntitledElectronGame.techTree);
		if(data.UntitledElectronGame.objectives) objectives.read(data.UntitledElectronGame.objectives);

	} catch(err){
		console.error("Import failed.", err);
		alert("Import failed! " + parseError(err));
	}
}

function attemptManualLocalSave(){
	if(safeToSave() || confirm("Are you sure you want to save? This will overwrite your current saved world which seems to be different!")){
		try {
			saveToLocalStorage();
			alert("Saved successfully!");
		} catch(err){
			alert("Failed to save! " + parseError(err));
		}
	}
}

/**An object to store the type, direction, and modifier of placed buildings. */
let placedBuilding: {
	type: RawBuildingID
	direction: Direction;
	ID: BuildingIDWithMeta;
	modifier: 0 | 1 | 2;
} = {
	type: "base_null",
	direction: Direction.right,
	modifier: 0,
	get ID():BuildingIDWithMeta {
		if(this.type == "base_null") return ["base_null", 0];
		return Buildings.get(this.type).getID(this.type, this.direction, this.modifier);
	}
};


/**Called once on page load. */
function init(){
	try {
		assert(localStorage.getItem("settings"));
		const loadedSettings = JSON.parse(localStorage.getItem("settings")!);
		for(const [k, v] of Object.entries(settings) as [keyof typeof settings, (typeof settings)[keyof typeof settings]][]){
			if(loadedSettings[k] && typeof loadedSettings[k] == typeof settings[k]) settings[k] = loadedSettings[k];
		}
	} catch(err){
		console.warn("Invalid persistent settings!\nIf this is your first time visiting this site, nothing to worry about.");
		localStorage.setItem("settings", JSON.stringify(settings));
	}
	
	console.log("%c Hey there! It looks like you're checking out the console.\nIf you want to view the source code, *please do it at* https://github.com/BalaM314/Untitled-Electron-Game \n Make sure to view the .ts files as the .js files are compiled and thus look weird.", "color: blue; font-size: 30px;")

	Gfx.init();
	
	noise.seed(1);
	loadTextures(textureIDs.map(id => ({id})), texturesDiv)
		.then(loadedTextures => {
			Gfx.textures = loadedTextures;
			Game.texturesReady = true;
		});
	
	
	registerEventHandlers();
	
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
		alert("It looks like you're trying to play on a phone. Unfortunately, mobile devices are not currently supported.");
	}
	
	Game.splash.text = Math.random() < 0.95
		? splashes[Math.ceil(Math.random() * (splashes.length - 1))]
		: raresplashes[Math.ceil(Math.random() * (raresplashes.length - 1))];
	//use of incorrect formula is intentional, we want the first splash to never get selected
	Game.splash.bounceFunc = Math.random() < 0.9 ? Math.sin : Math.tan;
	if(Game.splash.text == "I wonder what this button does!") Game.splash.clickBehavior = () => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

	errorBackground.classList.remove("hidden");
	loadingBackground.classList.add("hidden");
	gameBackground.classList.remove("hidden");
	
	main_loop();
}

init();
