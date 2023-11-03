

interface UnloadedTexture {
	id: string;
}

interface Texture extends UnloadedTexture {
	image: CanvasImageSource;
	width: number;
	height: number;
}

interface AnimationData {
	/**0 to 1 */
	inc:number;
	dec:number;
	sin:number;
	cos:number;
}

function getAnimationData(fin:number){
	return {
		inc: fin,
		dec: 1 - fin,
		sin: Math.sin(Math.PI * 2 * fin),
		cos: Math.cos(Math.PI * 2 * fin),
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
	static width = window.innerWidth;
	static height = window.innerHeight;
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
		"tile" | "buildingsUnder" | "buildings" | "overlayBuilds" | "ghostBuilds" | "items" | "overlay",
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
	createdAt: number;
}

class ParticleEffect {
	lifetime = 1000;
	//assertion: set in Object.assign
	drawer!: (args:EffectParams) => unknown;
	static effects = new Set<EffectData>();
	constructor(args:Partial<ParticleEffect> & Pick<ParticleEffect, "drawer">){
		Object.assign(this, args); //very safe
	}
	display(data:EffectData){
		this.drawer({
			...getAnimationData((Date.now() - data.createdAt) / this.lifetime),
			pos: data.pos,
			createdAt: data.createdAt
		});
	}
	at(pos:Pos){
		ParticleEffect.effects.add({
			type: this,
			createdAt: Date.now(),
			pos
		});
	}
	static displayAll(){
		Gfx.layer("overlay");//todo effects layer
		this.effects.forEach(e => {
			if(Date.now() >= e.createdAt + e.type.lifetime) this.effects.delete(e);
			else e.type.display(e);
		});
	}
}

const Fx = {
	smoke: new ParticleEffect({
		lifetime: 1500,
		drawer({inc, dec, pos}){
			Gfx.alpha(dec);
			Gfx.fillColor("gray");
			Gfx.tEllipse(...pos.tile, 0.2 + inc * 0.5, 0.2 + inc * 0.5);
		},
	})
}

interface EffectData {
	type: ParticleEffect;
	createdAt: number;
	pos: Pos;
}

