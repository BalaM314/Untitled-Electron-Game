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
function round(amount, places = 0) {
    const tenEplaces = 10 ** places;
    return Math.round(amount * tenEplaces) / tenEplaces;
}
function percentage(amount, places = 0) {
    return `${round(amount * 100, places)}%`;
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
function parseError(err) {
    if (err instanceof Error) {
        return err.message;
    }
    else if (typeof err == "number" || typeof err == "string" || typeof err == "boolean") {
        return err.toString();
    }
    else
        return err;
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
        this.color = config.color ?? "#0000FF";
        this.font = config.font ?? "20px sans-serif";
        this.onClick = config.onClick ?? (() => { });
    }
    display(_ctx) {
        _ctx.fillStyle = this.color;
        _ctx.strokeStyle = "#000000";
        _ctx.lineWidth = 2;
        _ctx.globalAlpha = 1.0;
        _ctx.fillRect(this.x, this.y, this.width, this.height);
        _ctx.strokeRect(this.x, this.y, this.width, this.height);
        if (this.isMouseInside()) {
            _ctx.fillStyle = "#FFFFFF";
            if (Input.mouseDown) {
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
        _ctx.font = this.font;
        _ctx.textAlign = "center";
        let tempBaseline = _ctx.textBaseline;
        _ctx.textBaseline = "middle";
        _ctx.fillStyle = "#FFFFFF";
        _ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
        _ctx.textBaseline = tempBaseline;
    }
    isMouseInside() {
        return Intersector.pointInRect([Input.mouseX, Input.mouseY], [this.x, this.y, this.width, this.height]);
    }
    handleMouseClick(e) {
        if (this.isMouseInside() && e.button == 0) {
            this.onClick(e);
        }
    }
}
class Intersector {
    static pointInRect([x, y], [rX, rY, rW, rH]) {
        return x > rX && x < (rX + rW) && y > rY && y < (rY + rH);
    }
    static rectsIntersect([aX, aY, aW, aH], [bX, bY, bW, bH]) {
        return bX < aX + aW && aX < bX + bW && bY < aY + aH && aY < bY + bH;
    }
}
class WindowedMean {
    constructor(maxWindowSize, fillValue = 0) {
        this.maxWindowSize = maxWindowSize;
        this.queuei = 0;
        this.data = new Array(maxWindowSize).fill(fillValue);
    }
    add(value) {
        this.data[this.queuei++ % this.maxWindowSize] = value;
    }
    mean(windowSize = this.maxWindowSize, notEnoughDataValue = null) {
        if (this.queuei >= windowSize)
            return this.rawMean(windowSize);
        else
            return notEnoughDataValue;
    }
    rawMean(windowSize = this.maxWindowSize) {
        if (windowSize > this.maxWindowSize)
            throw new Error(`Cannot get average over the last ${windowSize} values becaue only ${this.maxWindowSize} values are stored`);
        let total = 0;
        let wrappedQueueI = this.queuei % this.maxWindowSize;
        for (let i = wrappedQueueI - windowSize; i < wrappedQueueI; i++) {
            if (i >= 0)
                total += this.data[i];
            else
                total += this.data[this.maxWindowSize + i];
        }
        return total / windowSize;
    }
    standardDeviation(windowSize = this.maxWindowSize, notEnoughDataValue = 0) {
        if (this.queuei < windowSize)
            return notEnoughDataValue;
        const mean = this.mean(windowSize);
        let sumXMinusMeanSquared = 0;
        let wrappedQueueI = this.queuei % this.maxWindowSize;
        for (let i = wrappedQueueI - windowSize; i < wrappedQueueI; i++) {
            sumXMinusMeanSquared += (((i >= 0)
                ? this.data[i]
                : this.data[this.maxWindowSize + i]) - mean) ** 2;
        }
        return sumXMinusMeanSquared / windowSize;
    }
}
function Abstract(input, context) {
    return class __temp extends input {
        constructor(...args) {
            super(...args);
            if (this.constructor === __temp)
                throw new Error(`Cannot construct abstract class ${input.name}`);
        }
    };
}
var RectMode;
(function (RectMode) {
    RectMode[RectMode["CENTER"] = 0] = "CENTER";
    RectMode[RectMode["CORNER"] = 1] = "CORNER";
})(RectMode || (RectMode = {}));
function* pseudoRandom(seed) {
    let value = seed + 11111111111111;
    while (true) {
        value = value * 16807 % 16777216;
        let num = value / 16777216;
        yield {
            value: num,
            chance(amount) {
                return num < amount;
            }
        };
    }
    return null;
}
function getElement(id, type) {
    const element = document.getElementById(id);
    if (element instanceof type)
        return element;
    else if (element instanceof HTMLElement)
        throw new Error(`Element with id was fetched as type ${type}, but was of type ${element.constructor.name}`);
    else
        throw new Error(`Element with id ${id} does not exist`);
}
function trigger(type, buildingID, itemID) {
}
function _alert(x) {
    Game.alerts.list.push(x);
}
function closeAlert() {
    alertbox.classList.remove("active");
    Game.alerts.active = false;
}
function hex(num, length) {
    return `0x${(Array(length).fill("0").join("") + num.toString(16)).toUpperCase().slice(-length)}`;
}
function stringifyMeta(buildingID, buildingMeta) {
    return `${buildingID}:${buildingMeta}`;
}
function mapLegacyRawBuildingID(id) {
    switch (id) {
        case "0x01": return "base_conveyor";
        case "0x02": return "base_miner";
        case "0x03": return "base_trash_can";
        case "0x04": return "base_furnace";
        case "0x05": return "base_extractor";
        case "0x06": return "base_chest";
        case "0x07": return "base_alloy_smelter";
        case "0x08": return "base_resource_acceptor";
        case "0x09": return "base_wiremill";
        case "0x0A": return "base_compressor";
        case "0x0B": return "base_lathe";
        case "0x10": return "base_multiblock_secondary";
        case "0x11": return "base_assembler";
        case "0xFF": return "base_null";
    }
}
function getLegacyRawBuildingID(buildingID) {
    return hex(+buildingID, 2);
}
class Pos {
    constructor(pixelX, pixelY) {
        this.pixelX = pixelX;
        this.pixelY = pixelY;
    }
    static fromPixelCoords(x, y) {
        return new Pos(x, y);
    }
    static fromTileCoords(x, y, centered) {
        return new Pos(this.tileToPixel(x, centered), this.tileToPixel(y, centered));
    }
    get pixel() {
        return [this.pixelX, this.pixelY];
    }
    get tile() {
        return [this.tileXExact, this.tileYExact];
    }
    get tileC() {
        return [this.tileXCentered, this.tileYCentered];
    }
    get pixelXCenteredInTile() {
        return Pos.tileToPixel(this.tileX, true);
    }
    get pixelYCenteredInTile() {
        return Pos.tileToPixel(this.tileY, true);
    }
    get tileX() {
        return Pos.pixelToTile(this.pixelX);
    }
    get tileY() {
        return Pos.pixelToTile(this.pixelY);
    }
    get tileXCentered() {
        return Pos.pixelToTile(this.pixelX) + 0.5;
    }
    get tileYCentered() {
        return Pos.pixelToTile(this.pixelY) + 0.5;
    }
    get tileXExact() {
        return Pos.pixelToTileExact(this.pixelX);
    }
    get tileYExact() {
        return Pos.pixelToTileExact(this.pixelY);
    }
    get tileOffsetXInPixels() {
        return Pos.tileOffsetInPixels(this.pixelX);
    }
    get tileOffsetYInPixels() {
        return Pos.tileOffsetInPixels(this.pixelY);
    }
    get tileOffsetXInTiles() {
        return Pos.tileOffsetInTiles(this.pixelX);
    }
    get tileOffsetYInTiles() {
        return Pos.tileOffsetInTiles(this.pixelY);
    }
    get tileOffsetXCentered() {
        return Pos.tileOffsetInTiles(this.pixelX) == 0.5;
    }
    get tileOffsetYCentered() {
        return Pos.tileOffsetInTiles(this.pixelY) == 0.5;
    }
    get chunkOffsetXInTiles() {
        return Pos.chunkOffsetInTiles(this.tileX);
    }
    get chunkOffsetYInTiles() {
        return Pos.chunkOffsetInTiles(this.tileY);
    }
    get chunkX() {
        return Pos.pixelToChunk(this.pixelX);
    }
    get chunkY() {
        return Pos.pixelToChunk(this.pixelY);
    }
    static pixelToTile(pixelCoord) {
        return Math.floor(pixelCoord / consts.TILE_SIZE);
    }
    static pixelToTileExact(pixelCoord) {
        return pixelCoord / consts.TILE_SIZE;
    }
    static tileToPixel(tileCoord, centered) {
        return (tileCoord + centered * 0.5) * consts.TILE_SIZE;
    }
    static chunkToTile(chunkCoord) {
        return chunkCoord * consts.CHUNK_SIZE;
    }
    static tileToChunk(tileCoord) {
        return Math.floor(tileCoord / consts.CHUNK_SIZE);
    }
    static tileToChunkExact(tileCoord) {
        return Math.floor(tileCoord / consts.CHUNK_SIZE);
    }
    static pixelToChunk(pixelCoord) {
        return Math.floor(pixelCoord / (consts.TILE_SIZE * consts.CHUNK_SIZE));
    }
    static chunkToPixel(chunkCoord) {
        return chunkCoord * consts.CHUNK_SIZE * consts.TILE_SIZE;
    }
    static tileOffsetInPixels(pixelCoord) {
        pixelCoord = Math.floor(pixelCoord) % consts.TILE_SIZE;
        return pixelCoord + (pixelCoord < 0 ? consts.TILE_SIZE : 0);
    }
    static tileOffsetInTiles(pixelCoord) {
        pixelCoord = Math.floor(pixelCoord) % consts.TILE_SIZE;
        return (pixelCoord + (pixelCoord < 0 ? consts.TILE_SIZE : 0)) / consts.TILE_SIZE;
    }
    static chunkOffsetInTiles(tileCoord) {
        tileCoord = Math.floor(tileCoord) % consts.CHUNK_SIZE;
        return tileCoord + (tileCoord < 0 ? consts.CHUNK_SIZE : 0);
    }
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
            .filter(key => !Input.keysHeld.has(key))
            .length == 0;
        let disallowedModifiersNotHeld = this.modifiers
            .filter(key => key.startsWith("!"))
            .map(key => key.split("!")[1])
            .filter(key => Input.keysHeld.has(key))
            .length == 0;
        return Input.keysHeld.has(this.mainKey) && modifiersHeld && disallowedModifiersNotHeld;
    }
    check(e) {
        let modifiersHeld = this.modifiers
            .filter(key => !key.startsWith("!"))
            .filter(key => !Input.keysHeld.has(key))
            .length == 0;
        let disallowedModifiersNotHeld = this.modifiers
            .filter(key => key.startsWith("!"))
            .map(key => key.split("!")[1])
            .filter(key => Input.keysHeld.has(key))
            .length == 0;
        if (this.mainKey == e.key.toLowerCase() && modifiersHeld && disallowedModifiersNotHeld) {
            e.preventDefault();
            this.action();
        }
    }
}
function isKey(obj, thing) {
    if (obj instanceof Map)
        return obj.has(thing);
    else
        return thing in obj;
}
function forceType(input) {
}
function extend() {
    return (data) => data;
}
function never() {
    throw new Error(`Unreachable code was reached!`);
}
function makeRebindButton(y, buttonID, buttonName, defaultKey) {
    const keybind = keybinds[buttonID[0]]?.[buttonID[1]];
    if (!keybind)
        throw new Error(`Invalid rebind button ${buttonID[0]}.${buttonID[1]}`);
    return new Button({
        x: () => innerWidth * 0.3,
        y: () => innerHeight * y,
        width: () => innerWidth * 0.4,
        height: () => innerHeight * 0.05,
        label: () => `${buttonName}: ${keybind.modifiers
            .filter(key => !key.startsWith("!"))
            .map(el => el + " + ")
            .join("")}${keybind.mainKey}`,
        color: "#0000FF",
        font: "15px sans-serif",
        onClick: () => {
            keybind.mainKey =
                (prompt(`Rebind ${buttonName.toLowerCase()} to:`) ?? defaultKey).toLowerCase().substring(0, 1);
        }
    });
}
function selectID(id) {
    placedBuilding.type = id;
    const image = document.querySelector(`img#${id}`);
    if (image) {
        toolbarIcons.forEach(i => i.classList.remove("selected"));
        image.classList.add("selected");
    }
}
