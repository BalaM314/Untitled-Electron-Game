var ItemID;
(function (ItemID) {
    ItemID[ItemID["base:null"] = 0] = "base:null";
    ItemID[ItemID["base:coal"] = 1] = "base:coal";
    ItemID[ItemID["base:iron"] = 2] = "base:iron";
})(ItemID || (ItemID = {}));
const rands = {
    x_prime: 1299689,
    y_prime: 1156709,
    hill_x: 89,
    hill_y: 11,
};
let Game = {
    scroll: {
        x: -300,
        y: -300
    }
};
class ChunkedDataStorage {
    constructor(seed) {
        this.storage = new Map();
        this.seed = seed ? seed : 0;
        this.format = consts.VERSION;
    }
    getChunk(tileX, tileY) {
        if (this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`)) {
            return this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`);
        }
        else {
            return this.generateChunk(Math.floor(tileX / consts.CHUNK_SIZE), Math.floor(tileY / consts.CHUNK_SIZE));
        }
    }
    generateChunk(x, y) {
        this.storage.set(`${x},${y}`, new Chunk(x, y, this.seed)
            .generate());
        console.log(`generated chunk ${x}, ${y}`);
        return this.storage.get(`${x},${y}`);
    }
    tileAt(pixelX, pixelY) {
        return this.getChunk(Math.floor(pixelX / consts.TILE_SIZE), Math.floor(pixelY / consts.TILE_SIZE)).tileAt(tileToChunk(pixelX / consts.TILE_SIZE), tileToChunk(pixelY / consts.TILE_SIZE));
    }
    tileAt2(tileX, tileY) {
        return this.getChunk(Math.floor(tileX / consts.CHUNK_SIZE), Math.floor(tileY / consts.CHUNK_SIZE)).tileAt(tileToChunk(tileX), tileToChunk(tileY));
    }
    writeTile(tileX, tileY, tile) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setTile(tileToChunk(tileX), tileToChunk(tileY), tile);
            return true;
        }
        return false;
    }
}
class Level extends ChunkedDataStorage {
    constructor(seed) {
        super(seed);
        this.items = [];
        this.buildings = [];
    }
    buildingIDAt(pixelX, pixelY) {
        return this.getChunk(Math.floor(pixelX / consts.TILE_SIZE), Math.floor(pixelY / consts.TILE_SIZE)).buildingAt(tileToChunk(pixelX / consts.TILE_SIZE), tileToChunk(pixelY / consts.TILE_SIZE));
    }
    addItem(x, y, id) {
        let tempitem = new Item(x, y, id, this);
        this.items.push(tempitem);
        return tempitem;
    }
    update() {
        for (var item of this.items) {
            item.update();
        }
    }
    displayGhostBuilding(tileX, tileY, buildingID) {
        this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, true);
    }
    writeBuilding(tileX, tileY, buildingID) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID);
            return true;
        }
        return false;
    }
    buildBuilding(tileX, tileY, building) {
        if (this.getChunk(tileX, tileY)) {
            let tempBuilding = new building(); //because eventually we'll have different building classes ex; class Furnace extends Building; not sure if ts supports this
            this.buildings.push(tempBuilding);
            this.getChunk(tileX, tileY).setBuilding(tileToChunk(tileX), tileToChunk(tileY), tempBuilding.id);
            return true;
        }
        return false;
    }
    display(debug, _ctx) {
        _ctx = _ctx !== null && _ctx !== void 0 ? _ctx : ctx;
        //Currently we will just display every chunk that exists. Obviously this is not sustainable.
        for (var chunk of this.storage.values()) {
            chunk.display(true);
        }
        for (let item of this.items) {
            item.display(debug);
        }
    }
}
class Chunk {
    constructor(x, y, seed) {
        this.x = x;
        this.y = y;
        this.seed = seed;
        this.chunkSeed = Math.abs(Math.round((x * rands.x_prime) +
            (y * rands.y_prime) +
            (Math.pow(seed % 32, (x + y) % 10) % 16384) +
            Math.pow(seed, 4) +
            123456789
                % 2147483648));
        this.layers = [
            null,
            null,
            null //Reserved
        ];
        this.layers[0] = [];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[0][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[0][x].push(0xFF);
            }
        }
        this.layers[1] = [];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[1][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[1][x].push(0xFFFF);
            }
        }
        this.layers[2] = [];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[2][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[2][x].push(null);
            }
        }
        this.chunkSeed = Math.abs(Math.round((this.x * rands.x_prime) +
            (this.y * rands.y_prime) +
            (Math.pow(this.seed % 32, (this.x + this.y) % 10) % 16384) +
            Math.pow(this.seed, 4) +
            123456789
                % 2147483648)); //did I pull this out of my butt? yes.
        return this;
    }
    generate() {
        //Put down the base
        for (var row in this.layers[0]) {
            for (var tile in this.layers[0][row]) {
                this.layers[0][row][tile] = 0x00;
            }
        }
        this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x02);
        this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
        this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
        this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, 0x01);
        this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, 0x01);
        this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 4 > 1) ? 0x01 : 0x00);
        this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 8 > 3) ? 0x01 : 0x00);
        this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 16 > 7) ? 0x01 : 0x00);
        this.setTile((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 32 > 15) ? 0x01 : 0x00);
        return this;
    }
    update() {
        return this;
    }
    tileAt(x, y) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.layers[0]) === null || _a === void 0 ? void 0 : _a[y]) === null || _b === void 0 ? void 0 : _b[x]) !== null && _c !== void 0 ? _c : null;
    }
    buildingAt(x, y) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.layers[1]) === null || _a === void 0 ? void 0 : _a[y]) === null || _b === void 0 ? void 0 : _b[x]) !== null && _c !== void 0 ? _c : null;
    }
    setTile(x, y, tile) {
        if (this.tileAt(x, y) == null) {
            return false;
        }
        this.layers[0][y][x] = tile;
        return true;
    }
    setBuilding(x, y, buildingId) {
        if (this.tileAt(x, y) == null) {
            return false;
        }
        this.layers[1][y][x] = buildingId;
        return true;
    }
    displayToConsole() {
        console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
        console.table(this.layers[0]);
    }
    display(debug) {
        for (var y in this.layers[0]) {
            for (var x in this.layers[0][y]) {
                this.displayTile(parseInt(x), parseInt(y));
                this.displayBuilding(parseInt(x), parseInt(y), this.buildingAt(parseInt(x), parseInt(y)));
            }
        }
        if (debug) {
            overlayCtx.strokeStyle = "#0000FF";
            overlayCtx.strokeRect(this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE - Game.scroll.x, this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE - Game.scroll.y, consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE, consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE);
        }
    }
    displayTile(x, y) {
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE - Game.scroll.x;
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE - Game.scroll.y;
        switch (this.tileAt(x, y)) {
            case 0x00:
                ctx.fillStyle = "#00CC33";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                break;
            case 0x01:
                ctx.fillStyle = "#008822";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                break;
            case 0x02:
                ctx.fillStyle = "#22222";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                break;
            case 0xFF:
                ctx.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.fillStyle = "#000000";
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                break;
        }
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
    }
    displayBuilding(x, y, buildingID, isGhost) {
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE - Game.scroll.x;
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE - Game.scroll.y;
        ctx.strokeStyle = isGhost ? "#888888" : "#000000";
        switch (buildingID) {
            case 0x0001:
                ctx.beginPath();
                ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                ctx.stroke();
                break;
            case 0x0101:
                ctx.beginPath();
                ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
                ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
                ctx.stroke();
                break;
            case 0x0201:
                ctx.beginPath();
                ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
                ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
                ctx.stroke();
                break;
            case 0x0301:
                ctx.beginPath();
                ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
                ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
                ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
                ctx.stroke();
                break;
        }
    }
}
class Item {
    constructor(x, y, id, level) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.level = level;
    }
    update() {
        if (this.level.buildingIDAt(this.x, this.y) % 0x100 == 0x01) { //this is basically bit math that says "is the last byte == 01". In other words, "Is this item on a conveyor?"
            switch (this.level.buildingIDAt(this.x, this.y) >> 8) { //bit masks ftw, this just grabs the first byte
                //yes I know there's no need to write the ids in hex but why the heck not
                case 0x00:
                    this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    this.x += consts.buildings.conveyor.SPEED;
                    break;
                case 0x01:
                    this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    this.y += consts.buildings.conveyor.SPEED;
                    break;
                case 0x02:
                    this.x -= consts.buildings.conveyor.SPEED;
                    this.y = (Math.floor(this.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    break;
                case 0x03:
                    this.x = (Math.floor(this.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE / 2;
                    this.y -= consts.buildings.conveyor.SPEED;
                    break;
                case 0x04:
                    break;
                case 0x05:
                    break;
                case 0x06:
                    break;
                case 0x07:
                    break;
                case 0x08:
                    break;
                case 0x09:
                    break;
                case 0x0A:
                    break;
                case 0x0B:
                    break;
            }
        }
    }
    display(debug, _ctx) {
        _ctx = _ctx !== null && _ctx !== void 0 ? _ctx : ctx;
        switch (this.id) {
            case ItemID["base:null"]:
                ctx.fillStyle = "#FF00FF";
                break;
            case ItemID["base:coal"]:
                ctx.fillStyle = "#000000";
                break;
            case ItemID["base:iron"]:
                ctx.fillStyle = "#663300";
                break;
        }
        _ctx.fillRect((this.x * consts.DISPLAY_SCALE) - 5 - Game.scroll.x, (this.y * consts.DISPLAY_SCALE) - 5 - Game.scroll.y, 10, 10);
    }
}
class Building {
    constructor(tileX, tileY, id) {
        this.x = tileX;
        this.y = tileY;
        this.id = id;
    }
}
