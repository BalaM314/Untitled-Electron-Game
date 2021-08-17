const consts = {
	VERSION: "alpha 0.0.0",
	CHUNK_SIZE: 16,
    TILE_SIZE: 30,
    buildings: {
        conveyor: {
            SPEED: 1
        }
    }
}
var settings = {
	
};



let level1 = new Level(314);

level1.generateChunk(0, 0);
level1.generateChunk(1, 0);
level1.generateChunk(0, 1);
level1.generateChunk(-1, 0);
level1.generateChunk(0, -1);


level1.writeBuilding(0, 0, 0x0301);
level1.writeBuilding(1, 0, 0x0101);
level1.writeBuilding(1, 1, 0x0201);
level1.writeBuilding(0, 1, 0x0201);
level1.writeBuilding(-1, 1, 0x0301);
level1.writeBuilding(-1, 0, 0x0301);
level1.writeBuilding(-1, -1, 0x0001);
level1.writeBuilding(0, -1, 0x0001);
level1.writeBuilding(1, -1, 0x0101);

level1.addItem(15, 29, ItemID["base:null"]);

setInterval(_ => {
    level1.update();
    console.log(level1.items[0].x, level1.items[0].y);
}, 1000/5);
