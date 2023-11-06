class Content<K extends string> {
	nid:number;
	constructor(public id:K){
		//unsafe typescript goes brrrrr
		//change _id on whatever subclass this is
		(<any>this.constructor)._id ??= 0;
		this.nid = (<any>this.constructor)._id++;
	}
}

/**A combination of an ItemID and an amount. The amount is frequently mutated by function calls. */
type ItemStack = [id:ItemID, amount:number];

type FluidStack = [type:Fluid | null, amount:number, capacity:number];
class Fluid extends Content<FluidID> {

	constructor(id:FluidID, public color:string){
		super(id);
	}
	/**
	 * Moves fluid from `from` to `to`.
	 * @returns the amount of fluid moved.
	 */
	static merge(from:FluidStack, to:FluidStack, maxThroughput = Infinity):number {
		if(from[0] == null || from[1] == 0) return 0; //from is empty
		if(to[0] === null) to[0] = from[0]; //set fluid
		else if(from[0] !== to[0]) return 0; //fluids are different
		const remainingSpace = to[2] - to[1];
		const amountTransferred = Math.min(remainingSpace, from[1], maxThroughput);
		from[1] -= amountTransferred;
		to[1] += amountTransferred;
		return amountTransferred;
	}
	static fill(stack:FluidStack, type:Fluid, amount:number){
		if(type == null || amount == 0) return 0;
		if(stack[0] === null) stack[0] = type; //set fluid
		else if(stack[0] !== type) return 0; //different fluid
		const remainingSpace = stack[2] - stack[1];
		const amountTransferred = Math.min(remainingSpace, amount);
		stack[1] += amountTransferred;
		return amountTransferred;
	}
	/** @returns the amount that can be drained. */
	static checkDrain(stack:FluidStack, amount:number):number {
		if(stack[0] == null) return 0;
		return Math.min(stack[1], amount);
	}	
	/** @returns the amount drained. */
	static drain(stack:FluidStack, amount:number):number {
		if(stack[0] == null) return 0;
		const amountDrained = Math.min(stack[1], amount);
		stack[1] -= amountDrained;
		return amountDrained;
	}
}

