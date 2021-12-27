"use strict";
let settings = {
    graphics_mode: 1,
    debug: true
};
let Game = {
    scroll: {
        x: 300,
        y: 300,
        speed: 5
    },
    forceRedraw: true,
    persistent: {
        tutorialenabled: true
    },
    tutorial: {
        conveyor: {
            placed: true,
            beltchain: true,
            placefail: true
        },
        miner: {
            placefail: true,
            placed: true,
            coaloutput: true
        },
        trashcan: {
            placed: true
        },
        furnace: {
            placefail: true,
            placed: true
        },
        item: {
            coal: true,
            iron: true,
            steel: true
        },
        multiplesteel: false
    }
};
var GAME_STATE = "title";
const ctx = document.getElementById("canvas").getContext("2d");
const ctx1 = document.getElementById("canvas1").getContext("2d");
const ctx2 = document.getElementById("canvas2").getContext("2d");
const ctx25 = document.getElementById("canvas25").getContext("2d");
const ctx3 = document.getElementById("canvas3").getContext("2d");
const ctx4 = document.getElementById("canvas4").getContext("2d");
const ctxs = [ctx, ctx1, ctx2, ctx25, ctx3, ctx4];
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
        ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
    ctx1.clearRect(0, 0, innerWidth, innerHeight);
    ctx2.clearRect(0, 0, innerWidth, innerHeight);
    ctx25.clearRect(0, 0, innerWidth, innerHeight);
    ctx3.clearRect(0, 0, innerWidth, innerHeight);
    ctx4.clearRect(0, 0, innerWidth, innerHeight);
    level.display(currentFrame);
    level.displayGhostBuilding((mouseX - (Game.scroll.x * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_TILE_SIZE, (mouseY - (Game.scroll.y * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_TILE_SIZE, placedBuilding.ID);
    if (keysPressed.indexOf("shift") != -1) {
        level.displayTooltip(mouseX, mouseY, currentFrame);
    }
    ctx4.font = "30px sans-serif";
    ctx4.fillStyle = "#000000";
    ctx4.fillText((Math.round(-(Game.scroll.x * Globals.DISPLAY_SCALE) / Globals.DISPLAY_TILE_SIZE).toString() + ", " + Math.round(-(Game.scroll.y * Globals.DISPLAY_SCALE) / Globals.DISPLAY_TILE_SIZE).toString()), 10, 100);
    let frameMS = (new Date()).getTime() - startFrameTime.getTime();
    fps.splice(0, 1);
    fps.push(frameMS);
    let avgFPS = Math.round(constrain(5000 / (fps[0] + fps[1] + fps[2] + fps[3] + fps[4]), 0, 60));
    ctx4.fillText(avgFPS + " fps", 10, 50);
    if (settings.debug) {
        ctx4.fillText("C: " + currentFrame.cps, 10, 150);
        ctx4.fillText("I: " + currentFrame.ips, 10, 200);
    }
    for (var item of document.getElementById("resources").children) {
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
    for (var x of ctxs) {
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
var cancel = null;
function main_loop() {
    try {
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
        if (mouseIsPressed) {
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
        switch (GAME_STATE) {
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
                throw new InvalidStateError(`Invalid game state "${GAME_STATE}"`);
        }
        if (alerts.length) {
            mouseIsPressed = false;
            for (var __alert of alerts) {
                if (__alert instanceof Array) {
                    setTimeout(() => {
                        _alert(__alert[0]);
                    }, __alert[1]);
                }
                else {
                    alert(__alert);
                }
            }
            alerts = [];
        }
        cancel = requestAnimationFrame(main_loop);
    }
    catch (err) {
        alert("An error has occurred! Oopsie.\nPlease create an issue on this project's GitHub so I can fix it.\nErr: " + err.message);
        ctxs.forEach((ctx) => { ctx.clearRect(0, 0, innerWidth, innerHeight); });
        throw err;
    }
}
function runTitle() {
    ctx.clearRect(-1, -1, 10000, 10000);
    ctx.fillStyle = "#0033CC";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.font = "70px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000000";
    ctx.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
    ctx.font = "20px sans-serif";
    ctx.fillText("Title Screen Soon™", innerWidth / 2, innerHeight * 0.35);
    ctx.fillStyle = "#0000FF";
    rect(innerWidth / 4, innerHeight * 0.5, innerWidth / 2, innerHeight * 0.2, rectMode.CORNER);
    rect(innerWidth / 4, innerHeight * 0.75, innerWidth / 2, innerHeight * 0.2, rectMode.CORNER);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(innerWidth / 4, innerHeight * 0.5, innerWidth / 2, innerHeight * 0.2);
    ctx.strokeRect(innerWidth / 4, innerHeight * 0.75, innerWidth / 2, innerHeight * 0.2);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "40px sans-serif";
    ctx.fillText("Play", innerWidth / 2, innerHeight * 0.6);
    ctx.fillText("Settings", innerWidth / 2, innerHeight * 0.85);
}
function runSettings() {
    ctx.clearRect(-1, -1, 10000, 10000);
    ctx.fillStyle = "#0033CC";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.font = "70px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000000";
    ctx.fillText("Settings", innerWidth / 2, innerHeight * 0.2);
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(innerWidth * 0.9, innerHeight * 0.01, innerWidth * 0.09, innerHeight * 0.09);
    ctx.fillStyle = "#FF0000";
    ctx.font = "50px sans-serif";
    ctx.fillText("❌", innerWidth * 0.945, innerHeight * 0.055);
    ctx.strokeRect(innerWidth * 0.25, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2);
    ctx.strokeRect(innerWidth * 0.51, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2);
    ctx.fillStyle = "#0000FF";
    rect(innerWidth * 0.25, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2, rectMode.CORNER);
    rect(innerWidth * 0.51, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2, rectMode.CORNER);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Tutorial: " + Game.persistent.tutorialenabled, innerWidth * 0.375, innerHeight * 0.6);
    ctx.fillText("Debug: " + settings.debug, innerWidth * 0.625, innerHeight * 0.6);
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
for (var element of document.getElementById("textures").children) {
    element.addEventListener("load", () => {
        loadedtextures++;
    });
    element.addEventListener("error", (err) => {
        alert("Failed to load texture " + err.target.src.split("assets/textures/")[1]);
        throw err;
    });
}
for (var element of document.getElementById("toolbar").children) {
    element.addEventListener("click", (event) => {
        for (var x of document.getElementById("toolbar").children) {
            x.classList.remove("selected");
        }
        event.target.classList.add("selected");
        placedBuilding.type = parseInt(event.target.id);
        mouseIsPressed = false;
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
        GAME_STATE = "game";
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
                version: Globals.VERSION
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
    e = e ?? latestMouseEvent;
    switch (GAME_STATE) {
        case "game":
            if (e.ctrlKey) {
                level1.addItem((e.x - (Game.scroll.x * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_SCALE, (e.y - (Game.scroll.y * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_SCALE, ItemID.base_null);
                mouseIsPressed = false;
            }
            else {
                level1.buildBuilding(Math.floor((e.x - (Game.scroll.x * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_TILE_SIZE), Math.floor((e.y - (Game.scroll.y * Globals.DISPLAY_SCALE)) / Globals.DISPLAY_TILE_SIZE), placedBuilding.ID);
            }
            break;
        case "title":
            if (e.x > innerWidth / 4 && e.x < innerWidth * 0.75) {
                if (e.y > innerHeight / 2 && e.y < innerHeight * 0.7) {
                    mouseIsPressed = false;
                    load();
                }
                if (e.y > innerHeight * 0.75 && e.y < innerHeight * 0.95) {
                    GAME_STATE = "settings";
                }
            }
            break;
        case "settings":
            if (e.y < innerHeight * 0.1 && e.y > innerHeight * 0.01 && e.x > innerWidth * 0.9 && e.x < innerWidth * 0.99) {
                localStorage.setItem("persistentStorage", JSON.stringify(Game.persistent));
                GAME_STATE = "title";
            }
            if (e.y > innerHeight * 0.5 && e.y < innerHeight * 0.7 && e.x > innerWidth * 0.25 && e.x < innerWidth * 0.51) {
                Game.persistent.tutorialenabled = !Game.persistent.tutorialenabled;
                mouseIsPressed = false;
            }
            if (e.y > innerHeight * 0.5 && e.y < innerHeight * 0.7 && e.x > innerWidth * 0.51 && e.x < innerWidth * 0.76) {
                settings.debug = !settings.debug;
                mouseIsPressed = false;
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
main_loop();
