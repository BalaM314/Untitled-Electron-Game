import { crash } from "./funcs";
export class WindowedMean {
    constructor(maxWindowSize, fillValue = 0) {
        this.maxWindowSize = maxWindowSize;
        this.queuei = 0;
        this.data = new Array(maxWindowSize).fill(fillValue);
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
        let wrappedQueueI = this.queuei % this.maxWindowSize;
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
        let wrappedQueueI = this.queuei % this.maxWindowSize;
        for (let i = wrappedQueueI - windowSize; i < wrappedQueueI; i++) {
            sumXMinusMeanSquared += (((i >= 0)
                ? this.data[i]
                : this.data[this.maxWindowSize + i]) - mean) ** 2;
        }
        return sumXMinusMeanSquared / windowSize;
    }
}
