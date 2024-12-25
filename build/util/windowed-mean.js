/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { crash } from "./funcs.js";
export class WindowedMean {
    constructor(maxWindowSize, fillValue = 0) {
        this.maxWindowSize = maxWindowSize;
        this.queuei = 0;
        this.data = Array(maxWindowSize).fill(fillValue);
    }
    add(value) {
        this.data[this.queuei++ % this.maxWindowSize] = value;
    }
    mean(windowSize = this.maxWindowSize, notEnoughDataValue) {
        if (this.queuei >= windowSize)
            return this.rawMean(windowSize);
        else
            return (notEnoughDataValue ?? null);
    }
    rawMean(windowSize = this.maxWindowSize) {
        if (windowSize > this.maxWindowSize)
            crash(`Cannot get average over the last ${windowSize} values becaue only ${this.maxWindowSize} values are stored`);
        let total = 0;
        const wrappedQueueI = this.queuei % this.maxWindowSize;
        for (let i = wrappedQueueI - windowSize; i < wrappedQueueI; i++) {
            if (i >= 0)
                total += this.data[i];
            else
                total += this.data[this.maxWindowSize + i];
        }
        return total / windowSize;
    }
    standardDeviation(windowSize = this.maxWindowSize, notEnoughDataValue) {
        if (this.queuei < windowSize)
            return notEnoughDataValue ?? 0;
        const mean = this.mean(windowSize);
        let sumXMinusMeanSquared = 0;
        const wrappedQueueI = this.queuei % this.maxWindowSize;
        for (let i = wrappedQueueI - windowSize; i < wrappedQueueI; i++) {
            sumXMinusMeanSquared += ((i >= 0 ?
                this.data[i]
                : this.data[this.maxWindowSize + i]) - mean) ** 2;
        }
        return sumXMinusMeanSquared / windowSize;
    }
}
