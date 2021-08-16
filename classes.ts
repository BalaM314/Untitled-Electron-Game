
type Tile = 
0x00 |  //Blank
0x01 |  //decoration 1
0x02 |  //decoration 2
0x03 |  //water?
0xFF    //error


const rands = {
	x_prime: 1299689,
	y_prime: 1156709,
	hill_x: 89,
	hill_y: 11,
}

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
	getChunk(x:number, y:number){
		return this.storage.get(`${x},${y}`);
	}
	generateChunk(x:number, y:number){
		this.storage.set(`${x},${y}`, 
			new Chunk(x, y, this.seed)
			.generate()
		);
	}
}

interface Chunk {
	layers: ChunkLayer[];
	chunkSeed: number;
	x: number;
	y: number;
	seed: number;
}

type ChunkLayer = Tile[][] | null;

class Chunk {
	constructor(x:number, y:number, seed:number){
		this.x = x;
		this.y = y;
		this.seed = seed;
		this.chunkSeed = Math.abs(Math.round(
			(x*rands.x_prime) +
			(y*rands.y_prime) +
			(Math.pow(seed % 32, (x + y) % 10) % 16384) + 
			Math.pow(seed, 4) + 
			123456789
			% 2147483648
		));
		this.layers = [
			null,//Ground(ground, dirt)
			null,//Buildings
			null//Reserved
		];
		for(var layer in this.layers){
			this.layers[layer] = [];
			for(let x = 0; x < consts.CHUNK_SIZE; x ++){
				this.layers[layer][x] = [];
				for(let z = 0; z < consts.CHUNK_SIZE; z ++){
					this.layers[layer][x].push(0xFF);
				}
			}
		}
		this.chunkSeed = 0;
		return this;
	}
	generate():Chunk{
		//Put down the base
		for(var row in this.layers[0]){
			for(var tile in this.layers[0][row]){
				this.layers[0][row][tile] = 0x00;
			}
		}
		this.chunkSeed = Math.abs(Math.round(
			(this.x*rands.x_prime) +
			(this.y*rands.y_prime) +
			(Math.pow(this.seed % 32, (this.x + this.y) % 10) % 16384) + 
			Math.pow(this.seed, 4) + 
			123456789
			% 2147483648
		));//did I pull this out of my butt? yes.
		this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x02);
		this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
		this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
		this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, 0x01);
		this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, 0x01);
		this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 4 > 1) ? 0x01 : 0x00);
		this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 8 > 3) ? 0x01 : 0x00);
		this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 16 > 7) ? 0x01 : 0x00);
		this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 32 > 15) ? 0x01 : 0x00);

		return this;
	}
	update():Chunk{
		return this;
	}
	tileAt(x:number, y:number):Tile{
		return this.layers[0]?.[y]?.[x] ?? null;
	}
	setTile(x:number, y:number, tile:Tile):void{
		console.log(arguments);
		if(this.tileAt(x, y) == null){
			return;
		}
		this.layers[0][y][x] = tile;
	}
	display(){
		console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
		console.table(this.layers[0]);
	}
}

class Item {

}

class Building {

}