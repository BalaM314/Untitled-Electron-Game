/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { Buildings } from "../content/content.js";
import { SaveIO } from "../game-funcs.js";
import { tech, objectives } from "../objectives.js";
import { DOM } from "../ui/dom.js";
import { Input } from "../ui/input.js";
import { Game } from "../vars.js";
import { Intersector } from "./geom.js";
export function sort2(array, func) {
    array.sort((a, b) => func(a) - func(b));
}
if (!Array.prototype.at) {
    Array.prototype.at = function (index) {
        return this[index < 0 ? index + this.length : index];
    };
    Object.defineProperty(Array.prototype, "at", {
        enumerable: false
    });
}
export function millis() {
    return (new Date()).valueOf() - Game.startTime.valueOf();
}
export function gcd(x, y) {
    if ((typeof x !== 'number') || (typeof y !== 'number')) {
        return 1;
    }
    x = Math.abs(x);
    y = Math.abs(y);
    while (y) {
        const t = y;
        y = x % y;
        x = t;
    }
    return x;
}
export function delay(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}
export function until(predicate, checkInterval = 100) {
    return new Promise((resolve, reject) => {
        const id = setInterval(() => {
            if (predicate()) {
                clearInterval(id);
                resolve();
            }
        }, checkInterval);
    });
}
export function round(amount, places = 0) {
    const tenEplaces = 10 ** places;
    return Math.round(amount * tenEplaces) / tenEplaces;
}
export function percentage(amount, places = 0) {
    return `${round(amount * 100, places)}%`;
}
export function range(start, end, step = 1) {
    return Array.from({ length: Math.floor((end - start + step) / step) }, (_, i) => start + i * step);
}
export function constrain(x, min, max) {
    if (x > max)
        return max;
    if (x < min)
        return min;
    return x;
}
export function linear_map(value, from1, from2, to1, to2) {
    return ((value - from1) / (from2 - from1)) * (to2 - to1) + to1;
}
export function assert(x, message) {
    if (!x)
        crash(message ? `Assertion failed: ${message}` : message);
}
export function download(filename, text) {
    const temp2 = document.createElement('a');
    temp2.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    temp2.setAttribute('download', filename);
    temp2.style.display = 'none';
    document.body.appendChild(temp2);
    temp2.click();
    document.body.removeChild(temp2);
}
export function parseError(err) {
    if (err instanceof Error) {
        return err.message;
    }
    else if (typeof err == "number" || typeof err == "string" || typeof err == "boolean") {
        return err.toString();
    }
    else
        return String(err);
}
export class Button {
    constructor(config) {
        if (config.x instanceof Function)
            Object.defineProperty(this, "x", { get: config.x });
        else
            this.x = config.x ?? 300;
        if (config.y instanceof Function)
            Object.defineProperty(this, "y", { get: config.y });
        else
            this.y = config.y ?? 300;
        if (config.width instanceof Function)
            Object.defineProperty(this, "width", { get: config.width });
        else
            this.width = config.width ?? 300;
        if (config.height instanceof Function)
            Object.defineProperty(this, "height", { get: config.height });
        else
            this.height = config.height ?? 300;
        if (config.label instanceof Function)
            Object.defineProperty(this, "label", { get: config.label });
        else
            this.label = config.label ?? "Button";
        this.color = config.color ?? "#0000FF";
        this.font = config.font ?? "20px sans-serif";
        this.onClick = config.onClick ?? (() => { });
    }
    display(_ctx) {
        _ctx.fillStyle = this.color;
        _ctx.strokeStyle = "#000000";
        _ctx.lineWidth = 2;
        _ctx.globalAlpha = 1.0;
        _ctx.fillRect(this.x, this.y, this.width, this.height);
        _ctx.strokeRect(this.x, this.y, this.width, this.height);
        if (this.isMouseInside()) {
            _ctx.fillStyle = "#FFFFFF";
            if (Input.mouseDown) {
                _ctx.globalAlpha = 0.4;
            }
            else {
                _ctx.globalAlpha = 0.2;
            }
            _ctx.lineWidth = 0;
            _ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        _ctx.lineWidth = 1;
        _ctx.globalAlpha = 1.0;
        _ctx.font = this.font;
        _ctx.textAlign = "center";
        const tempBaseline = _ctx.textBaseline;
        _ctx.textBaseline = "middle";
        _ctx.fillStyle = "#FFFFFF";
        if (typeof this.label == "string") {
            _ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
        }
        else {
            _ctx.drawImage(this.label.image, this.x, this.y, this.width, this.height);
        }
        _ctx.textBaseline = tempBaseline;
    }
    isMouseInside() {
        return Intersector.pointInRect([Input.mouseX, Input.mouseY], [this.x, this.y, this.width, this.height]);
    }
    handleMouseClick(e) {
        if (this.isMouseInside() && e.button == 0) {
            this.onClick(e);
        }
    }
}
export function Abstract(input, context) {
    return class __temp extends input {
        constructor(...args) {
            super(...args);
            if (this.constructor === __temp)
                crash(`Cannot construct abstract class ${input.name}`);
        }
    };
}
export function* pseudoRandom(seed) {
    let value = seed + 11111111111111;
    while (true) {
        value = value * 16807 % 16777216;
        const num = value / 16777216;
        yield {
            value: num,
            chance(amount) {
                return num < amount;
            }
        };
    }
    return null;
}
export function getElement(id, type) {
    const element = document.getElementById(id);
    if (element instanceof type)
        return element;
    else if (element instanceof HTMLElement)
        crash(`Element with id ${id} was fetched as type ${type.name}, but was of type ${element.constructor.name}`);
    else
        crash(`Element with id ${id} does not exist`);
}
export function forceType(input) {
}
export function crash(message = `Unreachable code was reached!`) {
    throw new Error(message);
}
export function tooltip(title, properties) {
    const props = [];
    if (Array.isArray(properties)) {
        props.push(...properties);
    }
    else {
        for (const [k, v] of Object.entries(properties)) {
            if (v && v.trim().length > 0) {
                if (k.startsWith("_"))
                    props.push(v.trim());
                else
                    props.push(`${k}: ${v.trim()}`);
            }
        }
    }
    return `${title}<div style="font-size: 70%;">${props.join("<br/>")}</div>`;
}
export function bindFunctionProperties(obj) {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v == "function" ? v.bind(obj) : v]));
}
export function firstUsePopup(key, message, callback, runCallbackAfterMessage = false) {
    const lsKey = `untitled-electron-game-${key}`;
    if (localStorage.getItem(lsKey) != null) {
        callback?.();
    }
    else {
        alert(message);
        localStorage.setItem(lsKey, "true");
        if (runCallbackAfterMessage)
            callback?.();
    }
}
export function saveExists() {
    return localStorage.getItem("save1") != null;
}
export function safeToSave() {
    if (!saveExists())
        return true;
    try {
        const data = JSON.parse(localStorage.getItem("save1"));
        assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
        return data.UntitledElectronGame.metadata.uuid == Game.level1.uuid || data.UntitledElectronGame.metadata.id == Game.level1.uuid;
    }
    catch (err) {
        return true;
    }
}
export function saveToLocalStorage() {
    localStorage.setItem("save1", JSON.stringify(SaveIO.export()));
    localStorage.setItem("untitled-electron-game:tech-tree", tech.write());
    localStorage.setItem("untitled-electron-game:objectives", objectives.write());
    Game.lastSaved = Date.now();
}
export function hex(num, length) {
    return `0x${(Array(length).fill("0").join("") + num.toString(16)).toUpperCase().slice(-length)}`;
}
export function stringifyMeta(buildingID, buildingMeta) {
    return `${buildingID}:${buildingMeta}`;
}
export function mapLegacyRawBuildingID(id) {
    switch (id) {
        case "0x01": return "base_conveyor";
        case "0x02": return "base_miner";
        case "0x03": return "base_trash_can";
        case "0x04": return "base_furnace";
        case "0x05": return "base_extractor";
        case "0x06": return "base_chest";
        case "0x07": return "base_alloy_smelter";
        case "0x08": return "base_resource_acceptor";
        case "0x09": return "base_wiremill";
        case "0x0A": return "base_compressor";
        case "0x0B": return "base_lathe";
        case "0x10": return "base_multiblock_secondary";
        case "0x11": return "base_assembler";
        case "0xFF": return "base_null";
    }
}
export function getLegacyRawBuildingID(buildingID) {
    return hex(+buildingID, 2);
}
export function makeRebindButton(y, keybind, buttonName, defaultKey) {
    return new Button({
        x: () => innerWidth * 0.3,
        y: () => innerHeight * y,
        width: () => innerWidth * 0.4,
        height: () => innerHeight * 0.05,
        label: () => `${buttonName}: ${keybind.modifiers
            .filter(key => !key.startsWith("!"))
            .map(el => el + " + ")
            .join("")}${keybind.mainKey}`,
        color: "#08F",
        font: "15px sans-serif",
        onClick: () => {
            keybind.mainKey =
                (prompt(`Rebind ${buttonName.toLowerCase()} to:`) ?? defaultKey).toLowerCase().substring(0, 1);
        }
    });
}
export function selectID(id) {
    const block = Buildings.getOpt(id);
    if (block && !block.unlocked())
        id = "base_null";
    Input.placedBuilding.type = id;
    const image = document.querySelector(`img#toolbar_${id}`);
    for (const icon of DOM.toolbarEl.children) {
        icon.classList.remove("selected");
    }
    if (image)
        image.classList.add("selected");
}
