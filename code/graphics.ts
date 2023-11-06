

interface UnloadedTexture {
	id: string;
}

interface Texture extends UnloadedTexture {
	image: CanvasImageSource;
	width: number;
	height: number;
}

interface AnimationData {
	/** linear from `from` to `to` */
	linc(from?:number, to?:number):number;
	/** linear from `from` to `to` */
	ldec(from?:number, to?:number):number;
	/** Mostly linear from 0 to `a`, but drops off towards zero using x^`p`. p is 10 by default. */
	pdec(a:number, p?:number):number;
	/** Sharp decrease at first, then slowly goes towards zero. */
	edec(a:number, to?:number):number;
	/**
	 * Sine wave.
	 * @param b Multiplier for cycles number. Default 1, meaning 1 cycle per second.
	 * @param a Amplitude. Default 1, meaning the sine wave goes from -1 to +1.
	 * @param c Y offset to the sine wave.
	 */
	sin(b?:number, a?:number, c?:number):number;
	/**
	 * Cosine wave.
	 * @param b Multiplier for cycles number. Default 1, meaning 1 cycle per second.
	 * @param a Amplitude. Default 1, meaning the sine wave goes from -1 to +1.
	 * @param c Y offset to the cosine wave. Default 0.
	 */
	cos(b?:number, a?:number, c?:number):number;
}

function getAnimationData(fin:number):AnimationData {
	return {
		linc:(from = 0, to = 1) => from + fin * (to - from),
		ldec:(from = 1, to = 0) => from + fin * (to - from), //same function with different defaults lol
		pdec:(a, p = 10) => 1 - Math.pow(fin - 1 + a ** (1 / p), p) + (a - 1) * fin, //this will definitely not cause performance issues!
		edec:(a, to = 0) => (1 - to) * Math.exp(-a * fin) + to,
		sin:(b = 1, a = 1, c = 0) => a * Math.sin(Math.PI * 2 * b * fin) + c,
		cos:(b = 1, a = 1, c = 0) => a * Math.cos(Math.PI * 2 * b * fin) + c,
	};
}

function loadTexture(t:UnloadedTexture, texturesDiv:HTMLDivElement){
	return new Promise<Texture>((resolve, reject) => {
		let img = document.createElement("img");
		img.setAttribute("src", `assets/textures/${t.id}.png`.replace(":", "%23"));
		img.addEventListener("load", () => {
			Game.loadedTextures ++;
			resolve({
				...t,
				image: img,
				width: img.width,
				height: img.height,
			});
		});
		img.addEventListener("error", (err) => {
			alert(`Failed to load texture "${t.id}": ${err.message}`);
			console.error(err);
			reject(`Failed to load texture "${t.id}": ${err.message}`);
		});
		texturesDiv.appendChild(img);
	});
}

async function loadTextures(textures:UnloadedTexture[], texturesDiv:HTMLDivElement):Promise<Record<string, Texture>> {
	return Object.fromEntries(
		(await Promise.all(textures.map(t => loadTexture(t, texturesDiv))))
		.map(t => [t.id, t])
	);
}

class Camera {
	static zoomLevel:number = 1;
	static minZoom = 1;
	static maxZoom = 5;
	static scrollX:number = 0;
	static scrollY:number = 0;
	static get width(){return window.innerWidth;}
	static get height(){return window.innerHeight;}
	static zoom(scaleFactor:number){
		scaleFactor = constrain(scaleFactor, 0.9, 1.1);
		if(this.zoomLevel * scaleFactor < this.minZoom){
			scaleFactor = this.minZoom / this.zoomLevel;
		} else if(this.zoomLevel * scaleFactor > this.maxZoom){
			scaleFactor = this.maxZoom / this.zoomLevel;
		}
		if((this.zoomLevel <= this.minZoom && scaleFactor <= 1)||(this.zoomLevel >= this.maxZoom && scaleFactor >= 1)){
			return;
		}
		Game.forceRedraw = true;
		this.zoomLevel *= scaleFactor;
	}
	/**Returns the rectangle that is visible in in-world coordinates.*/
	static visibleRect(){
		return [
			...this.unproject(0, 0),
			this.width / this.zoomLevel,
			this.height / this.zoomLevel,
		] as Rect;
	}
	static isVisible(rect:Rect, cullingMargin:number = 0){
		const [x, y, w, h] = this.visibleRect();
		return Intersector.rectsIntersect(rect, [x - cullingMargin, y - cullingMargin, w + cullingMargin * 2, h + cullingMargin * 2]);
	}
	static isPointVisible(point:PosT, cullingMargin:number = 0){
		const [x, y, w, h] = this.visibleRect();
		return Intersector.pointInRect(point, [x - cullingMargin, y - cullingMargin, w + cullingMargin * 2, h + cullingMargin * 2]);
	}
	/**Converts world coordinates to screen coordinates, where [0,0] is at the top left. */
	static project(x:number, y:number):PosT {
		return [
			((x + this.scrollX) * this.zoomLevel) + this.width / 2,
			((y + this.scrollY) * this.zoomLevel) + this.height / 2
		];
	}
	/**Converts screen coordinates to world coordinates. */
	static unproject(x:number, y:number):PosT {
		return [
			(x - this.width / 2) / this.zoomLevel - this.scrollX,
			(y - this.height / 2) / this.zoomLevel - this.scrollY
		];
	}
}

class Gfx {

	static layers:Record<
		"tile" | "buildingsUnder" | "buildings" | "overlayBuilds" | "ghostBuilds" | "items" | "effects" | "overlay",
	CanvasRenderingContext2D> = null!;
	static textures:Record<string, Texture> = {};
	static rectMode:RectMode = RectMode.CORNER;
	static ctx:CanvasRenderingContext2D = null!;
	static init(){
		this.layers = {
			tile: ctxTiles,
			ghostBuilds: ctxGBuilds,
			buildingsUnder: ctxBuildsUnder,
			buildings: ctxBuilds,
			overlayBuilds: ctxOBuilds,
			items: ctxItems,
			effects: ctxEffects,
			overlay: ctxOverlays,
		};
		this.ctx = this.layers.overlay;
	}
	static layer(k:keyof typeof this.layers){
		this.ctx = this.layers[k] ?? crash(`Invalid layer ${k}`);
		this.alpha(1);
	}
	static lerp(from:[r:number, g:number, b:number], to:[r:number, g:number, b:number], f:number):[r:number, g:number, b:number]{
		return [
			from[0] + f * (to[0] - from[0]),
			from[1] + f * (to[1] - from[1]),
			from[2] + f * (to[2] - from[2])
		];
	}
	static alpha(a:number) {
		this.ctx.globalAlpha = a;
	}
	static texture(id:string):Texture {
		return this.textures[id] ?? this.textures["error"];
	}
	static tLine(x1:number, y1:number, x2:number, y2:number, _ctx = this.ctx){
		_ctx.beginPath();
		_ctx.moveTo(
			(x1 * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
			(y1 * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2
		);
		_ctx.lineTo(
			(x2 * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
			(y2 * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2
		);
		_ctx.stroke();
	}
	static lineTRect(tileX:number, tileY:number, width:number, height:number, mode:RectMode = this.rectMode, _ctx = this.ctx){
		if(mode == RectMode.CORNER)
			_ctx.strokeRect(
				(tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
				(tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
				width * Camera.zoomLevel * consts.TILE_SIZE,
				height * Camera.zoomLevel * consts.TILE_SIZE
			);
		else 
			_ctx.strokeRect(
				((tileX - 0.5) * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
				((tileY - 0.5) * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
				width * Camera.zoomLevel * consts.TILE_SIZE, height * Camera.zoomLevel * consts.TILE_SIZE
			);
	}
	static lineWidth(width:number) {
		this.ctx.lineWidth = width;
	}
	static text(text:string, x:number, y:number) {
		this.ctx.fillText(text, x, y);
	}
	static pText(pixelX:number, pixelY:number, text:string){
		if(mode == RectMode.CORNER)
		_ctx.fillRect(
			(pixelX + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
			(pixelY + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
			width * Camera.zoomLevel,
			height * Camera.zoomLevel
		);
	}
	static lineRect(x:number, y:number, w:number, h:number, mode:RectMode = this.rectMode, _ctx = this.ctx){
		if(mode == RectMode.CENTER){
			_ctx.strokeRect(x - w/2, y - w/2, w, h);
		} else {
			_ctx.strokeRect(x, y, w, h);
		}
	}
	static strokeColor(color:string) {
		this.ctx.strokeStyle = color;
	}
	static fillColor(color:string):void;
	static fillColor(r:number, g:number, b:number):void;
	static fillColor(arg1:any, arg2?:any, arg3?:any){
		if(typeof arg1 == "string"){
			this.ctx.fillStyle = arg1;
		} else {
			this.ctx.fillStyle = `rgb(${arg1},${arg2},${arg3})`;
		}
	}
	static font(font:string) {
		this.ctx.font = font;
	}
	static rect(x:number, y:number, w:number, h:number, mode:RectMode = this.rectMode, _ctx = this.ctx){
		if(mode == RectMode.CENTER){
			_ctx.fillRect(x - w/2, y - w/2, w, h);
		} else {
			_ctx.fillRect(x, y, w, h);
		}
	}
	static pRect(pixelX:number, pixelY:number, width:number, height:number, mode:RectMode = this.rectMode, _ctx = this.ctx){
		if(mode == RectMode.CORNER)
			_ctx.fillRect(
				(pixelX + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
				(pixelY + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
				width * Camera.zoomLevel,
				height * Camera.zoomLevel
			);
		else 
			_ctx.fillRect(
				pixelX + ((Camera.scrollX - width / 2) * Camera.zoomLevel) + Camera.width / 2,
				pixelY + ((Camera.scrollY - height / 2) * Camera.zoomLevel) + Camera.height / 2,
				width * Camera.zoomLevel, height * Camera.zoomLevel
			);
	}
	static tRect(tileX:number, tileY:number, width:number, height:number, mode:RectMode = this.rectMode, _ctx = this.ctx){
		if(mode == RectMode.CORNER)
			_ctx.fillRect(
				(tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
				(tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
				width * Camera.zoomLevel * consts.TILE_SIZE,
				height * Camera.zoomLevel * consts.TILE_SIZE
			);
		else 
			_ctx.fillRect(
				((tileX - 0.5 * width) * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
				((tileY - 0.5 * height) * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
				width * Camera.zoomLevel * consts.TILE_SIZE, height * Camera.zoomLevel * consts.TILE_SIZE
			);
	}
	static tImage(
		texture:Texture,
		tileX:number, tileY:number,
		width:number = 1, height:number = 1,
		_ctx = this.ctx
	){
		_ctx.drawImage(
			texture.image,
			(tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
			(tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
			width * consts.TILE_SIZE * Camera.zoomLevel,
			height * consts.TILE_SIZE * Camera.zoomLevel
		);
	}
	static pImage(
		texture:Texture,
		pixelX:number, pixelY:number,
		width:number = texture.width, height:number = texture.height,
		mode:RectMode = this.rectMode, _ctx = this.ctx
	){
		if(mode == RectMode.CORNER)
			_ctx.drawImage(
				texture.image,
				(pixelX + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
				(pixelY + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
				width * Camera.zoomLevel,
				height * Camera.zoomLevel
			);
		else
			_ctx.drawImage(
				texture.image,
				(pixelX - (width / 2) + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
				(pixelY - (width / 2) + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
				width * Camera.zoomLevel,
				height * Camera.zoomLevel
			);
	}
	static tEllipse(tileX:number, tileY:number, width:number, height:number, rotation = 0, startAngle = 0, endAngle = 2 * Math.PI, _ctx = this.ctx){
		_ctx.beginPath();
		_ctx.moveTo(
			(tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
			(tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2
		);
		_ctx.ellipse(
			(tileX * consts.TILE_SIZE + Camera.scrollX) * Camera.zoomLevel + Camera.width / 2,
			(tileY * consts.TILE_SIZE + Camera.scrollY) * Camera.zoomLevel + Camera.height / 2,
			width * Camera.zoomLevel * consts.TILE_SIZE / 2,
			height * Camera.zoomLevel * consts.TILE_SIZE / 2,
			rotation, startAngle, endAngle
		);
		_ctx.fill();
	}
	static ellipse(x:number, y:number, w:number, h:number, _ctx = this.ctx){
		_ctx.beginPath();
		_ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
		_ctx.fill();
	}
}

interface EffectParams extends AnimationData {
	pos: Pos;
	prand: PseudoRandom;
	createdAt: number;
	color: string;
}

class ParticleEffect {
	lifetime = 1000;
	/** default color */
	color = "white";
	clipSize = 100;
	//assertion: set in Object.assign
	drawer!: (args:EffectParams) => unknown;
	static effects = new Set<EffectData>(); //maybe quadtree?
	private static id = 0;
	constructor(args:Partial<ParticleEffect> & Pick<ParticleEffect, "drawer">){
		Object.assign(this, args); //very safe
	}
	display(data:EffectData){
		data.prand.reset();
		this.drawer({
			...getAnimationData((Date.now() - data.createdAt) / this.lifetime),
			color: data.color,
			pos: data.pos,
			createdAt: data.createdAt,
			prand: data.prand
		});
	}
	at(pos:Pos, color = this.color){
		ParticleEffect.effects.add({
			type: this,
			createdAt: Date.now(),
			pos, color,
			id: ++ParticleEffect.id,
			prand: new PseudoRandom(ParticleEffect.id),
		});
	}
	static displayAll(){
		Gfx.layer("effects");
		this.effects.forEach(e => {
			if(Date.now() >= e.createdAt + e.type.lifetime) this.effects.delete(e);
			else if(Camera.isPointVisible(e.pos.pixel, e.type.clipSize)) e.type.display(e);
		});
	}
}

const Fx = {
	smoke: new ParticleEffect({
		lifetime: 1500,
		color: "#555",
		drawer({linc, pdec, pos, color}){
			Gfx.alpha(pdec(0.3, 8));
			Gfx.fillColor(color);
			Gfx.tEllipse(pos.tileXCentered + linc(0, 0.1), pos.tileYCentered - linc(0, 0.9), linc(0.2, 0.7), linc(0.2, 0.7));
		},
	}),
	spark: new ParticleEffect({
		lifetime: 500,
		color: "#FFD",
		drawer({prand, linc, edec, pos, color}){
			Gfx.alpha(edec(5));
			Gfx.strokeColor(color);
			Gfx.lineWidth(5);
			//velocity is set to zero because it looks weird
			const location = add(add(pos.tile, prand.vec(prand.num(0.4, 0.55))), mul(prand.vec(0), linc()));
			const offset = add(location, prand.vec(0.15));
			const offset2 = add(location, prand.vec(0.15));
			Gfx.tLine(...location, ...offset);
			Gfx.tLine(...location, ...offset2);
		},
	}),
}

interface EffectData {
	type: ParticleEffect;
	createdAt: number;
	pos: Pos;
	color: string;
	id: number;
	prand: PseudoRandom;
}

