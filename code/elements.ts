const ctxTiles = getElement("canvas0", HTMLCanvasElement).getContext("2d")!;
const ctxTilesOver = getElement("canvas1", HTMLCanvasElement).getContext("2d")!;//Tiles
const ctxGBuilds = getElement("canvas2", HTMLCanvasElement).getContext("2d")!;//Ghost buildings
const ctxBuildsUnder = getElement("canvas3", HTMLCanvasElement).getContext("2d")!;//Under buildings
const ctxBuilds = getElement("canvas4", HTMLCanvasElement).getContext("2d")!;//Buildings
const ctxOBuilds = getElement("canvas5", HTMLCanvasElement).getContext("2d")!;//Overlay builds
const ctxItems = getElement("canvas6", HTMLCanvasElement).getContext("2d")!;//Items
const ctxEffects = getElement("canvas7", HTMLCanvasElement).getContext("2d")!;//Effects
const ctxOverlays = getElement("canvas8", HTMLCanvasElement).getContext("2d")!;//Overlays
const ctx___ = getElement("canvas9", HTMLCanvasElement).getContext("2d")!;//Unused
const ctxs = [ctxTiles, ctxTilesOver, ctxGBuilds, ctxBuildsUnder, ctxBuilds, ctxOBuilds, ctxItems, ctxEffects, ctxOverlays, ctx___];
const uploadButton = getElement("uploadButton", HTMLInputElement);
const alertmessage = getElement("alertmessage", HTMLDivElement);
const alertexit = getElement("alertexit", HTMLDivElement);
const alertbox = getElement("alertbox", HTMLDivElement);
const tooltipbox = getElement("tooltipbox", HTMLDivElement);
const toolbarEl = getElement("toolbar", HTMLDivElement);
const toolbarIcons = [...toolbarEl.children];
const clickcapture = getElement("clickcapture", HTMLDivElement);
const errorBackground = getElement("error_background", HTMLDivElement);
const loadingBackground = getElement("loading_background", HTMLDivElement);
const gameBackground = getElement("game_background", HTMLDivElement);
const resourcesEl = getElement("resources", HTMLDivElement);
const texturesDiv = getElement("textures", HTMLDivElement);
