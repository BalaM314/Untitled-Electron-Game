/*
	Main classes.
*/



class Level {
	resources: {
		[index: string]: number
	} = {};
	storage = new Map<string, Chunk>();
	format: string;
	uuid: string;
	constructor(public seed:number){
		this.format = consts.VERSION;
		this.uuid = Math.random().toString().substring(2);
	}
	static read(data:LevelData){
		// Read a level from JSON
		const {chunks, resources, seed, version, uuid} = data;
		const level = new Level(seed);
		level.resources = resources;
		level.uuid = uuid;
		let position, chunkData;
		try {
			for([position, chunkData] of Object.entries(chunks)){
				chunkData.version = version;
				level.storage.set(position,
					Chunk.read(parseInt(position.split(",")[0]), parseInt(position.split(",")[1]), level, chunkData)
				);
				//Generate a chunk with that data
			}
		} catch(err){
			throw new Error(`Error loading chunk ${position}: ${parseError(err)}`)
		}
		return level;
	}
	generate(){
		this.generateNecessaryChunks();
		this.buildBuilding(0, 0, ["base_resource_acceptor", 0]);
		this.buildBuilding(0, -1, ["base_resource_acceptor", 0]);
		this.buildBuilding(-1, 0, ["base_resource_acceptor", 0]);
		this.buildBuilding(-1, -1, ["base_resource_acceptor", 0]);
		return this;
	}
	hasChunk(tileX:number, tileY:number):boolean {
		return !! this.storage.get(`${Pos.tileToChunk(tileX)},${Pos.tileToChunk(tileY)}`);
	}
	getChunk(tileX:number, tileY:number):Chunk {
		if(!this.hasChunk(tileX, tileY)){
			this.generateChunk(Pos.tileToChunk(tileX), Pos.tileToChunk(tileY));
		}
		return this.storage.get(`${Pos.tileToChunk(tileX)},${Pos.tileToChunk(tileY)}`)!;
	}
	generateChunk(x:number, y:number){
		if(this.storage.get(`${x},${y}`)){
			return;
		}
		this.storage.set(`${x},${y}`, 
			new Chunk(x, y, this).generate()
		);
	}
	generateNecessaryChunks(){
		let [chunkX, chunkY] = Camera.unproject(0, 0).map(Pos.pixelToChunk) as [number, number]
		const xOffsets = [0, 1, 2, 3, 4];
		const yOffsets = [0, 1, 2];
		for(const xOffset of xOffsets){
			for(const yOffset of yOffsets){
				this.generateChunk(chunkX + xOffset, chunkY + yOffset);
			}
		}
		//good enough
	}

	tileAtByPixel(pixelX:number, pixelY:number):TileID{
		return this.getChunk(
			Pos.pixelToTile(pixelX),
			Pos.pixelToTile(pixelY)
		).tileAt(Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelX)), Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelY)));
	}
	tileAtByTile(tileX:number, tileY:number):TileID{
		return this.getChunk(
			tileX,
			tileY
		).tileAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
	}
	setTileByTile(tileX:number, tileY:number, tile:TileID):boolean {
		this.getChunk(tileX,tileY).setTile(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), tile);
		Game.forceRedraw = true;
		return true;
	}
	buildingAtTile(tileX:number, tileY:number):Building | null {
		return this.getChunk(
			tileX,
			tileY
		).buildingAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
	}
	buildingAtPixel(pixelX:number, pixelY:number):Building | null {
		return this.getChunk(
			Pos.pixelToTile(pixelX),
			Pos.pixelToTile(pixelY)
		).buildingAt(Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelX)), Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelY)));
	}
	buildingAtPos(pos:Pos):Building | null {
		return this.getChunk(
			pos.tileX,
			pos.tileY
		).buildingAt(pos.chunkOffsetXInTiles, pos.chunkOffsetYInTiles);
	}
	overlayBuildAtTile(tileX:number, tileY:number):OverlayBuild | null {
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).overlayBuildAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
	}
	overlayBuildAtPos(pos:Pos):OverlayBuild | null {
		return this.getChunk(
			pos.tileX,
			pos.tileY
		).overlayBuildAt(pos.chunkOffsetXInTiles, pos.chunkOffsetYInTiles);
	}
	writeBuilding(tileX:number, tileY:number, building:Building | null):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setBuilding(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building);
			Game.forceRedraw = true;
			return true;
		}
		return false;
	}
	writeOverlayBuild(tileX:number, tileY:number, building:OverlayBuild | null):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setOverlayBuild(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building);
			Game.forceRedraw = true;
			return true;
		}
		return false;
	}
	
	
	displayGhostBuilding(tileX:number, tileY:number, buildingID:BuildingIDWithMeta, currentframe:CurrentFrame){
		if(!this.hasChunk(tileX, tileY)) return;
		Gfx.layer("ghostBuilds");
		//TODO this should probably be different method
		if(keybinds.placement.break_building.isHeld()){
			Gfx.alpha(0.9);
			Gfx.tImage(Gfx.texture("misc/invalidunderlay"), tileX, tileY, 1, 1);
			Gfx.alpha(1);
		}
		if(buildingID[0] == "base_null") return;

		let changedID:BuildingIDWithMeta = [buildingID[0], buildingID[1]];
		changedID[1] = Buildings.get(buildingID[0]).changeMeta(changedID[1], tileX, tileY, this);
		let textureSize = Buildings.get(buildingID[0]).textureSize(buildingID[1]);

		//Draw underlay
		let isError = !Buildings.get(changedID[0]).canBuildAt(tileX, tileY, this) || this.buildingAtTile(tileX, tileY)?.block.immutable;
		let underlayTextureSize = textureSize[0][0] == textureSize[0][1] ? textureSize : [[1, 1], [0, 0]];
		Gfx.tImage(isError ? Gfx.texture("misc/invalidunderlay") : Gfx.texture("misc/ghostunderlay"), tileX + underlayTextureSize[1][0], tileY + underlayTextureSize[1][1], underlayTextureSize[0][0], underlayTextureSize[0][1]);

		Gfx.alpha(0.7);
		Building.display(changedID, Pos.fromTileCoords(tileX, tileY, false), "ghostBuilds");
		Gfx.alpha(1);

	}

	breakBuilding(tileX:number, tileY:number){
		function safeBreak(build:Building | null){
			if(build && !build.block.immutable) build.break();
		}
		safeBreak(this.buildingAtTile(tileX, tileY));
		safeBreak(this.overlayBuildAtTile(tileX, tileY));
	}
	buildBuilding(tileX:number, tileY:number, buildingID:BuildingIDWithMeta):boolean {
		if(this.buildingAtTile(tileX, tileY)?.block.immutable) return false;

		if(buildingID[0] == "base_null"){
			return true;
		}
		const block = Buildings.get(buildingID[0]);

		//Only overwrite the same building once per build attempt.
		//Otherwise, you could constantly overwrite a building on every frame you tried to build, which is not good.
		if(block.isOverlay){
			if(this.overlayBuildAtTile(tileX, tileY)?.block.id == buildingID[0] && this.overlayBuildAtTile(tileX, tileY)?.meta == buildingID[1]){
				if(!canOverwriteBuilding) return false;
				canOverwriteBuilding = false;
			}
			this.overlayBuildAtTile(tileX, tileY)?.break();
		} else {
			if(this.buildingAtTile(tileX, tileY)?.block.id == buildingID[0] && this.buildingAtTile(tileX, tileY)?.meta == buildingID[1]){
				if(!canOverwriteBuilding) return false;
				canOverwriteBuilding = false;
			}
			this.buildingAtTile(tileX, tileY)?.break();
		}

		if(block.canBuildAt(tileX, tileY, this)){
			trigger(triggerType.placeBuilding, buildingID[0]);
			if(block.prototype instanceof MultiBlockController){
				//Multiblock handling
				const _block = block as typeof MultiBlockController;
				const offsets = MultiBlockController.getOffsetsForSize(..._block.multiblockSize);
				//todo dubious
				const multiblockSecondary = Buildings.get("base_multiblock_secondary") as typeof MultiBlockSecondary;
				
				//Break all the buildings under
				for(const [xOffset, yOffset] of offsets){
					const buildUnder = this.buildingAtTile(tileX + xOffset, tileY + yOffset);
					//if(buildUnder?.block.immutable) return false;
					buildUnder?.break();
				}
				
				//Create buildings
				let controller = new _block(tileX, tileY, buildingID[1], this);
				controller.secondaries = offsets.map(([x, y]) => new multiblockSecondary(tileX + x, tileY + y, 0, this));
				//Link buildings
				controller.secondaries.forEach(secondary => secondary.controller = controller);
				//Write buildings
				this.writeBuilding(tileX, tileY, controller);
				controller.secondaries.forEach(secondary => this.writeBuilding(secondary.pos.tileX, secondary.pos.tileY, secondary));
				return true;
			} else {
				const building = new block(
					tileX, tileY,
					block.changeMeta(buildingID[1], tileX, tileY, this), this
				);
				if(building instanceof OverlayBuild){
					return this.writeOverlayBuild(tileX, tileY, building);
				} else {
					return this.writeBuilding(tileX, tileY, building);
				}
			}
		} else {
			trigger(triggerType.placeBuildingFail, buildingID[0]);
			return false;
		}
	}

	update(currentFrame:CurrentFrame){
		for(let chunk of this.storage.values()){
			chunk.update(currentFrame);
		}
	}
	display(currentframe:Object):void {
		
		//Instantly returns in the display method if offscreen.
		for(let chunk of this.storage.values()){
			chunk.display(currentframe);
		}
		
	}
	displayTooltip(mousex:number, mousey:number, currentframe:CurrentFrame){
		if(!currentframe.tooltip){return;}
		const [x, y] = Camera.unproject(mousex, mousey);
		Gfx.layer("overlay");
		Gfx.font("16px monospace");
		let building = this.buildingAtPixel(x, y);
		if(building instanceof Building){
			let buildingID = building.block.id;
			if(building.block.displaysItem && building.item){
				let item = this.buildingAtPixel(x, y)!.item;
				if(item && (Math.abs(item.pos.pixelX - x) < consts.ITEM_SIZE / 2) && Math.abs(item.pos.pixelY - y) < consts.ITEM_SIZE / 2){
					//If the item is within 8 pixels of the cursor
					Gfx.fillColor("#0033CC");
					Gfx.rect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
					Gfx.strokeColor("#000000");
					Gfx.lineRect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
					Gfx.fillColor("#FFFFFF");
					Gfx.text((names.item[item.id] ?? item.id), mousex + 2, mousey + 10);
					return;
				}
			}
			Gfx.fillColor("#0033CC");
			Gfx.rect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
			Gfx.strokeColor("#000000");
			Gfx.lineRect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
			Gfx.fillColor("#FFFFFF");
			Gfx.text((names.building[buildingID] ?? buildingID), mousex + 2, mousey + 10);
			return;
		}
		let tileID = this.tileAtByPixel(x, y);
		Gfx.fillColor("#0033CC");
		Gfx.rect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
		Gfx.strokeColor("#000000");
		Gfx.lineRect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
		Gfx.fillColor("#FFFFFF");
		Gfx.text((names.tile[tileID] ?? tileID), mousex + 2, mousey + 10);
		return;
	}
	export():LevelData {
		//Exports the level's data to JSON.
		let chunkOutput:Record<string, ChunkData> = {};
		for(let [position, chunk] of this.storage.entries()){
			let output = chunk.export();
			if(output){
				chunkOutput[position] = output;
			}
		}


		return {
			chunks: chunkOutput,
			resources: this.resources,
			seed: this.seed,
			version: consts.VERSION,
			uuid: this.uuid
		};
	}
}





class Chunk {
	layers: [
		TileID[][],
		(Building | null)[][],
		(OverlayBuild | null)[][]
	];
	_generator: Generator<{
		value: number;
		chance(amount: number): boolean;
	}, never>;
	chunkSeed: number;
	hasBuildings: boolean = false;
	constructor(public x:number, public y:number, public parent:Level){
		//Don't allow x or y to be zero
		let tweakedX = x == 0 ? 5850 : x;
		let tweakedY = y == 0 ? 9223 : y;
		this.chunkSeed = Math.abs(
			(((tweakedX) ** 3) * (tweakedY ** 5) + 3850 + ((parent.seed - 314) * 11)) % (2 ** 16)
		);
		//A very sophisticated algorithm that I definitely didn't just make up

		this._generator = pseudoRandom(this.chunkSeed);
		this.layers = Chunk.initializeLayers();

		return this;
	}
	static initializeLayers(){
		const layers:Chunk["layers"] = [
			new Array(consts.CHUNK_SIZE),
			new Array(consts.CHUNK_SIZE),
			new Array(consts.CHUNK_SIZE)
		];
		for(let i = 0; i < consts.CHUNK_SIZE; i ++){
			layers[0][i] = new Array(consts.CHUNK_SIZE).fill("base_null");
			layers[1][i] = new Array(consts.CHUNK_SIZE).fill(null);
			layers[2][i] = new Array(consts.CHUNK_SIZE).fill(null);
		}
		return layers;
	}
	static read(chunkX:number, chunkY:number, level:Level, data:ChunkData){
		const chunk = new Chunk(chunkX, chunkY, level);
		//Import a chunk from JSON data.
		//TODO 🚮
		const numericVersion = +data.version.split(" ")[1].replaceAll(".", "");
		if(numericVersion < 200){
			(data as any).layers = data;
		}
		for(let y in data.layers[0]){
			for(let x in data.layers[0][y]){
				let _buildingData = data.layers[0][y][x] as BuildingData | LegacyBuildingData | null;
				if(!_buildingData) continue;
				chunk.hasBuildings = true;
				let buildingData:BuildingData;
				if(numericVersion <= 200){
					_buildingData.id = hex(_buildingData.id as any as number, 4) as LegacyBuildingID;
				}
				if(numericVersion < 300){
					buildingData = {
						..._buildingData,
						id: mapLegacyRawBuildingID(getLegacyRawBuildingID((_buildingData as LegacyBuildingData).id)),
						meta: +(_buildingData as LegacyBuildingData).id >> 8
					}
					//aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa I am still looking forward to beta when I can throw out these garbage formats
				} else buildingData = _buildingData as BuildingData;
				let tempBuilding:Building;
				try {
					tempBuilding = Buildings.get(buildingData.id).read(buildingData, level);
				} catch(err){
					console.error(err);
					throw new Error(`Failed to import building id ${stringifyMeta(buildingData.id, buildingData.meta)} at position ${x},${y} in chunk ${chunkX},${chunkY}. See console for more details.`);
				}
				chunk.layers[1][y][x] = tempBuilding;
			}
		}

		//Same as above but for overlay builds.
		for(let y in data.layers[1]){
			for(let x in data.layers[1][y]){
				let _buildingData = data.layers[1][y][x] as BuildingData | LegacyBuildingData | null;
				if(!_buildingData) continue;
				chunk.hasBuildings = true;
				let buildingData:BuildingData;
				if(numericVersion <= 200){
					_buildingData.id = hex(_buildingData.id as any as number, 4) as LegacyBuildingID;
				}
				if(numericVersion < 300){
					buildingData = {
						..._buildingData,
						id: mapLegacyRawBuildingID(getLegacyRawBuildingID((_buildingData as LegacyBuildingData).id)),
						meta: +(_buildingData as LegacyBuildingData).id >> 8
					}
					//aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa I am still looking forward to beta when I can throw out these garbage formats
				} else buildingData = _buildingData as BuildingData;
				let tempBuilding = new (Buildings.get(buildingData.id))(
					parseInt(x) + (consts.CHUNK_SIZE * chunkX),
					parseInt(y) + (consts.CHUNK_SIZE * chunkY),
					buildingData.meta, level
				) as OverlayBuild;
				if(buildingData.item && numericVersion >= 130){
					//AAAAAAAAAAAAAAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaAAA
					tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id);
				}
				chunk.layers[2][y][x] = tempBuilding;
			}
		}
		chunk.generate();
		return chunk;
	}
	update(currentFrame:CurrentFrame):Chunk {
		if(!this.hasBuildings) return this;
		for(let i = 0; i < consts.CHUNK_SIZE; i ++){
			for(let j = 0; j < consts.CHUNK_SIZE; j ++){
				if(this.layers[1][i][j]){
					this.layers[1][i][j]!.update(currentFrame);
				}
			}
		}
		for(let i = 0; i < consts.CHUNK_SIZE; i ++){
			for(let j = 0; j < consts.CHUNK_SIZE; j ++){
				if(this.layers[2][i][j]){
					this.layers[2][i][j]!.update(currentFrame);
				}
			}
		}
		return this;
	}
	tileAt(tileX:number, tileY:number):TileID {
		return this.layers[0][tileY]?.[tileX] ?? (() => {throw new Error(`Tile ${tileX}, ${tileY} does not exist!`)})();
	}
	buildingAt(tileX:number, tileY:number):Building | null {
		return this.layers[1][tileY]?.[tileX] ?? null;
	}
	overlayBuildAt(tileX:number, tileY:number):OverlayBuild | null {
		return this.layers[2][tileY]?.[tileX] ?? null;
	}
	setTile(tileX:number, tileY:number, value:TileID):boolean {
		try {
			this.tileAt(tileX, tileY);
		} catch(err){
			return false;
		}
		this.layers[0][tileY][tileX] = value;
		return true;
	}
	setBuilding(tileX:number, tileY:number, value:Building | null):boolean {
		if(this.tileAt(tileX, tileY) == null){
			return false;
		}
		this.layers[1][tileY][tileX] = value;
		if(value instanceof Building) this.hasBuildings = true;
		return true;
	}
	setOverlayBuild(tileX:number, tileY:number, value:OverlayBuild | null):boolean {
		if(this.tileAt(tileX, tileY) == null){
			return false;
		}
		this.layers[2][tileY][tileX] = value;
		if(value instanceof Building) this.hasBuildings = true;
		return true;
	}
	/**
	 * @deprecated
	 */
	displayToConsole(){
		console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
		console.table(this.layers[0]);
		//The oldest method in this program. Was used a very long time ago.
	}
	generator(){
		return this._generator.next().value;
	}
	generate():Chunk {
		//This... needs to be refactored. TODO
		let isWet = false;
		let isHilly = false;

		let distanceFromSpawn = Math.sqrt(this.x **2 + this.y **2);
		let distanceBoost = constrain(Math.log((distanceFromSpawn / generation_consts.ore_scale) + 0.5)/2, 0, 0.6);
		//A value added to the perlin noise on each tile to make the amount of stone/ore increase, scales as you go further out.

		if(this.generator().chance(0.07) && distanceFromSpawn > generation_consts.min_water_chunk_distance){
			isWet = true;
		} else if(distanceBoost > generation_consts.hilly.terrain_cutoff){
			isHilly = true;
		}
		
		if(isWet){//Generator for wet chunks.
			for(let row in this.layers[0]){
				for(let tile in this.layers[0][row]){
					//Choose the tile to be placed:
					if(row == "0" || row == "15" || tile == "0" || tile == "15"){
						this.layers[0][row][tile] = "base_water";//If on edge, place water
					} else if(row == "1" || row == "14" || tile == "1" || tile == "14"){
						this.layers[0][row][tile] = this.generator().chance(0.5) ? "base_water" : "base_stone";//If near edge, place 50-50 stone or water		
					} else {
						this.layers[0][row][tile] = 
						this.generator().chance(0.1) ?
						(this.generator().chance(0.3) ? "base_ore_iron" : "base_ore_coal")
						: "base_stone";
						//Otherwise, stone, iron, or coal.
					}
				}
			}
		} else if(isHilly){
			//Hilly terrain generator:
			//Based on perlin noise.

			//Chooses which ore to generate based on RNG and ditance from spawn.
			let oreToGenerate:TileID;
			let oreRand = this.generator();
			if(distanceFromSpawn < generation_consts.hilly.min_iron_distance){
				oreToGenerate = "base_ore_coal";
			} else if(distanceFromSpawn < generation_consts.hilly.min_copper_distance){
				oreToGenerate = oreRand.chance(0.5) ? "base_ore_iron" : "base_ore_coal";
			} else {
				oreToGenerate = oreRand.chance(0.5) ? (oreRand.chance(0.25) ? "base_ore_copper" : "base_ore_iron") : "base_ore_coal";
			}


			for(let row in this.layers[0]){
				for(let tile in this.layers[0][row]){
					//Choose the tile to be placed:
					let noiseHeight = 
					Math.abs(noise.perlin2(
						((this.x * consts.CHUNK_SIZE) + +tile + this.parent.seed) / generation_consts.perlin_scale,
						((this.y * consts.CHUNK_SIZE) + +row + (this.parent.seed + generation_consts.y_offset))
							/ generation_consts.perlin_scale
					));
					//This formula just finds the perlin noise value at a tile, but tweaked so it's different per seed and not mirrored diagonally.

					if((noiseHeight + distanceBoost / 2) > generation_consts.hilly.ore_threshold){
						this.layers[0][row][tile] = oreToGenerate;
					} else if((noiseHeight + distanceBoost) > generation_consts.hilly.stone_threshold){
						this.layers[0][row][tile] = "base_stone";
					} else {
						this.layers[0][row][tile] = "base_grass";
					}
				}
			}
		} else {
			//Old terrain generation. I kept it, just only close to spawn.
			for(let row in this.layers[0]){
				for(let tile in this.layers[0][row]){
					this.layers[0][row][tile] = "base_grass";
				}
			}
			let oreToGenerate:TileID;
			if(distanceFromSpawn < 3){
				oreToGenerate = "base_ore_coal";
			} else {
				oreToGenerate = (this.generator().chance(0.5)) ? "base_ore_coal" : "base_ore_iron";
			}
			let hill_x = Math.floor(this.generator().value * 16);
			let hill_y = Math.floor(this.generator().value * 16);

			//Makes a "hill", with an ore node in the middle, stone on the sides, and maybe stone in the corners.
			this.setTile(hill_x, hill_y, oreToGenerate);
			this.setTile(hill_x + 1, hill_y, "base_stone");
			this.setTile(hill_x - 1, hill_y, "base_stone");
			this.setTile(hill_x, hill_y + 1, "base_stone");
			this.setTile(hill_x, hill_y - 1, "base_stone");
			this.setTile(hill_x + 1, hill_y + 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
			this.setTile(hill_x + 1, hill_y - 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
			this.setTile(hill_x - 1, hill_y + 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
			this.setTile(hill_x - 1, hill_y - 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
		}


		return this;
	}
	display(currentframe:any){
		if(!Camera.isVisible([
			Pos.chunkToPixel(this.x), Pos.chunkToPixel(this.y),
			Pos.chunkToPixel(1), Pos.chunkToPixel(1)
		], consts.chunkCullingMargin)) return;//if offscreen return immediately
		currentframe.cps ++;
		
		if(currentframe.redraw){
			Gfx.strokeColor("#000000");
			Gfx.lineWidth(1);
			Gfx.layer("tile");
			for(let y = 0; y < consts.CHUNK_SIZE; y ++){
				for(let x = 0; x < consts.CHUNK_SIZE; x ++){
					currentframe.tps ++;
					let tileX = (this.x * consts.CHUNK_SIZE) + x;
					let tileY = (this.y * consts.CHUNK_SIZE) + y;
					const tile = this.layers[0][y][x];
					Gfx.tImage(Gfx.texture(`tile/${tile}`), tileX, tileY, 1, 1);
				}
			}
			if(currentframe.debug){
				for(let i = 1; i < consts.CHUNK_SIZE; i ++){
					Gfx.tLine((this.x * consts.CHUNK_SIZE) + i, (this.y * consts.CHUNK_SIZE), (this.x * consts.CHUNK_SIZE) + i, ((this.y + 1) * consts.CHUNK_SIZE));
					Gfx.tLine((this.x * consts.CHUNK_SIZE), (this.y * consts.CHUNK_SIZE) + i, ((this.x + 1) * consts.CHUNK_SIZE), (this.y * consts.CHUNK_SIZE) + i);
				}
			}
		}
		for(let y = 0; y < this.layers[1].length; y ++){
			for(let x = 0; x < this.layers[1][y].length; x ++){
				this.layers[1][y][x]?.display(currentframe);
			}
		}
		for(let y = 0; y < this.layers[2].length; y ++){
			for(let x = 0; x < this.layers[2][y].length; x ++){
				this.layers[2][y][x]?.display(currentframe);
			}
		}
		if(currentframe.debug){
			Gfx.layer("overlay");
			Gfx.strokeColor("#0000FF");
			Gfx.lineWidth(1);
			Gfx.lineTRect(
				this.x * consts.CHUNK_SIZE, this.y * consts.CHUNK_SIZE,
				consts.CHUNK_SIZE, consts.CHUNK_SIZE
			);
		}
	}
	export():ChunkData | null {
		let exportDataL1:(BuildingData | null)[][] = [];
		let hasBuildings = false;
		for(let row of this.layers[1]){
			let tempRow:(BuildingData | null)[] = [];
			for(let building of row){
				if(building instanceof Building){
					hasBuildings = true;
				}
				tempRow.push(building?.export() ?? null);
			}
			exportDataL1.push(tempRow);
		}

		let exportDataL2:(BuildingData | null)[][]= [];
		for(let row of this.layers[2]){
			let tempRow:(BuildingData | null)[] = [];
			for(let overlayBuild of row){
				if(overlayBuild instanceof Building){
					hasBuildings = true;
				}
				tempRow.push(overlayBuild?.export() ?? null);
			}
			exportDataL2.push(tempRow);
		}

		if(hasBuildings){
			return {
				layers: [exportDataL1, exportDataL2],
				version: consts.VERSION,
			};
		} else {
			return null;
		}
	}
}

class Item {
	pos: Pos;
	constructor(x:number, y:number, public id:ItemID){
		this.pos = Pos.fromPixelCoords(x, y);
	}
	update(currentframe:CurrentFrame){
		//nothing necessary
	}
	static display(id:ItemID, pos:Pos){
		Gfx.layer("items");
		Gfx.pImage(Gfx.texture(`item/${id}`), pos.pixelX, pos.pixelY, consts.ITEM_SIZE, consts.ITEM_SIZE, RectMode.CENTER);
	}
	display(currentframe:CurrentFrame){
		if(Camera.isPointVisible([this.pos.pixelX, this.pos.pixelY], consts.ITEM_SIZE)){
			currentframe.ips ++;
			Item.display(this.id, this.pos);
		}
	}
	export():ItemData | null {
		return {
			id: this.id,
			x: this.pos.pixelX,
			y: this.pos.pixelY,
		};
	}
	static read(data:ItemData){
		return new this(data.x, data.y, data.id);
	}
}

interface BlockDrawer<T> {
	(build:T, currentFrame:CurrentFrame):void;
}

@Abstract
class Building {
	static outputsItems = false;
	static acceptsItems = false;
	static id:RawBuildingID;
	/**Whether this building cannot be placed or broken.*/
	static immutable = false;
	static isOverlay = false;
	static displaysItem = false;
	static drawer:BlockDrawer<Building> | null = null;

	item: Item | null = null;
	pos:Pos;
	//https://www.typescriptlang.org/play?#code/CYUwxgNghgTiAEAzArgOzAFwJYHtXzgHMsBnDEGAHgCF4QAPc1YE+DATwAcQdF5rkWCMCypCAPgAUWYAC4yMUYQA08TDhizqqzjBycSsgN4AoeOfgBtAArxR8ANYh2vfgF0A-LP423AbhMAXwBKLQCAenCAFQALUiQ0TFx8GKhWACMQEHwsAFtOCBBc7PJgeChmeAB3DQdWRGgqwpISCHZVKAgMGJxkQhi2GIQwHFB4CBwcOoIQTrbqkCwYYAA6ExNIgEEc1DIKsARXbvjINNY4XRASEtYoeBIlQvh0wWElO1QAWhqYYTXTlr8V4iMTwUwWe4YKDYMB2OQKd4AXngACI0KgoMUyi8hCDCCiAhC9jD7lgAF4gWSoZC5TIweDIgCMhIs6QmYAcDMGpBWI12GBgyHU9LSbC4PD4AlxShZ5kIIAwAElgJJguCIRY4BhkDB8McSCs2TgOSsZLL4IEzBZkJxgNCQKqjJbLSYAawAMJ4ABuzg0dEY2RYQOloPV5mJWFhJG4IDk1NpFC5zKt5kiiuqFQwbBw8FSPvgIkQiAoJTF3FYrj5PpcMFYVSw3QLWCLJdQWejWRYKfgkQAsuwkEsyOVOLocFAwAMqqKMDmwHB7eV4KgQFU1NBAQwmHi1N7ffT6427oXi3A2-cY2UvZ1kAh7N076gG1hOuSKKoXlnutCCzgrqgAHIs1Aa4YHzWdngQO43Q+QYEEICZ0k6e4Rm4NYITTNQF1KJciFIch6RQdBsDwao4kneBkGuVgAHl0gAK3ADAVjOLBCD1HN5RXGBFwfdcznKLNBTbPIoMqMgNDvLN7GgvAmCzXIoE4dCLEiWJ4h+aZuBgYtMHmRBRBAD9kC-IY4AA1h6KorM8DvFpb1kbtMJXWNuVYCBDMgiYqhU8wjQ5ABCbwOG4VxPVQasNHNLZ0hwfN7yGYM3lBN1VCqVIs3TBcIHmadz3iFFRFPOCy0OPh9V5PAFCFWcYBRYysyicUSHnLBOGk1BT1YBtylYFEADFEhI1AUTIyMBniKiQGaEgOkqdNA0ozhcygL13gg1CB31Z4cCECgCkXDyV3KVB2GndhfKWu1yEdbsIQq-yHBWDtY3NZ11hg3tDPpLdA1YKVksIMFuwjWFckMgBlS8qRpOkuQANgABnNR6gtK1wvu480bWuh01TuiwHvZJ7wZXKHOzeoJ1jwsgKEkFFWhwKp6vgcLIpgVQjAvTtvERlYAFYLWCAIaYI+nEDSDAWbZ-dOe52NvAAZiFkWQGIWmYHp9I2M+UmKBZzH3zBUkKW8RkVaAA
	block = this.constructor as typeof Building;
	constructor(x:number, y:number, public readonly meta:BuildingMeta, public level:Level){
		this.pos = Pos.fromTileCoords(x, y, false);
	}
	static changeMeta(meta:BuildingMeta, tileX:number, tileY:number, level:Level):BuildingMeta {
		return meta;
	}
	static getID(type:RawBuildingID, direction:Direction, modifier:number):BuildingIDWithMeta {
		return [type, 0];
	}
	static canBuildAt(tileX:number, tileY:number, level:Level){
		//By default, buildings cant be built on water
		return level.tileAtByTile(tileX, tileY) != "base_water";
	}
	/**Returns texture size and offset given meta. */
	static textureSize(meta:number):[size:[number, number], offset:[number, number]] {
		return [[1, 1], [0, 0]];
	}
	static canOutputTo(building:Building | null){
		return building instanceof Conveyor;
	}
	/**Called to destroy the building. Should remove all references to it. */
	break(){
		if(this.block.isOverlay) this.level.writeOverlayBuild(this.pos.tileX, this.pos.tileY, null);
		else this.level.writeBuilding(this.pos.tileX, this.pos.tileY, null);
	}
	update(currentFrame:CurrentFrame){
		this.item?.update(currentFrame);
	}
	stringID(){
		return stringifyMeta(this.block.id, this.meta);
	}
	centeredPos(){
		return Pos.fromTileCoords(this.pos.tileX, this.pos.tileY, true);
	}
	static display(id:BuildingIDWithMeta, pos:Pos, layer?:(keyof typeof Gfx.layers)){
		const block = Buildings.get(id[0]);
		const textureSize = block.textureSize(id[1]);
		layer ??= block.isOverlay ? "overlayBuilds" : "buildings"
		Gfx.tImage(
			Gfx.texture(`building/${stringifyMeta(...id)}`),
			pos.tileX + textureSize[1][0], pos.tileY + textureSize[1][1],
			...textureSize[0],
			Gfx.layers[layer]
		);
	}
	display(currentFrame:CurrentFrame, layer:(keyof typeof Gfx.layers) = this.block.isOverlay ? "overlayBuilds" : "buildings"){
		Gfx.layer(layer);
		Building.display([this.block.id, this.meta], this.pos, layer);
		this.block.drawer?.(this, currentFrame);
		if(this.item instanceof Item && this.block.displaysItem){
			this.item.display(currentFrame);
		}
	}
	hasItem():Item | null {
		if(this.item) return this.item;
		return null;
	}
	removeItem():Item | null {
		if(this.item){
			let temp = this.item;
			this.item = null;
			return temp;
		}
		return null;
	}
	/**Whether a building can ever accept items from a particular side. */
	acceptsItemFromSide(side:Direction):boolean {
		return this.block.acceptsItems;
	}
	/**Whether a building can ever output items to a particular side. */
	outputsItemToSide(side:Direction):boolean {
		return this.block.outputsItems;
	}
	buildAt(direction:Direction):Building | null {
		return this.level.buildingAtTile(this.pos.tileX + direction.vec[0], this.pos.tileY + direction.vec[1]);
	}
	buildAtOffset(offset:[x:number, y:number]):Building | null {
		return this.level.buildingAtTile(this.pos.tileX + offset[0], this.pos.tileY + offset[1]);
	}
	spawnItem(id:ItemID){
		for(const direction of Direction){
			const build = this.buildAt(direction);
			if(
				build && this.block.canOutputTo(build) &&
				this.outputsItemToSide(direction) && build.acceptsItemFromSide(direction.opposite) && build.acceptItem(new Item(
					(this.pos.tileX + 0.5 + direction.vec[0] * 0.6) * consts.TILE_SIZE,
					(this.pos.tileY + 0.5 + direction.vec[1] * 0.6) * consts.TILE_SIZE,
					id
				), direction.opposite)
			) return true;
		}
		return false;
	}
	acceptItem(item:Item, side:Direction | null):boolean {
		if(this.item === null && this.block.acceptsItems && (side == null || this.acceptsItemFromSide(side))){
			this.item = item;
			return true;
		} else {
			return false;
		}
	}
	export():BuildingData {
		return {
			x: this.pos.tileX,
			y: this.pos.tileY,
			id: this.block.id,
			meta: this.meta,
			item: this.item?.export() ?? null
		};
	}
	/**Must be called with a "this" context obtained from Buildings.get(id). */
	static read(buildingData:BuildingData, level:Level):Building {
		//"this" refers to the subclass that read() was called on, which should be Buildings.get(id)
		//This is done because subclasses may want to override the read() method, so you have to Buildings.get() anyway.
		const build = new this(buildingData.x, buildingData.y, buildingData.meta, level);
		if(buildingData.item) build.item = Item.read(buildingData.item);
		return build;
	}
}


@Abstract
class BuildingWithRecipe extends Building {
	timer: number = -1;
	recipe: Recipe | null = null;
	items: Item[] = [];
	static outputsItems = true;
	static acceptsItems = true;
	static recipeType: {recipes: Recipe[]};
	static recipeMaxInputs = 3;
	block!:typeof BuildingWithRecipe;
	constructor(tileX:number, tileY:number, meta:BuildingMeta, level:Level){
		super(tileX, tileY, meta, level);
	}
	acceptItem(item:Item):boolean {
		for(let i = 0; i < this.block.recipeMaxInputs; i ++){
			//repeat recipeMaxInputs times
			if(!this.items[i] && !this.items.map(item => item.id).includes(item.id)){
				//if there is nothing in this item slot and the new item's id is not in the list of current items' ids
				for(let recipe of this.block.recipeType.recipes){
					//for each recipe this building can do
					if(!recipe.inputs) continue;//If the recipe has no inputs, it cant be the right one
					if(!this.items.map(item => recipe.inputs!.includes(item.id)).includes(false) && recipe.inputs.includes(item.id)){
						//if all of the current items are inputs of the recipe and the item is an input of the recipe
						this.items[i] = item;
						if(recipe.inputs.length == i + 1){
							this.setRecipe(recipe);
						}
						return true;
					}
				}
				return false;
			}
		}
		return false;
	}
	hasItem(){
		return null;
	}
	removeItem(){
		return null;
	}
	setRecipe(recipe:Recipe){
		if(!(recipe.inputs instanceof Array)) throw new ShouldNotBePossibleError("tried to set invalid recipe");
		this.recipe = recipe;
		this.timer = recipe.duration;
	}
	update(){
		if(this.timer > 0){
			this.timer --;
		} else if(this.timer == 0 && this.recipe){
			if(this.spawnItem(this.recipe.outputs[0])){
				this.timer = -1;
				this.items = [];
				this.recipe = null;
			}
		}
	}
	static makeDrawer<T extends BuildingWithRecipe>(drawer:(build:T, e:AnimationData, currentFrame:CurrentFrame) => void, ...drawers:BlockDrawer<T>[]){
		return ((build:T, currentFrame:CurrentFrame) => {
			if(build.recipe){
				Gfx.layer("buildings");
				drawer(build, getAnimationData(1 - (build.timer) / build.recipe.duration), currentFrame);
			}
			drawers.forEach(d => d(build, currentFrame));
			BuildingWithRecipe.makeDrawer((build, e, currentFrame) => {build.recipe});
		}) as BlockDrawer<Building>;
		//This is an unsafe cast
		//The issue is that static properties can't reference this in their type declaration, so I can't tell typescript that a (T extends BuildingWithRecipe)'s drawer won't get called with something other than a T (so it only accepts BuildingDrawer<Building>) without adding an extra line of boilerplate to each class.
	}
	static progressDrawer<T extends BuildingWithRecipe>(){
		return ((build:T, currentFrame:CurrentFrame) => {
			if(build.recipe){
				Gfx.layer("buildings");
				Gfx.fillColor("blue");
				Gfx.tEllipse(...build.centeredPos().tile, 0.3, 0.3, 0, 0, (1 - (build.timer) / build.recipe.duration) * 2 * Math.PI);
			}
		}) as BlockDrawer<Building>;
	}
	static outputDrawer<T extends BuildingWithRecipe>(){
		return ((build:T, currentFrame:CurrentFrame) => {
			if(build.recipe){
				Item.display(build.recipe.outputs[0], build.centeredPos());
			}
		}) as BlockDrawer<Building>;
	}
}


class Miner extends Building {
	timer: number;
	miningItem: ItemID | null = null;
	static outputsItems = true;
	constructor(tileX:number, tileY:number, meta:BuildingMeta, level:Level){
		super(tileX, tileY, meta, level);
		this.timer = 61;
		for(let recipe of recipes.base_mining.recipes){
			if(recipe.tile == level.tileAtByTile(tileX, tileY)){
				this.miningItem = recipe.outputs[0];
				return;
			}
		}
		console.warn(`Miner cannot mine tile at ${tileX}, ${tileY}`);
	}
	static canBuildAt(tileX:number, tileY:number, level:Level):boolean {
		return level.tileAtByTile(tileX, tileY).split("_")[1] == "ore";
	}
	update(){
		if(!this.miningItem) return;
		if(this.timer > 0){
			this.timer --;
		} else {
			if(this.spawnItem(this.miningItem)){
				this.timer = 61;
				trigger(triggerType.buildingRun, this.block.id, this.miningItem);
			}
		}
	}
}



class TrashCan extends Building {
	static acceptsItems = true;
	acceptItem(item:Item){
		return true;
	}
}


class Conveyor extends Building {
	static displaysItem = true;
	static acceptsItems = true;
	static outputsItems = true;
	/**Speed of the item in pixels per update. */
	static speed = 1;
	block!:typeof Conveyor;
	outputSide:Direction = Conveyor.outputSide(this.meta);
	acceptsItemFromSide(side:Direction):boolean {
		//Bit cursed, but far better than what it used to be
		switch(side){
			case Direction.left: return [
				0x00, 0x07, 0x0B, 0x0C, 0x0D, 0x0F, 0x13, 0x15, 0x17, 0x18, 0x19, 0x1B,
			].includes(this.meta);
			case Direction.up: return [
				0x01, 0x05, 0x09, 0x0D, 0x0E, 0x0F, 0x11, 0x14, 0x16, 0x18, 0x19, 0x1A,
			].includes(this.meta);
			case Direction.right: return [
				0x02, 0x06, 0x0A, 0x0E, 0x10, 0x11, 0x12, 0x15, 0x17, 0x19, 0x1A, 0x1B,
			].includes(this.meta);
			case Direction.down: return [
				0x03, 0x08, 0x04, 0x0C, 0x10, 0x12, 0x13, 0x14, 0x16, 0x18, 0x1A, 0x1B,
			].includes(this.meta);
			default: never();
		}
	}
	outputsItemToSide(side:Direction):boolean {
		//Bit cursed, but far better than what it used to be
		switch(side){
			case Direction.left: return [
				2, 8, 9, 16, 17, 22, 26
			].includes(this.meta);
			case Direction.up: return [
				3, 10, 11, 18, 19, 23, 27
			].includes(this.meta);
			case Direction.right: return [
				0, 4, 5, 12, 13, 20, 24
			].includes(this.meta);
			case Direction.down: return [
				1, 6, 7, 14, 15, 21, 25
			].includes(this.meta);
			default: never();
		}
	}
	/**Not sure if this function is a good idea? */
	static outputSide(meta:number):Direction {
		if([2, 8, 9, 16, 17, 22, 26].includes(meta)) return Direction.left;
		if([3,10,11, 18, 19, 23, 27].includes(meta)) return Direction.up;
		if([0, 4, 5, 12, 13, 20, 24].includes(meta)) return Direction.right;
		if([1, 6, 7, 14, 15, 21, 25].includes(meta)) return Direction.down;
		throw new Error(`Invalid meta ${meta}`);
	}
	static getID(type:RawBuildingID, direction:Direction, modifier:number):BuildingIDWithMeta {
		return [type, direction.num] as BuildingIDWithMeta;
	}
	static changeMeta(meta:BuildingMeta, tileX:number, tileY:number, level:Level):BuildingMeta {
		if(keybinds.placement.force_straight_conveyor.isHeld()){
			return meta;
			//If holding shift, just return a straight conveyor.
		}

		let hasLeftBuilding = level.buildingAtTile(tileX - 1, tileY)?.outputsItemToSide(Direction.right) ?? false;
		let hasTopBuilding = level.buildingAtTile(tileX, tileY - 1)?.outputsItemToSide(Direction.down) ?? false;
		let hasRightBuilding = level.buildingAtTile(tileX + 1, tileY)?.outputsItemToSide(Direction.left) ?? false;
		let hasBottomBuilding = level.buildingAtTile(tileX, tileY + 1)?.outputsItemToSide(Direction.up) ?? false;
		
		switch(meta){
			case 0:
				if(hasLeftBuilding){
					if(hasTopBuilding && hasBottomBuilding) return 0x18;
					else if(hasTopBuilding) return 0x0D;
					else if(hasBottomBuilding) return 0x0C;
					else return 0x00;
				} else {
					if(hasTopBuilding && hasBottomBuilding) return 0x14;
					else if(hasTopBuilding) return 0x05;
					else if(hasBottomBuilding) return 0x04;
					else return 0x00;
				}
			case 1:
				if(hasTopBuilding){
					if(hasLeftBuilding && hasRightBuilding) return 0x19;
					else if(hasLeftBuilding) return 0x0F;
					else if(hasRightBuilding) return 0x0E;
					else return 0x01;
				} else {
					if(hasLeftBuilding && hasRightBuilding) return 0x15;
					else if(hasLeftBuilding) return 0x07;
					else if(hasRightBuilding) return 0x06;
					else return 0x01;
				}
			case 2:
				if(hasRightBuilding){
					if(hasTopBuilding && hasBottomBuilding) return 0x1A;
					else if(hasTopBuilding) return 0x11;
					else if(hasBottomBuilding) return 0x10;
					else return 0x02;
				} else {
					if(hasTopBuilding && hasBottomBuilding) return 0x16;
					else if(hasTopBuilding) return 0x09;
					else if(hasBottomBuilding) return 0x08;
					else return 0x02;
				}
			case 3:
				if(hasBottomBuilding){
					if(hasLeftBuilding && hasRightBuilding) return 0x1B;
					else if(hasLeftBuilding) return 0x13;
					else if(hasRightBuilding) return 0x12;
					else return 0x03;
				} else {
					if(hasLeftBuilding && hasRightBuilding) return 0x17;
					else if(hasLeftBuilding) return 0x0B;
					else if(hasRightBuilding) return 0x0A;
					else return 0x03;
				}
			default: return meta;
		}
	}
	update(){
		if(this.item instanceof Item){
			if(this.item.pos.tileX != this.pos.tileX || this.item.pos.tileY != this.pos.tileY){
				let building = this.buildAt(this.outputSide);
				if(!building) return;
				if(building.acceptItem(this.item, this.outputSide.opposite)){
					this.item = null;
				}
				return;
			}
			switch(this.meta){
				//yes I know there's no need to write the ids in hex but why the heck not
				case 0x00:
					if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x01:
					if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x02:
					if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x03:
					if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x04:
					if(this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles > 0.5)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x05:
					if(this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles < 0.5)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x06:
					if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY += this.block.speed;
					else if(this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x07:
					if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY += this.block.speed;
					else if(this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x08:
					if(this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x09:
					if(this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x0A:
					if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					else if(this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x0B:
					if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					else if(this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x0C:
					if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x0D:
					if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x0E:
					if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.block.speed;
					else if(this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x0F:
					if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.block.speed;
					else if(this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x10:
					if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x11:
					if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY += this.block.speed;
					break;
				case 0x12:
					if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY -= this.block.speed;
					else if(this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x13:
					if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY -= this.block.speed;
					else if(this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					break;
				case 0x14:
					if(this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
					break;
				case 0x15:
					if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5)
						this.item.pos.pixelY += this.block.speed;
					else if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
					break;
				case 0x16:
					if(this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
					break;
				case 0x17:
					if(this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5)
						this.item.pos.pixelY -= this.block.speed;
					else if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
					break;
				case 0x18:
					if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.block.speed;
					else if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;	
					break;
				case 0x19:
					if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.block.speed;
					else if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
					break;
				case 0x1A:
					if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX -= this.block.speed;
					else if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
					break;
				case 0x1B:
					if(this.item.pos.tileOffsetXCentered)
						this.item.pos.pixelY -= this.block.speed;
					else if(this.item.pos.tileOffsetYCentered)
						this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
					break;
			}
		}
	}
}

class OverlayBuild extends Building {
	static isOverlay = true;
	buildingUnder(){
		return this.level.buildingAtPos(this.pos);
	}
}

class Extractor extends OverlayBuild {
	static displaysItem = true;
	static speed = 1;
	static outputsItems = true;
	block!:typeof Extractor;
	outputOffset: [x:number, y:number] = this.block.getOutputTile(this.meta)
	static textureSize(meta:BuildingMeta){
		switch(meta){
			case 0: return [[2, 1], [0, 0]] as [size:[number, number], offset:[number, number]];
			case 1: return [[1, 2], [0, 0]] as [size:[number, number], offset:[number, number]];
			case 2: return [[2, 1], [-1, 0]] as [size:[number, number], offset:[number, number]];
			case 3: return [[1, 2], [0, -1]] as [size:[number, number], offset:[number, number]];
			case 4: return [[3, 1], [0, 0]] as [size:[number, number], offset:[number, number]];
			case 5: return [[1, 3], [0, 0]] as [size:[number, number], offset:[number, number]];
			case 6: return [[3, 1], [-2, 0]] as [size:[number, number], offset:[number, number]];
			case 7: return [[1, 3], [0, -2]] as [size:[number, number], offset:[number, number]];
			case 8: return [[4, 1], [0, 0]] as [size:[number, number], offset:[number, number]];
			case 9: return [[1, 4], [0, 0]] as [size:[number, number], offset:[number, number]];
			case 10: return [[4, 1], [-3, 0]] as [size:[number, number], offset:[number, number]];
			case 11: return [[1, 4], [0, -3]] as [size:[number, number], offset:[number, number]];
			default: return [[1, 1], [0, 0]] as [size:[number, number], offset:[number, number]];
		}
	}
	static getID(type:RawBuildingID, direction:Direction, modifier:number):BuildingIDWithMeta {
		return [type, (modifier * 4) + direction.num] as BuildingIDWithMeta;
	}
	static getOutputTile(meta:BuildingMeta):[x:number, y:number] {
		switch(meta){
			case 0: return [1, 0];
			case 1: return [0, 1];
			case 2: return [-1, 0];
			case 3: return [0, -1];
			case 4: return [2, 0];
			case 5: return [0, 2];
			case 6: return [-2, 0];
			case 7: return [0, -2];
			case 8: return [2, 0];
			case 9: return [0, 2];
			case 10: return [-2, 0];
			case 11: return [0, -2];
			default: throw new Error(`Invalid meta ${meta}`);
		}
	}

	grabItemFromTile(filter:(item:Item) => boolean = item => item instanceof Item){

		if(
			this.buildingUnder() instanceof Building &&
			this.buildingUnder()!.hasItem() &&
			filter(this.buildingUnder()!.hasItem()!)
		){
			this.item = this.buildingUnder()!.removeItem()!;
			this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
			this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
		}

	}

	dropItem(){
		if(this.item instanceof Item){
			if(this.buildAtOffset(this.outputOffset)?.acceptItem(this.item, null)){
				this.item = null;
			}
		} else {
			console.error(this);
			throw new InvalidStateError(`no item to drop; extractor at ${this.pos.tileX} ${this.pos.tileY}`);
		}
	}

	update(){
		if(this.item instanceof Item){
			switch(this.meta){
				case 0x00:
					if(this.item.pos.tileXExact >= this.pos.tileX + 1.5) return this.dropItem();
					else this.item.pos.pixelX += this.block.speed;
					break;
				case 0x01:
					if(this.item.pos.tileYExact >= this.pos.tileY + 1.5) return this.dropItem();
					else this.item.pos.pixelY += this.block.speed;
					break;
				case 0x02:
					if(this.item.pos.tileXExact <= this.pos.tileX - 0.5) return this.dropItem();
					else this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x03:
					if(this.item.pos.tileYExact <= this.pos.tileY - 0.5) return this.dropItem();
					else this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x04:
					if(this.item.pos.tileXExact >= this.pos.tileX + 2.5) return this.dropItem();
					else this.item.pos.pixelX += this.block.speed;
					break;
				case 0x05:
					if(this.item.pos.tileYExact >= this.pos.tileY + 2.5) return this.dropItem();
					else this.item.pos.pixelY += this.block.speed;
					break;
				case 0x06:
					if(this.item.pos.tileXExact <= this.pos.tileX - 1.5) return this.dropItem();
					else this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x07:
					if(this.item.pos.tileYExact <= this.pos.tileY - 1.5) return this.dropItem();
					else this.item.pos.pixelY -= this.block.speed;
					break;
				case 0x08:
					if(this.item.pos.tileXExact >= this.pos.tileX + 3.5) return this.dropItem();
					else this.item.pos.pixelX += this.block.speed;
					break;
				case 0x09:
					if(this.item.pos.tileYExact >= this.pos.tileY + 3.5) return this.dropItem();
					else this.item.pos.pixelY += this.block.speed;
					break;
				case 0x0A:
					if(this.item.pos.tileXExact <= this.pos.tileX - 2.5) return this.dropItem();
					else this.item.pos.pixelX -= this.block.speed;
					break;
				case 0x0B:
					if(this.item.pos.tileYExact <= this.pos.tileY - 2.5) return this.dropItem();
					else this.item.pos.pixelY -= this.block.speed;
					break;
			}
		} else {
			this.grabItemFromTile();
		}
	}

	acceptsItemFromSide(side:Direction){ return false; }
	acceptItem(item:Item){ return false; }
}

class StorageBuilding extends Building {
	inventory:Item[] = [];
	static capacity:number = 64;
	static acceptsItems = true;
	block!:typeof StorageBuilding;
	hasItem(){
		if(this.inventory.length != 0) return this.inventory[0];
		return super.hasItem();
	}
	removeItem(){
		if(this.inventory?.length > 0){
			return this.inventory.pop()!;
		}
		return super.removeItem();
	}
	acceptItem(item:Item) {
		if(this.inventory.length < this.block.capacity){
			this.inventory.push(item);
			return true;
		} else return false;
	}
	export():BuildingData {
		let inv:ItemData[] = [];
		if(this.inventory){
			for(let item of this.inventory){
				const data = item.export();
				if(data) inv.push(data);
			}
		}
		return {
			x: this.pos.tileX,
			y: this.pos.tileY,
			id: this.block.id,
			meta: this.meta,
			item: null,
			inv: inv
		};
	}
	static read(buildingData:BuildingData, level:Level){
		const build = super.read(buildingData, level) as StorageBuilding;
		if(buildingData.inv){
			for(const itemData of buildingData.inv){
				build.inventory.push(Item.read(itemData));
			}
		}
		return build;
	}
}


class ResourceAcceptor extends Building {
	static immutable = true;
	static acceptsItems = true;
	acceptItem(item:Item){
		this.level.resources[item.id] ??= 0;
		this.level.resources[item.id] ++;
		return true;
	}
}

class MultiBlockController extends BuildingWithRecipe {
	block!: typeof MultiBlockController;
	secondaries: MultiBlockSecondary[] = [];
	static multiblockSize = [2, 2] as [number, number];
	static textureSize(meta: number) {
		return [this.multiblockSize, [0, 0]] as [size: [number, number], offset: [number, number]];
	}
	static getOffsetsForSize(width:number, height:number){
		let offsets = new Array<[x:number, y:number]>();
		for(let i = 0; i < width; i ++){
			for(let j = 0; j < height; j ++){
				if(i == 0 && j == 0) continue;
				offsets.push([i, j]);
			}
		}
		return offsets;
	}
	centeredPos(){
		return Pos.fromTileCoords(this.pos.tileX + this.block.multiblockSize[0] / 2, this.pos.tileY + this.block.multiblockSize[1] / 2, false);
	}
	break(){
		this.secondaries.forEach(secondary => secondary.break(true));
		this.secondaries = [];
		super.break();
	}
	update(){
		if(this.secondaries.length != this.block.multiblockSize[0] * this.block.multiblockSize[1] - 1){
			if(!this.resetSecondaries()) this.break();
		}
		super.update();
	}
	/**Attempts to reconnects to secondaries, returning if the attempt succeeded. */
	resetSecondaries():boolean {
		let possibleSecondaries = MultiBlockController.getOffsetsForSize(...this.block.multiblockSize)
		.map(([xOffset, yOffset]) =>
			this.level.buildingAtTile(this.pos.tileX + xOffset, this.pos.tileY + yOffset)
		);
		for(let possibleSecondary of possibleSecondaries){
			if(
				possibleSecondary instanceof MultiBlockSecondary && 
				(possibleSecondary.controller == this || possibleSecondary.controller == undefined)
			){
				possibleSecondary.controller = this;
				this.secondaries.push(possibleSecondary);
			} else {
				return false;
			}
		}
		return true;
	}
	spawnItem(id: ItemID):boolean {
		if(super.spawnItem(id)){
			return true;
		}
		for(let secondary of this.secondaries){
			if(secondary.spawnItem(id)){
				return true;
			}
		}
		return false;
	}
}

class MultiBlockSecondary extends Building {
	/**Assigned in buildBuilding */
	controller: MultiBlockController | null = null;
	static outputsItems = true;
	static acceptsItems = true;
	acceptItem(item: Item):boolean {
		return this.controller?.acceptItem(item) ?? false;
	}
	break(isRecursive?:boolean){
		if(!isRecursive){
			this.controller?.break();
		} else {
			this.controller = null;
			super.break();
		}
	}
	display(currentFrame:CurrentFrame){
		//Do nothing, the controller is responsible for displaying
	}
	update(){
		if(!(this.controller instanceof MultiBlockController)){
			this.break();
		}
	}
}


/**A combination of an ItemID and an amount. The amount is frequently mutated by function calls. */
type ItemStack = [id:ItemID, amount:number];

class ItemModule {
	storage:Partial<Record<ItemID, number>> = {};
	constructor(public maxCapacity:number = 10){}
	get(id:ItemID){
		return this.storage[id] ?? 0;
	}
	has(id:ItemID){
		return this.storage[id] === 0 || this.storage[id] === undefined;
	}
	/**
	 * Attempts to grab an ItemStack, mutating it.
	 * @returns whether the ItemStack was fully consumed.
	 **/
	addFrom(stack:ItemStack):boolean {
		const remainingSpace = this.maxCapacity - this.get(stack[0]);
		const amountTransferred = Math.max(0, Math.min(remainingSpace, stack[1]));
		this.storage[stack[0]] ??= 0;
		this.storage[stack[0]]! += amountTransferred;
		return (stack[1] -= amountTransferred) <= 0;
	}
	/**
	 * Attempts to output to an ItemStack, mutating it.
	 * @returns whether the output stack is full.
	 */
	removeTo(stack:ItemStack, maxCapacity = Infinity):boolean {
		const remainingSpace = maxCapacity - stack[1];
		const amountTransferred = Math.min(remainingSpace, this.get(stack[0]));
		this.storage[stack[0]] ??= 0;
		this.storage[stack[0]]! -= amountTransferred;
		return (stack[1] += amountTransferred) == maxCapacity;
	}
	
}


interface PowerProducer extends Building {
	/**
	 * Called between preUpdate and update.
	 * @returns the maximum power that this building can produce on this tick.
	**/
	getMaxPowerProduction():number;
}
interface PowerConsumer extends Building {
	/**
	 * Called between preUpdate and update.
	 * @returns the amount of power that this building wants on this tick.
	 **/
	getRequestedPower():number;
}

