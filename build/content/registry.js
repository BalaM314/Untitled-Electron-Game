/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { tech } from "../objectives.js";
import { crash } from "../util/funcs.js";
export class Content {
    constructor(id) {
        this.id = id;
        this.constructor._id ??= 0;
        this.nid = this.constructor._id++;
    }
}
export class ContentRegistryC {
    constructor() {
        this.contentMap = new Map();
    }
    register(id, ctor, props = {}) {
        let clazz = Object.assign(class extends ctor {
        }, {
            ...props, id
        });
        if ("node" in clazz)
            clazz.node = tech.getOpt(`building_${id}`);
        this.contentMap.set(id, clazz);
        return clazz;
    }
    get(id) {
        return this.contentMap.get(id) ?? crash(`Object with id ${id} does not exist.`);
    }
    getOpt(id) {
        return this.contentMap.get(id) ?? null;
    }
    [Symbol.iterator]() {
        return this.contentMap.values();
    }
    keys() {
        return Array.from(this.contentMap.keys());
    }
}
export class ContentRegistryI {
    constructor() {
        this.stringContentMap = new Map();
        this.numberContentMap = [];
    }
    register(content) {
        this.stringContentMap.set(content.id, content);
        this.numberContentMap[content.nid] = content;
    }
    get(id) {
        if (typeof id == "number")
            return this.numberContentMap[id] ?? crash(`No content with id ${id} exists.`);
        else if (id == null)
            return null;
        else
            return this.stringContentMap.get(id) ?? crash(`No content with id ${id} exists.`);
    }
}
export class Fluid extends Content {
    constructor(id, color) {
        super(id);
        this.color = color;
    }
    static merge(from, to, maxThroughput = Infinity) {
        if (from[0] == null || from[1] == 0)
            return 0;
        if (to[0] === null)
            to[0] = from[0];
        else if (from[0] !== to[0])
            return 0;
        const remainingSpace = to[2] - to[1];
        const amountTransferred = Math.min(remainingSpace, from[1], maxThroughput);
        from[1] -= amountTransferred;
        to[1] += amountTransferred;
        return amountTransferred;
    }
    static fill(stack, type, amount) {
        if (type == null || amount == 0)
            return 0;
        if (stack[0] === null)
            stack[0] = type;
        else if (stack[0] !== type)
            return 0;
        const remainingSpace = stack[2] - stack[1];
        const amountTransferred = Math.min(remainingSpace, amount);
        stack[1] += amountTransferred;
        return amountTransferred;
    }
    static checkDrain(stack, amount) {
        if (stack[0] == null)
            return 0;
        return Math.min(stack[1], amount);
    }
    static drain(stack, amount) {
        if (stack[0] == null)
            return 0;
        const amountDrained = Math.min(stack[1], amount);
        stack[1] -= amountDrained;
        return amountDrained;
    }
}
