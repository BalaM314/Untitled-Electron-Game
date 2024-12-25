/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the Direction enum class. */

import { forceType } from "./funcs.js";
import type { PosT } from "./geom.js";
import { PartialKey } from "./types.js";


export type Direction = {
	num: number;
	bitmask: number;
	opposite: Direction;
	string: string;
	vec: PosT;
	horizontal: boolean;
	vertical: boolean;
	cw: Direction;
	ccw: Direction;
}
//I miss java enums
export const Direction: {
	right: Direction;
	down: Direction;
	left: Direction;
	up: Direction;
	all: Direction[];
	number: number;
	[Symbol.iterator](): IterableIterator<Direction>;
} = (() => {
	type PartialDirection = PartialKey<Omit<Direction, "cw" | "ccw" | "opposite">, "bitmask"> & {
		cw?: PartialDirection;
		ccw?: PartialDirection;
		opposite?: PartialDirection;
	};
	const right:PartialDirection = { num: 0, string: "right", vec: [1, 0], horizontal: true, vertical: false};
	const down:PartialDirection = { num: 1, string: "down", vec: [0, 1], horizontal: false, vertical: true};
	const left:PartialDirection = { num: 2, string: "left", vec: [-1, 0], horizontal: true, vertical: false};
	const up:PartialDirection = { num: 3, string: "up", vec: [0, -1], horizontal: false, vertical: true};
	right.bitmask = 1 << right.num;
	down.bitmask = 1 << down.num;
	left.bitmask = 1 << left.num;
	up.bitmask = 1 << up.num;
	right.opposite = left;
	left.opposite = right;
	down.opposite = up;
	up.opposite = down;
	right.cw = down;
	down.cw = left;
	left.cw = up;
	up.cw = right;
	down.ccw = right;
	left.ccw = down;
	up.ccw = left;
	right.ccw = up;
	forceType<Direction>(right);
	forceType<Direction>(down);
	forceType<Direction>(left);
	forceType<Direction>(up);
	return {
		right,
		down,
		left,
		up,
		*[Symbol.iterator](){
			yield right;
			yield down;
			yield left;
			yield up;
		},
		all: [right, down, left, up],
		number: 4
	};
})();
