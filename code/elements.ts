const ctx = (document.getElementById("canvas") as HTMLCanvasElement).getContext("2d")!;//Tiles
const ctx1 = (document.getElementById("canvas1") as HTMLCanvasElement).getContext("2d")!;//Ghost buildings
const ctx2 = (document.getElementById("canvas2") as HTMLCanvasElement).getContext("2d")!;//Buildings
const ctx25 = (document.getElementById("canvas25") as HTMLCanvasElement).getContext("2d")!;//Overlay builds
const ctx3 = (document.getElementById("canvas3") as HTMLCanvasElement).getContext("2d")!;//Items
const ctx4 = (document.getElementById("canvas4") as HTMLCanvasElement).getContext("2d")!;//Overlays
const ctxs = [ctx, ctx1, ctx2, ctx25, ctx3, ctx4];
const uploadButton = document.getElementById('uploadButton')! as HTMLInputElement;
let alertmessage = document.getElementById("alertmessage")!;
let alertexit = document.getElementById("alertexit")!;
let alertbox = document.getElementById("alertbox")!;
const toolbarEl = document.getElementById("toolbar")!;
const clickcapture = document.getElementById("clickcapture")!;
const errorBackground = document.getElementById("error_background")!;
const loadingBackground = document.getElementById("loading_background")!;
const resourcesEl = document.getElementById("resources")!;

for(let element of toolbarEl.children){
	element.addEventListener("click", (event) => {
		for(let x of toolbarEl.children){
			x.classList.remove("selected");
		}
		(event.target as HTMLImageElement).classList.add("selected");
		placedBuilding.type = (event.target as HTMLImageElement).id as RawBuildingID;
		mouse.held = false;
	});
}


alertexit.onclick = (e) => {
	alertbox.classList.remove("active");
	alerts.active = false;
}