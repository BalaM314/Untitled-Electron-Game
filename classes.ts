
type Tile = 
0x00 |  //Blank
0x01 |  //stone
0x02 |  //iron ore
0x03 |  //coal ore
0x04 |	//water
0xFF ;  //Unset
type BuildingID = 
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
0xFFFF ;	//Unset




const enum ItemID {
	"base_null",
	"base_coalOre",
	"base_coal",
	"base_ironOre",
	"base_ironIngot"
}

const rands = {
	x_prime: 1299689,
	y_prime: 1156709,
	hill_x: 89,
	hill_y: 11,
	ore_type: 103
}

let Game = {
	scroll: {
		x: 300,
		y: 300
	}
};

interface ChunkedDataStorage {
	storage: Map<string, Chunk>;
	seed: number;
	format: string;
}

class ChunkedDataStorage {
	constructor(seed:number | null){
		this.storage = new Map();
		this.seed = seed ? seed : 0;
		this.format = consts.VERSION;
	}
	getChunk(tileX:number, tileY:number, dontGenerateChunk?:boolean):Chunk{
		if(this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`)){
			return this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`);
		} else if(!dontGenerateChunk){
			return this.generateChunk(Math.floor(tileX / consts.CHUNK_SIZE),Math.floor(tileY / consts.CHUNK_SIZE));
		} else {
			return null;
		}
	}
	generateChunk(x:number, y:number){
		if(this.storage.get(`${x},${y}`)){
			return;
		}
		this.storage.set(`${x},${y}`, 
			new Chunk(x, y, this.seed)
			.generate()
		);
		console.log(`generated chunk ${x}, ${y}`)
		return this.storage.get(`${x},${y}`);
	}
	tileAt(pixelX:number, pixelY:number):Tile{
		return this.getChunk(
			Math.floor(pixelX/consts.TILE_SIZE),
			Math.floor(pixelY/consts.TILE_SIZE)
		).tileAt(tileToChunk(pixelX/consts.TILE_SIZE), tileToChunk(pixelY/consts.TILE_SIZE));
	}
	tileAt2(tileX:number, tileY:number):Tile{
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).tileAt(tileToChunk(tileX), tileToChunk(tileY));
	}
	writeTile(tileX:number, tileY:number, tile:Tile):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setTile(tileToChunk(tileX), tileToChunk(tileY), tile);
			return true;
		}
		return false;
	}
	generateNecessaryChunks(){
		var xOffset = - Math.floor(Game.scroll.x / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
		var yOffset = - Math.floor(Game.scroll.y / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
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
	}
}

interface Level {
	items: Item[];
	buildings: Building[];
}
class Level extends ChunkedDataStorage {
	constructor(seed:number){
		super(seed);
		this.items = [];
		this.buildings = [];
	}
	buildingIDAt(pixelX:number, pixelY:number):BuildingID{
		return this.getChunk(
			Math.floor(pixelX/consts.TILE_SIZE),
			Math.floor(pixelY/consts.TILE_SIZE)
		).buildingAt(tileToChunk(pixelX/consts.TILE_SIZE), tileToChunk(pixelY/consts.TILE_SIZE));
	}
	buildingIDAt2(tileX:number, tileY:number):BuildingID{
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).buildingAt(tileToChunk(tileX), tileToChunk(tileY));
	}
	addItem(x:number, y:number, id:ItemID){
		let tempitem = new Item(x, y, id, this);
		this.items.push(tempitem);
		return tempitem;
	}
	update(){
		for(var item of this.items){
			item.update();
		}
		for(var building of this.buildings){
			building.update();
		}
	}
	displayGhostBuilding(tileX:number, tileY:number, buildingID:BuildingID){
		tileX = Math.floor(tileX);
		tileY = Math.floor(tileY);
		if(this.getChunk(tileX, tileY, true) == null){
			return;
		}
		switch(buildingID){
			case 0x0004:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, Furnace.canBuildAt(tileX, tileY, this) ? 1 : 2);
			break;
			case 0x0002:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, Miner.canBuildAt(tileX, tileY, this) ? 1 : 2);
			break;
			case 0x0001: case 0x0101: case 0x0201: case 0x0301:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), this.getTurnedConveyor(tileX, tileY, buildingID >> 8), Conveyor.canBuildAt(tileX, tileY, this) ? 1 : 2);
				break;
			default:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, 1);
			break;
		}
	}
	getTurnedConveyor(tileX:number, tileY:number, conveyorType:number){
		tileX = Math.floor(tileX);
		tileY = Math.floor(tileY);
		let topConveyor:BuildingID | boolean = this.buildingIDAt2(tileX, tileY - 1);
		topConveyor = topConveyor == 0x0101 || topConveyor == 0x0601 || topConveyor == 0x0701;
		let rightConveyor:BuildingID | boolean = this.buildingIDAt2(tileX + 1, tileY);
		rightConveyor = rightConveyor == 0x0201 || rightConveyor == 0x0801 || rightConveyor == 0x0901;
		let leftConveyor:BuildingID | boolean = this.buildingIDAt2(tileX - 1, tileY);
		leftConveyor = leftConveyor == 0x0001 || leftConveyor == 0x0401 || leftConveyor == 0x0501;
		let bottomConveyor:BuildingID | boolean = this.buildingIDAt2(tileX, tileY + 1);
		bottomConveyor = bottomConveyor == 0x0301 || bottomConveyor == 0x0A01 || bottomConveyor == 0x0B01;
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
	writeBuilding(tileX:number, tileY:number, buildingID:BuildingID):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID);
			return true;
		}
		return false;
	}
	buildBuilding(tileX:number, tileY:number, building:BuildingID):boolean {
		var tempBuilding:Building;
		switch(building){
			case 0x0004:
				tempBuilding = new Furnace(tileX, tileY, 0x0004, this);//typecsript go brrrrr
				if(!Furnace.canBuildAt(tileX, tileY, this)) return;
			break;
			case 0x0003:
				tempBuilding = new TrashCan(tileX, tileY, 0x0003, this);//typescript go brrrrr
			break;
			case 0x0002:
				if(!Miner.canBuildAt(tileX, tileY, this)) return;
				tempBuilding = new Miner(tileX, tileY, 0x0002, this);//typescript go brrrrr
			break;
			case 0x0001: case 0x0101: case 0x0201: case 0x0301: case 0x0401: case 0x0501: case 0x0601: case 0x0701: case 0x0801: case 0x0901: case 0x0A01: 
				if(!Conveyor.canBuildAt(tileX, tileY, this)) return;
				return this.writeBuilding(tileX, tileY, this.getTurnedConveyor(tileX, tileY, building >> 8));
			break;
			default:
				return this.writeBuilding(tileX, tileY, building);
			break;
		}
		this.buildings.push(tempBuilding);
		this.getChunk(tileX,tileY).setBuilding(tileToChunk(tileX), tileToChunk(tileY), tempBuilding.id);
		return true;
	}
	display(debug:boolean, _ctx?:CanvasRenderingContext2D):void {
		_ctx = _ctx ?? ctx;

		//Currently we will just display every chunk that exists. Obviously this is not sustainable.
		for(var chunk of this.storage.values()){
			chunk.display(debug);
		}

		for(let item of this.items){
			item.display(debug);
		}
	}
}

interface Chunk {
	layers: [
		Tile[][],
		BuildingID[][],
		null[][]
	];
	chunkSeed: number;
	x: number;
	y: number;
	isWet: boolean;
}


class Chunk {
	constructor(x:number, y:number, seed:number){
		this.x = x;
		this.y = y;
		this.chunkSeed = Math.abs(Math.round(
			seed * (x ? x : 23) * rands.x_prime +
			seed * (y ? y : 133) * rands.y_prime +
			Math.pow((Math.abs(x + y) % 10) + 10, (seed % 10) + 10) +
			123456789
		)) % 2147483648;
		this.layers = [
			null,//Ground(ground, dirt)
			null,//Buildings
			null//Reserved
		];

		this.layers[0] = [];
		for(let x = 0; x < consts.CHUNK_SIZE; x ++){
			this.layers[0][x] = [];
			for(let z = 0; z < consts.CHUNK_SIZE; z ++){
				this.layers[0][x].push(0xFF);
			}
		}

		this.layers[1] = [];
		for(let x = 0; x < consts.CHUNK_SIZE; x ++){
			this.layers[1][x] = [];
			for(let z = 0; z < consts.CHUNK_SIZE; z ++){
				this.layers[1][x].push(0xFFFF);
			}
		}

		this.layers[2] = [];
		for(let x = 0; x < consts.CHUNK_SIZE; x ++){
			this.layers[2][x] = [];
			for(let z = 0; z < consts.CHUNK_SIZE; z ++){
				this.layers[2][x].push(null);
			}
		}

		return this;
	}
	generate():Chunk {
		//Put down the base
		this.isWet = this.chunkSeed < 134217728 && Math.abs(this.x) > 3 && Math.abs(this.y) > 3;
		for(var row in this.layers[0]){
			for(var tile in this.layers[0][row]){
				this.layers[0][row][tile] = this.isWet ? 0x04 : 0x00;
			}
		}

		if(!this.isWet){
			this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, (((this.chunkSeed - rands.ore_type) % 3) > 1 && (Math.abs(this.x) > 1 || Math.abs(this.y) > 1)) ? 0x03 : 0x02);
			this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
			this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
			this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, 0x01);
			this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, 0x01);
			this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 4 > 1) ? 0x01 : 0x00);
			this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 8 > 3) ? 0x01 : 0x00);
			this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 16 > 7) ? 0x01 : 0x00);
			this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 32 > 15) ? 0x01 : 0x00);
		}

		if(this.isWet){
			this.setTile(7, 7, 0x02);
			this.setTile(8, 7, 0x03);
			this.setTile(7, 8, 0x03);
			this.setTile(8, 8, 0x02);
			this.setTile(6, 7, 0x01);
			this.setTile(7, 6, 0x01);
			this.setTile(6, 8, 0x01);
			this.setTile(8, 6, 0x01);
			this.setTile(8, 9, 0x01);
			this.setTile(9, 8, 0x01);
			this.setTile(7, 9, 0x01);
			this.setTile(9, 7, 0x01);
		}

		return this;
	}
	update():Chunk {
		return this;
	}
	tileAt(tileX:number, tileY:number):Tile {
		return this.layers[0]?.[tileY]?.[tileX] ?? null;
	}
	buildingAt(x:number, y:number):BuildingID {
		return this.layers[1]?.[y]?.[x] ?? null;
	}
	setTile(x:number, y:number, tile:Tile):boolean {
		if(this.tileAt(x, y) == null){
			return false;
		}
		this.layers[0][y][x] = tile;
		return true;
	}
	setBuilding(x:number, y:number, buildingId:BuildingID):boolean {
		if(this.tileAt(x, y) == null){
			return false;
		}
		this.layers[1][y][x] = buildingId;
		return true;
	}
	displayToConsole(){
		console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
		console.table(this.layers[0]);
	}
	display(debug:boolean){
		if(
			Game.scroll.x + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerWidth + 1 ||
			Game.scroll.x + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE ||
			Game.scroll.y + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerHeight + 1 ||
			Game.scroll.y + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE
		){return false;}//if offscreen return immediately
		for(var y in this.layers[0]){
			for(var x in this.layers[0][y]){
				this.displayTile(parseInt(x), parseInt(y));
			}
		}
		for(var y in this.layers[0]){
			for(var x in this.layers[0][y]){
				this.displayBuilding(parseInt(x), parseInt(y), this.buildingAt(tileToChunk(parseInt(x)), tileToChunk(parseInt(y))));
			}
		}
		if(debug){
			overlayCtx.strokeStyle = "#0000FF";
			overlayCtx.strokeRect(this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + Game.scroll.x, this.y  * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + Game.scroll.y, consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE, consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE);
			overlayCtx.font = "40px sans-serif";
			//overlayCtx.fillText(this.chunkSeed.toString(), this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE * 0.5) + Game.scroll.x, this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE * 0.5) + Game.scroll.y);
		}
	}
	displayTile(x:number, y:number){
		let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + Game.scroll.x;
		let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + Game.scroll.y;
		switch(this.tileAt(x, y)){
			case 0x00:
				ctx.fillStyle = "#00CC33";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				break;
			case 0x01:
				ctx.fillStyle = "#999999";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				break;
			case 0x02:
				ctx.fillStyle = "#666666";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				ctx.fillStyle = "#000000";
				ellipse(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.25, consts.DISPLAY_TILE_SIZE * 0.25);
				break;
			case 0x03:
				ctx.fillStyle = "#666666";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				ctx.fillStyle = "#CBCDCD";
				ellipse(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.25, consts.DISPLAY_TILE_SIZE * 0.25);
				break;
			case 0x04:
				ctx.fillStyle = "#0033CC";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				break;
			case 0xFF:
				ctx.fillStyle = "#FF00FF";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				ctx.fillStyle = "#000000";
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				break;
			default:
				ctx.fillStyle = "#FF00FF";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				ctx.fillStyle = "#000000";
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				ctx.font = "15px sans-serif";
				ctx.fillStyle = "#00FF00";
				ctx.fillText(this.tileAt(x, y).toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
		}
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 1;
		ctx.strokeRect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
	}
	displayBuilding(x:number, y:number, buildingID:BuildingID, isGhost?:number){
		if(buildingID == 0xFFFF){return;}
		let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + Game.scroll.x;
		let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + Game.scroll.y;
		if(isGhost == 2){
			ctx.strokeStyle = "#EE6666";
			ctx.fillStyle = "#EE6666";
		} else if(isGhost == 1){
			ctx.strokeStyle = "#888888";
			ctx.fillStyle = "#888888";
		} else {
			switch(buildingID){
				case 0x0002:
					ctx.fillStyle = "#3366CC";
					ctx.strokeStyle = "#3366CC";
					break;
				default:
					ctx.fillStyle = "#000000";
					ctx.strokeStyle = "#000000";
					break;
			}
		}
		switch(buildingID){


			case 0x0001:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				ctx.stroke();
				break;
			case 0x0101:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				ctx.stroke();
				break;
			case 0x0201:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				ctx.stroke();
				break;
			case 0x0301:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				ctx.stroke();
				break;
			case 0x0401:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				ctx.stroke();
				break;
			case 0x0501:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				ctx.stroke();
				break;
			case 0x0601:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				ctx.stroke();
				break;
			case 0x0701:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				ctx.stroke();
				break;
			case 0x0801:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				ctx.stroke();
				break;
			case 0x0901:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				ctx.stroke();
				break;
			case 0x0A01:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				ctx.stroke();
				break;
			case 0x0B01:
				ctx.beginPath();
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				ctx.stroke();
				break;
				
			
			case 0x0002:
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.6, rectMode.CENTER);
				break;
			
			case 0x0003:
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.6, rectMode.CENTER);
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.1, rectMode.CORNER);
				break;
			
			case 0x0004:
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER);
				ctx.fillStyle = "#FFCC11";
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.4, consts.DISPLAY_TILE_SIZE * 0.4, rectMode.CENTER);
				break
		}
	}
}

interface Item {
	id: ItemID;
	x: number;
	y: number;
	level: Level;
}
class Item {
	constructor(x:number, y:number, id:ItemID, level:Level){
		this.id = id;
		this.x = x;
		this.y = y;
		this.level = level;
	}
	update(){
		if(this.level.buildingIDAt(this.x, this.y) % 0x100 == 0x01){//this is basically bit math that says "is the last byte == 01". In other words, "Is this item on a conveyor?"
			switch(this.level.buildingIDAt(this.x, this.y) >> 8){//bit masks ftw, this just grabs the first byte
				//yes I know there's no need to write the ids in hex but why the heck not
				case 0x00:
					this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					this.x += consts.buildings.conveyor.SPEED;
					break;
				case 0x01:
					this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					this.y += consts.buildings.conveyor.SPEED;
					break;
				case 0x02:
					this.x -= consts.buildings.conveyor.SPEED;
					this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					break;
				case 0x03:
					this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					this.y -= consts.buildings.conveyor.SPEED;
					break;
				case 0x04:
					if(pixelToTile(this.x) >= consts.TILE_SIZE * 0.5 && pixelToTile(this.y) == consts.TILE_SIZE * 0.5){
						this.x ++;
						this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelToTile(this.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.y) >= consts.TILE_SIZE * 0.5){
						this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.y --;
					}
					break;
				case 0x05:
					if(pixelToTile(this.x) >= consts.TILE_SIZE * 0.5 && pixelToTile(this.y) == consts.TILE_SIZE * 0.5){
						this.x ++;
						this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelToTile(this.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.y) <= consts.TILE_SIZE * 0.5){
						this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.y ++;
					}
					break;
				case 0x06:
					if(pixelToTile(this.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.y) >= consts.TILE_SIZE * 0.5){
						this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.y ++;
					} else if(pixelToTile(this.x) > consts.TILE_SIZE * 0.5 && pixelToTile(this.y) == consts.TILE_SIZE * 0.5){
						this.x --;
						this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x07:
					if(pixelToTile(this.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.y) >= consts.TILE_SIZE * 0.5){
						this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.y ++;
					} else if(pixelToTile(this.x) < consts.TILE_SIZE * 0.5 && pixelToTile(this.y) == consts.TILE_SIZE * 0.5){
						this.x ++;
						this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x08:
					if(pixelToTile(this.x) <= consts.TILE_SIZE * 0.5 && pixelToTile(this.y) == consts.TILE_SIZE * 0.5){
						this.x --;
						this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelToTile(this.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.y) >= consts.TILE_SIZE * 0.5){
						this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.y --;
					}
					break;
				case 0x09:
					if(pixelToTile(this.x) <= consts.TILE_SIZE * 0.5 && pixelToTile(this.y) == consts.TILE_SIZE * 0.5){
						this.x --;
						this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelToTile(this.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.y) <= consts.TILE_SIZE * 0.5){
						this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.y ++;
					}
					break;
				case 0x0A:
					if(pixelToTile(this.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.y) <= consts.TILE_SIZE * 0.5){
						this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.y --;
					} else if(pixelToTile(this.x) > consts.TILE_SIZE * 0.5 && pixelToTile(this.y) == consts.TILE_SIZE * 0.5){
						this.x --;
						this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x0B:
					if(pixelToTile(this.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.y) <= consts.TILE_SIZE * 0.5){
						this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.y --;
					} else if(pixelToTile(this.x) < consts.TILE_SIZE * 0.5 && pixelToTile(this.y) == consts.TILE_SIZE * 0.5){
						this.x ++;
						this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
			}
		}
	}
	display(debug?:boolean, _ctx?:CanvasRenderingContext2D){
		_ctx = _ctx ?? ctx;
		switch(this.id){
			case ItemID.base_null:
				ctx.fillStyle = "#FF00FF";break;
			case ItemID.base_coalOre:
				ctx.fillStyle = "#444444";break;
			case ItemID.base_coal:
				ctx.fillStyle = "#000000";break;
			case ItemID.base_ironOre:
				ctx.fillStyle = "#663300";break;
			case ItemID.base_ironIngot:
				ctx.fillStyle = "#CBCDCD";break;
		}
		_ctx.fillRect((this.x * consts.DISPLAY_SCALE) - 5 + Game.scroll.x, (this.y * consts.DISPLAY_SCALE) - 5 + Game.scroll.y, 10, 10);
	}
}

interface Building{
	x: number;
	y: number;
	id: BuildingID;
	level: Level;
}
class Building {
	constructor(tileX:number, tileY: number, id:BuildingID, level:Level){
		this.x = tileX;
		this.y = tileY;
		this.id = id;
		this.level = level;
	}
	update(){
		if(this.level.buildingIDAt2(this.x, this.y) != this.id){
			return this.break();
		}
	}
	break(){
		this.level.buildings.splice(this.level.buildings.indexOf(this), 1);
	}
}


interface Miner {
	timer: number;
	itemBuffer: number;
	miningItem: ItemID;
	oreFor: any;
}
class Miner extends Building {
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.timer = 30;
		this.itemBuffer = 0;
		this.miningItem = oreFor[level.tileAt2(tileX, tileY)];
	}
	static canBuildAt(tileX:number, tileY:number, level:Level):boolean {
		return (level.tileAt2(tileX, tileY) == 0x02 || level.tileAt2(tileX, tileY) == 0x03) && level.buildingIDAt2(tileX, tileY) != 0x0002;
	}
	update(){
		if(this.level.buildingIDAt2(this.x, this.y) != this.id){
			return this.break();
		}
		if(this.timer > 0){
			this.timer --;
		} else {
			this.timer = 30;
			this.spawnItem();
		}
	}
	spawnItem(){
		if(this.level.buildingIDAt2(this.x + 1, this.y) % 0x100 == 0x01 && this.level.buildingIDAt2(this.x + 1, this.y) !== 0x0201){
			this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.miningItem);
		} else if(this.level.buildingIDAt2(this.x, this.y + 1) % 0x100 == 0x01 && this.level.buildingIDAt2(this.x, this.y + 1) !== 0x0301){
			this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, this.miningItem);
		} else if(this.level.buildingIDAt2(this.x - 1, this.y) % 0x100 == 0x01 && this.level.buildingIDAt2(this.x - 1, this.y) !== 0x0001){
			this.level.addItem(this.x * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.miningItem);
		} else if(this.level.buildingIDAt2(this.x, this.y - 1) % 0x100 == 0x01 && this.level.buildingIDAt2(this.x, this.y - 1) !== 0x0101){
			this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, this.miningItem);
		} else {
			this.itemBuffer ++;
		}
	}
}

const oreFor = {
	0x02: ItemID.base_coalOre,
	0x03: ItemID.base_ironOre
};

function smeltFor(item:ItemID){
	switch(item){
		case ItemID.base_coalOre: return ItemID.base_coal;
		case ItemID.base_ironOre: return ItemID.base_ironIngot;
	}
	return null;
}//but theres no reason to use a function you can just use an object-
//Typescript said no u

class TrashCan extends Building {
	update(){
		if(this.level.buildingIDAt2(this.x, this.y) != this.id){
			return this.break();
		}
		for(var item in this.level.items){
			if(
				(Math.abs(this.level.items[item].x - (this.x * consts.TILE_SIZE + consts.TILE_SIZE / 2)) < consts.TILE_SIZE * 0.6) &&
				(Math.abs(this.level.items[item].y - (this.y * consts.TILE_SIZE + consts.TILE_SIZE / 2)) < consts.TILE_SIZE * 0.6)
			){
				this.level.items.splice(parseInt(item), 1);
			}
		}
	}
}

interface Furnace {
	processingItem: Item;
	timer: number;
}

class Furnace extends Building {
	static canBuildAt(tileX:number, tileY:number, level:Level){
		return level.tileAt2(tileX, tileY) == 0x01 && level.buildingIDAt2(tileX, tileY) !== 0x0004;
	}
	update(){
		if(this.level.buildingIDAt2(this.x, this.y) != this.id){
			return this.break();
		}
		if(this.timer > 0 && this.processingItem){
			this.timer --;
		} else if(this.timer <= 0 && this.processingItem){
			if(this.spawnItem(smeltFor(this.processingItem.id))){
				this.timer = 30;
				this.processingItem = null;
			}
		} else if(!this.processingItem){
			this.timer = 30;
			for(var item in this.level.items){
				if(
					(Math.abs(this.level.items[item].x - (this.x * consts.TILE_SIZE + consts.TILE_SIZE / 2)) < consts.TILE_SIZE * 0.6) &&
					(Math.abs(this.level.items[item].y - (this.y * consts.TILE_SIZE + consts.TILE_SIZE / 2)) < consts.TILE_SIZE * 0.6) &&
					smeltFor(this.level.items[item].id)
				){
					this.level.items[item].x = (this.x + 0.5) * consts.TILE_SIZE;
					this.level.items[item].y = (this.y + 0.5) * consts.TILE_SIZE;
					this.processingItem = this.level.items[item];
					this.level.items.splice(parseInt(item), 1);
					return;
				}
			}
		}
	}
	spawnItem(id:ItemID){
		if(this.level.buildingIDAt2(this.x + 1, this.y) % 0x100 == 0x01 && this.level.buildingIDAt2(this.x + 1, this.y) !== 0x0201){
			this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, id);
		} else if(this.level.buildingIDAt2(this.x, this.y + 1) % 0x100 == 0x01 && this.level.buildingIDAt2(this.x, this.y + 1) !== 0x0301){
			this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, id);
		} else if(this.level.buildingIDAt2(this.x - 1, this.y) % 0x100 == 0x01 && this.level.buildingIDAt2(this.x - 1, this.y) !== 0x0001){
			this.level.addItem(this.x * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, id);
		} else if(this.level.buildingIDAt2(this.x, this.y - 1) % 0x100 == 0x01 && this.level.buildingIDAt2(this.x, this.y - 1) !== 0x0101){
			this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, id);
		} else {
			return false;
		}
		return true;
	}
}

class Conveyor {
	static canBuildAt(tileX:number, tileY:number, level:Level){
		return level.tileAt2(tileX, tileY) != 0x04;
	}
}