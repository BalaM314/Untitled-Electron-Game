/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains util functions for randomness. */

import { Mathf } from "../vars.js";
import type { PosT } from "./geom.js";


export class Random {
	constructor(public _rand: () => number) { }
	/** Returns a random integer between 0 and `max` inclusive. */
	int(max: number): number;
	/** Returns a random integer between `min` and `max` inclusive. */
	int(min: number, max: number): number;
	int(arg0: number, arg1?: number) {
		if (arg1)
			return Math.floor(this._rand() * (arg1 + 1 - arg0) + arg0);

		else
			return Math.floor(this._rand() * (arg0 + 1));
	}
	/** Returns a random number between 0 and `max` inclusive. */
	num(max: number): number;
	/** Returns a random number between `min` and `max` inclusive. */
	num(min: number, max: number): number;
	num(arg0: number, arg1?: number) {
		if (arg1)
			return this._rand() * (arg1 - arg0) + arg0;

		else
			return this._rand() * arg0;
	}
	chance(probability: number) {
		return this._rand() < probability;
	}
	vec(length: number): PosT {
		const theta = this.num(Mathf.TWO_PI);
		return [length * Math.cos(theta), length * Math.sin(theta)];
	}
	item<T>(input: T[]) {
		return input[Math.floor(this._rand() * input.length)];
	}
}
export class PseudoRandom extends Random {
	value: number;
	constructor(public seed: number) {
		super(null!);
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
