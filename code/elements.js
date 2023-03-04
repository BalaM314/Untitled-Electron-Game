"use strict";
const ctxTiles = getElement("canvas", HTMLCanvasElement).getContext("2d");
const ctxGBuilds = getElement("canvas1", HTMLCanvasElement).getContext("2d");
const ctxBuilds = getElement("canvas2", HTMLCanvasElement).getContext("2d");
const ctxOBuilds = getElement("canvas25", HTMLCanvasElement).getContext("2d");
const ctxItems = getElement("canvas3", HTMLCanvasElement).getContext("2d");
const ctxOverlays = getElement("canvas4", HTMLCanvasElement).getContext("2d");
const ctxs = [ctxTiles, ctxGBuilds, ctxBuilds, ctxOBuilds, ctxItems, ctxOverlays];
const uploadButton = getElement('uploadButton', HTMLInputElement);
let alertmessage = getElement("alertmessage", HTMLDivElement);
let alertexit = getElement("alertexit", HTMLDivElement);
let alertbox = getElement("alertbox", HTMLDivElement);
const toolbarEl = getElement("toolbar", HTMLDivElement);
const clickcapture = getElement("clickcapture", HTMLDivElement);
const errorBackground = getElement("error_background", HTMLDivElement);
const loadingBackground = getElement("loading_background", HTMLDivElement);
const resourcesEl = getElement("resources", HTMLDivElement);
const texturesDiv = getElement("textures", HTMLDivElement);
for (let element of toolbarEl.children) {
    element.addEventListener("click", (event) => {
        if (event.target instanceof HTMLImageElement) {
            for (let x of toolbarEl.children) {
                x.classList.remove("selected");
            }
            event.target.classList.add("selected");
            placedBuilding.type = event.target.id;
            mouse.held = false;
        }
    });
}
alertexit.onclick = (e) => {
    alertbox.classList.remove("active");
    alerts.active = false;
};
