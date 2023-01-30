

interface UnloadedTexture {
	src: string;
	pixelWidth: number;
	pixelHeight: number;
	pixelXOffset: number;
	pixelYOffset: number;
	id: string;
}

interface Texture extends UnloadedTexture {
	image: CanvasImageSource;
}

function loadTexture(t:UnloadedTexture, texturesDiv:HTMLDivElement){
	return new Promise<Texture>((resolve, reject) => {
		let img = document.createElement("img");
		img.setAttribute("src", `assets/textures/${t.src}`.replace(":", "%23"));
		img.addEventListener("load", () => {
			Game.loadedTextures ++;
			resolve({
				...t,
				image: img
			});
		});
		img.addEventListener("error", (err) => {
			alert(`Failed to load texture "${t.src}"`);
			reject();
		});
		texturesDiv.appendChild(img);
	});
}

async function loadTextures(textures:UnloadedTexture[], texturesDiv:HTMLDivElement):Promise<{
	[id:string]: Texture;
}>{
	return Object.fromEntries(
		(await Promise.all(textures.map(t => loadTexture(t, texturesDiv))))
		.map(t => [t.id, t])
	);
}

class Gfx {
	static layers = {
		tile: ctxGBuilds,
		buildings: ctxBuilds,
		overlayBuilds: ctxOBuilds,
		ghostBuilds: ctxGBuilds,
		items: ctxItems,
		overlay: ctxOverlays,
	};
	static rectMode:RectMode = RectMode.CORNER;
	static ctx:CanvasRenderingContext2D = this.layers.overlay;
	static layer(k:keyof typeof this.layers){
		this.ctx = this.layers[k];
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
	static tImage(texture:Texture, tileX:number, tileY:number, _ctx = this.ctx){
		_ctx.drawImage(
			texture.image,
			(texture.pixelXOffset + tileX * consts.TILE_SIZE + Game.scroll.x) * consts.DISPLAY_SCALE,
			(texture.pixelYOffset + tileY * consts.TILE_SIZE + Game.scroll.y) * consts.DISPLAY_SCALE,
			texture.pixelWidth * consts.DISPLAY_SCALE,
			texture.pixelHeight * consts.DISPLAY_SCALE
		);
	}
	static pImage(image:HTMLImageElement, pixelX:number, pixelY:number, width:number = image.width, height:number = image.height, mode:RectMode = this.rectMode, _ctx = this.ctx){
		if(mode == RectMode.CORNER)
			_ctx.drawImage(
				image,
				pixelX + (Game.scroll.x * consts.DISPLAY_SCALE),
				pixelY + (Game.scroll.y * consts.DISPLAY_SCALE),
				width * consts.DISPLAY_SCALE,
				height * consts.DISPLAY_SCALE
			);
		else 
			_ctx.drawImage(
				image,
				pixelX + ((Game.scroll.x - width / 2) * consts.DISPLAY_SCALE),
				pixelY + ((Game.scroll.y - height / 2) * consts.DISPLAY_SCALE),
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