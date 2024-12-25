/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { Mathf } from "../vars.js";
export class Random {
    constructor(_rand) {
        this._rand = _rand;
    }
    int(arg0, arg1) {
        if (arg1)
            return Math.floor(this._rand() * (arg1 + 1 - arg0) + arg0);
        else
            return Math.floor(this._rand() * (arg0 + 1));
    }
    num(arg0, arg1) {
        if (arg1)
            return this._rand() * (arg1 - arg0) + arg0;
        else
            return this._rand() * arg0;
    }
    chance(probability) {
        return this._rand() < probability;
    }
    vec(length) {
        const theta = this.num(Mathf.TWO_PI);
        return [length * Math.cos(theta), length * Math.sin(theta)];
    }
    item(input) {
        return input[Math.floor(this._rand() * input.length)];
    }
}
export class PseudoRandom extends Random {
    constructor(seed) {
        super(null);
        this.seed = seed;
        this.value = seed + 11111111111111;
        this._rand = () => {
            this.value = this.value * 16807 % 16777216;
            return this.value / 16777216;
        };
    }
    reset() {
        this.value = this.seed + 11111111111111;
    }
}
export const Rand = new Random(Math.random);
