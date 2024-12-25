/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
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
export function typeMatches(a, b) {
    if (a === null)
        return b === null;
    if (a === undefined)
        return b === undefined;
    return typeof a === typeof b;
}
export function importObject(base, ext) {
    for (const [k, v] of Object.entries(base)) {
        if (k in ext && typeMatches(ext[k], v)) {
            if (typeof v === "object" && v != null) {
                importObject(v, ext[k]);
            }
            else
                base[k] = ext[k];
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
