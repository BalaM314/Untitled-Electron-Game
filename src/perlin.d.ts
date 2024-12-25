declare let noise: {
	seed: (seed:number) => void;
	perlin2: (x:number, y:number) => number;
	simplex2: (x:number, y:number) => number;
	perlin3: (x:number, y:number, z:number) => number;
	simplex3: (x:number, y:number, z:number) => number;
};
