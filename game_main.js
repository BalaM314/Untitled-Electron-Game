const consts = {
    VERSION: "alpha 0.0.0",
    CHUNK_SIZE: 16,
    TILE_SIZE: 30
};
var settings = {};
let level1 = new ChunkedDataStorage(314);
level1.generateChunk(0, 0);
// level1.generateChunk(1, 0);
// level1.generateChunk(0, 1);
// level1.generateChunk(-1, 0);
// level1.generateChunk(0, -1);
