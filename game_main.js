const consts = {
    VERSION: "alpha 0.0.0",
    CHUNK_SIZE: 16,
    TILE_SIZE: 30,
    DISPLAY_TILE_SIZE: 90,
    buildings: {
        conveyor: {
            SPEED: 1
        }
    }
};
var settings = {};
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
level1.addItem(15, 15, ItemID["base:null"]);
function start() {
    const ctx = document.getElementById("main_canvas").getContext("2d");
    setInterval(_ => {
        level1.update();
        // document.getElementById("item").style.setProperty("--pos-x", level1.items[0].x.toString() + "px");
        // document.getElementById("item").style.setProperty("--pos-y", level1.items[0].y.toString() + "px");
        ctx.clearRect(0, 0, 600, 600);
        ctx.strokeRect(300, 300, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        ctx.strokeRect(300, 300 + consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        ctx.strokeRect(300 + consts.DISPLAY_TILE_SIZE, 300, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        ctx.strokeRect(300, 300 - consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        ctx.strokeRect(300 - consts.DISPLAY_TILE_SIZE, 300, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        ctx.strokeRect(300 + consts.DISPLAY_TILE_SIZE, 300 + consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        ctx.strokeRect(300 + consts.DISPLAY_TILE_SIZE, 300 - consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        ctx.strokeRect(300 - consts.DISPLAY_TILE_SIZE, 300 + consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        ctx.strokeRect(300 - consts.DISPLAY_TILE_SIZE, 300 - consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        ctx.fillRect(295 + level1.items[0].x * 3, 295 + level1.items[0].y * 3, 10, 10);
    }, 1000 / 30);
}
start();
