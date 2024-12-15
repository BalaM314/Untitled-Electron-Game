/* Copyright © BalaM314, 2024. MIT License. */

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
			Input.buildingPlaced = false;
		} else if(e.button === 2){
			Input.rightMouseDown = true;
		}
		if(scenes[Game.sceneName] && Input.active){
			scenes[Game.sceneName]?.onmousedown?.(e);
		}
	}
	window.onmouseup = (e:MouseEvent) => {
		Input.mouseX = e.x;
		Input.mouseY = e.y;
		Input.latestMouseEvent = e;
		if(e.button == 0){
			Input.mouseDown = false;
		} else if(e.button == 2){
			Input.rightMouseDown = false;
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

		if((e.ctrlKey && e.key.match(/^[wertuniWERTUNIK1234567890!@#$%^&*()=-]$/)) || e.key.match(/^f(5|11)$/i)){
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
		if(Input.active){
			for(let section of Object.values(keybinds)){
				for(let keybind of Object.values(section)){
					keybind.check(e);
				}
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
		let file = (event.target as HTMLInputElement)?.files?.[0];
		if(!file) return;
		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = e => {
			let content = e.target?.result?.toString();
			if(content == null) return;
			importData(content);
		}
	}

	window.onwheel = (e:WheelEvent) => {
		if(!Game.paused && Input.active){
			Camera.zoom(Math.pow(1.001, -e.deltaY));
		}
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
		img.src = `assets/textures/building/${block.id}!0.png`;
		img.id = "toolbar_" + block.id;
		img.addEventListener("drag", () => {
			GUI.alert(`Place a building by clicking it in the toolbar, then clicking again where you want the building to go.`);
		});
		img.title = f`${bundle.get(`building.${block.id}.name`)}\n${bundle.get(`building.${block.id}.description`, "\b")}`;
		img.addEventListener("click", () => {
			selectID(block.id);
			Input.mouseDown = false;
		});
		toolbarEl.appendChild(img);
	}


	objectiveTitle.addEventListener("click", () => {
		const objective = objectives.objectives.find(o => o.satisfied && !o.completed);
		objective?.tryComplete();
	});

	alertexit.onclick = GUI.closeAlert;
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
		if(this.hidden){
			tech.hideMenu();
			this.elements.forEach(e => e.classList.add("hidden"));
		} else this.elements.forEach(e => e.classList.remove("hidden"));
	},
	toggle(){
		this.hidden = !this.hidden;
	},
	alert(message:string){
		if(!Game.alerts.list.includes(message))
			Game.alerts.list.push(message);
	},
	closeAlert(){
		alertbox.classList.remove("active");
		Game.alerts.list.shift();
		Game.alerts.active = false;
	},
	closeDialog(){
		if(Game.alerts.active) this.closeAlert();
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
					Game.transientStats.objectiveHovered = true;
				} else if(hovered.id == "research-button" || hovered.id == "research-header-text" || hovered.id == "research-header" || hovered.id == "research-exit-button" || hovered.id == "research-menu" || hovered.className == "research-tree-inner"){
					tooltipbox.innerHTML = tooltip("Research", ["This menu allows you to research new buildings."])
				} else if(hovered.id == "settings-button"){
					tooltipbox.innerHTML = tooltip("Settings", ["This menu allows you to change the game settings."])
				} else if(hovered.id == "buttons-pane"){
					return;
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
	
		const frameMSLast10 = Game.transientStats.frameTimes.mean(10, null);
		const frameMSLast120 = Game.transientStats.frameTimes.mean(120, null);
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
			objectiveText.innerHTML = objective.name().replaceAll(`\\n`, "<br>");
			objectiveDescription.innerHTML = objective.description().replaceAll(`\\n`, "<br>");
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
		this.updateToolbar();
		this.updateVisibility();
		this.updateObjective();
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
		onrightmouseheld?: (currentFrame:CurrentFrame) => void;
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
			Gfx.layer("overlay");
			Gfx.clear("#0033CC");

			Gfx.font("70px sans-serif");
			Gfx.textAlign("center");
			ctxOverlays.textBaseline = "middle";
			Gfx.fillColor("#FFF");
			Gfx.text("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);

			Gfx.font(`40px sans-serif`);
			Gfx.text(`Loading... ${Game.loadedTextures}/${textureIDs.length}`, innerWidth / 2, innerHeight * 0.35);
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
				color: "#08F",
				font: "40px sans-serif",
				onClick: () => {Input.mouseDown = false;load();}
			}),
			new Button({
				x: () => innerWidth/4,
				y: () => innerHeight * 0.75,
				width: () => innerWidth/2,
				height: () => innerHeight/5,
				label: "Settings",
				color: "#08F",
				font: "40px sans-serif",
				onClick: () => {Game.sceneName = "settings";}
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.5,
				width: () => Math.min(innerWidth, innerHeight) * 0.1,
				height: () => Math.min(innerWidth, innerHeight) * 0.1,
				label: () => Gfx.texture("misc/github-60x60"),
				color: "#08F",
				font: "30px sans-serif",
				onClick: () => {window.open("https://github.com/BalaM314/Untitled-Electron-Game/");}
			}),
		],
		update(){},
		display(currentFrame:CurrentFrame){
			Gfx.layer("overlay");
			Gfx.clear("#0033CC");

			Gfx.font("70px sans-serif");
			Gfx.textAlign("center");
			ctxOverlays.textBaseline = "middle";
			Gfx.fillColor("#FFF");
			Gfx.text("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
			Gfx.font("20px sans-serif");
			Gfx.text("Version Alpha 4.0.0", innerWidth / 2, innerHeight * 0.25);
			Gfx.fillColor("#cccc00");
			Gfx.font(`${20 + 5*Game.splash.bounceFunc(millis() / 400)}px sans-serif`);
			Gfx.text(Game.splash.text ?? "splash not found! this is actually an error pls report", innerWidth / 2, innerHeight * 0.35);

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
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => {settings.debug = !settings.debug;}
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.66,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Always load save: " + settings.alwaysLoadSave,
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => {settings.alwaysLoadSave = !settings.alwaysLoadSave;}
			}),
			new Button({
				x: () => innerWidth * 0.51,
				y: () => innerHeight * 0.66,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Autosave: " + settings.autoSave,
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => {settings.autoSave = !settings.autoSave;}
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.5,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: "Controls",
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => {Game.sceneName = "settings.keybinds"}
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.82,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Show tile borders: " + settings.showTileBorders,
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => {settings.showTileBorders = !settings.showTileBorders;}
			}),
			new Button({
				x: () => innerWidth * 0.51,
				y: () => innerHeight * 0.82,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Extra pipe info: " + settings.showExtraPipeInfo,
				color: "#08F",
				font: "35px sans-serif",
				onClick: () => {settings.showExtraPipeInfo = !settings.showExtraPipeInfo;}
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#08F",
				font: "40px sans-serif",
				onClick: () => {Game.sceneName = "title"; localStorage.setItem("settings", JSON.stringify(settings));}
			}),
		],
		update(){},
		display(currentFrame:CurrentFrame){
			Gfx.layer("overlay");
			Gfx.clear("#0033CC");

			Gfx.font("70px sans-serif");
			Gfx.textAlign("center");
			ctxOverlays.textBaseline = "middle";
			Gfx.fillColor("#FFF");
			Gfx.text("Settings", innerWidth / 2, innerHeight * 0.2);

			scenes.settings.buttons.forEach(button => button.display(ctxOverlays));
		},
		onmousedown(e:MouseEvent){
			scenes.settings.buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	"settings.keybinds": {
		buttons: [
			makeRebindButton(0.3, keybinds.move.up, "Move up", "w"),
			makeRebindButton(0.35, keybinds.move.left, "Move left", "a"),
			makeRebindButton(0.4, keybinds.move.down, "Move down", "s"),
			makeRebindButton(0.45, keybinds.move.right, "Move right", "d"),
			makeRebindButton(0.5, keybinds.move.scroll_faster, "Scroll faster", "shift"),
			makeRebindButton(0.55, keybinds.saves.save_to_file, "Save to file", "s"),
			makeRebindButton(0.6, keybinds.saves.save, "Save to browser", "s"),
			makeRebindButton(0.65, keybinds.saves.load_from_file, "Load from file", "o"),
			makeRebindButton(0.7, keybinds.placement.break_building, "Break building", "backspace"),
			makeRebindButton(0.75, keybinds.placement.force_straight_conveyor, "Force straight conveyor", "shift"),
			makeRebindButton(0.8, keybinds.display.show_tooltip, "Show tooltips", "shift"),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#08F",
				font: "40px sans-serif",
				onClick: () => {Game.sceneName = "settings";}
			}),
		],
		update(){},
		display(currentFrame:CurrentFrame){
			Gfx.layer("overlay");
			Gfx.clear("#0033CC");

			Gfx.font("60px sans-serif");
			Gfx.textAlign("center");
			ctxOverlays.textBaseline = "middle";
			Gfx.fillColor("#FFF");
			Gfx.text("Keybinds", innerWidth / 2, innerHeight * 0.2);

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
				crash(`Error updating world: ${parseError(err)}`);
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
				if(!(ctx == ctxTiles || ctx == ctxTilesOver) || currentFrame.redraw){ //Only clear the tiles ctx if redrawing
					Gfx.clear(null, ctx);
				}
			}
			level1.resetResourceDisplayData();
		
			level1.display(currentFrame);
			ParticleEffect.displayAll();
			level1.displayGhostBuilding(
				...(Camera.unproject(...Input.mouse).map(Pos.pixelToTile)),
				placedBuilding.ID, currentFrame
			);

			Gfx.drawers.forEach(d => d());
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
			} else if(e.button === 1){
				const buildUnder = level1.buildingAtPixel(...Camera.unproject(...Input.mouse));
				if(buildUnder){
					placedBuilding.type = buildUnder.block.id;
				}
			}
		},
		onmouseheld(){
			if(Game.paused) return;
			if(!Input.latestMouseEvent) return;
			if(!Input.ctrl() && !keybinds.placement.break_building.isHeld() && placedBuilding.ID[0] != "base_null"){
				level1.buildBuilding(
					...(Camera.unproject(Input.latestMouseEvent.x, Input.latestMouseEvent.y).map(Pos.pixelToTile)),
					placedBuilding.ID
				);
			}
		},
		onrightmouseheld(){
			if(Game.paused) return;
			if(!Input.latestMouseEvent) return;
			if(!Input.ctrl() && !keybinds.placement.break_building.isHeld()){
				level1.breakBuilding(
					...Camera.unproject(...Input.mouse).map(Pos.pixelToTile)
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

		let currentState = scenes[Game.sceneName] ?? crash(`Invalid game state "${Game.sceneName}"`);

		if(Input.mouseDown){
			currentState.onmouseheld?.(currentFrame);
		}
		if(Input.rightMouseDown){
			currentState.onrightmouseheld?.(currentFrame);
		}
		if(Input.keysHeld.size > 0){
			currentState.onkeyheld?.(currentFrame);
		}

		currentState.update(currentFrame);
		currentState.display(currentFrame);
		let frameMS = Date.now() - startFrameTime;
		Game.transientStats.frameTimes.add(frameMS);

		handleAlerts();
		Game.frames ++;

	} catch(err){
		alert("An error has occurred!\nPlease create an issue on this project's GitHub so I can fix it.\nError message: " + parseError(err));
		ctxs.forEach(ctx => Gfx.clear(null, ctx));
		errorBackground.style.zIndex = "99999";
		gameBackground.classList.add("hidden");
		throw err;
	}
	Game.animationFrame = requestAnimationFrame(main_loop);
}

/**Called when switching to gamestate "game". */
function load(){
	
	Camera.scrollTo(0, 0);
	Camera.zoomTo(1);
	placedBuilding.type = "base_null";

	if(!localStorage.firstload){
		localStorage.firstload = true;
		GUI.alert(
`Welcome to Untitled Electron Game!
This is a game about building a factory. To get started, follow the objectives in the top right.`
		);
	}
	
	if(!Game.enteredGame){

		if(
			saveExists() &&
			(settings.alwaysLoadSave || confirm("Would you like to load your save?"))
		) importData(localStorage.getItem("save1")!);
		else level1 = new Level(Rand.int(0, 10000), true).generate();
		
		if(settings.autoSave){
			if(safeToSave()){
				setInterval(() => {
					saveToLocalStorage();
					Log.info("Autosaved.");
				}, 30000);
			} else {
				GUI.alert("It looks like your current world isn't the same world as your save. Autosaving has been disabled to avoid overwriting it.");
			}
		}
	}

	Game.sceneName = "game";
	Game.forceRedraw = true;
	GUI.show();
}

function returnToTitle(){
	GUI.hide();
	if(safeToSave() || confirm("Are you sure you want to save? This will overwrite your current saved world which seems to be different!")){
		try {
			saveToLocalStorage();
		} catch(err){
			alert("Failed to save! " + parseError(err));
		}
	}
	Game.sceneName = "title";
}


async function showCredits(){
	
	GUI.hide();
	Input.active = false;

	await delay(1000);

	//activate the animation
	screenOverlay.classList.add("active");

	//wait for the fade to black animation, then wait on the black screen for a bit
	await delay(1500 + 2500);

	//scene setup
	let boatX = 1 * consts.TILE_SIZE;
	let boatY = 161 * consts.TILE_SIZE;
	let cameraOffset = -5 * consts.TILE_SIZE;
	let boatVel = 0;
	let boatAccel = 0;
	const previousShowTileBorders = settings.showTileBorders;
	settings.showTileBorders = false;
	Camera.scrollTo(consts.TILE_SIZE * -3, -boatY + cameraOffset);
	Camera.zoomTo(1.3);
	//boat
	Gfx.addDrawer(() => {
		Camera.scrollTo(consts.TILE_SIZE * -3, -boatY + cameraOffset, false);
		boatVel += boatAccel;
		boatY += boatVel;
		Gfx.layer("items"); //don't override the effects
		Gfx.pImage(Gfx.texture("misc/base_boat"), boatX, boatY);
		if((Game.frames % 15) == 0){
			Fx.smoke.at(Pos.fromPixelCoords(boatX + 2.2 * consts.TILE_SIZE, boatY + 7.5 * consts.TILE_SIZE));
			Fx.smoke.at(Pos.fromPixelCoords(boatX + 4.2 * consts.TILE_SIZE, boatY + 7.5 * consts.TILE_SIZE));
		}
	});
	screenOverlay.classList.remove("active"); //show screen

	await delay(2000);

	Camera.zoomTo(1);

	await delay(1000);

	boatAccel = 0.01;

	await until(() => boatY > 180 * consts.TILE_SIZE);

	boatAccel = 0.02;

	await until(() => boatY > 300 * consts.TILE_SIZE);

	boatAccel = 0;
	screenOverlay.classList.add("active");
	
	await delay(1500);

	Gfx.clearDrawers();

	await delay(500);

	creditsEl.innerHTML = atob(`PGRpdiBpZD0iY3JlZGl0cy1pbm5lciI+PGgxIGlkPSJjcmVkaXRzLXRpdGxlIj5VbnRpdGxlZCBFbGVjdHJvbiBHYW1lPC9oMT4KPGltZyBzcmM9ImFzc2V0cy90ZXh0dXJlcy9sb2dvLnBuZyIgYWx0PSJVbnRpdGxlZCBFbGVjdHJvbiBHYW1lIExvZ28iIGlkPSJjcmVkaXRzLWxvZ28iPgo8cD5HYW1lIERlc2lnbiw8L3A+CjxwPlByb2dyYW1taW5nLDwvcD4KPHA+U3RvcnksPC9wPgo8cD5HcmFwaGljcyAvIEFydC0gQmFsYSBNPC9wPgo8cD5QbGF5dGVzdGluZy0gQWRpdGksIENyYXksIE5hdGVzaCwgUHJhZHl1biwgUml0aGlrYSwgUml0aGlzaCwgVHZpc2hhPC9wPgo8cD48YSBocmVmPSJodHRwczovL2dpdGh1Yi5jb20vQmFsYU0zMTQvVW50aXRsZWQtRWxlY3Ryb24tR2FtZS8iPlNvdXJjZSBjb2RlIGF2YWlsYWJsZSBvbiBHaXRIdWI8L2E+PC9wPgo8cCBzdHlsZT0iY29sb3I6IGxpZ2h0Ymx1ZSI+VGhhbmtzIGZvciBwbGF5aW5nITwvcD48L2Rpdj4=`);
	creditsEl.classList.add("active");
	screenOverlay.classList.remove("active");

	await delay(60000);

	settings.showTileBorders = previousShowTileBorders;
	creditsEl.classList.remove("active");
	Input.active = true;
	returnToTitle();
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
		Log.group(`Importing save data...`, () => {
			let data = JSON.parse(rawData) as SaveData;
			assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
			
			let levelData = data.UntitledElectronGame.level1;
			levelData.version = data.UntitledElectronGame.metadata.version;
			levelData.uuid = data.UntitledElectronGame.metadata.uuid ?? (<any>data.UntitledElectronGame.metadata).id;
			assert(levelData.chunks instanceof Object);
	
	
	
			tempLevel = Level.read(levelData);
			Log.info("Parsed world data.");
			level1 = tempLevel;
	
			if(data.UntitledElectronGame.techTree){
				const num = tech.read(data.UntitledElectronGame.techTree);
				Log.info(`Imported ${num} tech tree nodes.`);
			}
			if(data.UntitledElectronGame.objectives){
				const num = objectives.read(data.UntitledElectronGame.objectives);
				Log.info(`Imported ${num} completed objectives.`);
			}
			Log.info(`Imported save data.`);
		});
	} catch(err){
		Log.error("Import failed.", err);
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
	Log.showBanner();
	Log.info("Starting...");
	Log.raw`${Log.style({color: "blue", "font-size": "150%"})}\
Hey there! It looks like you're checking out the console.
This game is open source! https://github.com/BalaM314/Untitled-Electron-Game`;

	try {
		assert(localStorage.getItem("settings"));
		const loadedSettings = JSON.parse(localStorage.getItem("settings")!) as any;
		for(const [k, v] of Object.entries(settings) as [keyof typeof settings, (typeof settings)[keyof typeof settings]][]){
			if(loadedSettings[k] && typeof loadedSettings[k] == typeof settings[k]) settings[k] = loadedSettings[k];
		}
	} catch(err){
		Log.caution("Invalid persistent settings!\nIf this is your first time visiting this site, nothing to worry about.");
		localStorage.setItem("settings", JSON.stringify(settings));
	}

	Gfx.init();
	
	noise.seed(1);
	loadTextures(textureIDs.map(id => ({id})), texturesDiv)
		.then(loadedTextures => {
			Gfx.textures = loadedTextures;
			Game.texturesReady = true;
			Log.info(`Successfully loaded ${Object.keys(loadedTextures).length} textures.`);
		})
		.catch(() => {});
	
	
	registerEventHandlers();
	
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
		alert("It looks like you're trying to play on a phone. Unfortunately, mobile devices are not currently supported.");
	}
	
	Game.splash.text = Rand.chance(0.95)
		? Rand.item(splashes.slice(1))
		: Rand.item(raresplashes.slice(1));

	Game.splash.bounceFunc = Rand.chance(0.9) ? Math.sin : Math.tan;
	if(Game.splash.text == "I wonder what this button does!") Game.splash.clickBehavior = () => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

	errorBackground.classList.remove("hidden");
	loadingBackground.classList.add("hidden");
	gameBackground.classList.remove("hidden");
	
	main_loop();
}

init();
