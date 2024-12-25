import { Mathf } from "../vars";
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
