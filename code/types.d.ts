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
0x0010 |	//Multiblock secondary
0x0011 |	//Assembler
0xFFFF ;	//Unset

type RawBuildingID = 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0A | 0x0B | 0x10 | 0x11 | 0xFF;

type RecipeType = "1-1" | "2-1" | "t-1";

interface Recipe {
	inputs?: ItemID[];
	outputs: ItemID[];
	duration: number;
	tile?: Tile;
}

declare let noise: {
	seed: (seed:number) => void;
	perlin2: (x:number, y:number) => number;
	simplex2: (x:number, y:number) => number;
	perlin3: (x:number, y:number, z:number) => number;
	simplex3: (x:number, y:number, z:number) => number;
};

interface currentFrame {
	tooltip: boolean;
	debug: boolean;
	cps: number;//Chunks per frame
	tps: number;//Tiles per frame
	ips: number;//Items per frame
	redraw: boolean;
}
