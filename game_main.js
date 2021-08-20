const consts = {
    VERSION: "alpha 0.0.0",
    CHUNK_SIZE: 16,
    TILE_SIZE: 30,
    DISPLAY_SCALE: 1,
    get DISPLAY_TILE_SIZE() {
        return this.TILE_SIZE * this.DISPLAY_SCALE;
    },
    buildings: {
        conveyor: {
            SPEED: 1
        }
    }
};
var settings = {};
let level1 = new Level(3141);
level1.generateNecessaryChunks();
level1.buildBuilding(0, 0, 0x0301);
level1.buildBuilding(1, 0, 0x0101);
level1.buildBuilding(1, 1, 0x0201);
level1.buildBuilding(0, 1, 0x0201);
level1.buildBuilding(-1, 1, 0x0301);
level1.buildBuilding(-1, 0, 0x0301);
level1.buildBuilding(-1, -1, 0x0001);
level1.buildBuilding(0, -1, 0x0001);
level1.buildBuilding(1, -1, 0x0101);
level1.addItem(15, 15, ItemID.base_null);
const ctx = document.getElementById("main_canvas").getContext("2d");
const overlayCtx = document.getElementById("secondary_canvas").getContext("2d");
function loop() {
    let startFrameTime = new Date();
    document.getElementById("main_canvas").width = innerWidth;
    document.getElementById("main_canvas").height = innerHeight;
    document.getElementById("secondary_canvas").width = innerWidth;
    document.getElementById("secondary_canvas").height = innerHeight;
    level1.generateNecessaryChunks();
    level1.update();
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    overlayCtx.clearRect(0, 0, innerWidth, innerHeight);
    level1.display(true);
    level1.displayGhostBuilding((mouseX - Game.scroll.x) / consts.DISPLAY_TILE_SIZE, (mouseY - Game.scroll.y) / consts.DISPLAY_TILE_SIZE, placedBuildingID);
    if (mouseIsPressed) {
        handleMouseDown(latestMouseEvent);
    }
    if (keysPressed.indexOf("w") != -1) {
        Game.scroll.y += 5;
    }
    if (keysPressed.indexOf("a") != -1) {
        Game.scroll.x += 5;
    }
    if (keysPressed.indexOf("s") != -1) {
        Game.scroll.y -= 5;
    }
    if (keysPressed.indexOf("d") != -1) {
        Game.scroll.x -= 5;
    }
    let frameMS = (new Date()).getTime() - startFrameTime.getTime();
    overlayCtx.font = "30px sans-serif";
    overlayCtx.fillText(Math.round(constrain(1000 / frameMS, 0, 60)) + " fps", 10, 50);
    overlayCtx.fillText((Math.round(-Game.scroll.x / consts.DISPLAY_TILE_SIZE).toString() + ", " + Math.round(-Game.scroll.y / consts.DISPLAY_TILE_SIZE).toString()), 10, 100);
    requestAnimationFrame(loop);
}
function load() {
    document.getElementById("main_canvas").width = innerWidth;
    document.getElementById("main_canvas").height = innerHeight;
    document.getElementById("secondary_canvas").width = innerWidth;
    document.getElementById("secondary_canvas").height = innerHeight;
    ctx.fillStyle = "#0033FF";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000000";
    ctx.fillText("Loading...", innerWidth / 2, innerHeight / 2);
    loadTextures();
    setTimeout(loop, 100);
}
let placedBuildingID = 0x0001;
let handleMouseDown = (e) => {
    if (e.ctrlKey) {
        level1.addItem((e.x / consts.DISPLAY_SCALE) - Game.scroll.x, (e.y / consts.DISPLAY_SCALE) - Game.scroll.y, ItemID.base_null);
    }
    else {
        level1.buildBuilding(Math.floor((e.x - Game.scroll.x) / consts.DISPLAY_TILE_SIZE), Math.floor((e.y - Game.scroll.y) / consts.DISPLAY_TILE_SIZE), placedBuildingID);
    }
};
window.onkeypress = (e) => {
    switch (e.key) {
        case "ArrowRight":
            placedBuildingID = 0x0001;
            break;
        case "ArrowDown":
            placedBuildingID = 0x0101;
            break;
        case "ArrowLeft":
            placedBuildingID = 0x0201;
            break;
        case "ArrowUp":
            placedBuildingID = 0x0301;
            break;
        case "2":
            placedBuildingID = 0x0002;
            break;
        case "3":
            placedBuildingID = 0x0003;
            break;
        case "4":
            placedBuildingID = 0x0004;
            break;
        case "0":
            placedBuildingID = 0xFFFF;
            break;
    }
};
load();
setTimeout(_ => {
    alert(`
Welcome to Conveyor belt simulator 2021!
Click to place a building.
Press 2 for a miner and 3 for a trash can.
Use arrow keys to change direction of placed belts.
Ctrl+click to place an item.
Use WASD to scroll.
	`);
}, 500);
