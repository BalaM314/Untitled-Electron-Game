"use strict";
const ctx = document.getElementById("canvas").getContext("2d");
const ctx1 = document.getElementById("canvas1").getContext("2d");
const ctx2 = document.getElementById("canvas2").getContext("2d");
const ctx25 = document.getElementById("canvas25").getContext("2d");
const ctx3 = document.getElementById("canvas3").getContext("2d");
const ctx4 = document.getElementById("canvas4").getContext("2d");
const ctxs = [ctx, ctx1, ctx2, ctx25, ctx3, ctx4];
const uploadButton = document.getElementById('uploadButton');
let alertmessage = document.getElementById("alertmessage");
let alertexit = document.getElementById("alertexit");
let alertbox = document.getElementById("alertbox");
const toolbarEl = document.getElementById("toolbar");
const clickcapture = document.getElementById("clickcapture");
const errorBackground = document.getElementById("error_background");
const loadingBackground = document.getElementById("loading_background");
const resourcesEl = document.getElementById("resources");
for (let element of toolbarEl.children) {
    element.addEventListener("click", (event) => {
        for (let x of toolbarEl.children) {
            x.classList.remove("selected");
        }
        event.target.classList.add("selected");
        placedBuilding.type = event.target.id;
        mouse.held = false;
    });
}
alertexit.onclick = (e) => {
    alertbox.classList.remove("active");
    alerts.active = false;
};
