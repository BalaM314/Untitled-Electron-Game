"use strict";
class Content {
    constructor(id) {
        var _a;
        this.id = id;
        (_a = this.constructor)._id ?? (_a._id = 0);
        this.nid = this.constructor._id++;
    }
}
class Fluid extends Content {
    constructor(id) {
        super(id);
    }
    static merge(from, to, maxThroughput = Infinity) {
        if (from[0] == null || from[1] == 0)
            return 0;
        if (to[0] === null)
            to[0] = from[0];
        else if (from[0] !== to[0])
            return 0;
        const remainingSpace = to[2] - to[1];
        const amountTransferred = Math.min(remainingSpace, from[1], maxThroughput);
        from[1] -= amountTransferred;
        to[1] += amountTransferred;
        return amountTransferred;
    }
    static fill(stack, type, amount) {
        if (type == null || amount == 0)
            return 0;
        if (stack[0] === null)
            stack[0] = type;
        else if (stack[0] !== type)
            return 0;
        const remainingSpace = stack[2] - stack[1];
        const amountTransferred = Math.min(remainingSpace, amount);
        stack[1] += amountTransferred;
        return amountTransferred;
    }
}
