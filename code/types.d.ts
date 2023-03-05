type TileID = 
"base_grass" |  //Grass
"base_stone" |  //stone
"base_water" |	//water
"base_ore_iron" |  //iron ore
"base_ore_coal" |  //coal ore
"base_ore_copper" |	//copper ore
"base_null" ;  //Unset

type LegacyBuildingID = 
//0x0000 is invalid
"0x0001" |	//Conveyor Belt Facing Right
"0x0101" |	//Conveyor Belt Facing Down
"0x0201" |	//Conveyor Belt Facing Left
"0x0301" |	//Conveyor Belt Facing Up
"0x0401" |	//Conveyor Belt Facing Down->Right
"0x0501" |	//Conveyor Belt Facing Up->Right
"0x0601" |	//Conveyor Belt Facing Right->Down
"0x0701" |	//Conveyor Belt Facing Left->Down
"0x0801" |	//Conveyor Belt Facing Down->Left
"0x0901" |	//Conveyor Belt Facing Up->Left
"0x0A01" |	//Conveyor Belt Facing Right->Up
"0x0B01" |	//Conveyor Belt Facing Left->Up
"0x0C01" |	//Conveyor Belt Facing Left+Down->Right
"0x0D01" |	//Conveyor Belt Facing Left+Up->Right
"0x0E01" |	//Conveyor Belt Facing Up+Right->Down
"0x0F01" |	//Conveyor Belt Facing Up+Left->Down
"0x1001" |	//Conveyor Belt Facing Right+Down->Left
"0x1101" |	//Conveyor Belt Facing Right+Up->Left
"0x1201" |	//Conveyor Belt Facing Down+Right->Up
"0x1301" |	//Conveyor Belt Facing Down+Left->Up
"0x1401" |	//Conveyor Belt Facing Down+up->Right
"0x1501" |	//Conveyor Belt Facing Right+Left->Down
"0x1601" |	//Conveyor Belt Facing Down+Up->Left
"0x1701" |	//Conveyor Belt Facing Right+Left->Up
"0x1801" |	//Conveyor Belt Facing Up+Left+Down->Right
"0x1901" |	//Conveyor Belt Facing Left+Up+Right->Down
"0x1A01" |	//Conveyor Belt Facing Down+Right+Up->Left
"0x1B01" |	//Conveyor Belt Facing Right+Down+Left->Up
"0x0002" |	//Miner
"0x0003" |	//Trash Can
"0x0004" |	//Furnace
"0x0005" |	//Extractor Facing Right
"0x0105" |	//Extractor Facing Down
"0x0205" |	//Extractor Facing Left
"0x0305" |	//Extractor Facing Up
"0x0405" |	//Long Extractor Facing Right
"0x0505" |	//Long Extractor Facing Down
"0x0605" |	//Long Extractor Facing Left
"0x0705" |	//Long Extractor Facing Up
"0x0805" |	//Longer Extractor Facing Right
"0x0905" |	//Longer Extractor Facing Down
"0x0A05" |	//Longer Extractor Facing Left
"0x0B05" |	//Longer Extractor Facing Up
"0x0006" |	//Chest
"0x0007" |	//Alloy Smelter
"0x0008" |	//Resource Acceptor
"0x0009" |	//Wiremill
"0x000A" |	//Compressor
"0x000B" |	//Lathe
"0x0010" |	//Multiblock secondary
"0x0011" |	//Assembler
"0xFFFF" ;	//Null

type LegacyRawBuildingID = "0x01" | "0x02" | "0x03" | "0x04" | "0x05" | "0x06" | "0x07" | "0x08" | "0x09" | "0x0A" | "0x0B" | "0x10" | "0x11" | "0xFF";
type RawBuildingID = "base_conveyor" | "base_miner" | "base_trash_can" | "base_furnace" | "base_extractor" | "base_chest" | "base_alloy_smelter" | "base_resource_acceptor" | "base_wiremill" | "base_compressor" | "base_lathe" | "base_multiblock_secondary" | "base_assembler" | "base_null";
type BuildingIDWithMeta = [buildingID:RawBuildingID, meta:BuildingMeta];
type BuildingMeta = number;
type StringBuildingID = `${RawBuildingID}:${BuildingMeta}`;
type RecipeType = "1-1" | "2-1" | "t-1";

interface Recipe {
	inputs?: ItemID[];
	outputs: ItemID[];
	duration: number;
	tile?: TileID;
}

interface Recipes {
	[index: `${string}_${string}`]: {
		type: RecipeType;
		recipes: Recipe[];
	};
}

interface Keybinds {
	[index: string]: {
		[index: string]: Keybind
	}
}



interface SaveData {
	UntitledElectronGame: {
		metadata: {
			validationCode: "esrdtfgvczdsret56u7yhgvfcesrythgvfd!";
			id: string;
			version: string;
			timeCreated: string;
		};
		level1: LevelData;
	}
}

interface LevelData {
	chunks: {
		[index: string]: ChunkData
	};
	resources: {
		[index: string]: number;
	};
	seed: number;
	uuid: string;
	version: string;
}

interface ChunkData {
	layers: [(BuildingData | null)[][], (BuildingData | null)[][]];
	version: string;
}
	

interface LegacyBuildingData {
	x: number;
	y: number;
	id: LegacyBuildingID;
	item: ItemData | null;
	inv: ItemData[];
}

interface BuildingData {
	x: number;
	y: number;
	id: RawBuildingID;
	meta: BuildingMeta;
	item: ItemData | null;
	inv: ItemData[];
}

interface ItemData {
	x: number;
	y: number;
	id: ItemID;
	grabbedBy: {x: number; y: number;}
}

declare let noise: {
	seed: (seed:number) => void;
	perlin2: (x:number, y:number) => number;
	simplex2: (x:number, y:number) => number;
	perlin3: (x:number, y:number, z:number) => number;
	simplex3: (x:number, y:number, z:number) => number;
};

interface CurrentFrame {
	tooltip: boolean;
	debug: boolean;
	cps: number;//Chunks per frame
	tps: number;//Tiles per frame
	ips: number;//Items per frame
	redraw: boolean;
}

interface Array<T> {
	/**
	 * Sorts an array, with a callback that ranks elements with a number.
	 */
	sort2: (callback: (value:T) => number) => void;
}

interface CanvasRenderingContext2D {
	/**Clears a ctx. */
	clear: () => void;
}