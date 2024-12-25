/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains classes used for the world, like Level, Chunk, and Item. */

import { ItemIDs, Buildings, Fluids } from "../content/content.js";
import { bundle } from "../content/i18n.js";
import { ItemStack } from "../content/registry.js";
import type { ItemID, LevelData, TileID, BuildingIDWithMeta, CurrentFrame, ChunkData, BuildingData, LegacyBuildingData, LegacyBuildingID, ItemData } from "../types.js";
import { Camera, Gfx, RectMode } from "../ui/graphics.js";
import { GUI } from "../ui/gui.js";
import { keybinds, Input } from "../ui/input.js";
import { crash, parseError, forceType, tooltip, pseudoRandom, hex, mapLegacyRawBuildingID, getLegacyRawBuildingID, stringifyMeta, constrain } from "../util/funcs.js";
import { Pos, PosT, add } from "../util/geom.js";
import { consts, Game, settings } from "../vars.js";
import { Building, PowerGrid } from "./building.js";
import { MultiBlockController, OverlayBuild } from "./building-types.js";


export class Level {
	resources: Record<ItemID, number> = Object.fromEntries(ItemIDs.map(id => [id, 0]));
	//TODO genericify
	timeSinceStoneRanOut = Date.now();
	resourceDisplayData: Record<ItemID, {
		shouldShowAlways:boolean;
		amountRequired:number | null;
		flashEffect:string | null;
		flashExpireTime:number;
	}> = Object.fromEntries(ItemIDs.map(id =>
		[id, {
			shouldShowAlways: false,
			amountRequired: null,
			flashEffect: null,
			flashExpireTime: 0,
		}]
	));
	storage = new Map<string, Chunk>();
	format: string;
	uuid: string;
	grid = new PowerGrid();
	buildings = new Set<Building>();
	static startResources:ItemStack[] = [["base_stone", 50]];
	constructor(public seed:number, applyStartResources:boolean){
		this.format = consts.VERSION;
		this.uuid = Math.random().toString().substring(2);
		if(applyStartResources){
			for(const [id, amount] of Level.startResources){
				this.resources[id] = amount;
			}
		}
	}
	static read(data:LevelData){
		// Read a level from JSON
		let {chunks, resources, seed, version, uuid} = data;
		const level = new Level(seed, false);
		if(!Array.isArray(resources)) resources = Object.entries(resources);
		for(const [item, amount] of resources){
			if(!isNaN(amount)) level.resources[item] = amount;
		}
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
			crash(`Error loading chunk ${position}: ${parseError(err)}`)
		}
		level.buildings.forEach(b => {
			if(b instanceof MultiBlockController){
				//If the secondary is in a different chunk and updates first, the secondary will not know how to find the controller and break, which causes the multiblock to break on loading a save
				b.resetSecondaries();
			}
		})
		return level;
	}
	generate(){
		this.generateNecessaryChunks();
		this.buildBuilding(-2, -2, ["base_resource_acceptor", 1]);
		for(const [x, y] of MultiBlockController.getOffsetsForSize(4, 4)){
			this.buildBuilding(-2 + x, -2 + y, ["base_resource_acceptor", 0]);
		}
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
		let [chunkX, chunkY] = Camera.unproject(0, 0).map(Pos.pixelToChunk);
		const xOffsets = [0, 1, 2, 3, 4];
		const yOffsets = [0, 1, 2, 3];
		for(const xOffset of xOffsets){
			for(const yOffset of yOffsets){
				this.generateChunk(chunkX + xOffset, chunkY + yOffset);
			}
		}
		//good enough
	}

	tileAtByPixel(pixelX:number, pixelY:number):TileID {
		return this.getChunk(
			Pos.pixelToTile(pixelX),
			Pos.pixelToTile(pixelY)
		).tileAt(Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelX)), Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelY)));
	}
	tileAtByTile(tileX:number, tileY:number):TileID {
		return this.getChunk(
			tileX,
			tileY
		).tileAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
	}
	setTileByTile(tileX:number, tileY:number, tile:TileID){
		this.getChunk(tileX,tileY).setTile(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), tile);
		Game.forceRedraw = true;
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
	writeBuilding(tileX:number, tileY:number, building:Building | null){
		this.getChunk(tileX,tileY).setBuilding(
			Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building
		);
	}
	writeOverlayBuild(tileX:number, tileY:number, building:OverlayBuild | null){
		this.getChunk(tileX,tileY).setOverlayBuild(
			Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building
		);
	}
	
	
	displayGhostBuilding(tileX:number, tileY:number, buildingID:BuildingIDWithMeta, currentFrame:CurrentFrame){ //TODO refactor this method
		Gfx.layer("ghostBuilds");
		if(keybinds.placement.break_building.isHeld() || Input.rightMouseDown){
			Gfx.alpha(0.9);
			Gfx.tImage(Gfx.texture("misc/breakunderlay"), tileX, tileY, 1, 1);
			Gfx.alpha(1);
			return;
		}
		if(buildingID[0] == "base_null") return;
		if(!this.hasChunk(tileX, tileY)) return;

		const block = Buildings.get(buildingID[0]);

		let changedID:BuildingIDWithMeta = [buildingID[0], buildingID[1]];
		changedID[1] = block.changeMeta(changedID[1], tileX, tileY, this);
		let textureSize = block.textureSize(buildingID[1]);


		//Draw underlay
		const isError =
			!this.hasResources(block.buildCost, 100) ||
			!block.canBuildAt(tileX, tileY, this) ||
			!this.canBuildBuilding([tileX, tileY], block);
		//Make the gray/red border 1x1 if the block is rectangular, but NxN if it's square
		//because making the border rectangular looks weird
		const underlayTextureSize = textureSize[0][0] == textureSize[0][1] ? textureSize : [[1, 1], [0, 0]];
		
		Gfx.tImage(
			Gfx.texture(isError ? "misc/invalidunderlay" : "misc/ghostunderlay"),
			tileX + underlayTextureSize[1][0], tileY + underlayTextureSize[1][1],
			...underlayTextureSize[0]
		);
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
	canBuildBuilding(tile:PosT, block:typeof Building){
		const size:PosT = block.prototype instanceof MultiBlockController ? (block as typeof MultiBlockController).multiblockSize : [1, 1];
		for(const [x, y] of MultiBlockController.getOffsetsForSize(...size)
			.concat([[0, 0]])
			.map(pos => add(pos, tile))
		){
			const build = this.buildingAtTile(x, y);
			if(build?.block.immutable) return false;
		}
		return true;
	}
	buildBuilding(tileX:number, tileY:number, buildingID:BuildingIDWithMeta):boolean {
		
		if(buildingID[0] == "base_null") return true;
		const block = Buildings.get(buildingID[0]);
		if(!this.canBuildBuilding([tileX, tileY], block)) return false;
		buildingID = [buildingID[0], block.changeMeta(buildingID[1], tileX, tileY, this)];

		//Only overwrite the same building once per build attempt.
		//Otherwise, you could constantly overwrite a building on every frame you tried to build, which is not good.
		if(block.isOverlay){
			if(
				this.overlayBuildAtTile(tileX, tileY)?.block.id == buildingID[0] &&
				this.overlayBuildAtTile(tileX, tileY)?.meta == buildingID[1] &&
				!Input.canOverwriteBuilding()
			) return false;
			this.overlayBuildAtTile(tileX, tileY)?.break();
		} else {
			if(
				this.buildingAtTile(tileX, tileY)?.block.id == buildingID[0] &&
				this.buildingAtTile(tileX, tileY)?.meta == buildingID[1] &&
				!Input.canOverwriteBuilding()
			) return false;
			this.buildingAtTile(tileX, tileY)?.break();
		}
		Input.buildingPlaced = true;

		if(!block.canBuildAt(tileX, tileY, this)) return false;
		if(!this.hasResources(block.buildCost, 1500)) return false;
		if(block.prototype instanceof MultiBlockController){
			//Multiblock handling
			forceType<typeof MultiBlockController>(block);
			const offsets = MultiBlockController.getOffsetsForSize(...block.multiblockSize);
			
			//Break all the other buildings under
			for(const [xOffset, yOffset] of offsets){
				const buildUnder = this.buildingAtTile(tileX + xOffset, tileY + yOffset);
				if(buildUnder?.block.immutable) return false;
				buildUnder?.break();
			}

			this.drainResources(block.buildCost);
			
			//Create buildings
			let controller = new block(tileX, tileY, buildingID[1], this);
			controller.secondaries = offsets.map(([x, y]) => new block.secondary(tileX + x, tileY + y, 0, this));
			//Link buildings
			controller.secondaries.forEach(secondary => secondary.controller = controller);
			//Write buildings
			this.buildings.add(controller);
			this.grid.addBuilding(controller);
			this.writeBuilding(tileX, tileY, controller);
			controller.secondaries.forEach(secondary => {
				this.writeBuilding(secondary.pos.tileX, secondary.pos.tileY, secondary);
				this.buildings.add(secondary);
			});
			Input.lastBuilding = controller;
			return true;
		} else {
			this.drainResources(block.buildCost);
			const building = new block(
				tileX, tileY, buildingID[1], this
			);
			this.buildings.add(building);
			this.grid.addBuilding(building);
			if(building instanceof OverlayBuild) this.writeOverlayBuild(tileX, tileY, building);
			else this.writeBuilding(tileX, tileY, building);
			Input.lastBuilding = building;
			return true;
		}
	}
	resetResourceDisplayData(){
		Object.values(this.resourceDisplayData).forEach(d => {
			d.flashEffect = null;
			d.flashExpireTime = 0;
			d.amountRequired = null;
		});
	}
	hasResources(items:ItemStack[], flashTime = 0){
		let sufficient = true;
		for(const [item, amount] of items){
			if(flashTime > 0){
				this.resourceDisplayData[item].amountRequired = amount;
			}
			if(this.resources[item] < amount){
				sufficient = false;
				if(flashTime){
					this.resourceDisplayData[item].flashExpireTime = Date.now() + flashTime;
					this.resourceDisplayData[item].flashEffect = "flashing";
					//If flashTime is set, we might need to set other items to flash
				} else break; //otherwise break
			}
		}
		return sufficient;
	}
	missingItemForResources(items:ItemStack[]):ItemID | null {
		return items.find(([item, amount]) => this.resources[item] < amount)?.[0] ?? null;
	}
	drainResources(items:ItemStack[]){
		for(const [item, amount] of items){
			this.resources[item] ??= 0;
			this.resources[item]! -= amount;
		}
	}
	addResources(items:ItemStack[]){
		for(const [item, amount] of items){
			this.resources[item] ??= 0;
			this.resources[item]! += amount;
		}
	}
	update(currentFrame:CurrentFrame){
		this.buildings.forEach(b => b.preUpdate(currentFrame));
		this.grid.updatePower();
		this.buildings.forEach(b => b.update(currentFrame));
		for(let chunk of this.storage.values()){
			chunk.update(currentFrame);
		}

		if(this.resources["base_stone"] == 0 && Date.now() - this.timeSinceStoneRanOut > 15000 && !Game.transientStats.stoneRunOutMessageShown){
			//Stone is dead for more than 10 seconds
			Game.transientStats.stoneRunOutMessageShown = true;
			GUI.alert(`It looks like you have run out of stone. Break unnecessary buildings by holding Backspace and moving the cursor over them to recover resources.`);
		} else if(this.resources["base_stone"] > 0){
			this.timeSinceStoneRanOut = Date.now();
		}
	}
	display(currentframe:Object):void {
		
		//Instantly returns in the display method if offscreen.
		for(const chunk of this.storage.values()){
			chunk.display(currentframe);
		}
		
	}
	getTooltip(x:number, y:number):string {
		//returns raw html, make sure to escape!
		let building = this.buildingAtPixel(x, y);
		if(building instanceof Building){
			if(
				//If there's an item
				building.block.displaysItem && building.item &&
				//and it's under the cursor
				(Math.abs(building.item.pos.pixelX - x) < consts.ITEM_SIZE / 2) &&
				Math.abs(building.item.pos.pixelY - y) < consts.ITEM_SIZE / 2
			){
				const id = building.item.id;
				return Item.getTooltip(id);
			}
			else return building.getTooltip();
		} else {
			const id = this.tileAtByPixel(x, y);
			return tooltip(bundle.get(`tile.${id}.name`), {
				_description: bundle.get(`tile.${id}.description`, ""),
				id: settings.showIDsInTooltips ? id : ""
			});
		}
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
			resources: Object.entries(this.resources as Record<ItemID, number>).filter(([id, amount]) => amount > 0),
			seed: this.seed,
			version: consts.VERSION,
			uuid: this.uuid
		};
	}
}





export class Chunk {
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
	pixelX = Pos.chunkToPixel(this.x);
	pixelY = Pos.chunkToPixel(this.y);
	tileX = Pos.chunkToTile(this.x);
	tileY = Pos.chunkToTile(this.y);
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
				} else if(numericVersion < 310 && (_buildingData as BuildingData).fluid) {
					const fluid = (_buildingData as BuildingData).fluid as any;
					buildingData = {
						..._buildingData,
						fluid: [Fluids.get(fluid[0] as number - 1).id, fluid[1]]
					} as BuildingData;
				} else buildingData = _buildingData as BuildingData;
				let tempBuilding:Building;
				try {
					tempBuilding = Buildings.get(buildingData.id).read(buildingData, level);
				} catch(err){
					console.error(err);
					crash(`Failed to import building id ${stringifyMeta(buildingData.id, buildingData.meta)} at position ${x},${y} in chunk ${chunkX},${chunkY}. See console for more details.`);
				}
				level.buildings.add(tempBuilding);
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
				level.buildings.add(tempBuilding);
				chunk.layers[2][y][x] = tempBuilding;
			}
		}
		chunk.generate();
		return chunk;
	}
	update(currentFrame:CurrentFrame):Chunk {
		// if(!this.hasBuildings) return this;
		// for(let i = 0; i < consts.CHUNK_SIZE; i ++){
		// 	for(let j = 0; j < consts.CHUNK_SIZE; j ++){
		// 		if(this.layers[1][i][j]){
		// 			this.layers[1][i][j]!.update(currentFrame);
		// 		}
		// 	}
		// }
		// for(let i = 0; i < consts.CHUNK_SIZE; i ++){
		// 	for(let j = 0; j < consts.CHUNK_SIZE; j ++){
		// 		if(this.layers[2][i][j]){
		// 			this.layers[2][i][j]!.update(currentFrame);
		// 		}
		// 	}
		// }
		return this;
	}
	tileAt(tileX:number, tileY:number):TileID {
		return this.layers[0][tileY]?.[tileX] ?? crash(`Tile ${tileX}, ${tileY} does not exist!`);
	}
	buildingAt(tileX:number, tileY:number):Building | null {
		return this.layers[1][tileY]?.[tileX] ?? null;
	}
	overlayBuildAt(tileX:number, tileY:number):OverlayBuild | null {
		return this.layers[2][tileY]?.[tileX] ?? null;
	}
	setTile(tileX:number, tileY:number, value:TileID):boolean {
		if(tileX < 0 || tileX >= consts.CHUNK_SIZE || tileY < 0 || tileY >= consts.CHUNK_SIZE) return false;
		this.layers[0][tileY][tileX] = value;
		return true;
	}
	setBuilding(tileX:number, tileY:number, value:Building | null):boolean {
		if(tileX < 0 || tileX >= consts.CHUNK_SIZE || tileY < 0 || tileY >= consts.CHUNK_SIZE) return false;
		this.layers[1][tileY][tileX] = value;
		if(value instanceof Building) this.hasBuildings = true;
		return true;
	}
	setOverlayBuild(tileX:number, tileY:number, value:OverlayBuild | null):boolean {
		if(tileX < 0 || tileX >= consts.CHUNK_SIZE || tileY < 0 || tileY >= consts.CHUNK_SIZE) return false;
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
		const generation_consts = {
			//All distance values are in chunks.
			/**	An irrational number used to scale the perlin noise. The larger the number, the larger the terrain formations.*/
			perlin_scale: 2 * Math.PI,
			/** To make the terrain not mirrored diagonally.*/
			y_offset: 2031,
			/** Affects how fast the stone/ore gets bigger as you move away from spawn.*/
			ore_scale: 3,
			/** The minimum distance from spawn for water chunks to spawn.*/
			min_water_chunk_distance: 3,
			ocean_distance: 160,
			river_distance: 140,
			sand_distance: 155,
			hilly: {
				/** Determins where the hilly(perlin generated) terrain starts. Higher values make it start further away.*/
				terrain_cutoff: 0,
				/** Determines how high the perlin noise has to go for stone to generate... sort of. See Chunk.generate().*/
				stone_threshold: 0.7,
				/** Same as terrain stone threshold but for ore.*/
				ore_threshold: 0.8,
				water_threshold: -0.1,
				/** Minimum distance from spawn for iron ore to generate in chunks.*/
				min_iron_distance: 4,
				/** Minimum distance from spawn for copper ore to generate in chunks.*/
				min_copper_distance: 7
			}
		};

		let isLake = false;
		let isHilly = false;

		let distanceFromSpawn = Math.sqrt((this.x) ** 2 + (this.y) ** 2);
		let distanceBoost = constrain(Math.log(distanceFromSpawn + 1) / 3, 0, 0.6);
		//A value added to the perlin noise on each tile to make the amount of stone/ore increase, scales as you go further out.

		if(distanceBoost > generation_consts.hilly.terrain_cutoff){
			isHilly = true;
		}
		
		if(isLake){//Generator for lake chunks.
			for(let y = 0; y < consts.CHUNK_SIZE; y ++){
				for(let x = 0; x < consts.CHUNK_SIZE; x ++){
					//Choose the tile to be placed:
					if(y == 0 || y == 15 || x == 0 || x == 15){
						this.layers[0][y][x] = "base_water";//If on edge, place water
					} else if(y == 1 || y == 14 || x == 1 || x == 14){
						this.layers[0][y][x] = this.generator().chance(0.5) ? "base_water" : "base_stone";//If near edge, place 50-50 stone or water		
					} else {
						this.layers[0][y][x] = 
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
			const oreRand = this.generator();
			if(distanceFromSpawn < generation_consts.hilly.min_iron_distance){
				oreToGenerate = "base_ore_coal";
			} else if(Math.floor(distanceFromSpawn) == generation_consts.hilly.min_iron_distance){
				oreToGenerate = "base_ore_iron";
			} else if(distanceFromSpawn < generation_consts.hilly.min_copper_distance){
				oreToGenerate = oreRand.chance(0.5) ? "base_ore_coal" : "base_ore_iron";
			} else if(Math.floor(distanceFromSpawn) == generation_consts.hilly.min_copper_distance){
				oreToGenerate = "base_ore_copper";
			} else {
				oreToGenerate = oreRand.chance(0.5) ? (oreRand.chance(0.25) ? "base_ore_copper" : "base_ore_iron") : "base_ore_coal";
			}


			for(let y = 0; y < consts.CHUNK_SIZE; y ++){
				for(let x = 0; x < consts.CHUNK_SIZE; x ++){
					const dist = Math.sqrt(((this.x * consts.CHUNK_SIZE) + x) ** 2 + ((this.y * consts.CHUNK_SIZE) + y) ** 2);
					if(dist > generation_consts.ocean_distance){
						this.layers[0][y][x] = "base_water";
					} else {
						//Choose the tile to be placed:
						const noiseHeight = 
						Math.abs(noise.perlin2(
							((this.x * consts.CHUNK_SIZE) + x + this.parent.seed) / generation_consts.perlin_scale,
							((this.y * consts.CHUNK_SIZE) + y + (this.parent.seed + generation_consts.y_offset))
								/ generation_consts.perlin_scale
						));
						//This formula just finds the perlin noise value at a tile, but tweaked so it's different per seed and not mirrored diagonally.
	
						if((noiseHeight + distanceBoost / 2) > generation_consts.hilly.ore_threshold){
							this.layers[0][y][x] = oreToGenerate;
						} else if((noiseHeight + distanceBoost) > generation_consts.hilly.stone_threshold){
							this.layers[0][y][x] = dist > generation_consts.sand_distance ? "base_sand" : "base_stone";
						} else if(dist > generation_consts.river_distance && noiseHeight - (distanceBoost / 5) < generation_consts.hilly.water_threshold){
							this.layers[0][y][x] = "base_water";
						} else {
							this.layers[0][y][x] = "base_grass";
						}
					}
				}
			}
		} else {
			//Old terrain generation. I kept it, just only close to spawn.
			for(let y = 0; y < consts.CHUNK_SIZE; y ++){
				for(let x = 0; x < consts.CHUNK_SIZE; x ++){
					this.layers[0][y][x] = "base_grass";
				}
			}
			
			this.setTile(10, 9, "base_stone");
			this.setTile(10, 10, "base_ore_coal");
			this.setTile(10, 11, "base_ore_coal");
			this.setTile(10, 12, "base_stone");
			this.setTile(11, 9, "base_stone");
			this.setTile(12, 10, "base_stone");
			this.setTile(11, 10, "base_stone");
			this.setTile(11, 11, "base_stone");
			this.setTile(11, 12, "base_stone");
			this.setTile(9, 9, "base_stone");
			this.setTile(9, 10, "base_stone");
			this.setTile(9, 11, "base_stone");
			this.setTile(9, 12, "base_stone");

		}

		return this;
	}
	display(currentframe:any){
		if(!Camera.isVisible([
			this.pixelX, this.pixelY,
			consts.chunkSizeInPixels, consts.chunkSizeInPixels
		], consts.chunkCullingMargin)) return;//if offscreen return immediately
		currentframe.cps ++;
		
		if(currentframe.redraw){
			Gfx.strokeColor("#000000");
			Gfx.lineWidth(1);
			Gfx.layer("tile");
			currentframe.tps += 256;
			let tileX:number;
			let tileY:number;
			for(let y = 0; y < consts.CHUNK_SIZE; y ++){
				tileY = this.tileY + y;
				for(let x = 0; x < consts.CHUNK_SIZE; x ++){
					//WARNING: 300k runs per second! Very hot!
					tileX = this.tileX + x;
					const tile = this.layers[0][y][x];
					Gfx.tImageOneByOne(Gfx.texture(`tile/${tile}`), tileX, tileY);
				}
			}
			Gfx.layer("tileOver");
			if(settings.showTileBorders){
				for(let i = 0; i < consts.CHUNK_SIZE; i ++){
					Gfx.tLine(this.tileX + i, this.tileY, this.tileX + i, ((this.y + 1) * consts.CHUNK_SIZE));
					Gfx.tLine(this.tileX, this.tileY + i, ((this.x + 1) * consts.CHUNK_SIZE), this.tileY + i);
				}
			}
		}
		for(let y = 0; y < this.layers[1].length; y ++){
			for(let x = 0; x < this.layers[1][y].length; x ++){
				this.layers[1][y][x]?.display(currentframe);
				this.layers[2][y][x]?.display(currentframe);
			}
		}
		if(settings.showChunkBorders){
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

export class Item {
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
	static getTooltip(id:ItemID){
		return tooltip(bundle.get(`item.${id}.name`), {
			_description: bundle.get(`item.${id}.description`, ""),
			id: settings.showIDsInTooltips ? id : ""
		});
	}
	static read(data:ItemData){
		return new this(data.x, data.y, data.id);
	}
}


