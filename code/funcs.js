"use strict";
Array.prototype.sort2 = function (func) {
    this.sort((a, b) => func(a) - func(b));
};
Array.prototype.at = function (index) {
    return this[index < 0 ? index + this.length : index];
};
Object.defineProperty(Array.prototype, "sort2", {
    enumerable: false
});
Object.defineProperty(Array.prototype, "at", {
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
function delay(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}
function until(predicate, checkInterval = 100) {
    return new Promise((resolve, reject) => {
        const id = setInterval(() => {
            if (predicate()) {
                clearInterval(id);
                resolve();
            }
        }, checkInterval);
    });
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
function map(value, from1, from2, to1, to2) {
    return ((value - from1) / (from2 - from1)) * (to2 - to1) + to1;
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
        if (typeof this.label == "string") {
            _ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
        }
        else {
            _ctx.drawImage(this.label.image, this.x, this.y, this.width, this.height);
        }
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
        return x >= rX && x < (rX + rW) && y >= rY && y < (rY + rH);
    }
    static rectsIntersect([aX, aY, aW, aH], [bX, bY, bW, bH]) {
        return bX <= aX + aW && aX <= bX + bW && bY <= aY + aH && aY <= bY + bH;
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
        throw new Error(`Element with id ${id} was fetched as type ${type.name}, but was of type ${element.constructor.name}`);
    else
        throw new Error(`Element with id ${id} does not exist`);
}
function add(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
}
function mul(a, amount) {
    return [a[0] * amount, a[1] * amount];
}
function saveExists() {
    return localStorage.getItem("save1") != null;
}
function safeToSave() {
    if (!saveExists())
        return true;
    try {
        const data = JSON.parse(localStorage.getItem("save1"));
        assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
        return data.UntitledElectronGame.metadata.uuid == level1.uuid || data.UntitledElectronGame.metadata.id == level1.uuid;
    }
    catch (err) {
        return true;
    }
}
function saveToLocalStorage() {
    localStorage.setItem("save1", JSON.stringify(exportData()));
    localStorage.setItem("untitled-electron-game:tech-tree", tech.write());
    localStorage.setItem("untitled-electron-game:objectives", objectives.write());
    Game.lastSaved = Date.now();
}
function trigger(key, data) {
    switch (key) {
        case "buildingFirstRun":
            break;
    }
}
function _alert(message) {
    if (!Game.alerts.list.includes(message))
        Game.alerts.list.push(message);
}
function closeAlert() {
    alertbox.classList.remove("active");
    Game.alerts.list.shift();
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
        return Math.floor(pixelCoord / consts.chunkSizeInPixels);
    }
    static chunkToPixel(chunkCoord) {
        return chunkCoord * consts.chunkSizeInPixels;
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
    toString() {
        let key = this.mainKey;
        if (this.mainKey == " ")
            key = "Space";
        return this.modifiers.map(m => m + "+").join("") + key;
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
function crash(message = `Unreachable code was reached!`) {
    throw new Error(message);
}
function tooltip(title, properties) {
    const props = [];
    if (Array.isArray(properties)) {
        props.push(...properties);
    }
    else {
        for (const [k, v] of Object.entries(properties)) {
            if (v && v.trim().length > 0) {
                if (k.startsWith("_"))
                    props.push(v.trim());
                else
                    props.push(`${k}: ${v.trim()}`);
            }
        }
    }
    return `${title}<div style="font-size: 70%;">${props.join("<br/>")}</div>`;
}
function firstUsePopup(key, message, callback, runCallbackAfterMessage = false) {
    const lsKey = `untitled-electron-game-${key}`;
    if (localStorage.getItem(lsKey) != null) {
        callback?.();
    }
    else {
        alert(message);
        localStorage.setItem(lsKey, "true");
        if (runCallbackAfterMessage)
            callback?.();
    }
}
function f(stringChunks, ...varChunks) {
    return String.raw({ raw: stringChunks }, ...varChunks).replaceAll(/[\s\S]\u0008/g, "");
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
        color: "#08F",
        font: "15px sans-serif",
        onClick: () => {
            keybind.mainKey =
                (prompt(`Rebind ${buttonName.toLowerCase()} to:`) ?? defaultKey).toLowerCase().substring(0, 1);
        }
    });
}
function selectID(id) {
    const block = Buildings.getOpt(id);
    if (block && !block.unlocked())
        id = "base_null";
    placedBuilding.type = id;
    const image = document.querySelector(`img#toolbar_${id}`);
    for (const icon of toolbarEl.children) {
        icon.classList.remove("selected");
    }
    if (image)
        image.classList.add("selected");
}
class QuadTree {
    constructor(span, depth = 1) {
        this.span = span;
        this.depth = depth;
        this.elements = [];
        this.nodes = null;
    }
    split() {
        this.nodes = [
            new QuadTree([this.span[0], this.span[1], this.span[2] / 2, this.span[3] / 2], this.depth + 1),
            new QuadTree([this.span[0], this.span[1] + this.span[3] / 2, this.span[2] / 2, this.span[3] / 2], this.depth + 1),
            new QuadTree([this.span[0] + this.span[2] / 2, this.span[1], this.span[2] / 2, this.span[3] / 2], this.depth + 1),
            new QuadTree([this.span[0] + this.span[2] / 2, this.span[1] + this.span[3] / 2, this.span[2] / 2, this.span[3] / 2], this.depth + 1),
        ];
        for (const el of this.elements) {
            this.add(el);
        }
        this.elements = [];
    }
    add(element) {
        if (this.nodes) {
            for (const node of this.nodes) {
                if (node.contains(element)) {
                    node.add(element);
                    return true;
                }
            }
            return false;
        }
        else if (this.elements.length == QuadTree.maxItems && this.depth < QuadTree.maxDepth) {
            this.split();
            this.add(element);
            return true;
        }
        else {
            this.elements.push(element);
            return true;
        }
    }
    delete(element) {
        if (this.nodes) {
            for (const node of this.nodes) {
                if (node.contains(element)) {
                    return node.delete(element);
                }
            }
            return false;
        }
        else {
            const index = this.elements.indexOf(element);
            if (index == -1)
                return false;
            this.elements.splice(index, 1);
            return true;
        }
    }
    forEach(cons, thisArg) {
        if (this.nodes) {
            this.nodes[0].forEach(cons, thisArg);
            this.nodes[1].forEach(cons, thisArg);
            this.nodes[2].forEach(cons, thisArg);
            this.nodes[3].forEach(cons, thisArg);
        }
        else {
            for (let i = 0; i < this.elements.length; i++) {
                cons.call(thisArg, this.elements[i]);
            }
        }
    }
    intersect(rect, cons) {
        if (this.nodes) {
            if (Intersector.rectsIntersect(this.nodes[0].span, rect))
                this.nodes[0].intersect(rect, cons);
            if (Intersector.rectsIntersect(this.nodes[1].span, rect))
                this.nodes[1].intersect(rect, cons);
            if (Intersector.rectsIntersect(this.nodes[2].span, rect))
                this.nodes[2].intersect(rect, cons);
            if (Intersector.rectsIntersect(this.nodes[3].span, rect))
                this.nodes[3].intersect(rect, cons);
        }
        else {
            for (let i = 0; i < this.elements.length; i++) {
                if (Intersector.pointInRect(this.elements[i].pos.pixel, rect))
                    cons(this.elements[i]);
            }
        }
    }
    contains(el) {
        return Intersector.pointInRect(el.pos.pixel, this.span);
    }
    display() {
        Gfx.fillColor(`hsl(${(this.depth - 1) * 35}, 100%, 50%)`);
        Gfx.rect(...this.span.map(a => a * QuadTree.displayScale));
        Gfx.strokeColor("white");
        Gfx.lineRect(...this.span.map(a => a * QuadTree.displayScale));
        if (this.nodes) {
            for (const node of this.nodes)
                node.display();
        }
        else {
            Gfx.fillColor("blue");
            for (const el of this.elements) {
                Gfx.ellipse(...el.pos.pixel.map(a => a * QuadTree.displayScale), 2.5, 2.5);
            }
        }
    }
    static setShowcaseMode() {
        let tree = new QuadTree([0, 0, 300, 180]);
        cancelAnimationFrame(Game.animationFrame);
        Gfx.layer("overlay");
        Gfx.fillColor("black");
        Gfx.rect(0, 0, innerWidth, innerHeight);
        tree.display();
        scenes[Game.sceneName].onmousedown = () => {
            tree.add({
                pos: Pos.fromPixelCoords(...Input.mouse.map(a => a / QuadTree.displayScale))
            });
            tree.display();
        };
    }
}
QuadTree.maxItems = 64;
QuadTree.maxDepth = 8;
QuadTree.displayScale = 4;
class QuadTreeI extends QuadTree {
    constructor() {
        super([-Infinity, -Infinity, Infinity, Infinity]);
        this.nodes = [];
    }
    static getRegion(pos) {
        return [
            Math.floor(pos.pixelX / this.regionSize[0]) * this.regionSize[0],
            Math.floor(pos.pixelY / this.regionSize[1]) * this.regionSize[1],
            ...this.regionSize
        ];
    }
    add(element) {
        if (super.add(element))
            return true;
        const node = new QuadTree(QuadTreeI.getRegion(element.pos), 1);
        this.nodes.push(node);
        return node.add(element);
    }
    forEach(cons, thisArg) {
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].forEach(cons, thisArg);
        }
    }
    intersect(rect, cons) {
        for (let i = 0; i < this.nodes.length; i++) {
            if (Intersector.rectsIntersect(this.nodes[i].span, rect))
                this.nodes[i].intersect(rect, cons);
        }
    }
}
QuadTreeI.regionSize = [3840, 3840];
class Random {
    constructor(_rand) {
        this._rand = _rand;
    }
    int(arg0, arg1) {
        if (arg1)
            return Math.floor(this._rand() * (arg1 + 1 - arg0) + arg0);
        else
            return Math.floor(this._rand() * (arg0 + 1));
    }
    num(arg0, arg1) {
        if (arg1)
            return this._rand() * (arg1 - arg0) + arg0;
        else
            return this._rand() * arg0;
    }
    chance(probability) {
        return this._rand() < probability;
    }
    vec(length) {
        const theta = this.num(Mathf.TWO_PI);
        return [length * Math.cos(theta), length * Math.sin(theta)];
    }
    item(input) {
        return input[Math.floor(this._rand() * input.length)];
    }
}
class PseudoRandom extends Random {
    constructor(seed) {
        super(null);
        this.seed = seed;
        this.value = seed + 11111111111111;
        this._rand = () => {
            this.value = this.value * 16807 % 16777216;
            return this.value / 16777216;
        };
    }
    reset() {
        this.value = this.seed + 11111111111111;
    }
}
const Rand = new Random(Math.random);
