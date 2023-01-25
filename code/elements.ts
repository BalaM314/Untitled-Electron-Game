const ctx = getElement("canvas", HTMLCanvasElement).getContext("2d")!;//Tiles
const ctx1 = getElement("canvas1", HTMLCanvasElement).getContext("2d")!;//Ghost buildings
const ctx2 = getElement("canvas2", HTMLCanvasElement).getContext("2d")!;//Buildings
const ctx25 = getElement("canvas25", HTMLCanvasElement).getContext("2d")!;//Overlay builds
const ctx3 = getElement("canvas3", HTMLCanvasElement).getContext("2d")!;//Items
const ctx4 = getElement("canvas4", HTMLCanvasElement).getContext("2d")!;//Overlays
const ctxs = [ctx, ctx1, ctx2, ctx25, ctx3, ctx4];
const uploadButton = getElement('uploadButton', HTMLInputElement);
let alertmessage = getElement("alertmessage", HTMLDivElement);
let alertexit = getElement("alertexit", HTMLDivElement);
let alertbox = getElement("alertbox", HTMLDivElement);
const toolbarEl = getElement("toolbar", HTMLDivElement);
const clickcapture = getElement("clickcapture", HTMLDivElement);
const errorBackground = getElement("error_background", HTMLDivElement);
const loadingBackground = getElement("loading_background", HTMLDivElement);
const resourcesEl = getElement("resources", HTMLDivElement);
const texturesDivs = {
	item: getElement("item", HTMLDivElement),
	misc: getElement("misc", HTMLDivElement),
	tile: getElement("tile", HTMLDivElement),
	building: getElement("building", HTMLDivElement),
}

for(let element of toolbarEl.children){
	element.addEventListener("click", (event) => {
		if(event.target instanceof HTMLImageElement){
			for(let x of toolbarEl.children){
				x.classList.remove("selected");
			}
			event.target.classList.add("selected");
			placedBuilding.type = (event.target as HTMLImageElement).id as RawBuildingID;
			mouse.held = false;
		}
	});
}


alertexit.onclick = (e) => {
	alertbox.classList.remove("active");
	alerts.active = false;
};