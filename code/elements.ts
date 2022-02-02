const ctx = (document.getElementById("canvas") as HTMLCanvasElement).getContext("2d");//Tiles
const ctx1 = (document.getElementById("canvas1") as HTMLCanvasElement).getContext("2d");//Ghost buildings
const ctx2 = (document.getElementById("canvas2") as HTMLCanvasElement).getContext("2d");//Buildings
const ctx25 = (document.getElementById("canvas25") as HTMLCanvasElement).getContext("2d");//Extractors
const ctx3 = (document.getElementById("canvas3") as HTMLCanvasElement).getContext("2d");//Items
const ctx4 = (document.getElementById("canvas4") as HTMLCanvasElement).getContext("2d");//Overlays
const ctxs = [ctx, ctx1, ctx2, ctx25, ctx3, ctx4];
const uploadButton = document.getElementById('uploadButton')! as HTMLInputElement;
let alertmessage = document.getElementById("alertmessage");
let alertexit = document.getElementById("alertexit");
let alertbox = document.getElementById("alertbox");

for(let element of document.getElementById("textures").children){
	element.addEventListener("load", () => {
		loadedtextures ++;
	});
	element.addEventListener("error", (err) => {
		alert("Failed to load texture " + (err.target as HTMLImageElement).src.split("assets/textures/")[1]);
		throw err;
	});
}

for(let element of document.getElementById("toolbar").children){
	element.addEventListener("click", (event) => {
		for(let x of document.getElementById("toolbar").children){
			x.classList.remove("selected");
		}
		(event.target as HTMLImageElement).classList.add("selected");
		placedBuilding.type = parseInt((event.target as HTMLImageElement).id) as RawBuildingID;
		mouse.held = false;
	});
}


alertexit.onclick = (e) => {
	alertbox.classList.remove("active");
	alerts.active = false;
}