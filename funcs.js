(Array).prototype.last = function () {
    return this[this.length - 1];
};
function sq(x) {
    return x * x;
}
const programStart = new Date();
function millis() {
    return (new Date()).valueOf() - programStart.valueOf();
}
function gcd(x, y) {
    if ((typeof x !== 'number') || (typeof y !== 'number')) {
        return false;
    }
    x = Math.abs(x);
    y = Math.abs(y);
    while (y) {
        var t = y;
        y = x % y;
        x = t;
    }
    return x;
}
function random(min, max) {
    if (arguments.length > 2) {
        throw new Error("Too many arguments for random");
    }
    if (arguments.length == 1) {
        max = min;
        min = 0;
    }
    if (arguments.length == 0) {
        min = 0;
        max = 1;
    }
    return Math.random() * (max - min) + min;
}
function range(start, end) {
    let temp = [];
    for (let i = start; i <= end; i++) {
        temp.push(i);
    }
    return temp;
}
