
type Tile = 
0x00 |  //Grass
0x01 |  //stone
0x02 |	//water
0x10 |  //iron ore
0x11 |  //coal ore
0x12 |	//copper ore
0xFF ;  //Unset
type BuildingID = 
//0x0000 is invalid
0x0001 |	//Conveyor Belt Facing Right
0x0101 |	//Conveyor Belt Facing Down
0x0201 |	//Conveyor Belt Facing Left
0x0301 |	//Conveyor Belt Facing Up
0x0401 |	//Conveyor Belt Facing Down->Right
0x0501 |	//Conveyor Belt Facing Up->Right
0x0601 |	//Conveyor Belt Facing Right->Down
0x0701 |	//Conveyor Belt Facing Left->Down
0x0801 |	//Conveyor Belt Facing Down->Left
0x0901 |	//Conveyor Belt Facing Up->Left
0x0A01 |	//Conveyor Belt Facing Right->Up
0x0B01 |	//Conveyor Belt Facing Left->Up
0x0002 |	//Miner
0x0003 |	//Trash Can
0x0004 |	//Furnace
0x0005 |	//Extractor Facing Right
0x0105 |	//Extractor Facing Down
0x0205 |	//Extractor Facing Left
0x0305 |	//Extractor Facing Up
0x0405 |	//Long Extractor Facing Right
0x0505 |	//Long Extractor Facing Down
0x0605 |	//Long Extractor Facing Left
0x0705 |	//Long Extractor Facing Up
0x0805 |	//Longer Extractor Facing Right
0x0905 |	//Longer Extractor Facing Down
0x0A05 |	//Longer Extractor Facing Left
0x0B05 |	//Longer Extractor Facing Up
0x0006 |	//Chest
0x0007 |	//Alloy Smelter
0x0008 |	//Resource Acceptor
0x0009 |	//Wiremill
0x000A |	//Compressor
0x000B |	//Lathe
0x000C |	//Assembler
0xFFFF ;	//Unset

type RawBuildingID = 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0A | 0x0B | 0x0C | 0xFF;




let textures = new Map();

const names = {
	tile: {
		0x00: "Grass",
		0x01: "Stone",
		0x02: "Water",
		0x10: "Coal Ore Node",
		0x11: "Iron Ore Node",
		0x12: "Copper Ore Node"
	},
	building: {
		0x01: "Conveyor Belt",
		0x02: "Miner",
		0x03: "Trash Can",
		0x04: "Furnace",
		0x05: "Extractor",
		0x06: "Storage",
		0x07: "Alloy Smelter",
		0x08: "Resource Acceptor",
		0x09: "Wiremill",
		0x0A: "Compressor",
		0x0B: "Lathe",
		0x0C: "Assembler"
	},
	item: {
		"base_null": "Debug Item",
		"base_coalOre": "Coal Ore",
		"base_coal": "Coal",
		"base_ironOre": "Iron Ore",
		"base_ironIngot": "Iron Ingot",
		"base_ironPlate": "Iron Plate",
		"base_ironRod": "Iron Rod",
		"base_steelIngot": "Steel Ingot",
		"base_steelPlate": "Steel Plate",
		"base_steelRod": "Steel Rod",
		"base_copperOre": "Copper Ore",
		"base_copperIngot": "Copper Ingot",
		"base_copperWire": "Copper Wire",
		"base_stator": "Stator",
		"base_rotor": "Rotor",
		"base_motor": "Motor"
	}
};

enum ItemID {
	base_null = "base_null",
	base_coalOre = "base_coalOre",
	base_coal = "base_coal",
	base_ironOre = "base_ironOre",
	base_ironIngot = "base_ironIngot",
	base_ironPlate = "base_ironPlate",
	base_ironRod = "base_ironRod",
	base_copperOre = "base_copperOre",
	base_copperIngot = "base_copperIngot",
	base_copperWire = "base_copperWire",
	base_steelIngot = "base_steelIngot",
	base_steelPlate = "base_steelPlate",
	base_steelRod = "base_steelRod",
	base_stator = "base_stator",
	base_rotor = "base_rotor",
	base_motor = "base_motor"
}

const generation_consts = {
	//All distance values are in chunks.
	perlin_scale: 2 * Math.PI,//An irrational number used to scale the perlin noise. The larger the number, the larger the terrain formations.
	y_offset: 2031,//To make the terrain not mirrored diagonally.
	ore_scale: 3,//Affects how fast the stone/ore gets bigger as you move away from spawn.
	min_water_chunk_distance: 3,//The minimum distance from spawn for water chunks to spawn.
	hilly: {
		terrain_cutoff: 0.01,//Determins where the hilly(perlin generated) terrain starts. Higher values make it start further away.
		stone_threshold: 0.7,//Determines how high the perlin noise has to go for stone to generate... sort of. See Chunk.generate().
		ore_threshold: 0.8,//Same as above but for ore.
		min_iron_distance: 8,//Minimum distance from spawn for iron ore to generate.
		min_copper_distance: 12//Minimum distance from spawn for copper ore to generate.
	}
};

const Globals = {
	VERSION: "alpha 1.0.0",
	CHUNK_SIZE: 16,//Size of a chunk in tiles.
	TILE_SIZE: 30,//Sile of a tile in pixels.
	DISPLAY_SCALE: 1,
	get DISPLAY_TILE_SIZE(){
		return this.TILE_SIZE * this.DISPLAY_SCALE;
	},
	buildings: {
		conveyor: {
			SPEED: 1//pixels per update
		}
	}
};

interface Recipe {
	inputs?: ItemID[];
	outputs: ItemID[];
	duration: number;
	tile?: Tile;
}

type RecipeType = "1-1" | "2-1" | "t-1";

const recipes: {
	[index: `${string}_${string}`]: {
		type: RecipeType;
		recipes: Recipe[];
	}
} = {
	"base_mining": {
		"type": "t-1",
		"recipes": [
			{
				"outputs": [ItemID.base_coalOre],
				"duration": 60,
				"tile": 0x10
			},
			{
				"outputs": [ItemID.base_ironOre],
				"duration": 60,
				"tile": 0x11
			},
			{
				"outputs": [ItemID.base_copperOre],
				"duration": 60,
				"tile": 0x12
			},
		]
	},
	"base_smelting": {
		"type": "1-1",
		"recipes": [
			{
				"inputs": [ItemID.base_coalOre],
				"outputs": [ItemID.base_coal],
				"duration": 60
			},
			{
				"inputs": [ItemID.base_ironOre],
				"outputs": [ItemID.base_ironIngot],
				"duration": 60
			},
			{
				"inputs": [ItemID.base_copperOre],
				"outputs": [ItemID.base_copperIngot],
				"duration": 60
			}
		]
	},
	"base_alloying": {
		"type": "2-1",
		"recipes": [
			{
				"inputs": [ItemID.base_coal, ItemID.base_ironIngot],
				"outputs": [ItemID.base_steelIngot],
				duration: 240
			}
		]
	},
	"base_wiremilling": {
		"type": "1-1",
		"recipes": [
			{
				"inputs": [ItemID.base_copperIngot],
				"outputs": [ItemID.base_copperWire],
				"duration": 60
			}
		]
	},
	"base_compressing": {
		"type": "1-1",
		"recipes": [
			{
				"inputs": [ItemID.base_ironIngot],
				"outputs": [ItemID.base_ironPlate],
				"duration": 60
			},
			{
				"inputs": [ItemID.base_steelIngot],
				"outputs": [ItemID.base_steelPlate],
				"duration": 60
			}
		]
	},
	"base_lathing": {
		"type": "1-1",
		"recipes": [
			{
				"inputs": [ItemID.base_ironIngot],
				"outputs": [ItemID.base_ironRod],
				"duration": 60
			},
			{
				"inputs": [ItemID.base_steelIngot],
				"outputs": [ItemID.base_steelRod],
				"duration": 60
			}
		]
	},
	"base_assembling": {
		"type": "2-1",
		recipes: [
			{
				"inputs": [ItemID.base_steelRod, ItemID.base_copperWire],
				"outputs": [ItemID.base_rotor],
				duration: 120
			},
			{
				"inputs": [ItemID.base_ironPlate, ItemID.base_copperWire],
				"outputs": [ItemID.base_stator],
				duration: 120
			},
			{
				"inputs": [ItemID.base_stator, ItemID.base_rotor],
				"outputs": [ItemID.base_motor],
				duration: 120
			}
		]
	}
};

enum triggerType {
	placeBuilding,
	placeBuildingFail,
	spawnItem,
	buildingRun
}

function trigger(type:triggerType, buildingID?:RawBuildingID, itemID?:ItemID){
	switch(type){
		case triggerType.placeBuilding:
			switch(buildingID){
				case 0x04:
					if(Game.tutorial.furnace.placed && Game.persistent.tutorialenabled){
						_alert("The Furnace converts raw ores into their smelted forms. Simply point a conveyor belt carrying ores at it and provide another belt for it to output onto.");
						Game.tutorial.furnace.placed = false;
					}
				break;
				case 0x03:
					if(Game.tutorial.trashcan.placed && Game.persistent.tutorialenabled){
						_alert("The Trash Can is pretty simple: it deletes all items it receives.");
						Game.tutorial.trashcan.placed = false;
					}
				break;
				case 0x02:
					if(Game.tutorial.miner.placed && Game.persistent.tutorialenabled){
						_alert("The Miner mines ore nodes, producing one ore per second. \nIt auto-outputs to adjacent conveyor belts.\nAlso, ore nodes are infinite.");
						Game.tutorial.miner.placed = false;
					}
				break;
				case 0x01:
					if(Game.tutorial.conveyor.placed && Game.persistent.tutorialenabled){
						_alert("Conveyors are the way to move items around. \nYou can use the arrow keys to change the direction of placed belts. \nTry making a belt chain, then putting a debug item on it with Ctrl+click.\nYou can drag-click to build multiple of the same building.");
						Game.tutorial.conveyor.placed = false;
					}
				break;
			}
			break;


		case triggerType.placeBuildingFail:
			switch(buildingID){
				case 0x04:
					if(Game.tutorial.furnace.placefail && Game.persistent.tutorialenabled){
						_alert("The Furnace generates a lot of heat and is pretty heavy, so you can only place it on stone.");
						Game.tutorial.furnace.placefail = false;
					}
				break;
				case 0x03:

				break;
				case 0x02:
					if(Game.tutorial.miner.placefail && Game.persistent.tutorialenabled){
						_alert("The Miner can only be placed on a resource node(the colored circles).");
						Game.tutorial.miner.placefail = false;
					}
				break;
				case 0x01:
					if(Game.tutorial.conveyor.placefail && Game.persistent.tutorialenabled){
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
						_alert(["Try doing the same thing for iron: Iron nodes are whiteish and are a bit further from the center of the map.\nUse WASD to scroll.", 3000]);
						Game.tutorial.item.coal = false;
					}
					break;
				case ItemID.base_ironIngot:
					if(Game.tutorial.item.iron){
						_alert("Nice job!");
						_alert(["The next automateable resource is steel.\nYou'll need to use the alloy smelter(slot 7), which needs two inputs(coal and iron).", 3000]);
						Game.tutorial.item.iron = false;
					}
					break;
			}
			break;


		case triggerType.buildingRun:
			switch(buildingID){
				case 0x02:
					if(Game.tutorial.miner.coaloutput && Game.persistent.tutorialenabled && itemID == ItemID.base_coalOre){
						_alert("Nice!\nThis is just coal ore though, not coal. Try placing a furnace(4 key).\nOh also, remember you can scroll to zoom in on that beautiful coal ore texture.");
						Game.tutorial.miner.coaloutput = false;
					}
					break;
				case 0x07:

					break;
			}
			break;
	}

}










/*
	Classes
*/

class Level {
	items: Item[];
	resources: {
		[index: string]: number
	}
	storage: Map<string, Chunk>;
	seed: number;
	format: string;
	constructor(data:number|any){
		this.storage = new Map<string, Chunk>();
		this.format = Globals.VERSION;
		this.items = [];
		this.resources = {};
		if(typeof data != "object"){
			this.seed = data ? data : 0;
		} else {
			// Generate a level from JSON
			let {chunks, items, resources, seed, version} = data;
			this.seed = seed;
			this.resources = resources

			for(var [position, chunkData] of Object.entries(chunks)){//Get data for a chunk
				this.storage.set(position, new Chunk({
					x: parseInt(position.split(",")[0]), y: parseInt(position.split(",")[1]),
					seed: seed, parent: this
				}, chunkData).generate());
				//Generate a chunk with that data
			}

			if(version !== "alpha 0.0.0"){//Needed because before (e4360ab) items being moved by conveyor belts were also in level.items and the below code would otherwise dupe them due to the removal of an O(n^2) check.
				for(var item of items){
					let tempItem = new Item(item.x, item.y, item.id, this);
					if(item.grabbedBy){
						tempItem.grabbedBy = this.buildingAtTile(item.grabbedBy.x, item.grabbedBy.y);
						assert(tempItem.grabbedBy);
					}
					this.items.push(tempItem);
				}
			}

		}
	}
	getChunk(tileX:number, tileY:number, dontGenerateChunk?:boolean):Chunk {
		if(this.storage.get(`${Math.floor(tileX / Globals.CHUNK_SIZE)},${Math.floor(tileY / Globals.CHUNK_SIZE)}`)){
			return this.storage.get(`${Math.floor(tileX / Globals.CHUNK_SIZE)},${Math.floor(tileY / Globals.CHUNK_SIZE)}`);
		} else if(!dontGenerateChunk){
			return this.generateChunk(Math.floor(tileX / Globals.CHUNK_SIZE),Math.floor(tileY / Globals.CHUNK_SIZE));
		} else {
			return null;
		}
	}
	generateChunk(x:number, y:number){
		if(this.storage.get(`${x},${y}`)){
			return;
		}
		this.storage.set(`${x},${y}`, 
			new Chunk({x: x, y: y, seed: this.seed, parent: this})
			.generate()
		);
		return this.storage.get(`${x},${y}`);
	}
	tileAtByPixel(pixelX:number, pixelY:number):Tile{
		return this.getChunk(
			Math.floor(pixelX/Globals.TILE_SIZE),
			Math.floor(pixelY/Globals.TILE_SIZE)
		).tileAt(tileToChunk(pixelX/Globals.TILE_SIZE), tileToChunk(pixelY/Globals.TILE_SIZE));
	}
	tileAtByTile(tileX:number, tileY:number):Tile{
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).tileAt(tileToChunk(tileX), tileToChunk(tileY));
	}
	setTileByTile(tileX:number, tileY:number, tile:Tile):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setTile(tileToChunk(tileX), tileToChunk(tileY), tile);
			Game.forceRedraw = true;
			return true;
		}
		return false;
	}
	generateNecessaryChunks(){
		var xOffset = - Math.floor((Game.scroll.x * Globals.DISPLAY_SCALE) / (Globals.DISPLAY_TILE_SIZE * Globals.CHUNK_SIZE));
		var yOffset = - Math.floor((Game.scroll.y * Globals.DISPLAY_SCALE) / (Globals.DISPLAY_TILE_SIZE * Globals.CHUNK_SIZE));
		this.generateChunk(xOffset - 1, yOffset - 1);
		this.generateChunk(xOffset, yOffset - 1);
		this.generateChunk(xOffset + 1, yOffset - 1);
		this.generateChunk(xOffset - 1, yOffset);
		this.generateChunk(xOffset, yOffset);
		this.generateChunk(xOffset + 1, yOffset);
		this.generateChunk(xOffset - 1, yOffset + 1);
		this.generateChunk(xOffset, yOffset + 1);
		this.generateChunk(xOffset + 1, yOffset + 1);
		this.generateChunk(xOffset + 2, yOffset - 1);
		this.generateChunk(xOffset + 2, yOffset);
		this.generateChunk(xOffset + 2, yOffset + 1);
		this.generateChunk(xOffset + 3, yOffset - 1);
		this.generateChunk(xOffset + 3, yOffset);
		this.generateChunk(xOffset + 3, yOffset + 1);
		//good enough
	}
	buildingIDAtPixel(pixelX:number, pixelY:number):BuildingID {
		return this.getChunk(
			Math.floor(pixelX/Globals.TILE_SIZE),
			Math.floor(pixelY/Globals.TILE_SIZE)
		).buildingAt(tileToChunk(pixelX/Globals.TILE_SIZE), tileToChunk(pixelY/Globals.TILE_SIZE))?.id ?? 0xFFFF;
	}
	buildingIDAtTile(tileX:number, tileY:number):BuildingID {
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).buildingAt(tileToChunk(tileX), tileToChunk(tileY))?.id ?? 0xFFFF;
	}
	buildingAtTile(tileX:number, tileY:number):Building {
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).buildingAt(tileToChunk(tileX), tileToChunk(tileY));
	}
	buildingAtPixel(pixelX:number, pixelY:number):Building {
		return this.getChunk(
			Math.floor(pixelX/Globals.TILE_SIZE),
			Math.floor(pixelY/Globals.TILE_SIZE)
		).buildingAt(tileToChunk(pixelX/Globals.TILE_SIZE), tileToChunk(pixelY/Globals.TILE_SIZE));
	}
	extractorAtTile(tileX:number, tileY:number):Extractor {
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).extractorAt(tileToChunk(tileX), tileToChunk(tileY));
	}
	addItem(x:number, y:number, id:string){
		let tempitem = new Item(x, y, id, this);
		this.items.push(tempitem);
		return tempitem;
	}
	update(currentframe){
		for(var item of this.items){
			item.update(currentframe);
		}
		for(var chunk of level1.storage.values()){
			chunk.update();
		}
	}
	displayGhostBuilding(tileX:number, tileY:number, buildingID:BuildingID){
		tileX = Math.floor(tileX);
		tileY = Math.floor(tileY);
		//Tells a chunk to display a ghost building.
		if(this.getChunk(tileX, tileY, true) == null){
			return;
		}
		switch(buildingID % 0x100){
			case 0x01:
				this.getChunk(tileX, tileY).displayGhostBuilding(tileToChunk(tileX), tileToChunk(tileY), this.getTurnedConveyor(tileX, tileY, buildingID >> 8), !Conveyor.canBuildAt(tileX, tileY, this));
				break;
			case 0xFF:
				break;
			default:
				this.getChunk(tileX, tileY).displayGhostBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, !BuildingType[buildingID % 0x100]?.canBuildAt(tileX, tileY, this));
			break;
		}
	}
	getTurnedConveyor(tileX:number, tileY:number, conveyorType:number){
		//Returns how a conveyor should be turned based on nearby buildings.
		tileX = Math.floor(tileX);
		tileY = Math.floor(tileY);
		//🍝👨‍💻 is delicious
		let topConveyor:BuildingID | boolean = this.buildingIDAtTile(tileX, tileY - 1);
		topConveyor = topConveyor == 0x0101 || topConveyor == 0x0601 || topConveyor == 0x0701 || topConveyor == 0x0002 || topConveyor == 0x0004  || topConveyor == 0x0007 || topConveyor == 0x0009 || topConveyor == 0x000A || topConveyor == 0x000B || topConveyor == 0x000C;
		let rightConveyor:BuildingID | boolean = this.buildingIDAtTile(tileX + 1, tileY);
		rightConveyor = rightConveyor == 0x0201 || rightConveyor == 0x0801 || rightConveyor == 0x0901 || rightConveyor == 0x0002 || rightConveyor == 0x0004  || rightConveyor == 0x0007 || rightConveyor == 0x0009 || rightConveyor == 0x000A || rightConveyor == 0x000B || rightConveyor == 0x000C;
		let leftConveyor:BuildingID | boolean = this.buildingIDAtTile(tileX - 1, tileY);
		leftConveyor = leftConveyor == 0x0001 || leftConveyor == 0x0401 || leftConveyor == 0x0501 || leftConveyor == 0x0002 || leftConveyor == 0x0004  || leftConveyor == 0x0007 || leftConveyor == 0x0009 || leftConveyor == 0x000A || leftConveyor == 0x000B || leftConveyor == 0x000C;
		let bottomConveyor:BuildingID | boolean = this.buildingIDAtTile(tileX, tileY + 1);
		bottomConveyor = bottomConveyor == 0x0301 || bottomConveyor == 0x0A01 || bottomConveyor == 0x0B01 || bottomConveyor == 0x0002 || bottomConveyor == 0x0004  || bottomConveyor == 0x0007 || bottomConveyor == 0x0009 || bottomConveyor == 0x000A || bottomConveyor == 0x000B || bottomConveyor == 0x000C;
		let buildingID:BuildingID = 0xFFFF;
		switch(conveyorType){
			case 0:
				if(leftConveyor){
					buildingID = 0x0001;
				} else if(topConveyor && bottomConveyor){
					buildingID = 0x0001;
				} else if(topConveyor){
					buildingID = 0x0501;
				} else if(bottomConveyor){
					buildingID = 0x0401;
				} else {
					buildingID = 0x0001;
				}
				break;
			case 1:
				if(topConveyor){
					buildingID = 0x0101;
				} else if(leftConveyor && rightConveyor){
					buildingID = 0x0101;
				} else if(leftConveyor){
					buildingID = 0x0701;
				} else if(rightConveyor){
					buildingID = 0x0601;
				} else {
					buildingID = 0x0101;
				}
				break;
			case 2:
				if(rightConveyor){
					buildingID = 0x0201;
				} else if(topConveyor && bottomConveyor){
					buildingID = 0x0201;
				} else if(topConveyor){
					buildingID = 0x0901;
				} else if(bottomConveyor){
					buildingID = 0x0801;
				} else {
					buildingID = 0x0201;
				}
				break;
			case 3:
				if(bottomConveyor){
					buildingID = 0x0301;
				} else if(leftConveyor && rightConveyor){
					buildingID = 0x0301;
				} else if(leftConveyor){
					buildingID = 0x0B01;
				} else if(rightConveyor){
					buildingID = 0x0A01;
				} else {
					buildingID = 0x0301;
				}
				break;
		}
		return buildingID;
	}
	writeBuilding(tileX:number, tileY:number, building:Building):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setBuilding(tileToChunk(tileX), tileToChunk(tileY), building);
			Game.forceRedraw = true;
			return true;
		}
		return false;
	}
	writeExtractor(tileX:number, tileY:number, building:Extractor):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setExtractor(tileToChunk(tileX), tileToChunk(tileY), building);
			Game.forceRedraw = true;
			return true;
		}
		return false;
	}
	buildBuilding(tileX:number, tileY:number, building:BuildingID):boolean {
		if((building % 0x100 != 5 ? this.buildingIDAtTile(tileX, tileY) : this.extractorAtTile(tileX, tileY)?.id) === building){
			if(!canOverwriteBuilding){
				return false;
			}
		}//Only overwrite the same building once per build attempt.
		//Otherwise, you could constantly overwrite a building on every frame you tried to build, which is not good.
		canOverwriteBuilding = false;
		this.buildingAtTile(tileX, tileY)?.break();
		var tempBuilding:Building;
		
		if(building == 0xFFFF){
			this.writeExtractor(tileX, tileY, null);
			this.writeBuilding(tileX, tileY, null);
			return;
		}
		if(BuildingType[building % 0x100]?.canBuildAt(tileX, tileY, this)){
			trigger(triggerType.placeBuilding, building % 0x100 as RawBuildingID);
			if(building % 0x100 == 0x01){
				tempBuilding = new BuildingType[building % 0x100](tileX, tileY, this.getTurnedConveyor(tileX, tileY, building >> 8), this);
			} else {
				tempBuilding = new BuildingType[building % 0x100](tileX, tileY, building, this);
			}
		} else {
			trigger(triggerType.placeBuildingFail, building % 0x100 as RawBuildingID);
			return;
		}
		if(tempBuilding instanceof Extractor){
			return this.writeExtractor(tileX, tileY, tempBuilding);
		} else {
			return this.writeBuilding(tileX, tileY, tempBuilding);
		}
	}
	display(currentframe:Object):void {
		for(let item of this.items){
			item.display(currentframe);
		}
		
		//Insta returns in the display method if offscreen.
		for(var chunk of this.storage.values()){
			chunk.display(currentframe);
		}
		
	}
	displayTooltip(mousex:number, mousey:number, currentframe){
		if(!currentframe.tooltip){return;}
		var x = (mousex - (Game.scroll.x * Globals.DISPLAY_SCALE))/Globals.DISPLAY_SCALE;
		var y = (mousey - (Game.scroll.y * Globals.DISPLAY_SCALE))/Globals.DISPLAY_SCALE;
		ctx4.font = "16px monospace";
		for(let item of this.items){
			if((Math.abs(item.x - x) < 16) && Math.abs(item.y - y) < 16){
				ctx4.fillStyle = "#0033CC";
				ctx4.fillRect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
				ctx4.strokeStyle = "#000000";
				ctx4.strokeRect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
				ctx4.fillStyle = "#FFFFFF";
				ctx4.fillText((names.item[item.id] ?? item.id), mousex + 2, mousey + 10);
				return;
			}
		}
		if(this.buildingAtPixel(x, y) instanceof Building){
			let buildingID = this.buildingAtPixel(x, y).id % 0x100;
			ctx4.fillStyle = "#0033CC";
			ctx4.fillRect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
			ctx4.strokeStyle = "#000000";
			ctx4.strokeRect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
			ctx4.fillStyle = "#FFFFFF";
			ctx4.fillText((names.building[buildingID] ?? buildingID), mousex + 2, mousey + 10);
			return;
		}
		let tileID = this.tileAtByPixel(x, y);
		ctx4.fillStyle = "#0033CC";
		ctx4.fillRect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
		ctx4.strokeStyle = "#000000";
		ctx4.strokeRect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
		ctx4.fillStyle = "#FFFFFF";
		ctx4.fillText((names.tile[tileID] ?? tileID), mousex + 2, mousey + 10);
		return;
	}


	export(){
		//Exports the level's data to JSON.
		let chunkOutput = {};
		for(var [position, chunk] of this.storage.entries()){
			let output = chunk.export();
			if(output){
				chunkOutput[position] = output;
			}
		}

		let items = [];
		for(var item of this.items){
			items.push(item.export());
		}

		return {
			chunks: chunkOutput,
			items: items,
			resources: this.resources,
			seed: this.seed
		};
	}
}





class Chunk {
	layers: [
		Tile[][],
		Building[][],
		Extractor[][]
	];
	generator: Generator;
	x: number;
	y: number;
	chunkSeed: number;
	parent: Level;
	constructor({ x, y, seed, parent}: { x: number; y: number; seed: number; parent: Level;}, data?:any){
		this.x = x;
		this.y = y;
		this.parent = parent;
		let tweakedX = x == 0 ? 5850 : x;
		let tweakedY = y == 0 ? 9223 : y;
		this.chunkSeed = Math.abs(
			(((tweakedX) ** 3) * (tweakedY ** 5) + 3850 + ((seed - 314) * 11)) % (2 ** 16)
		);
		this.generator = pseudoRandom(this.chunkSeed);
		this.layers = [
			null,
			null,
			null
		];

		this.layers[0] = [];
		for(let x = 0; x < Globals.CHUNK_SIZE; x ++){
			this.layers[0][x] = [];
			for(let z = 0; z < Globals.CHUNK_SIZE; z ++){
				this.layers[0][x].push(0xFF);
			}
		}

		this.layers[1] = [];
		for(let x = 0; x < Globals.CHUNK_SIZE; x ++){
			this.layers[1][x] = [];
			for(let z = 0; z < Globals.CHUNK_SIZE; z ++){
				this.layers[1][x].push(null);
			}
		}

		this.layers[2] = [];
		for(let x = 0; x < Globals.CHUNK_SIZE; x ++){
			this.layers[2][x] = [];
			for(let z = 0; z < Globals.CHUNK_SIZE; z ++){
				this.layers[2][x].push(null);
			}
		}

		if(data){
			//Import a chunk from JSON data.
			for(let y in data[0]){
				for(let x in data[0][y]){
					let buildingData = data[0][y][x];
					if(!buildingData) continue;

					let tempBuilding = new BuildingType[buildingData.id % 0x100](parseInt(x) + (Globals.CHUNK_SIZE * this.x), parseInt(y) + (Globals.CHUNK_SIZE * this.y), buildingData.id, this.parent);
					if(buildingData.item){
						//If the building has an item, spawn it in.
						tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id, this.parent as Level);
						tempBuilding.item.grabbedBy = tempBuilding;
					}
					if(buildingData.inv){
						//If the building has an inventory, spawn in the items.
						for(var itemData of buildingData.inv){
							let tempItem = new Item(itemData.x, itemData.y, itemData.id, this.parent as Level);
							tempItem.grabbedBy = tempBuilding;
							tempBuilding.inventory.push(tempItem);
						}
					}
					this.layers[1][y][x] = tempBuilding;
				}
			}

			for(let y in data[1]){
				for(let x in data[1][y]){
					let buildingData = data[1][y][x];
					if(!buildingData) continue;
					let tempBuilding = new Extractor(parseInt(x) + (Globals.CHUNK_SIZE * this.x), parseInt(y) + (Globals.CHUNK_SIZE * this.y), buildingData.id, this.parent as Level);
					if(buildingData.item){
						tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id, this.parent as Level);
						tempBuilding.item.grabbedBy = tempBuilding;
					}
					//Same as above but for extractors.
					this.layers[2][y][x] = tempBuilding;
				}
			}
		}

		return this;
	}
	update():Chunk {
		for(let row of this.layers[1]){
			for(let value of row){
				value?.update?.();
			}
		}
		for(let row of this.layers[2]){
			for(let value of row){
				value?.update?.(undefined);
			}
		}
		return this;
	}
	tileAt(tileX:number, tileY:number):Tile {
		return this.layers[0]?.[tileY]?.[tileX] ?? null;
	}
	buildingAt(tileX:number, tileY:number):Building {
		return this.layers[1]?.[tileY]?.[tileX] ?? null;
	}
	extractorAt(tileX:number, tileY:number):Extractor {
		return this.layers[2]?.[tileY]?.[tileX] ?? null;
	}
	setTile(tileX:number, tileY:number, value:Tile):boolean {
		if(this.tileAt(tileX, tileY) == null){
			return false;
		}
		this.layers[0][tileY][tileX] = value;
		return true;
	}
	setBuilding(tileX:number, tileY:number, value:Building):boolean {
		if(this.tileAt(tileX, tileY) == null){
			return false;
		}
		this.layers[1][tileY][tileX] = value;
		return true;
	}
	setExtractor(tileX:number, tileY:number, value:Extractor):boolean {
		if(this.tileAt(tileX, tileY) == null){
			return false;
		}
		this.layers[2][tileY][tileX] = value;
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
	generate():Chunk {
		//This... needs to be refactored.  TODO
		let isWet = false;
		let isHilly = false;

		let distanceFromSpawn = Math.sqrt(this.x **2 + this.y **2);
		let distanceBoost = constrain(Math.log((distanceFromSpawn / generation_consts.ore_scale) + 0.5)/2, 0, 0.6);
		//A value added to the perlin noise on each tile to make the amount of stone/ore increase, scales as you go further out.

		if(this.generator.next().value < 0.07 && distanceFromSpawn > generation_consts.min_water_chunk_distance){
			isWet = true;
		} else if(distanceBoost > generation_consts.hilly.terrain_cutoff){
			isHilly = true;
		}
		
		if(isWet){//Generator for wet chunks.
			for(var row in this.layers[0]){
				for(var tile in this.layers[0][row]){
					//Choose the tile to be placed:
					if(row == "0" || row == "15" || tile == "0" || tile == "15"){
						this.layers[0][row][tile] = 0x02;//If on edge, place water
					} else if(row == "1" || row == "14" || tile == "1" || tile == "14"){
						this.layers[0][row][tile] = this.generator.next().value > 0.5 ? 0x01 : 0x02;//If near edge, place 50-50 stone or water		
					} else {
						this.layers[0][row][tile] = 
						this.generator.next().value < 0.1 ?
						(this.generator.next().value < 0.3 ? 0x11 : 0x10)
						: 0x01;
						//Otherwise, stone, iron, or coal.
					}
				}
			}
		} else if(isHilly){
			//Hilly terrain generator:
			//Based on perlin noise.

			//Chooses which ore to generate based on RNG and ditance from spawn.
			let oreToGenerate:Tile = 0xFF;
			let oreRand = this.generator.next().value;
			if(distanceFromSpawn < generation_consts.hilly.min_iron_distance){
				oreToGenerate = 0x10;
			} else if(distanceFromSpawn < generation_consts.hilly.min_copper_distance){
				oreToGenerate = oreRand > 0.5 ? 0x10 : 0x11;
			} else {
				oreToGenerate = oreRand > 0.5 ? 0x10 : (oreRand > 0.25 ? 0x11 : 0x12);
			}


			for(var row in this.layers[0]){
				for(var tile in this.layers[0][row]){
					//Choose the tile to be placed:
					let noiseHeight = 
					Math.abs(noise.perlin2(
						((this.x * Globals.CHUNK_SIZE) + +tile + this.parent.seed) / generation_consts.perlin_scale,
						((this.y * Globals.CHUNK_SIZE) + +row + (this.parent.seed + generation_consts.y_offset)) / generation_consts.perlin_scale
					));
					//This formula just finds the perlin noise value at a tile, but tweaked so it's different per seed and not mirrored diagonally.

					if((noiseHeight + distanceBoost / 2) > generation_consts.hilly.ore_threshold){
						this.layers[0][row][tile] = oreToGenerate;
					} else if((noiseHeight + distanceBoost) > generation_consts.hilly.stone_threshold){
						this.layers[0][row][tile] = 0x01;
					} else {
						this.layers[0][row][tile] = 0x00;
					}
				}
			}
		} else {
			//Old terrain generation. I kept it, just only close to spawn.
			for(var row in this.layers[0]){
				for(var tile in this.layers[0][row]){
					this.layers[0][row][tile] = 0x00;
				}
			}
			let oreToGenerate:Tile = 0xFF;
			if(distanceFromSpawn < 3){
				oreToGenerate = 0x10;
			} else {
				oreToGenerate = (this.generator.next().value > 0.5) ? 0x11 : 0x10;
			}
			let hill_x = Math.floor(this.generator.next().value * 16);
			let hill_y = Math.floor(this.generator.next().value * 16);

			//Makes a "hill", with an ore node in the middle, stone on the sides, and maybe stone in the corners.
			this.setTile(hill_x, hill_y, oreToGenerate);
			this.setTile(hill_x + 1, hill_y, 0x01);
			this.setTile(hill_x - 1, hill_y, 0x01);
			this.setTile(hill_x, hill_y + 1, 0x01);
			this.setTile(hill_x, hill_y - 1, 0x01);
			this.setTile(hill_x + 1, hill_y + 1, (this.generator.next().value > 0.5) ? 0x01 : 0x00);
			this.setTile(hill_x + 1, hill_y - 1, (this.generator.next().value > 0.5) ? 0x01 : 0x00);
			this.setTile(hill_x - 1, hill_y + 1, (this.generator.next().value > 0.5) ? 0x01 : 0x00);
			this.setTile(hill_x - 1, hill_y - 1, (this.generator.next().value > 0.5) ? 0x01 : 0x00);
		}


		return this;
	}
	display(currentframe){
		if(
			(Game.scroll.x * Globals.DISPLAY_SCALE) + this.x * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE > window.innerWidth + 1 ||
			(Game.scroll.x * Globals.DISPLAY_SCALE) + this.x * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE < -1 - Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE ||
			(Game.scroll.y * Globals.DISPLAY_SCALE) + this.y * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE > window.innerHeight + 1 ||
			(Game.scroll.y * Globals.DISPLAY_SCALE) + this.y * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE < -1 - Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE
		){return;}//if offscreen return immediately
		currentframe.cps ++;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 1;
		
		if(currentframe.redraw){
			for(let y = 0; y < this.layers[0].length; y ++){
				for(let x = 0; x < this.layers[0][y].length; x ++){
					this.displayTile(x, y, currentframe);
				}
			}
		}
		for(let y = 0; y < this.layers[1].length; y ++){
			for(let x = 0; x < this.layers[1][y].length; x ++){
				if(this.layers[1][y][x] instanceof Building){
					this.layers[1][y][x].display(currentframe);
				}
			}
		}
		for(let y = 0; y < this.layers[2].length; y ++){
			for(let x = 0; x < this.layers[2][y].length; x ++){
				if(this.layers[2][y][x]){
					this.displayL3(x, y, this.layers[2][y][x]?.id ?? 0xFFFF);
					this.layers[2][y][x].display(currentframe);
				}
			}
		}
		if(currentframe.debug){
			ctx4.strokeStyle = "#0000FF";
			ctx4.strokeRect(this.x * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE + (Game.scroll.x * Globals.DISPLAY_SCALE), this.y  * Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE + (Game.scroll.y * Globals.DISPLAY_SCALE), Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE, Globals.CHUNK_SIZE * Globals.DISPLAY_TILE_SIZE);
		}
	}
	displayTile(x:number, y:number, currentframe){
		currentframe.tps ++;
		let pixelX = ((this.x * Globals.CHUNK_SIZE) + x) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.x * Globals.DISPLAY_SCALE);
		let pixelY = ((this.y * Globals.CHUNK_SIZE) + y) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.y * Globals.DISPLAY_SCALE);
		if(settings.graphics_mode || (this.tileAt(x,y) != 0x00)){
			if(textures.get("t" + this.tileAt(x,y).toString())){
				ctx.drawImage(textures.get("t" + this.tileAt(x,y).toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
			} else {
				ctx.fillStyle = "#FF00FF";
				rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2);
				rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2);
				ctx.fillStyle = "#000000";
				rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2);
				rect(pixelX, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2);
				ctx.font = "15px sans-serif";
				ctx.fillStyle = "#00FF00";
				ctx.fillText(this.tileAt(x, y).toString(), pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2);
			}
		} else {
			ctx.fillStyle = "#00CC33";
			rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
		}
		if(currentframe.debug) ctx.strokeRect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
	}
	displayGhostBuilding(x:number, y:number, buildingID:BuildingID, isError:boolean){
		if(buildingID == 0xFFFF){return;}
		let pixelX = ((this.x * Globals.CHUNK_SIZE) + x) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.x * Globals.DISPLAY_SCALE);
		let pixelY = ((this.y * Globals.CHUNK_SIZE) + y) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.y * Globals.DISPLAY_SCALE);
		let _ctx = ctx1;
		if(isError){
			_ctx.globalAlpha = 0.9;
			_ctx.drawImage(textures.get("invalidunderlay"), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
			_ctx.globalAlpha = buildingID % 0x100 == 0x01 ? 0.3 : 0.7;
		} else {
			_ctx.globalAlpha = 0.9;
			_ctx.drawImage(textures.get("ghostunderlay"), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
			_ctx.globalAlpha = buildingID % 0x100 == 0x01 ? 0.3 : 0.7;
		}
		if(textures.get(buildingID.toString())){
			switch(buildingID){
				case 0x0005:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE); break;
				case 0x0105:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 2); break;
				case 0x0205:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX - Globals.DISPLAY_TILE_SIZE, pixelY, Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE); break;
				case 0x0305:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 2); break;
				case 0x0405:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE); break;
				case 0x0505:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 3); break;
				case 0x0605:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX - Globals.DISPLAY_TILE_SIZE * 2, pixelY, Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE); break;
				case 0x0705:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 3); break;
				case 0x0805:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 4, Globals.DISPLAY_TILE_SIZE); break;
				case 0x0905:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 4); break;
				case 0x0A05:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX - Globals.DISPLAY_TILE_SIZE * 3, pixelY, Globals.DISPLAY_TILE_SIZE * 4, Globals.DISPLAY_TILE_SIZE); break;
				case 0x0B05:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 4); break;
				default:
					_ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE); break;
			}
			_ctx.globalAlpha = 1.0;
		} else {
			_ctx.fillStyle = "#FF00FF";
			rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			_ctx.fillStyle = "#000000";
			rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			rect(pixelX, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			_ctx.font = "15px sans-serif";
			_ctx.fillStyle = "#00FF00";
			_ctx.fillText(buildingID.toString(), pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2);
		}
	}
	displayL3(x:number, y:number, buildingID:BuildingID, isGhost?:number){
		if(buildingID == 0xFFFF){return;}
		let pixelX = ((this.x * Globals.CHUNK_SIZE) + x) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.x * Globals.DISPLAY_SCALE);
		let pixelY = ((this.y * Globals.CHUNK_SIZE) + y) * Globals.DISPLAY_TILE_SIZE + (Game.scroll.y * Globals.DISPLAY_SCALE);
		let _ctx = ctx25;
		if(textures.get(buildingID.toString())){
			switch(buildingID){
				case 0x0005:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE);
				case 0x0105:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 2);
				case 0x0205:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX - Globals.DISPLAY_TILE_SIZE, pixelY, Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE);
				case 0x0305:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 2);
				case 0x0405:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE);
				case 0x0505:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 3);
				case 0x0605:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX - Globals.DISPLAY_TILE_SIZE * 2, pixelY, Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE);
				case 0x0705:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 3);
				case 0x0805:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 4, Globals.DISPLAY_TILE_SIZE);
				case 0x0905:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 4);
				case 0x0A05:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX - Globals.DISPLAY_TILE_SIZE * 3, pixelY, Globals.DISPLAY_TILE_SIZE * 4, Globals.DISPLAY_TILE_SIZE);
				case 0x0B05:
					return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY - Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 4);
			}
		} else {
			_ctx.fillStyle = "#FF00FF";
			rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			_ctx.fillStyle = "#000000";
			rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			rect(pixelX, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			_ctx.font = "15px sans-serif";
			_ctx.fillStyle = "#00FF00";
			_ctx.fillText(this.buildingAt(x, y).toString(), pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2);
		}
	}
	export(){
		let exportDataL1 = [];
		var hasBuildings = false;
		for(let row of this.layers[1]){
			let tempRow = [];
			for(let building of row){
				if(building instanceof Building){
					hasBuildings = true;
				}
				tempRow.push(building?.export() ?? null);
			}
			exportDataL1.push(tempRow);
		}

		let exportDataL2 = [];
		for(let row of this.layers[2]){
			let tempRow = [];
			for(let extractor of row){
				if(extractor instanceof Extractor){
					hasBuildings = true;
				}
				tempRow.push(extractor?.export() ?? null);
			}
			exportDataL2.push(tempRow);
		}

		if(hasBuildings){
			return [exportDataL1, exportDataL2];
		} else {
			return null;
		}



	}
}

class Item {
	id: string;
	x: number;
	y: number;
	level: Level;
	startY: number | undefined;
	startX: number | undefined;
	grabbedBy: Building;
	deleted: boolean;
	constructor(x:number, y:number, id:string, level:Level){
		this.id = id;
		this.x = x;
		this.y = y;
		this.level = level;
		this.grabbedBy = null;
		this.deleted = false;
		if(this.id == ItemID.base_null){
			this.startX = x;
			this.startY = y;
		}
	}
	update(currentframe){
		if(Game.tutorial.conveyor.beltchain && Game.persistent.tutorialenabled && ((Math.abs(this.startX - this.x) + 1 > Globals.TILE_SIZE * 2) || (Math.abs(this.startY - this.y) + 1 > Globals.TILE_SIZE * 2))){
			_alert("Nice!\nConveyor belts are also the way to put items in machines.\nSpeaking of which, let's try automating coal: Place a Miner(2 key).");
			Game.tutorial.conveyor.beltchain = false;
		}
		if(this.deleted){
			//do stuff
		}
	}
	display(currentframe){
		if(
			Globals.DISPLAY_SCALE * (this.x + Game.scroll.x - 8) < 0 ||
			Globals.DISPLAY_SCALE * (this.x + Game.scroll.x - 8) > window.innerWidth ||
			Globals.DISPLAY_SCALE * (this.y + Game.scroll.y - 8) < 0 ||
			Globals.DISPLAY_SCALE * (this.y + Game.scroll.y - 8) > window.innerHeight
		){return;}//if offscreen return immediately
		currentframe.ips ++;
		ctx3.drawImage(textures.get("item_" + this.id), this.x * Globals.DISPLAY_SCALE + (Game.scroll.x * Globals.DISPLAY_SCALE) - 8*Globals.DISPLAY_SCALE, this.y * Globals.DISPLAY_SCALE + (Game.scroll.y * Globals.DISPLAY_SCALE) - 8*Globals.DISPLAY_SCALE, 16 * Globals.DISPLAY_SCALE, 16 * Globals.DISPLAY_SCALE);
		if(keysPressed.indexOf("Shift") != -1){
			var x = (mouseX - (Game.scroll.x * Globals.DISPLAY_SCALE))/Globals.DISPLAY_SCALE;
			var y = (mouseY - (Game.scroll.y * Globals.DISPLAY_SCALE))/Globals.DISPLAY_SCALE;
			//alert(this.x + " " + this.y + "  " + x + " " + y);
			if(
				x > this.x - (8 * Globals.DISPLAY_SCALE) &&
				y > this.y - (8 * Globals.DISPLAY_SCALE) &&
				x < this.x + (8 * Globals.DISPLAY_SCALE) &&
				y < this.y + (8 * Globals.DISPLAY_SCALE)
			){
				ctx4.font = "16px monospace";
				ctx4.fillStyle = "#0033CC";
				ctx4.fillRect(mouseX, mouseY, (names.item[this.id] ?? this.id).length * 10, 16);
				ctx4.strokeStyle = "#000000";
				ctx4.strokeRect(mouseX, mouseY, (names.item[this.id] ?? this.id).length * 10, 16);
				ctx4.fillStyle = "#FFFFFF";
				ctx4.fillText((names.item[this.id] ?? this.id), mouseX + 2, mouseY + 10);
				if(currentframe?.tooltip){
					currentframe.tooltip = false;
				}
			}
		}
	}
	export(){
		if(this.deleted) return null;
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			grabbedBy: this.grabbedBy ? {x: this.grabbedBy.x, y: this.grabbedBy.y} : null
		};
	}
}

class Building {
	x: number;
	y: number;
	id: BuildingID;
	item: Item;
	inventory: StorageInventory;
	level: Level;
	static animated = false;
	constructor(tileX:number, tileY: number, id:BuildingID, level:Level){
		this.x = tileX;
		this.y = tileY;
		this.id = id;
		this.level = level;
		this.inventory = null;
	}
	static canBuildAt(tileX:number, tileY:number, level:Level){
		return level.tileAtByTile(tileX, tileY) != 0x02;
	}
	break(){
		if(this.item){
			this.item.grabbedBy = null;
		}
		if(this.inventory){
			for(var item of this.inventory){
				item.grabbedBy = null;
			}
		}
	}
	update(...any:any){
		
	}
	display(currentFrame:currentFrame){
		let pixelX = this.x * Globals.DISPLAY_TILE_SIZE + Game.scroll.x * Globals.DISPLAY_SCALE;
		let pixelY = this.y * Globals.DISPLAY_TILE_SIZE + Game.scroll.y * Globals.DISPLAY_SCALE;
		let _ctx = ctx2;
		let texture = textures.get(this.id.toString());
		if(texture){
			if(this.id % 0x100 == 5){
				switch(this.id){
					case 0x0005:
						_ctx.drawImage(texture, pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE); break;
					case 0x0105:
						_ctx.drawImage(texture, pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 2); break;
					case 0x0205:
						_ctx.drawImage(texture, pixelX - Globals.DISPLAY_TILE_SIZE, pixelY, Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE); break;
					case 0x0305:
						_ctx.drawImage(texture, pixelX, pixelY - Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 2); break;
					case 0x0405:
						_ctx.drawImage(texture, pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE); break;
					case 0x0505:
						_ctx.drawImage(texture, pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 3); break;
					case 0x0605:
						_ctx.drawImage(texture, pixelX - Globals.DISPLAY_TILE_SIZE * 2, pixelY, Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE); break;
					case 0x0705:
						_ctx.drawImage(texture, pixelX, pixelY - Globals.DISPLAY_TILE_SIZE * 2, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 3); break;
					case 0x0805:
						_ctx.drawImage(texture, pixelX, pixelY, Globals.DISPLAY_TILE_SIZE * 4, Globals.DISPLAY_TILE_SIZE); break;
					case 0x0905:
						_ctx.drawImage(texture, pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 4); break;
					case 0x0A05:
						_ctx.drawImage(texture, pixelX - Globals.DISPLAY_TILE_SIZE * 3, pixelY, Globals.DISPLAY_TILE_SIZE * 4, Globals.DISPLAY_TILE_SIZE); break;
					case 0x0B05:
						_ctx.drawImage(texture, pixelX, pixelY - Globals.DISPLAY_TILE_SIZE * 3, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE * 4); break;
				}
			} else {
				_ctx.drawImage(texture, pixelX, pixelY, Globals.DISPLAY_TILE_SIZE, Globals.DISPLAY_TILE_SIZE);
				if((this.constructor as typeof Building).animated){
					//do animations
				}
			}
		} else {
			_ctx.fillStyle = "#FF00FF";
			rect(pixelX, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			_ctx.fillStyle = "#000000";
			rect(pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			rect(pixelX, pixelY + Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, Globals.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
			_ctx.font = "15px sans-serif";
			_ctx.fillStyle = "#00FF00";
			_ctx.fillText(this.id.toString(), pixelX + Globals.DISPLAY_TILE_SIZE / 2, pixelY + Globals.DISPLAY_TILE_SIZE / 2);
		}
	}
	hasItem():Item {
		if(this.item) return this.item;
		if(this.inventory && this.inventory?.length != 0) return this.inventory[0];
		return null;
	}
	removeItem():Item {
		if(this.item){
			var temp = this.item;
			this.item = null;
			return temp;
		}
		if(this.inventory?.length > 0){
			return this.inventory.pop();
		}
		return null;
	}
	spawnItem(id:string){
		id ??= "base_null";
		if(
			(this.level.buildingIDAtTile(this.x + 1, this.y) === 0x0001 ||
			this.level.buildingIDAtTile(this.x + 1, this.y) === 0x0701 ||
			this.level.buildingIDAtTile(this.x + 1, this.y) === 0x0B01) &&
			(this.level.buildingAtTile(this.x + 1, this.y) as Conveyor).item == null
		){
			this.level.addItem(this.x * Globals.TILE_SIZE + Globals.TILE_SIZE * 1.1, this.y * Globals.TILE_SIZE + Globals.TILE_SIZE * 0.5, id);
		} else if(
			(this.level.buildingIDAtTile(this.x, this.y + 1) === 0x0101 ||
			this.level.buildingIDAtTile(this.x, this.y + 1) === 0x0501 ||
			this.level.buildingIDAtTile(this.x, this.y + 1) === 0x0901) &&
			(this.level.buildingAtTile(this.x, this.y + 1) as Conveyor).item == null
		){
			this.level.addItem(this.x * Globals.TILE_SIZE + Globals.TILE_SIZE * 0.5, this.y * Globals.TILE_SIZE + Globals.TILE_SIZE * 1.1, id);
		} else if(
			(this.level.buildingIDAtTile(this.x - 1, this.y) === 0x0201 ||
			this.level.buildingIDAtTile(this.x - 1, this.y) === 0x0601 ||
			this.level.buildingIDAtTile(this.x - 1, this.y) === 0x0A01) &&
			(this.level.buildingAtTile(this.x - 1, this.y) as Conveyor).item == null
		){
			this.level.addItem(this.x * Globals.TILE_SIZE - Globals.TILE_SIZE * 0.1, this.y * Globals.TILE_SIZE + Globals.TILE_SIZE * 0.5, id);
		} else if(
			(this.level.buildingIDAtTile(this.x, this.y - 1) === 0x0301 ||
			this.level.buildingIDAtTile(this.x, this.y - 1) === 0x0401 ||
			this.level.buildingIDAtTile(this.x, this.y - 1) === 0x0801) &&
			(this.level.buildingAtTile(this.x, this.y - 1) as Conveyor).item == null
		){
			this.level.addItem(this.x * Globals.TILE_SIZE + Globals.TILE_SIZE * 0.5, this.y * Globals.TILE_SIZE - Globals.TILE_SIZE * 0.1, id);
		} else {
			return false;
		}
		return true;
	}
	grabItem(filter:(item:Item) => any, callback:(item:Item) => void, remove:boolean, grabDistance?:number){
		grabDistance ??= 0.5;
		filter ??= () => {return true};
		for(var item in this.level.items){
			if(
				(Math.abs(this.level.items[item].x - ((this.x + grabDistance) * Globals.TILE_SIZE)) <= Globals.TILE_SIZE * grabDistance) &&
				(Math.abs(this.level.items[item].y - ((this.y + grabDistance) * Globals.TILE_SIZE)) <= Globals.TILE_SIZE * grabDistance) &&
				filter(this.level.items[item])
			){
				this.level.items[item].grabbedBy = this;
				callback(this.level.items[item]);
				let returnItem = this.level.items[item];
				if(remove){
					this.level.items.splice(parseInt(item), 1);
				}
				return returnItem;
			}
		}
		return null;
	}
	acceptItem(item:Item):boolean{
		if(this.item === null){
			this.item = item;
		} else if(this.inventory?.length < this.inventory?.MAX_LENGTH){
			this.inventory.push(item);
		} else {
			return false;
		}
		item.grabbedBy = this;
		return true;
	}
	export(){
		var inv = [];
		if(this.inventory){
			for(var item of this.inventory){
				inv.push(item.export());
			}
		}
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			item: this.item?.export(),
			inv: inv
		};
	}
}

class BuildingWithRecipe extends Building {
	timer: number;
	recipe: Recipe;
	static recipeType: any;
	constructor(tileX, tileY, id, level){
		super(tileX, tileY, id, level);
		if(this.constructor === BuildingWithRecipe) throw this;
		this.timer = -1;
		this.item = null;
	}

	findRecipe(item:Item):Recipe {
		for(var recipe of (this.constructor as any).recipeType.recipes){
			if(item.id == recipe.inputs[0]){
				return recipe;
			}
		}
		return null;
	}
	setRecipe(recipe:Recipe){
		if(!(<any>recipe?.inputs instanceof Array)) return;
		this.recipe = recipe;
		this.timer = recipe.duration;
	}
	hasItem():Item {
		return null;
	}
	removeItem():Item {
		return null;
	}
	update(){

		if(!this.recipe && this.item) this.setRecipe(this.findRecipe(this.item));

		if(this.timer > 0 && this.item){
			this.timer --;
		} else if(this.timer == 0 && this.item){
			if(this.spawnItem(this.recipe.outputs[0])){
				this.timer = -1;
				this.item = null;
			}
		} else if(!this.item){
			this.grabItem(this.findRecipe.bind(this), (item) => {
				this.setRecipe(this.findRecipe(item));
			}, true);
		}
	}
	acceptItem(item:Item):boolean {
		if(this.item) return false;
		let recipe = this.findRecipe(item);
		if(recipe){
			this.setRecipe(recipe);
			this.item = item;
			return true;
		}
		return false;
	}

}

class BuildingWithTwoRecipe extends Building {
	timer: number;
	item1: Item;
	item2: Item;
	hasRunOnce: boolean;
	recipe: Recipe;
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		if(this.constructor === BuildingWithTwoRecipe) throw this;
		this.timer = -1;
		this.item1 = null;
		this.item2 = null;
		this.hasRunOnce = false;
	}
	acceptItem(item:Item):boolean {
		if(!this.item1){
			for(var recipe of <Recipe[]>(this.constructor as any).recipeType.recipes){
				if(recipe.inputs[0] == item.id || recipe.inputs[1] == item.id){
					this.item1 = item;
					return true;
				}
			}
			return false;
		}
		if(!this.item2 && this.item1.id != item.id){
			for(var recipe of <Recipe[]>(this.constructor as any).recipeType.recipes){
				if(recipe.inputs[0] == item.id || recipe.inputs[1] == item.id){
					this.item2 = item;
					return true;
				}
			}
			return false;
		}
		return false;
	}
	findRecipe(item1:Item, item2:Item):Recipe {
		for(var recipe of (this.constructor as any).recipeType.recipes){
			if(
				recipe.inputs[0] == item1?.id ||
				recipe.inputs[1] == item2?.id &&
				recipe.inputs[1] == item1?.id ||
				recipe.inputs[0] == item2?.id
			){
				return recipe;
			}
		}
		return null;
	}
	hasItem():Item {
		return null;
	}
	removeItem():Item {
		return null;
	}
	setRecipe(recipe:Recipe){
		if(!(<any>recipe?.inputs instanceof Array)) return;
		this.recipe = recipe;
		this.timer = recipe.duration;
	}
	update(){
		if(!this.item1){
			this.grabItem(((item) => {return item.id != this.item2?.id;}).bind(this), (item:Item) => {this.item1 = item;}, true);
		}
		if(!this.item2){
			this.grabItem(((item) => {return item.id != this.item1?.id;}).bind(this), (item:Item) => {this.item2 = item;}, true);
		}
		if(this.item1 instanceof Item && this.item2 instanceof Item){
			if(!this.recipe){
				this.setRecipe(this.findRecipe(this.item1, this.item2));
				return;
			}
			if(this.timer > 0){
				this.timer --;
			} else if(this.timer == 0){
				if(this.spawnItem(this.recipe.outputs[0])){
					this.timer = -1;
					this.item1 = null;
					this.item2 = null;
					this.recipe = null;
				}
			}
		}
	}
}


class Miner extends Building {
	timer: number;
	miningItem: ItemID;
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.timer = 61;
		for(var recipe of recipes.base_mining.recipes){
			if(recipe.tile == level.tileAtByTile(tileX, tileY)){
				this.miningItem = recipe.outputs[0];
			}
		}
	}
	static canBuildAt(tileX:number, tileY:number, level:Level):boolean {
		return level.tileAtByTile(tileX, tileY) >> 4 == 1;
	}
	update(){
		if(this.timer > 0){
			this.timer --;
		} else {
			this.timer = 61;
			if(this.spawnItem(this.miningItem)){
				trigger(triggerType.buildingRun, this.id % 0x100 as RawBuildingID, this.miningItem);
			}
		}
	}
}



class TrashCan extends Building {
	update(){
		this.grabItem(_ => {return true}, item => {item.deleted = true;}, true);
	}
	acceptItem(item:Item){
		return true;
	}
}


class Furnace extends BuildingWithRecipe {
	static recipeType = recipes.base_smelting;
	static animated = true;
	static canBuildAt(tileX:number, tileY:number, level:Level){
		return level.tileAtByTile(tileX, tileY) == 0x01;
	}
}

class Conveyor extends Building {
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.item = null;
	}
	break(){
		if(this.item instanceof Item){
			this.level.items.push(this.item);
			if(this.item.grabbedBy === this){
				this.item.grabbedBy = null;
			}
		}
		this.item = null;
	}
	display(currentFrame:currentFrame){
		super.display(currentFrame);
		if(this.item instanceof Item){
			this.item.display(currentFrame);
		}
	}
	update(currentframe, nograb?:boolean){
		if(this.item instanceof Item){
			if(Math.floor(this.item.x / Globals.TILE_SIZE) != this.x || Math.floor(this.item.y / Globals.TILE_SIZE) != this.y){
				let building = this.level.buildingAtTile(Math.floor(this.item.x / Globals.TILE_SIZE), Math.floor(this.item.y / Globals.TILE_SIZE));
				if(!building) return;
				if(building.acceptItem(this.item)){
					this.item = null;
				}
				return;
			}
			switch(this.id >> 8){//bit masks ftw, this just grabs the first byte
				//yes I know there's no need to write the ids in hex but why the heck not
				case 0x00:
					this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					this.item.x += Globals.buildings.conveyor.SPEED;
					break;
				case 0x01:
					this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					this.item.y += Globals.buildings.conveyor.SPEED;
					break;
				case 0x02:
					this.item.x -= Globals.buildings.conveyor.SPEED;
					this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					break;
				case 0x03:
					this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					this.item.y -= Globals.buildings.conveyor.SPEED;
					break;
				case 0x04:
					if(pixelToTile(this.item.x) >= Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					} else if(pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= Globals.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
						this.item.y --;
					} else {
						this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
						this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
					}
					break;
				case 0x05:
					if(pixelToTile(this.item.x) >= Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					} else if(pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= Globals.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
						this.item.y ++;
					} else {
						this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
						this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
					}
					break;
				case 0x06:
					if(pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= Globals.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelToTile(this.item.x) > Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					} else {
						this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
						this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
					}
					break;
				case 0x07:
					if(pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= Globals.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelToTile(this.item.x) < Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					} else {
						this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
						this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
					}
					break;
				case 0x08:
					if(pixelToTile(this.item.x) <= Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					} else if(pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= Globals.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
						this.item.y --;
					} else {
						this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
						this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
					}
					break;
				case 0x09:
					if(pixelToTile(this.item.x) <= Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					} else if(pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= Globals.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
						this.item.y ++;
					} else {
						this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
						this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
					}
					break;
				case 0x0A:
					if(pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= Globals.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelToTile(this.item.x) > Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					} else {
						this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
						this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
					}
					break;
				case 0x0B:
					if(pixelToTile(this.item.x) == Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= Globals.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelToTile(this.item.x) < Globals.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == Globals.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / Globals.TILE_SIZE) * Globals.TILE_SIZE) + Globals.TILE_SIZE/2;
					} else {
						this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
						this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
					}
					break;
			}
		} else if(!nograb){
			this.grabItem(null, (item) => {this.item = item;}, true);
		}
	}
}


class Extractor extends Conveyor {
	constructor(x:number, y:number, id:BuildingID, level:Level){
		super(x, y, id, level);
	}

	display(currentFrame:currentFrame){
		super.display(currentFrame);
		if(this.item instanceof Item){
			this.item.display(currentFrame);
		}
	}

	grabItemFromTile(filter?:(item:Item) => any, callback?:(item:Item) => void, remove?:boolean, grabDistance?:number){
		filter ??= (item) => {return item instanceof Item;};
		callback ??= () => {};

		if(
			this.level.buildingAtTile(this.x, this.y) instanceof Building &&
			filter(this.level.buildingAtTile(this.x, this.y).hasItem())
		){
			let item = this.level.buildingAtTile(this.x, this.y).removeItem();
			if(!(item instanceof Item)) throw "what even";
			if(item.deleted) throw "wat?";
			this.item = item;
			this.item.y = (this.y + 0.5) * Globals.TILE_SIZE;
			this.item.x = (this.x + 0.5) * Globals.TILE_SIZE;
			item.grabbedBy = this;
			if(this.level.items.indexOf(item) != -1){
				this.level.items.splice(this.level.items.indexOf(item), 1);
			}
		}

	}

	dropItem(){
		if(this.item instanceof Item){
			if(this.level.buildingAtPixel(this.item.x, this.item.y)?.acceptItem(this.item)){
				this.item = null;
			}
		} else {
			console.error(this);
			throw new Error(`no item to drop; extractor at ${this.x} ${this.y}`);
		}
	}

	update(currentFrame){
		if(this.item instanceof Item){
			if(this.item.grabbedBy != this || this.item.deleted){
				console.error(this.item);
				console.error(this);
				throw new RangeError("ERR Item somehow grabbed or deleted from an extractor.");
			}

			switch(this.id){
				case 0x0005:
					if(this.item.x > (this.x + 1.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.x ++;
					}
					break;
				case 0x0105:
					if(this.item.y > (this.y + 1.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.y ++;
					}
					break;
				case 0x0205:
					if(this.item.x < (this.x - 0.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.x --;
					}
					break;
				case 0x0305:
					if(this.item.y < (this.y - 0.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.y --;
					}
					break;
				case 0x0405:
					if(this.item.x > (this.x + 2.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.x ++;
					}
					break;
				case 0x0505:
					if(this.item.y > (this.y + 2.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.y ++;
					}
					break;
				case 0x0605:
					if(this.item.x < (this.x - 1.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.x --;
					}
					break;
				case 0x0705:
					if(this.item.y < (this.y - 1.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.y --;
					}
					break;
				case 0x0805:
					if(this.item.x > (this.x + 3.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.x ++;
					}
					break;
				case 0x0905:
					if(this.item.y > (this.y + 3.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.y ++;
					}
					break;
				case 0x0A05:
					if(this.item.x < (this.x - 2.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.x --;
					}
					break;
				case 0x0B05:
					if(this.item.y < (this.y - 2.5) * Globals.TILE_SIZE){return this.dropItem();} else {
						this.item.y --;
					}
					break;
			}
		} else {
			this.grabItemFromTile();
		}
	}
}

interface StorageInventory extends Array<Item> {
	MAX_LENGTH: number;
	at: Function;
}
class StorageBuilding extends Building {
	inventory: StorageInventory;
	constructor(tileX:number, tileY: number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		let temp:any = [];
		temp.MAX_LENGTH = 64;
		this.inventory = temp;
	}
	update(){
		if(this.inventory.length < this.inventory.MAX_LENGTH){
			this.grabItem(null, (item:Item) => {this.inventory.push(item);}, true);
		}
	}
	grabItem(filter:(item:Item) => any, callback:(item:Item) => void, remove:boolean, grabDistance?:number):Item {
		let item = super.grabItem(filter, callback, remove, grabDistance);
		if(item){
			item.x = (this.x + 0.5) * Globals.TILE_SIZE;
			item.y = (this.y + 0.5) * Globals.TILE_SIZE;
			return item;
		}
		return null;
	}
}


let totalAlloySmeltersRun = 0;

class ResourceAcceptor extends Building {
	acceptItem(item:Item){
		item.deleted = true;
		item.grabbedBy = null;
		if(! this.level.resources[item.id]){
			this.level.resources[item.id] = 0;
		}
		this.level.resources[item.id] ++;
		return true;
	}
	update(){
		this.grabItem(null, item => {
			item.deleted = true;
			item.grabbedBy = null;
			if(! this.level.resources[item.id]){
				this.level.resources[item.id] = 0;
			}
			this.level.resources[item.id] ++;
		}, true);
	}
}

//I love abstraction
class AlloySmelter extends BuildingWithTwoRecipe {
	static animated = true;
	static recipeType = recipes.base_alloying;
}

class Wiremill extends BuildingWithRecipe {
	static recipeType = recipes.base_wiremilling;
}

class Compressor extends BuildingWithRecipe {
	static recipeType = recipes.base_compressing;
}

class Lathe extends BuildingWithRecipe {
	static recipeType = recipes.base_lathing;
}

class Assembler extends BuildingWithTwoRecipe {
	static recipeType = recipes.base_assembling;
}


const BuildingType: {
	[index:number]: typeof Building
} = {
	0x01: Conveyor,
	0x02: Miner,
	0x03: TrashCan,
	0x04: Furnace,
	0x05: Extractor,
	0x06: StorageBuilding,
	0x07: AlloySmelter,
	0x08: ResourceAcceptor,
	0x09: Wiremill,
	0x0A: Compressor,
	0x0B: Lathe,
	0x0C: Assembler
};