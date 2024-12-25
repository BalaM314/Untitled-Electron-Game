/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { forceType } from "./funcs.js";
export const Direction = (() => {
    const right = { num: 0, string: "right", vec: [1, 0], horizontal: true, vertical: false };
    const down = { num: 1, string: "down", vec: [0, 1], horizontal: false, vertical: true };
    const left = { num: 2, string: "left", vec: [-1, 0], horizontal: true, vertical: false };
    const up = { num: 3, string: "up", vec: [0, -1], horizontal: false, vertical: true };
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
    forceType(right);
    forceType(down);
    forceType(left);
    forceType(up);
    return {
        right,
        down,
        left,
        up,
        *[Symbol.iterator]() {
            yield right;
            yield down;
            yield left;
            yield up;
        },
        all: [right, down, left, up],
        number: 4
    };
})();
