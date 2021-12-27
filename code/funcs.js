"use strict";
Array.prototype.contains = function (val) {
    return this.indexOf(val) != -1;
};
Object.defineProperty(Array.prototype, "contains", {
    enumerable: false
});
function makeError(name) {
    return class extends Error {
        constructor(message) {
            super(...arguments);
            this.name = name;
        }
    };
}
var triggerType;
(function (triggerType) {
    triggerType[triggerType["placeBuilding"] = 0] = "placeBuilding";
    triggerType[triggerType["placeBuildingFail"] = 1] = "placeBuildingFail";
    triggerType[triggerType["spawnItem"] = 2] = "spawnItem";
    triggerType[triggerType["buildingRun"] = 3] = "buildingRun";
})(triggerType || (triggerType = {}));
function trigger(type, buildingID, itemID) {
    switch (type) {
        case triggerType.placeBuilding:
            switch (buildingID) {
                case 0x04:
                    if (Game.tutorial.furnace.placed && Game.persistent.tutorialenabled) {
                        _alert("The Furnace converts raw ores into their smelted forms. Simply point a conveyor belt carrying ores at it and provide another belt for it to output onto.");
                        Game.tutorial.furnace.placed = false;
                    }
                    break;
                case 0x03:
                    if (Game.tutorial.trashcan.placed && Game.persistent.tutorialenabled) {
                        _alert("The Trash Can is pretty simple: it deletes all items it receives.");
                        Game.tutorial.trashcan.placed = false;
                    }
                    break;
                case 0x02:
                    if (Game.tutorial.miner.placed && Game.persistent.tutorialenabled) {
                        _alert("The Miner mines ore nodes, producing one ore per second. \nIt auto-outputs to adjacent conveyor belts.\nAlso, ore nodes are infinite.");
                        Game.tutorial.miner.placed = false;
                    }
                    break;
                case 0x01:
                    if (Game.tutorial.conveyor.placed && Game.persistent.tutorialenabled) {
                        _alert("Conveyors are the way to move items around. \nYou can use the arrow keys to change the direction of placed belts. \nTry making a belt chain, then putting a debug item on it with Ctrl+click.\nYou can drag-click to build multiple of the same building.");
                        Game.tutorial.conveyor.placed = false;
                    }
                    break;
            }
            break;
        case triggerType.placeBuildingFail:
            switch (buildingID) {
                case 0x04:
                    if (Game.tutorial.furnace.placefail && Game.persistent.tutorialenabled) {
                        _alert("The Furnace generates a lot of heat and is pretty heavy, so you can only place it on stone.");
                        Game.tutorial.furnace.placefail = false;
                    }
                    break;
                case 0x03:
                    break;
                case 0x02:
                    if (Game.tutorial.miner.placefail && Game.persistent.tutorialenabled) {
                        _alert("The Miner can only be placed on a resource node(the colored circles).");
                        Game.tutorial.miner.placefail = false;
                    }
                    break;
                case 0x01:
                    if (Game.tutorial.conveyor.placefail && Game.persistent.tutorialenabled) {
                        _alert("Conveyors don't float!\nYes, I know, then water chunks are useless... I'll add pontoons in a future update.");
                        Game.tutorial.conveyor.placefail = false;
                    }
                    break;
            }
            break;
        case triggerType.spawnItem:
            switch (itemID) {
                case ItemID.base_coal:
                    if (Game.tutorial.item.coal) {
                        _alert("Congratulations! You just automated coal!");
                        _alert(["Try doing the same thing for iron: Iron nodes are whiteish and are a bit further from the center of the map.\nUse WASD to scroll.", 3000]);
                        Game.tutorial.item.coal = false;
                    }
                    break;
                case ItemID.base_ironIngot:
                    if (Game.tutorial.item.iron) {
                        _alert("Nice job!");
                        _alert(["The next automateable resource is steel.\nYou'll need to use the alloy smelter(slot 7), which needs two inputs(coal and iron).", 3000]);
                        Game.tutorial.item.iron = false;
                    }
                    break;
            }
            break;
        case triggerType.buildingRun:
            switch (buildingID) {
                case 0x02:
                    if (Game.tutorial.miner.coaloutput && Game.persistent.tutorialenabled && itemID == ItemID.base_coalOre) {
                        _alert("Nice!\nThis is just coal ore though, not coal. Try placing a furnace(4 key).\nOh also, remember you can scroll to zoom in on that beautiful coal ore texture.");
                        Game.tutorial.miner.coaloutput = false;
                    }
                    break;
                case 0x07:
                    break;
            }
            break;
    }
}
function sq(x) {
    return x * x;
}
const programStart = new Date();
function millis() {
    return (new Date()).valueOf() - programStart.valueOf();
}
function gcd(x, y) {
    if ((typeof x !== 'number') || (typeof y !== 'number')) {
        return false;
    }
    x = Math.abs(x);
    y = Math.abs(y);
    while (y) {
        let t = y;
        y = x % y;
        x = t;
    }
    return x;
}
function random(min, max) {
    if (typeof min == "number") {
        if (arguments.length > 2) {
            throw new ArgumentError("Too many arguments for random");
        }
        if (arguments.length == 1) {
            max = min;
            min = 0;
        }
        if (arguments.length == 0) {
            min = 0;
            max = 1;
        }
        return Math.random() * (max - min) + min;
    }
    else if (min instanceof Array) {
        return min[Math.floor(random(0, min.length + 1))];
    }
}
function range(start, end) {
    let temp = [];
    for (let i = start; i <= end; i++) {
        temp.push(i);
    }
    return temp;
}
function constrain(x, min, max) {
    if (x > max)
        return max;
    if (x < min)
        return min;
    return x;
}
function assert(x) {
    if (!x) {
        throw new AssertionFailedError(x);
    }
}
function download(filename, text) {
    let temp2 = document.createElement('a');
    temp2.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    temp2.setAttribute('download', filename);
    temp2.style.display = 'none';
    document.body.appendChild(temp2);
    temp2.click();
    document.body.removeChild(temp2);
}
var rectMode;
(function (rectMode) {
    rectMode[rectMode["CENTER"] = 0] = "CENTER";
    rectMode[rectMode["CORNER"] = 1] = "CORNER";
})(rectMode || (rectMode = {}));
function rect(x, y, w, h, mode, _ctx) {
    if (!_ctx)
        _ctx = ctx;
    if (mode == rectMode.CENTER) {
        _ctx.fillRect(x - w / 2, y - w / 2, w, h);
    }
    else {
        _ctx.fillRect(x, y, w, h);
    }
}
function ellipse(x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
}
function* pseudoRandom(seed) {
    let value = seed + 11111111111111;
    while (true) {
        value = value * 16807 % 16777216;
        yield value / 16777216;
    }
}
let alerts = [];
function _alert(x) {
    alerts.push(x);
}
function loadTextures() {
    for (let element of document.getElementById("textures").children) {
        textures.set(element.id, element);
    }
}
;
function zoom(scaleFactor) {
    scaleFactor = constrain(scaleFactor, 0.9, 1.1);
    if (Globals.DISPLAY_SCALE * scaleFactor < 1) {
        scaleFactor = 1 / Globals.DISPLAY_SCALE;
    }
    else if (Globals.DISPLAY_SCALE * scaleFactor > 5) {
        scaleFactor = 5 / Globals.DISPLAY_SCALE;
    }
    if ((Globals.DISPLAY_SCALE <= 1 && scaleFactor <= 1) || (Globals.DISPLAY_SCALE >= 5 && scaleFactor >= 1)) {
        return;
    }
    Game.forceRedraw = true;
    Globals.DISPLAY_SCALE *= scaleFactor;
    Game.scroll.x -= (innerWidth * 0.5 * (scaleFactor - 1)) / Globals.DISPLAY_SCALE;
    Game.scroll.y -= (innerHeight * 0.5 * (scaleFactor - 1)) / Globals.DISPLAY_SCALE;
}
function tileToChunk(tileCoord) {
    tileCoord = Math.floor(tileCoord) % Globals.CHUNK_SIZE;
    return tileCoord + (tileCoord < 0 ? Globals.CHUNK_SIZE : 0);
}
function pixelToTile(pixelCoord) {
    pixelCoord = Math.floor(pixelCoord) % Globals.TILE_SIZE;
    return pixelCoord + (pixelCoord < 0 ? Globals.TILE_SIZE : 0);
}
function tileAtPixel(pixelCoord) {
    return Math.floor(pixelCoord / Globals.TILE_SIZE);
}
