/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the WindowedMean utility class. */

import { crash } from "./funcs.js";


/**
 * Keeps a running average of some data.
 */
export class WindowedMean {
	/** Queue to hold the data. */
	data: number[];
	/** Index of the next place to insert an item into the queue. */
	queuei: number = 0;

	constructor(public maxWindowSize: number, fillValue = 0) {
		this.data = new Array(maxWindowSize).fill(fillValue);
	}

	add(value: number) {
		this.data[this.queuei++ % this.maxWindowSize] = value;
	}
	mean(windowSize?: number): number | null;
	mean<T>(windowSize: number, notEnoughDataValue: T): number | T;
	mean<T>(windowSize = this.maxWindowSize, notEnoughDataValue?: T): number | T {
		if (this.queuei >= windowSize) return this.rawMean(windowSize);
		else return (notEnoughDataValue ?? null) as any; //overload 1
	}
	rawMean(windowSize: number = this.maxWindowSize): number {
		if (windowSize > this.maxWindowSize)
			crash(`Cannot get average over the last ${windowSize} values becaue only ${this.maxWindowSize} values are stored`);
		let total = 0;
		let wrappedQueueI = this.queuei % this.maxWindowSize;
		for (let i = wrappedQueueI - windowSize; i < wrappedQueueI; i++) {
			if (i >= 0) total += this.data[i]!;
			else total += this.data[this.maxWindowSize + i]!;
		}
		return total / windowSize;
	}
	standardDeviation(windowSize?: number): number;
	standardDeviation<T>(windowSize: number, notEnoughDataValue: T): number | T;
	standardDeviation<T>(windowSize = this.maxWindowSize, notEnoughDataValue?: T): number | T {
		if (this.queuei < windowSize) return notEnoughDataValue ?? 0;
		const mean = this.mean(windowSize)!;
		/** Σ(x-x̄)^2 */
		let sumXMinusMeanSquared = 0;
		let wrappedQueueI = this.queuei % this.maxWindowSize;
		for (let i = wrappedQueueI - windowSize; i < wrappedQueueI; i++) {
			sumXMinusMeanSquared += ((i >= 0 ?
				this.data[i]!
			: this.data[this.maxWindowSize + i]!) - mean) ** 2;
		}
		return sumXMinusMeanSquared / windowSize;
	}
}
