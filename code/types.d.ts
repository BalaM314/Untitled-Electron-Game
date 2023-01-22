type TileID = 
"0x00" |  //Grass
"0x01" |  //stone
"0x02" |	//water
"0x10" |  //iron ore
"0x11" |  //coal ore
"0x12" |	//copper ore
"0xFF" ;  //Unset


type RawBuildingID = "0x01" | "0x02" | "0x03" | "0x04" | "0x05" | "0x06" | "0x07" | "0x08" | "0x09" | "0x0A" | "0x0B" | "0x10" | "0x11" | "0xFF";

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

interface Registry {
	recipes: Recipes;
	buildings: {
		[ID in RawBuildingID]: typeof Building;
	}
	buildingIDs: typeof BuildingID;
	itemIDs: typeof ItemID;
	tileIDs: TileID[];
	miscTextures: string[];
	textures: {
		item: {
			[ID in ItemID]: HTMLImageElement
		};
		building: {
			[ID in BuildingID]: HTMLImageElement
		};
		tile: {
			[ID in TileID]: HTMLImageElement
		};
		misc: {
			[index: string]: HTMLImageElement
		};
	};
	keybinds: {
		[index: string]: {
			[index: string]: Keybind
		}
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
	

interface BuildingData {
	x: number;
	y: number;
	id: BuildingID;
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