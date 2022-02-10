"use strict";
console.log("%c Hey there! It looks like you're checking out the console.\nIf you want to view the source code, *please do it at* https://github.com/BalaM314/Untitled-Electron-Game \n Make sure to view the .ts files as the .js files are compiled and thus look weird.", "color: blue; font-size: 30px;");
noise.seed(1);
function registerEventHandlers() {
    window.onmousemove = (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
        mouse.latestEvent = e;
    };
    let clickcapture = document.getElementById("clickcapture");
    clickcapture.onmousedown = (e) => {
        if (e.button)
            return e.preventDefault();
        mouse.held = true;
        mouse.latestEvent = e;
        canOverwriteBuilding = true;
        if (state[Game.state]) {
            state[Game.state]?.onclick?.(e);
        }
    };
    clickcapture.onmouseup = (e) => {
        mouse.held = false;
        mouse.latestEvent = e;
        canOverwriteBuilding = true;
    };
    clickcapture.addEventListener("touchstart", (e) => {
        e.x = e.touches[0].clientX;
        e.y = e.touches[0].clientY;
        clickcapture.onmousedown(e);
    });
    clickcapture.addEventListener("touchend", (e) => {
        setTimeout(() => {
            mouse.held = false;
            canOverwriteBuilding = true;
        }, 500);
    });
    clickcapture.addEventListener("touchmove", (e) => {
        e.x = e.touches[0].clientX;
        e.y = e.touches[0].clientY;
        window.onmousemove(e);
    });
    clickcapture.oncontextmenu = (e) => {
        e.preventDefault();
    };
    window.onkeydown = (e) => {
        if (!isNaN(parseInt(e.key))) {
            for (let x of document.getElementById("toolbar").children) {
                x.classList.remove("selected");
            }
            document.getElementById("toolbar").children?.[parseInt(e.key) - 1]?.classList.add("selected");
        }
        if (!isNaN(parseInt(e.key[1]))) {
            for (let x of document.getElementById("toolbar").children) {
                x.classList.remove("selected");
            }
            document.getElementById("toolbar").children?.[parseInt(e.key[1]) + 8]?.classList.add("selected");
        }
        if (e.key == "Enter" && lastKeysPressed.join(", ") == ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"].join(", ")) {
            window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
            for (var [key, value] of Object.entries(level1.resources)) {
                level1.resources[key] = Infinity;
            }
        }
        if (keysHeld.indexOf(e.key.toLowerCase()) == -1) {
            keysHeld.push(e.key.toLowerCase());
        }
        lastKeysPressed.push(e.key);
        lastKeysPressed.splice(0, 1);
        if (e.ctrlKey) {
            if (e.altKey) {
                switch (e.key) {
                    case "s":
                        e.preventDefault();
                        download("Untitled-Electron-Game-save.json", JSON.stringify(exportData()));
                        break;
                    case "o":
                        e.preventDefault();
                        uploadButton.click();
                        break;
                }
            }
            else {
                switch (e.key) {
                    case "s":
                        if ((!localStorage.getItem("save1") || JSON.parse(localStorage.getItem("save1"))?.metadata?.uuid == level1?.uuid) || confirm("Are you want to save? This will overwrite your current saved world which seems to be different!")) {
                            try {
                                localStorage.setItem("save1", JSON.stringify(exportData()));
                                alert("Saved successfully!");
                                Game.lastSaved = millis();
                            }
                            catch (err) {
                                alert("Failed to save! " + err.message);
                            }
                        }
                        break;
                    case "o":
                        e.preventDefault();
                        uploadButton.click();
                        break;
                }
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
                case "Backspace":
                    placedBuilding.type = 0xFF;
                    e.preventDefault();
                    break;
            }
        }
    };
    window.onkeyup = (e) => {
        if (keysHeld.includes(e.key.toLowerCase())) {
            keysHeld.splice(keysHeld.indexOf(e.key.toLowerCase()), 1);
        }
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
        keysHeld = [];
        mouse.held = false;
    };
    window.onbeforeunload = (e) => {
        if (Game.state !== "title" || (!localStorage.getItem("save1") || JSON.parse(localStorage.getItem("save1"))?.metadata?.uuid == level1?.uuid)) {
            localStorage.setItem("save1", JSON.stringify(exportData()));
        }
        else {
            e.preventDefault();
            e.returnValue = "";
            localStorage.setItem("save-recovered", JSON.stringify(exportData()));
            setTimeout(() => {
                if (confirm("Could not save automatically on page exit because your current world is unrelated to your saved world.\nWould you like to save anyway? This will overwrite your current save!")) {
                    localStorage.setItem('save1', JSON.stringify(exportData()));
                    localStorage.removeItem("save-recovered");
                }
            }, 1);
        }
    };
}
let fps = [0, 0, 0, 0, 0, 0];
let state = {
    loading: {
        buttons: [],
        update: function () {
            if (loadedtextures == document.getElementById("textures").children.length) {
                Game.state = "title";
            }
            else if (loadedtextures > document.getElementById("textures").children.length) {
                throw new ShouldNotBePossibleError("Somehow loaded more textures than exist.");
            }
        },
        display: function (currentFrame) {
            ctx.clearRect(-1, -1, 10000, 10000);
            ctx.fillStyle = "#0033CC";
            ctx.fillRect(0, 0, innerWidth, innerHeight);
            ctx.font = "70px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000000";
            ctx.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
            ctx.fillStyle = "#000000";
            ctx.font = `40px sans-serif`;
            ctx.fillText(`Loading... ${loadedtextures}/${document.getElementById("textures").childElementCount}`, innerWidth / 2, innerHeight * 0.35);
        }
    },
    title: {
        buttons: [
            new Button({
                x: () => innerWidth / 4,
                y: () => innerHeight / 2,
                width: () => innerWidth / 2,
                height: () => innerHeight / 5,
                label: "Play",
                color: "#0000FF",
                font: "40px sans-serif",
                onClick: () => { mouse.held = false; load(); }
            }),
            new Button({
                x: () => innerWidth / 4,
                y: () => innerHeight * 0.75,
                width: () => innerWidth / 2,
                height: () => innerHeight / 5,
                label: "Settings",
                color: "#0000FF",
                font: "40px sans-serif",
                onClick: () => { Game.state = "settings"; }
            }),
        ],
        update: function () { },
        display: function (currentFrame) {
            ctx.clearRect(-1, -1, 10000, 10000);
            ctx.fillStyle = "#0033CC";
            ctx.fillRect(0, 0, innerWidth, innerHeight);
            ctx.font = "70px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000000";
            ctx.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
            ctx.fillStyle = "#cccc00";
            ctx.font = `${20 + 5 * Math[Game.title.splashbehavior](millis() / 400)}px sans-serif`;
            ctx.fillText(Game.title.splashtext ?? "splash not found! this is actually an error pls report", innerWidth / 2, innerHeight * 0.35);
            state.title.buttons.forEach(button => button.display(ctx));
        },
        onclick(e) {
            state.title.buttons.forEach(button => button.handleMouseClick(e));
        }
    },
    settings: {
        buttons: [
            new Button({
                x: () => innerWidth * 0.25,
                y: () => innerHeight * 0.5,
                width: () => innerWidth * 0.25,
                height: () => innerHeight * 0.2,
                label: () => "Tutorial: " + settings.tutorial,
                color: "#0000FF",
                font: "35px sans-serif",
                onClick: () => { settings.tutorial = !settings.tutorial; }
            }),
            new Button({
                x: () => innerWidth * 0.51,
                y: () => innerHeight * 0.5,
                width: () => innerWidth * 0.25,
                height: () => innerHeight * 0.2,
                label: () => "Debug: " + settings.debug,
                color: "#0000FF",
                font: "35px sans-serif",
                onClick: () => { settings.debug = !settings.debug; }
            }),
            new Button({
                x: () => innerWidth * 0.25,
                y: () => innerHeight * 0.71,
                width: () => innerWidth * 0.25,
                height: () => innerHeight * 0.2,
                label: () => "Always load save: " + settings.alwaysLoadSave,
                color: "#0000FF",
                font: "35px sans-serif",
                onClick: () => { settings.alwaysLoadSave = !settings.alwaysLoadSave; }
            }),
            new Button({
                x: () => innerWidth * 0.51,
                y: () => innerHeight * 0.71,
                width: () => innerWidth * 0.25,
                height: () => innerHeight * 0.2,
                label: () => "Autosave: " + settings.autoSave,
                color: "#0000FF",
                font: "35px sans-serif",
                onClick: () => { settings.autoSave = !settings.autoSave; }
            }),
            new Button({
                x: () => innerWidth * 0.9,
                y: () => innerHeight * 0.01,
                width: () => innerWidth * 0.09,
                height: () => innerHeight * 0.09,
                label: "❌",
                color: "#0000FF",
                font: "40px sans-serif",
                onClick: () => { Game.state = "title"; localStorage.setItem("settings", JSON.stringify(settings)); }
            }),
        ],
        update: function () { },
        display: function (currentFrame) {
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
            ctx.fillText("Tutorial: " + settings.tutorial, innerWidth * 0.375, innerHeight * 0.6);
            ctx.fillText("Debug: " + settings.debug, innerWidth * 0.625, innerHeight * 0.6);
            state.settings.buttons.forEach(button => button.display(ctx));
        },
        onclick: function (e) {
            state.settings.buttons.forEach(button => button.handleMouseClick(e));
        }
    },
    game: {
        buttons: [],
        update: function (currentFrame, level) {
            level ?? (level = level1);
            level.generateNecessaryChunks();
            try {
                level.update(currentFrame);
            }
            catch (err) {
                console.error(err);
                throw new Error(`Error updating world: ${err.message}`);
            }
        },
        display: function (currentFrame, level) {
            level ?? (level = level1);
            if (currentFrame.redraw) {
                ctx.clearRect(0, 0, innerWidth, innerHeight);
            }
            ctx1.clearRect(0, 0, innerWidth, innerHeight);
            ctx2.clearRect(0, 0, innerWidth, innerHeight);
            ctx25.clearRect(0, 0, innerWidth, innerHeight);
            ctx3.clearRect(0, 0, innerWidth, innerHeight);
            ctx4.clearRect(0, 0, innerWidth, innerHeight);
            level.display(currentFrame);
            level.displayGhostBuilding((mouse.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, (mouse.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, placedBuilding.ID);
            if (keysHeld.indexOf("shift") != -1) {
                level.displayTooltip(mouse.x, mouse.y, currentFrame);
            }
            ctx4.font = "30px sans-serif";
            ctx4.fillStyle = "#000000";
            ctx4.fillText((Math.round(-(Game.scroll.x * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString() + ", " + Math.round(-(Game.scroll.y * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString()), 10, 100);
            if (settings.debug) {
                ctx4.fillText("C: " + currentFrame.cps, 10, 150);
                ctx4.fillText("I: " + currentFrame.ips, 10, 200);
            }
            for (let item of document.getElementById("resources").children) {
                item.innerText = (level1.resources[item.id] ?? 0).toString();
            }
        },
        onclick: function (e) {
            if (e.ctrlKey) {
                if (e.shiftKey) {
                    level1.addItem((e.x / consts.DISPLAY_SCALE - Game.scroll.x), (e.y / consts.DISPLAY_SCALE - Game.scroll.y), ItemID.base_null);
                }
                else {
                    level1.addItem((Math.floor((e.x / consts.DISPLAY_SCALE - Game.scroll.x) / consts.TILE_SIZE) + 0.5) * consts.TILE_SIZE, (Math.floor((e.y / consts.DISPLAY_SCALE - Game.scroll.y) / consts.TILE_SIZE) + 0.5) * consts.TILE_SIZE, ItemID.base_null);
                }
            }
        },
        onmouseheld: function () {
            let e = mouse.latestEvent;
            if (!(keysHeld.includes("control") || keysHeld.includes("backspace")) && placedBuilding.ID != 0xFFFF) {
                level1.buildBuilding(Math.floor((e.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), Math.floor((e.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), placedBuilding.ID);
            }
        },
        onkeyheld: function (currentframe) {
            if (keysHeld.includes("w")) {
                Game.scroll.y += Game.scroll.speed;
                currentframe.redraw = true;
            }
            if (keysHeld.includes("a")) {
                Game.scroll.x += Game.scroll.speed;
                currentframe.redraw = true;
            }
            if (keysHeld.includes("s")) {
                Game.scroll.y -= Game.scroll.speed;
                currentframe.redraw = true;
            }
            if (keysHeld.includes("d")) {
                Game.scroll.x -= Game.scroll.speed;
                currentframe.redraw = true;
            }
            if (keysHeld.includes("backspace")) {
                currentframe.redraw = true;
                level1.buildBuilding(Math.floor((mouse.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), Math.floor((mouse.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), 0xFFFF);
            }
        }
    }
};
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
function handleAlerts() {
    if (alerts.list.length && alerts.active == false) {
        mouse.held = false;
        alertmessage.innerText = alerts.list.shift();
        alertmessage.style.setProperty("--text-length", alertmessage.innerText.length.toString());
        alertbox.classList.add("active");
        alerts.active = true;
    }
}
let cancel = null;
function main_loop() {
    try {
        let startFrameTime = new Date();
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
        window.getSelection().empty();
        if (keysHeld.indexOf("shift") !== -1) {
            Game.scroll.speed = 20;
        }
        else {
            Game.scroll.speed = 5;
        }
        let currentState = state[Game.state];
        if (!currentState) {
            throw new InvalidStateError(`Invalid game state "${Game.state}"`);
        }
        if (mouse.held) {
            currentState.onmouseheld?.(currentFrame);
        }
        if (keysHeld.length != 0) {
            currentState.onkeyheld?.(currentFrame);
        }
        currentState.update(currentFrame);
        currentState.display(currentFrame);
        if (Game.state == "game") {
            let frameMS = (new Date()).getTime() - startFrameTime.getTime();
            fps.splice(0, 1);
            fps.push(frameMS);
            let avgFPS = Math.round(constrain(5000 / (fps[0] + fps[1] + fps[2] + fps[3] + fps[4]), 0, 60));
            ctx4.fillText(avgFPS + " fps", 10, 50);
        }
        handleAlerts();
    }
    catch (err) {
        alert("An error has occurred! Oopsie.\nPlease create an issue on this project's GitHub so I can fix it.\nError message: " + err.message);
        if (err.message.startsWith("Error updating world:")) {
        }
        ctxs.forEach((ctx) => { ctx.clearRect(0, 0, innerWidth, innerHeight); });
        throw err;
    }
    cancel = requestAnimationFrame(main_loop);
}
function load() {
    loadTextures();
    level1 = new Level(314);
    if (localStorage.firstload) {
        localStorage.firstload = false;
        _alert(`Welcome to Untitled Electron Game!
This is a game about building a factory. It's still in early alpha, so there's not much content.
There's no good in game tutorial, so to get started check the wiki page: https://github.com/BalaM314/Untitled-Electron-Game/wiki/Quickstart-Guide`);
    }
    if (localStorage.getItem("save1") && (settings.alwaysLoadSave || confirm("Would you like to load your save?"))) {
        importData(localStorage.getItem("save1"));
    }
    Game.state = "game";
    Game.forceRedraw = true;
    document.getElementById("toolbar").classList.remove("hidden");
    document.getElementById("resources").classList.remove("hidden");
    if (settings.tutorial) {
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
    if (settings.autoSave) {
        if (!localStorage.getItem("save1") || JSON.parse(localStorage.getItem("save1"))?.metadata?.uuid == level1.uuid) {
            setInterval(() => {
                localStorage.setItem("save1", JSON.stringify(exportData()));
                console.log("Autosaved.");
                Game.lastSaved = millis();
            }, 30000);
        }
        else {
            alert("It looks like your current world isn't the same world as your save. Autosaving has been disabled to avoid overwriting it.");
        }
    }
}
let level1;
function exportData() {
    return {
        UntitledElectronGame: {
            metadata: {
                validationCode: "esrdtfgvczdsret56u7yhgvfcesrythgvfd!",
                id: level1?.uuid ?? Math.random().toString().substring(2),
                version: consts.VERSION,
                timeCreated: new Date().getTime().toString()
            },
            level1: level1.export()
        }
    };
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
        alert("Import failed! " + err.message);
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
try {
    assert(localStorage.getItem("settings"));
    settings = JSON.parse(localStorage.getItem("settings"));
}
catch (err) {
    console.warn("Invalid persistent settings!\nIf this is your first time visiting this site, nothing to worry about.");
    localStorage.setItem("settings", JSON.stringify(settings));
}
registerEventHandlers();
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    alert("It looks like you're trying to play on a phone. Unfortunately, mobile devices are not currently supported.");
}
Game.title.splashtext = Math.random() < 0.9 ? splashes[Math.ceil(Math.random() * (splashes.length - 1))] : raresplashes[Math.ceil(Math.random() * (raresplashes.length - 1))];
Game.title.splashbehavior = Math.random() < 0.9 ? "sin" : "tan";
main_loop();
