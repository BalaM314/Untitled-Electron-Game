"use strict";
Array.prototype.sort2 = function (callback) {
    this.sort((value1, value2) => {
        let result1 = callback(value1);
        let result2 = callback(value2);
        if (result1 < result2) {
            return -1;
        }
        else if (result1 > result2) {
            return 1;
        }
        else {
            return 0;
        }
    });
};
Object.defineProperty(Array.prototype, "sort2", {
    enumerable: false
});
CanvasRenderingContext2D.prototype.clear = function () {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
};
Object.defineProperty(CanvasRenderingContext2D.prototype, "clear", {
    enumerable: false
});
function millis() {
    return (new Date()).valueOf() - Game.startTime.valueOf();
}
function gcd(x, y) {
    if ((typeof x !== 'number') || (typeof y !== 'number')) {
        return 1;
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
        return min[Math.floor(random(0, min.length))];
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
class Button {
    constructor(config) {
        if (config.x instanceof Function)
            Object.defineProperty(this, "x", { get: config.x });
        else
            this.x = config.x ?? 300;
        if (config.y instanceof Function)
            Object.defineProperty(this, "y", { get: config.y });
        else
            this.y = config.y ?? 300;
        if (config.width instanceof Function)
            Object.defineProperty(this, "width", { get: config.width });
        else
            this.width = config.width ?? 300;
        if (config.height instanceof Function)
            Object.defineProperty(this, "height", { get: config.height });
        else
            this.height = config.height ?? 300;
        if (config.label instanceof Function)
            Object.defineProperty(this, "label", { get: config.label });
        else
            this.label = config.label ?? "Button";
        this.color = config.color || "#0000FF";
        this.font = config.font || "20px sans-serif";
        this.onClick = config.onClick || (() => { });
    }
    ;
    display(_ctx) {
        _ctx.fillStyle = this.color;
        _ctx.strokeStyle = "#000000";
        _ctx.lineWidth = 2;
        _ctx.globalAlpha = 1.0;
        _ctx.fillRect(this.x, this.y, this.width, this.height);
        _ctx.strokeRect(this.x, this.y, this.width, this.height);
        if (this.isMouseInside()) {
            _ctx.fillStyle = "#FFFFFF";
            if (mouse.held) {
                _ctx.globalAlpha = 0.4;
            }
            else {
                _ctx.globalAlpha = 0.2;
            }
            _ctx.lineWidth = 0;
            _ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        _ctx.lineWidth = 1;
        _ctx.globalAlpha = 1.0;
        ctx.font = this.font;
        ctx.textAlign = "center";
        let tempBaseline = ctx.textBaseline;
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
        ctx.textBaseline = tempBaseline;
    }
    ;
    isMouseInside() {
        return mouse.x > this.x &&
            mouse.x < this.x + this.width &&
            mouse.y > this.y &&
            mouse.y < this.y + this.height;
    }
    ;
    handleMouseClick(e) {
        if (this.isMouseInside()) {
            this.onClick(e);
        }
    }
    ;
}
var rectMode;
(function (rectMode) {
    rectMode[rectMode["CENTER"] = 0] = "CENTER";
    rectMode[rectMode["CORNER"] = 1] = "CORNER";
})(rectMode || (rectMode = {}));
function rect(x, y, w, h, mode, _ctx) {
    _ctx ?? (_ctx = ctx);
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
function trigger(type, buildingID, itemID) {
}
function _alert(x) {
    alerts.list.push(x);
}
function loadTexturesIntoMemory() {
    for (let imageElement of Array.from(document.getElementById("item").children)) {
        if (!imageElement.complete) {
            return false;
        }
        registry.textures.item[imageElement.src.match(/(?<=assets\/textures\/item\/).*(?=\.png)/)[0]] = imageElement;
    }
    for (let imageElement of Array.from(document.getElementById("building").children)) {
        if (!imageElement.complete) {
            return false;
        }
        registry.textures.building[imageElement.src.match(/(?<=assets\/textures\/building\/).*(?=\.png)/)[0]] = imageElement;
    }
    for (let imageElement of Array.from(document.getElementById("tile").children)) {
        if (!imageElement.complete) {
            return false;
        }
        registry.textures.tile[imageElement.src.match(/(?<=assets\/textures\/tile\/).*(?=\.png)/)[0]] = imageElement;
    }
    for (let imageElement of Array.from(document.getElementById("misc").children)) {
        if (!imageElement.complete) {
            return false;
        }
        registry.textures.misc[imageElement.src.match(/(?<=assets\/textures\/misc\/).*(?=\.png)/)[0]] = imageElement;
    }
    return true;
}
function loadTexturesIntoPage() {
    for (let buildingID of Object.values(registry.buildingIDs)) {
        let img = document.createElement("img");
        img.setAttribute("src", `assets/textures/building/${buildingID}.png`);
        img.addEventListener("load", () => {
            Game.loadedTextures++;
        });
        img.addEventListener("error", (err) => {
            alert("Failed to load texture " + err.target.src.split("assets/textures/")[1]);
            throw err;
        });
        document.getElementById("building").appendChild(img);
    }
    for (let itemID of Object.values(registry.itemIDs)) {
        let img = document.createElement("img");
        img.setAttribute("src", `assets/textures/item/${itemID}.png`);
        img.addEventListener("load", () => {
            Game.loadedTextures++;
        });
        img.addEventListener("error", (err) => {
            alert("Failed to load texture " + err.target.src.split("assets/textures/")[1]);
            throw err;
        });
        document.getElementById("item").appendChild(img);
    }
    for (let tileID of registry.tileIDs) {
        let img = document.createElement("img");
        img.setAttribute("src", `assets/textures/tile/${tileID}.png`);
        img.addEventListener("load", () => {
            Game.loadedTextures++;
        });
        img.addEventListener("error", (err) => {
            alert("Failed to load texture " + err.target.src.split("assets/textures/")[1]);
            throw err;
        });
        document.getElementById("tile").appendChild(img);
    }
    for (let textureID of registry.miscTextures) {
        let img = document.createElement("img");
        img.setAttribute("src", `assets/textures/misc/${textureID}.png`);
        img.addEventListener("load", () => {
            Game.loadedTextures++;
        });
        img.addEventListener("error", (err) => {
            alert("Failed to load texture " + err.target.src.split("assets/textures/")[1]);
            throw err;
        });
        document.getElementById("misc").appendChild(img);
    }
}
function getTotalTextures() {
    return Object.values(registry.buildingIDs).length + Object.values(registry.itemIDs).length + registry.tileIDs.length + registry.miscTextures.length;
}
function hex(num, length) {
    return `0x${(Array(length).fill("0").join("") + num.toString(16)).toUpperCase().slice(-length)}`;
}
function zoom(scaleFactor) {
    scaleFactor = constrain(scaleFactor, 0.9, 1.1);
    if (consts.DISPLAY_SCALE * scaleFactor < 1) {
        scaleFactor = 1 / consts.DISPLAY_SCALE;
    }
    else if (consts.DISPLAY_SCALE * scaleFactor > 5) {
        scaleFactor = 5 / consts.DISPLAY_SCALE;
    }
    if ((consts.DISPLAY_SCALE <= 1 && scaleFactor <= 1) || (consts.DISPLAY_SCALE >= 5 && scaleFactor >= 1)) {
        return;
    }
    Game.forceRedraw = true;
    consts.DISPLAY_SCALE *= scaleFactor;
    Game.scroll.x -= (innerWidth * 0.5 * (scaleFactor - 1)) / consts.DISPLAY_SCALE;
    Game.scroll.y -= (innerHeight * 0.5 * (scaleFactor - 1)) / consts.DISPLAY_SCALE;
}
function tileOffsetInChunk(tileCoord) {
    tileCoord = Math.floor(tileCoord) % consts.CHUNK_SIZE;
    return tileCoord + (tileCoord < 0 ? consts.CHUNK_SIZE : 0);
}
function pixelOffsetInTile(pixelCoord) {
    pixelCoord = Math.floor(pixelCoord) % consts.TILE_SIZE;
    return pixelCoord + (pixelCoord < 0 ? consts.TILE_SIZE : 0);
}
function tileAtPixel(pixelCoord) {
    return Math.floor(pixelCoord / consts.TILE_SIZE);
}
function getRawBuildingID(buildingID) {
    return hex(+buildingID, 2);
}
class Keybind {
    constructor(mainKey, modifiers, action) {
        this.mainKey = mainKey;
        this.modifiers = modifiers?.map(key => key.toLowerCase()) ?? [];
        this.action = action ?? (() => { });
    }
    isHeld() {
        let modifiersHeld = this.modifiers
            .filter(key => !key.startsWith("!"))
            .filter(key => !keysHeld.includes(key))
            .length == 0;
        let disallowedModifiersNotHeld = this.modifiers
            .filter(key => key.startsWith("!"))
            .map(key => key.split("!")[1])
            .filter(key => keysHeld.includes(key))
            .length == 0;
        return keysHeld.includes(this.mainKey) && modifiersHeld && disallowedModifiersNotHeld;
    }
    check(e) {
        let modifiersHeld = this.modifiers
            .filter(key => !key.startsWith("!"))
            .filter(key => !keysHeld.includes(key))
            .length == 0;
        let disallowedModifiersNotHeld = this.modifiers
            .filter(key => key.startsWith("!"))
            .map(key => key.split("!")[1])
            .filter(key => keysHeld.includes(key))
            .length == 0;
        if (this.mainKey == e.key.toLowerCase() && modifiersHeld && disallowedModifiersNotHeld) {
            e.preventDefault();
            this.action();
        }
    }
}
function makeRebindButton(y, buttonID, buttonName, defaultKey) {
    return new Button({
        x: () => innerWidth * 0.3,
        y: () => innerHeight * y,
        width: () => innerWidth * 0.4,
        height: () => innerHeight * 0.05,
        label: () => `${buttonName}: ${registry.keybinds[buttonID[0]][buttonID[1]].modifiers
            .filter(key => !key.startsWith("!"))
            .map(el => el + " + ")
            .join("")}${registry.keybinds[buttonID[0]][buttonID[1]].mainKey}`,
        color: "#0000FF",
        font: "15px sans-serif",
        onClick: () => {
            registry.keybinds[buttonID[0]][buttonID[1]].mainKey =
                (prompt(`Rebind ${buttonName.toLowerCase()} to:`) ?? defaultKey).toLowerCase().substring(0, 1);
        }
    });
}
