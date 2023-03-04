

interface UnloadedTexture {
	id: string;
}

interface Texture extends UnloadedTexture {
	image: CanvasImageSource;
	width: number;
	height: number;
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

class Gfx {
	static layers = {
		tile: ctxTiles,
		buildings: ctxBuilds,
		overlayBuilds: ctxOBuilds,
		ghostBuilds: ctxGBuilds,
		items: ctxItems,
		overlay: ctxOverlays,
	};
	static textures:Record<string, Texture> = {};
	static rectMode:RectMode = RectMode.CORNER;
	static ctx:CanvasRenderingContext2D = this.layers.overlay;
	static layer(k:keyof typeof this.layers){
		this.ctx = this.layers[k];
		this.alpha(1);
	}
	static alpha(a:number) {
		this.ctx.globalAlpha = a;
	}
	static texture(id:string):Texture {
		return this.textures[id] ?? this.textures["error"];
	}
	static lineTRect(tileX:number, tileY:number, width:number, height:number, mode:RectMode = this.rectMode, _ctx = this.ctx){
		if(mode == RectMode.CORNER)
			_ctx.strokeRect(
				(tileX * consts.TILE_SIZE + Game.scroll.x) * consts.DISPLAY_SCALE,
				(tileY * consts.TILE_SIZE + Game.scroll.y) * consts.DISPLAY_SCALE,
				width * consts.DISPLAY_SCALE * consts.TILE_SIZE,
				height * consts.DISPLAY_SCALE * consts.TILE_SIZE
			);
		else 
			_ctx.strokeRect(
				((tileX - 0.5) * consts.TILE_SIZE + Game.scroll.x) * consts.DISPLAY_SCALE,
				((tileY - 0.5) * consts.TILE_SIZE + Game.scroll.y) * consts.DISPLAY_SCALE,
				width * consts.DISPLAY_SCALE * consts.TILE_SIZE, height * consts.DISPLAY_SCALE * consts.TILE_SIZE
			);
	}
	static lineWidth(width:number) {
		this.ctx.lineWidth = width;
	}
	static text(text:string, x:number, y:number) {
		this.ctx.fillText(text, x, y);
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
	static fillColor(color:string) {
		this.ctx.fillStyle = color;
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
				pixelX + (Game.scroll.x * consts.DISPLAY_SCALE),
				pixelY + (Game.scroll.y * consts.DISPLAY_SCALE),
				width * consts.DISPLAY_SCALE,
				height * consts.DISPLAY_SCALE
			);
		else 
			_ctx.fillRect(
				pixelX + ((Game.scroll.x - width / 2) * consts.DISPLAY_SCALE),
				pixelY + ((Game.scroll.y - height / 2) * consts.DISPLAY_SCALE),
				width * consts.DISPLAY_SCALE, height * consts.DISPLAY_SCALE
			);
	}
	static tRect(tileX:number, tileY:number, width:number, height:number, mode:RectMode = this.rectMode, _ctx = this.ctx){
		if(mode == RectMode.CORNER)
			_ctx.fillRect(
				(tileX * consts.TILE_SIZE + Game.scroll.x) * consts.DISPLAY_SCALE,
				(tileY * consts.TILE_SIZE + Game.scroll.y) * consts.DISPLAY_SCALE,
				width * consts.DISPLAY_SCALE * consts.TILE_SIZE,
				height * consts.DISPLAY_SCALE * consts.TILE_SIZE
			);
		else 
			_ctx.fillRect(
				((tileX - 0.5) * consts.TILE_SIZE + Game.scroll.x) * consts.DISPLAY_SCALE,
				((tileY - 0.5) * consts.TILE_SIZE + Game.scroll.y) * consts.DISPLAY_SCALE,
				width * consts.DISPLAY_SCALE * consts.TILE_SIZE, height * consts.DISPLAY_SCALE * consts.TILE_SIZE
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
			(tileX * consts.TILE_SIZE + Game.scroll.x) * consts.DISPLAY_SCALE,
			(tileY * consts.TILE_SIZE + Game.scroll.y) * consts.DISPLAY_SCALE,
			width * consts.TILE_SIZE * consts.DISPLAY_SCALE,
			height * consts.TILE_SIZE * consts.DISPLAY_SCALE
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
				(pixelX + Game.scroll.x) * consts.DISPLAY_SCALE,
				(pixelY + Game.scroll.y) * consts.DISPLAY_SCALE,
				width * consts.DISPLAY_SCALE,
				height * consts.DISPLAY_SCALE
			);
		else
			_ctx.drawImage(
				texture.image,
				(pixelX - (width / 2) + Game.scroll.x) * consts.DISPLAY_SCALE,
				(pixelY - (width / 2) + Game.scroll.y) * consts.DISPLAY_SCALE,
				width * consts.DISPLAY_SCALE,
				height * consts.DISPLAY_SCALE
			);
	}
	static ellipse(x:number, y:number, w:number, h:number, _ctx = this.ctx){
		_ctx.beginPath();
		_ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
		_ctx.fill();
	}
}