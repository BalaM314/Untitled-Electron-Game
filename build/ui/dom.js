/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { getElement } from "../util/funcs.js";
import { Game } from "../vars.js";
import { Camera } from "./camera.js";
import { bundle } from "../content/i18n.js";
export const CTX = (d => Object.fromEntries(Object.entries(d).map(([k, id]) => [k, getElement(id, HTMLCanvasElement).getContext("2d")])))({
    tiles: "canvas0",
    tilesOver: "canvas1",
    buildsUnder: "canvas2",
    builds: "canvas3",
    oBuilds: "canvas4",
    gBuilds: "canvas5",
    items: "canvas6",
    effects: "canvas7",
    overlays: "canvas8",
    ___: "canvas9",
});
export const DOM = {
    uploadButton: getElement("uploadButton", HTMLInputElement),
    alertmessage: getElement("alertmessage", HTMLDivElement),
    alertexit: getElement("alertexit", HTMLDivElement),
    alertbox: getElement("alertbox", HTMLDivElement),
    tooltipbox: getElement("tooltipbox", HTMLDivElement),
    toolbarEl: getElement("toolbar", HTMLDivElement),
    clickcapture: getElement("clickcapture", HTMLDivElement),
    errorBackground: getElement("error_background", HTMLDivElement),
    loadingBackground: getElement("loading_background", HTMLDivElement),
    gameBackground: getElement("game_background", HTMLDivElement),
    resourcesEl: getElement("resources", HTMLDivElement),
    hudtextEl: getElement("hudtext", HTMLDivElement),
    objectiveEl: getElement("objective", HTMLDivElement),
    objectiveTitle: getElement("objective-title", HTMLDivElement),
    objectiveText: getElement("objective-text", HTMLSpanElement),
    objectiveDescription: getElement("objective-description", HTMLDivElement),
    objectiveNextButton: getElement("objective-next-button", HTMLSpanElement),
    resourcesItems: {},
    texturesDiv: getElement("textures", HTMLDivElement),
    researchMenu: getElement("research-menu", HTMLDivElement),
    researchTree: getElement("research-tree", HTMLDivElement),
    buttonsPane: getElement("buttons-pane", HTMLDivElement),
    researchButton: getElement("research-button", HTMLSpanElement),
    settingsButton: getElement("settings-button", HTMLSpanElement),
    screenOverlay: getElement("screen-overlay", HTMLDivElement),
    creditsEl: getElement("credits-container", HTMLDivElement),
};
export async function registerEventHandlers() {
    const { scenes } = await import("./scenes.js");
    const { GUI } = await import("./gui.js");
    const { Buildings } = await import("../content/content.js");
    const { safeToSave, SaveIO, saveToLocalStorage, selectID } = await import("../game-funcs.js");
    const { clickcapture } = DOM;
    const { Input, keybinds } = await import("./input.js");
    const { completeObjective } = await import("../game-funcs.js");
    const onmousemove = (e) => {
        Input.mouseX = e.x;
        Input.mouseY = e.y;
        Input.latestMouseEvent = e;
    };
    const onmousedown = (e) => {
        Input.mouseX = e.x;
        Input.mouseY = e.y;
        Input.latestMouseEvent = e;
        if (e.button)
            e.preventDefault();
        if (e.button === 0) {
            Input.mouseDown = true;
            Input.buildingPlaced = false;
        }
        else if (e.button === 2) {
            Input.rightMouseDown = true;
        }
        if (scenes[Game.sceneName] && Input.active) {
            scenes[Game.sceneName]?.onmousedown?.(e);
        }
    };
    const onmouseup = (e) => {
        Input.mouseX = e.x;
        Input.mouseY = e.y;
        Input.latestMouseEvent = e;
        if (e.button == 0) {
            Input.mouseDown = false;
        }
        else if (e.button == 2) {
            Input.rightMouseDown = false;
        }
        Input.buildingPlaced = false;
    };
    window.onmousemove = onmousemove;
    clickcapture.onmousedown = onmousedown;
    window.onmouseup = onmouseup;
    clickcapture.addEventListener("touchstart", (e) => {
        onmousedown({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            button: 0,
            preventDefault() { },
        });
    });
    clickcapture.addEventListener("touchend", (e) => {
        setTimeout(() => {
            onmouseup({
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY,
                button: 0,
                preventDefault() { },
            });
        }, 250);
    });
    clickcapture.addEventListener("touchmove", (e) => {
        onmousemove({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            button: 0,
            preventDefault() { },
        });
    });
    clickcapture.oncontextmenu = (e) => {
        e.preventDefault();
    };
    window.onkeydown = (e) => {
        if ((e.ctrlKey && e.key.match(/^[wertuniWERTUNIK1234567890!@#$%^&*()=-]$/)) || e.key.match(/^f(5|11)$/i)) {
            return;
        }
        e.preventDefault();
        Input.keysHeld.add(e.key.toLowerCase());
        Input.lastKeysPressed.push(e.key);
        Input.lastKeysPressed.shift();
        if (Input.active) {
            for (const section of Object.values(keybinds)) {
                for (const keybind of Object.values(section)) {
                    keybind.check(e);
                }
            }
        }
        if (scenes[Game.sceneName]) {
            scenes[Game.sceneName]?.onkeydown?.(e);
        }
    };
    window.onkeyup = (e) => {
        Input.keysHeld.delete(e.key.toLowerCase());
    };
    DOM.uploadButton.onchange = (event) => {
        const file = event.target?.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = e => {
            const content = e.target?.result?.toString();
            if (content == null)
                return;
            SaveIO.import(content);
        };
    };
    window.onwheel = (e) => {
        if (!Game.paused && Input.active) {
            Camera.zoom(Math.pow(1.001, -e.deltaY));
        }
    };
    window.onblur = () => {
        Input.keysHeld.clear();
        Input.mouseDown = false;
    };
    window.onbeforeunload = (e) => {
        if (Game.sceneName != "game") {
            return;
        }
        if (safeToSave()) {
            saveToLocalStorage();
        }
        else {
            e.preventDefault();
            e.returnValue = "";
            localStorage.setItem("save-recovered", JSON.stringify(SaveIO.export()));
            setTimeout(() => {
                if (confirm("Could not save automatically on page exit because your current world is unrelated to your saved world.\nWould you like to save anyway? This will overwrite your current save!")) {
                    saveToLocalStorage();
                    localStorage.removeItem("save-recovered");
                }
            }, 1);
        }
    };
    for (const block of Buildings) {
        if (block.hidden)
            continue;
        const img = document.createElement("img");
        img.src = `assets/textures/building/${block.id}!0.png`;
        img.id = "toolbar_" + block.id;
        img.addEventListener("drag", () => {
            GUI.alert(`Place a building by clicking it in the toolbar, then clicking again where you want the building to go.`);
        });
        img.title = [bundle.get(`building.${block.id}.name`), bundle.get(`building.${block.id}.description`)].filter(Boolean).join("\n");
        img.addEventListener("click", () => {
            selectID(block.id);
            Input.mouseDown = false;
        });
        DOM.toolbarEl.appendChild(img);
    }
    DOM.objectiveTitle.addEventListener("click", () => completeObjective());
    DOM.alertexit.onclick = GUI.closeAlert;
}
export function setCanvasSizes() {
    for (const ctx of Object.values(CTX)) {
        if (ctx.canvas.width != window.innerWidth) {
            ctx.canvas.width = window.innerWidth;
            Game.forceRedraw = true;
        }
        if (ctx.canvas.height != window.innerHeight) {
            ctx.canvas.height = window.innerHeight;
            Game.forceRedraw = true;
        }
    }
}
