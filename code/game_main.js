import { ItemID, consts, mouse, keysPressed, settings, Game, ctx, ctxs, uploadButton, InvalidStateError } from "./vars.js";
import { alerts, assert, constrain, download, loadTextures, rect, rectMode, zoom, _alert } from "./funcs.js";
import { Level } from "./classes.js";
import * as noise from "./perlin.js";
console.log("%c Hey there! It looks like you're checking out the console.\nIf you want to view the source code, *please do it at* https://github.com/BalaM314/Untitled-Electron-Game \n Make sure to view the .ts files as the .js files are compiled and thus look weird.", "color: blue; font-size: 30px;");
noise.seed(1);
window.onmousemove = (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
    mouse.latestEvent = e;
};
window.onkeydown = (e) => {
    if (typeof parseInt(e.key) == "number") {
        for (let x of document.getElementById("toolbar").children) {
            x.classList.remove("selected");
        }
        document.getElementById("toolbar").children?.[parseInt(e.key) - 1]?.classList.add("selected");
    }
    if (parseInt(e.key[1])) {
        for (let x of document.getElementById("toolbar").children) {
            x.classList.remove("selected");
        }
        document.getElementById("toolbar").children?.[parseInt(e.key[1]) + 8]?.classList.add("selected");
    }
    if (keysPressed.indexOf(e.key.toLowerCase()) == -1) {
        keysPressed.push(e.key.toLowerCase());
    }
    if (e.ctrlKey) {
        switch (e.key) {
            case "s":
                exportData();
                e.preventDefault();
                break;
            case "o":
                uploadButton.click();
                e.preventDefault();
                break;
        }
    }
    else {
        switch (e.key) {
            case "ArrowRight":
                placedBuilding.direction = 0x000;
                break;
            case "ArrowDown":
                placedBuilding.direction = 0x100;
                break;
            case "ArrowLeft":
                placedBuilding.direction = 0x200;
                break;
            case "ArrowUp":
                placedBuilding.direction = 0x300;
                break;
            case ",":
                placedBuilding.modifier = 0x000;
                break;
            case ".":
                placedBuilding.modifier = 0x400;
                break;
            case "/":
                placedBuilding.modifier = 0x800;
                e.preventDefault();
                break;
            case "1":
                placedBuilding.type = 0x0001;
                break;
            case "2":
                placedBuilding.type = 0x0002;
                break;
            case "3":
                placedBuilding.type = 0x0003;
                break;
            case "4":
                placedBuilding.type = 0x0004;
                break;
            case "5":
                placedBuilding.type = 0x0005;
                break;
            case "6":
                placedBuilding.type = 0x0006;
                break;
            case "7":
                placedBuilding.type = 0x0007;
                break;
            case "8":
                placedBuilding.type = 0x0009;
                break;
            case "9":
                placedBuilding.type = 0x000A;
                break;
            case "F1":
                placedBuilding.type = 0x000B;
                e.preventDefault();
                break;
            case "F2":
                placedBuilding.type = 0x0011;
                e.preventDefault();
                break;
            case "0":
                placedBuilding.type = 0xFF;
                break;
        }
    }
};
window.onkeyup = (e) => {
    if (keysPressed.indexOf(e.key.toLowerCase()) != -1) {
        keysPressed.splice(keysPressed.indexOf(e.key.toLowerCase()), 1);
    }
};
document.getElementById("clickcapture").onmousedown = (e) => {
    mouse.pressed = true;
    mouse.latestEvent = e;
    canOverwriteBuilding = true;
};
document.getElementById("clickcapture").onmouseup = (e) => {
    mouse.pressed = false;
    mouse.latestEvent = e;
    canOverwriteBuilding = true;
};
uploadButton.onchange = function (event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function (readerEvent) {
        let content = readerEvent.target.result.toString();
        importData(content);
    };
};
window.onwheel = (e) => {
    zoom(Math.pow(1.001, -e.deltaY));
};
window.onblur = () => {
    keysPressed.splice(0);
    mouse.pressed = false;
};
let fps = [0, 0, 0, 0, 0, 0];
function runLevel(level, currentFrame) {
    let startFrameTime = new Date();
    level.generateNecessaryChunks();
    try {
        level.update(currentFrame);
    }
    catch (err) {
        console.error(err);
        throw new Error(`Error updating world: ${err.message}`);
    }
    if (currentFrame.redraw) {
        ctx.tiles.clearRect(0, 0, innerWidth, innerHeight);
    }
    ctx.ghostbuildings.clearRect(0, 0, innerWidth, innerHeight);
    ctx.buildings.clearRect(0, 0, innerWidth, innerHeight);
    ctx.extractors.clearRect(0, 0, innerWidth, innerHeight);
    ctx.items.clearRect(0, 0, innerWidth, innerHeight);
    ctx.overlays.clearRect(0, 0, innerWidth, innerHeight);
    level.display(currentFrame);
    level.displayGhostBuilding((mouse.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, (mouse.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, placedBuilding.ID);
    if (keysPressed.indexOf("shift") != -1) {
        level.displayTooltip(mouse.x, mouse.y, currentFrame);
    }
    ctx.overlays.font = "30px sans-serif";
    ctx.overlays.fillStyle = "#000000";
    ctx.overlays.fillText((Math.round(-(Game.scroll.x * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString() + ", " + Math.round(-(Game.scroll.y * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString()), 10, 100);
    let frameMS = (new Date()).getTime() - startFrameTime.getTime();
    fps.splice(0, 1);
    fps.push(frameMS);
    let avgFPS = Math.round(constrain(5000 / (fps[0] + fps[1] + fps[2] + fps[3] + fps[4]), 0, 60));
    ctx.overlays.fillText(avgFPS + " fps", 10, 50);
    if (settings.debug) {
        ctx.overlays.fillText("C: " + currentFrame.cps, 10, 150);
        ctx.overlays.fillText("I: " + currentFrame.ips, 10, 200);
    }
    for (let item of document.getElementById("resources").children) {
        item.innerHTML = (level1.resources[item.id] ?? 0).toString();
    }
}
function handleKeysPressed(currentframe) {
    if (keysPressed.indexOf("w") != -1) {
        Game.scroll.y += Game.scroll.speed;
        currentframe.redraw = true;
    }
    if (keysPressed.indexOf("a") != -1) {
        Game.scroll.x += Game.scroll.speed;
        currentframe.redraw = true;
    }
    if (keysPressed.indexOf("s") != -1) {
        Game.scroll.y -= Game.scroll.speed;
        currentframe.redraw = true;
    }
    if (keysPressed.indexOf("d") != -1) {
        Game.scroll.x -= Game.scroll.speed;
        currentframe.redraw = true;
    }
}
function fixSizes() {
    for (let x of ctxs) {
        if (x.canvas.width != window.innerWidth) {
            x.canvas.width = window.innerWidth;
            Game.forceRedraw = true;
        }
        if (x.canvas.height != window.innerHeight) {
            x.canvas.height = window.innerHeight;
            Game.forceRedraw = true;
        }
    }
}
let cancel = null;
function main_loop() {
    let currentFrame = {
        tooltip: true,
        debug: settings.debug,
        cps: 0,
        tps: 0,
        ips: 0,
        redraw: Game.forceRedraw
    };
    Game.forceRedraw = false;
    fixSizes();
    if (mouse.pressed) {
        handleMouseDown(currentFrame);
    }
    if (keysPressed.length > 0) {
        handleKeysPressed(currentFrame);
    }
    if (keysPressed.indexOf("shift") !== -1) {
        Game.scroll.speed = 20;
    }
    else {
        Game.scroll.speed = 5;
    }
    switch (Game.state) {
        case "title":
            runTitle();
            break;
        case "game":
            runLevel(level1, currentFrame);
            break;
        case "settings":
            runSettings();
            break;
        default:
            throw new InvalidStateError(`Invalid game state "${Game.state}"`);
    }
    if (alerts.length) {
        mouse.pressed = false;
        for (let __alert of alerts) {
            if (__alert instanceof Array) {
                setTimeout(() => {
                    _alert(__alert[0]);
                }, __alert[1]);
            }
            else {
                alert(__alert);
            }
        }
        alerts.splice(0);
    }
    cancel = requestAnimationFrame(main_loop);
}
function runTitle() {
    ctx.tiles.clearRect(-1, -1, 10000, 10000);
    ctx.tiles.fillStyle = "#0033CC";
    ctx.tiles.fillRect(0, 0, innerWidth, innerHeight);
    ctx.tiles.font = "70px sans-serif";
    ctx.tiles.textAlign = "center";
    ctx.tiles.textBaseline = "middle";
    ctx.tiles.fillStyle = "#000000";
    ctx.tiles.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
    ctx.tiles.font = "20px sans-serif";
    ctx.tiles.fillText("Title Screen Soon™", innerWidth / 2, innerHeight * 0.35);
    ctx.tiles.fillStyle = "#0000FF";
    rect(innerWidth / 4, innerHeight * 0.5, innerWidth / 2, innerHeight * 0.2, rectMode.CORNER);
    rect(innerWidth / 4, innerHeight * 0.75, innerWidth / 2, innerHeight * 0.2, rectMode.CORNER);
    ctx.tiles.strokeStyle = "#000000";
    ctx.tiles.lineWidth = 2;
    ctx.tiles.strokeRect(innerWidth / 4, innerHeight * 0.5, innerWidth / 2, innerHeight * 0.2);
    ctx.tiles.strokeRect(innerWidth / 4, innerHeight * 0.75, innerWidth / 2, innerHeight * 0.2);
    ctx.tiles.fillStyle = "#FFFFFF";
    ctx.tiles.font = "40px sans-serif";
    ctx.tiles.fillText("Play", innerWidth / 2, innerHeight * 0.6);
    ctx.tiles.fillText("Settings", innerWidth / 2, innerHeight * 0.85);
}
function runSettings() {
    ctx.tiles.clearRect(-1, -1, 10000, 10000);
    ctx.tiles.fillStyle = "#0033CC";
    ctx.tiles.fillRect(0, 0, innerWidth, innerHeight);
    ctx.tiles.font = "70px sans-serif";
    ctx.tiles.textAlign = "center";
    ctx.tiles.textBaseline = "middle";
    ctx.tiles.fillStyle = "#000000";
    ctx.tiles.fillText("Settings", innerWidth / 2, innerHeight * 0.2);
    ctx.tiles.strokeStyle = "#000000";
    ctx.tiles.strokeRect(innerWidth * 0.9, innerHeight * 0.01, innerWidth * 0.09, innerHeight * 0.09);
    ctx.tiles.fillStyle = "#FF0000";
    ctx.tiles.font = "50px sans-serif";
    ctx.tiles.fillText("❌", innerWidth * 0.945, innerHeight * 0.055);
    ctx.tiles.strokeRect(innerWidth * 0.25, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2);
    ctx.tiles.strokeRect(innerWidth * 0.51, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2);
    ctx.tiles.fillStyle = "#0000FF";
    rect(innerWidth * 0.25, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2, rectMode.CORNER);
    rect(innerWidth * 0.51, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2, rectMode.CORNER);
    ctx.tiles.fillStyle = "#FFFFFF";
    ctx.tiles.fillText("Tutorial: " + Game.persistent.tutorialenabled, innerWidth * 0.375, innerHeight * 0.6);
    ctx.tiles.fillText("Debug: " + settings.debug, innerWidth * 0.625, innerHeight * 0.6);
}
;
function load() {
    loadTextures();
    if (Game.persistent.tutorialenabled) {
        setTimeout(() => {
            alert(`
Welcome to Untitled Electron Game!
This is a game about... well I don't really know, but it has items, conveyor belts, and machines. Guess you could call it a factory game?

For now there's no real goal, but I suggest you automate iron and coal production.
To get started, place a conveyor belt.

Basic controls:
Click to place a building.
Use the number keys to choose the type of building.
Press 0 to "place air"(delete buildings).
Use WASD to move around the map and mouse wheel to zoom.
Press Shift to move faster and for tooltips.`);
        }, 500);
    }
    checkload();
}
let loadedtextures = 0;
let level1;
for (let element of document.getElementById("textures").children) {
    element.addEventListener("load", () => {
        loadedtextures++;
    });
    element.addEventListener("error", (err) => {
        alert("Failed to load texture " + err.target.src.split("assets/textures/")[1]);
        throw err;
    });
}
for (let element of document.getElementById("toolbar").children) {
    element.addEventListener("click", (event) => {
        for (let x of document.getElementById("toolbar").children) {
            x.classList.remove("selected");
        }
        event.target.classList.add("selected");
        placedBuilding.type = parseInt(event.target.id);
        mouse.pressed = false;
    });
}
function checkload() {
    if (loadedtextures == document.getElementById("textures").children.length) {
        level1 = new Level(314);
        level1.generateNecessaryChunks();
        level1.buildBuilding(0, 0, 0x0008);
        level1.buildBuilding(0, -1, 0x0008);
        level1.buildBuilding(-1, 0, 0x0008);
        level1.buildBuilding(-1, -1, 0x0008);
        Game.state = "game";
        Game.forceRedraw = true;
        document.getElementById("toolbar").classList.remove("hidden");
        document.getElementById("resources").classList.remove("hidden");
    }
    else if (loadedtextures > document.getElementById("textures").children.length) {
        throw new Error("somehow loaded more textures than exist, what the fffffff");
    }
    else {
        setTimeout(checkload, 100);
        alert("Not all textures have loaded!\nYou may have a slow internet connection, or the game may just be broken.\nClick OK to try again.");
    }
}
function exportData() {
    let output = {
        UntitledElectronGame: {
            metadata: {
                validationCode: "esrdtfgvczdsret56u7yhgvfcesrythgvfd!",
                version: consts.VERSION
            },
            level1: level1.export()
        }
    };
    download("Untitled-Electron-Game-save.json", JSON.stringify(output));
}
function importData(rawData) {
    let tempLevel;
    try {
        let data = JSON.parse(rawData);
        assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
        let levelData = data.UntitledElectronGame.level1;
        levelData.version = data.UntitledElectronGame.metadata.version;
        assert(levelData.chunks instanceof Object);
        assert(levelData.items instanceof Array);
        tempLevel = new Level(levelData);
        level1 = tempLevel;
    }
    catch (err) {
        console.error("Import failed.", err);
    }
}
let placedBuilding = {
    type: 0x0001,
    direction: 0x100,
    modifier: 0x000,
    get ID() {
        if (this.type == 0x05) {
            return this.type + this.direction + this.modifier;
        }
        else if (this.type == 0x01) {
            return this.type + this.direction;
        }
        else if (this.type == 0xFF) {
            return 0xFFFF;
        }
        else {
            return this.type;
        }
    }
};
let canOverwriteBuilding = true;
let handleMouseDown = (currentFrame, e) => {
    e = e ?? mouse.latestEvent;
    switch (Game.state) {
        case "game":
            if (e.ctrlKey) {
                level1.addItem((e.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE, (e.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE, ItemID.base_null);
                mouse.pressed = false;
            }
            else {
                level1.buildBuilding(Math.floor((e.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), Math.floor((e.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), placedBuilding.ID);
            }
            break;
        case "title":
            if (e.x > innerWidth / 4 && e.x < innerWidth * 0.75) {
                if (e.y > innerHeight / 2 && e.y < innerHeight * 0.7) {
                    mouse.pressed = false;
                    load();
                }
                if (e.y > innerHeight * 0.75 && e.y < innerHeight * 0.95) {
                    Game.state = "settings";
                }
            }
            break;
        case "settings":
            if (e.y < innerHeight * 0.1 && e.y > innerHeight * 0.01 && e.x > innerWidth * 0.9 && e.x < innerWidth * 0.99) {
                localStorage.setItem("persistentStorage", JSON.stringify(Game.persistent));
                Game.state = "title";
            }
            if (e.y > innerHeight * 0.5 && e.y < innerHeight * 0.7 && e.x > innerWidth * 0.25 && e.x < innerWidth * 0.51) {
                Game.persistent.tutorialenabled = !Game.persistent.tutorialenabled;
                mouse.pressed = false;
            }
            if (e.y > innerHeight * 0.5 && e.y < innerHeight * 0.7 && e.x > innerWidth * 0.51 && e.x < innerWidth * 0.76) {
                settings.debug = !settings.debug;
                mouse.pressed = false;
            }
            break;
    }
};
try {
    assert(localStorage.getItem("persistentStorage"));
    Game.persistent = JSON.parse(localStorage.getItem("persistentStorage"));
}
catch (err) {
    console.warn("Invalid persistent settings!\nIf this is your first time visiting this site, nothing to worry about.");
    localStorage.setItem("persistentStorage", "{\"tutorialenabled\": true}");
}
try {
    main_loop();
}
catch (err) {
    alert("An error has occurred! Oopsie.\nPlease create an issue on this project's GitHub so I can fix it.\nErr: " + err.message);
    ctxs.forEach((ctx) => { ctx.clearRect(0, 0, innerWidth, innerHeight); });
    throw err;
}
