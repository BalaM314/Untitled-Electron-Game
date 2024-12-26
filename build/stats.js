/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { Buildings, ItemIDs } from "./content/content.js";
import { importObject } from "./util/funcs.js";
const persistentStats = () => ({
    buildings: {
        builtByType: Object.fromEntries(Buildings.keys().map(k => [k, 0])),
        totalBuilt: 0,
        totalRemoved: 0,
    },
    items: {
        totalReachedHub: 0,
        reachedHub: Object.fromEntries(ItemIDs.map(k => [k, 0])),
        totalUsed: 0,
        used: Object.fromEntries(ItemIDs.map(k => [k, 0])),
    },
    power: {
        totalProduced: 0,
        producedByType: Object.fromEntries(Buildings.keys().map(k => [k, 0])),
    },
    misc: {
        timeStarted: 0,
        timeWon: 0,
    },
});
export const PersistentStats = {
    value: persistentStats(),
    read(data) {
        try {
            importObject(this.value, JSON.parse(data));
        }
        catch {
        }
    },
    write() {
        return JSON.stringify(this.value);
    }
};
