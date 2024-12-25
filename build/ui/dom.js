/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { Buildings } from "../content/content.js";
import { bundle } from "../content/i18n.js";
import { SaveIO } from "../game-funcs.js";
import { objectives } from "../objectives.js";
import { getElement, safeToSave, saveToLocalStorage, selectID } from "../util/funcs.js";
import { Game } from "../vars.js";
import { Camera } from "./graphics.js";
import { GUI } from "./gui.js";
import { Input, keybinds } from "./input.js";
import { scenes } from "./scenes.js";
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
export function registerEventHandlers() {
    const { clickcapture } = DOM;
    window.onmousemove = (e) => {
        Input.mouseX = e.x;
        Input.mouseY = e.y;
        Input.latestMouseEvent = e;
    };
    clickcapture.onmousedown = (e) => {
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
    window.onmouseup = (e) => {
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
    clickcapture.addEventListener("touchstart", (e) => {
        e.x = e.touches[0].clientX;
        e.y = e.touches[0].clientY;
        e.button = 0;
        clickcapture.onmousedown?.(e);
    });
    clickcapture.addEventListener("touchend", (e) => {
        e.x = e.changedTouches[0].clientX;
        e.y = e.changedTouches[0].clientY;
        e.button = 0;
        setTimeout(() => {
            clickcapture.onmouseup?.(e);
        }, 250);
    });
    clickcapture.addEventListener("touchmove", (e) => {
        e.x = e.touches[0].clientX;
        e.y = e.touches[0].clientY;
        window.onmousemove?.(e);
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
            for (let section of Object.values(keybinds)) {
                for (let keybind of Object.values(section)) {
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
        let file = event.target?.files?.[0];
        if (!file)
            return;
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = e => {
            let content = e.target?.result?.toString();
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
    DOM.objectiveTitle.addEventListener("click", () => {
        const objective = objectives.objectives.find(o => o.satisfied && !o.completed);
        objective?.tryComplete();
    });
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
