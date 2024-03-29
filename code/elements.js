"use strict";
const ctxTiles = getElement("canvas0", HTMLCanvasElement).getContext("2d");
const ctxTilesOver = getElement("canvas1", HTMLCanvasElement).getContext("2d");
const ctxBuildsUnder = getElement("canvas2", HTMLCanvasElement).getContext("2d");
const ctxBuilds = getElement("canvas3", HTMLCanvasElement).getContext("2d");
const ctxOBuilds = getElement("canvas4", HTMLCanvasElement).getContext("2d");
const ctxGBuilds = getElement("canvas5", HTMLCanvasElement).getContext("2d");
const ctxItems = getElement("canvas6", HTMLCanvasElement).getContext("2d");
const ctxEffects = getElement("canvas7", HTMLCanvasElement).getContext("2d");
const ctxOverlays = getElement("canvas8", HTMLCanvasElement).getContext("2d");
const ctx___ = getElement("canvas9", HTMLCanvasElement).getContext("2d");
const ctxs = [ctxTiles, ctxTilesOver, ctxGBuilds, ctxBuildsUnder, ctxBuilds, ctxOBuilds, ctxItems, ctxEffects, ctxOverlays, ctx___];
const uploadButton = getElement("uploadButton", HTMLInputElement);
const alertmessage = getElement("alertmessage", HTMLDivElement);
const alertexit = getElement("alertexit", HTMLDivElement);
const alertbox = getElement("alertbox", HTMLDivElement);
const tooltipbox = getElement("tooltipbox", HTMLDivElement);
const toolbarEl = getElement("toolbar", HTMLDivElement);
const clickcapture = getElement("clickcapture", HTMLDivElement);
const errorBackground = getElement("error_background", HTMLDivElement);
const loadingBackground = getElement("loading_background", HTMLDivElement);
const gameBackground = getElement("game_background", HTMLDivElement);
const resourcesEl = getElement("resources", HTMLDivElement);
const hudtextEl = getElement("hudtext", HTMLDivElement);
const objectiveEl = getElement("objective", HTMLDivElement);
const objectiveTitle = getElement("objective-title", HTMLDivElement);
const objectiveText = getElement("objective-text", HTMLSpanElement);
const objectiveDescription = getElement("objective-description", HTMLDivElement);
const objectiveNextButton = getElement("objective-next-button", HTMLSpanElement);
const resourcesItems = {};
const texturesDiv = getElement("textures", HTMLDivElement);
const researchMenu = getElement("research-menu", HTMLDivElement);
const researchTree = getElement("research-tree", HTMLDivElement);
const buttonsPane = getElement("buttons-pane", HTMLDivElement);
const researchButton = getElement("research-button", HTMLSpanElement);
const settingsButton = getElement("settings-button", HTMLSpanElement);
const screenOverlay = getElement("screen-overlay", HTMLDivElement);
const creditsEl = getElement("credits-container", HTMLDivElement);
