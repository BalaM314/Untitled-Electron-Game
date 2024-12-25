/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the Button class. */

import type { Texture } from "../ui/graphics.js";
import { type PartialMouseEvent, Input, type Keybind } from "../ui/input.js";
import { Intersector } from "./geom.js";


export class Button {
	declare x: number;
	declare y: number;
	declare width: number;
	declare height: number;
	declare label: string | Texture;
	//is this really the best way to solve this?
	color: string;
	font: string;
	onClick: (event: PartialMouseEvent) => void;
	constructor(config: {
		x: number | (() => number);
		y: number | (() => number);
		width: number | (() => number);
		height: number | (() => number);
		label: string | (() => string | Texture) | Texture;
		color: string;
		font: string;
		onClick: (event: PartialMouseEvent) => void;
	}) {
		if (config.x instanceof Function)
			Object.defineProperty(this, "x", { get: config.x });

		else
			this.x = config.x ?? 300;

		if (config.y instanceof Function)
			Object.defineProperty(this, "y", { get: config.y });

		else
			this.y = config.y ?? 300;

		if (config.width instanceof Function)
			Object.defineProperty(this, "width", { get: config.width });

		else
			this.width = config.width ?? 300;

		if (config.height instanceof Function)
			Object.defineProperty(this, "height", { get: config.height });

		else
			this.height = config.height ?? 300;

		if (config.label instanceof Function)
			Object.defineProperty(this, "label", { get: config.label });

		else
			this.label = config.label ?? "Button";

		this.color = config.color ?? "#0000FF";
		this.font = config.font ?? "20px sans-serif";
		this.onClick = config.onClick ?? (() => { });
	}
	display(_ctx: CanvasRenderingContext2D) {
		_ctx.fillStyle = this.color;
		_ctx.strokeStyle = "#000000";
		_ctx.lineWidth = 2;
		_ctx.globalAlpha = 1.0;
		_ctx.fillRect(this.x, this.y, this.width, this.height);
		_ctx.strokeRect(this.x, this.y, this.width, this.height);
		if (this.isMouseInside()) {
			_ctx.fillStyle = "#FFFFFF";
			if (Input.mouseDown) {
				_ctx.globalAlpha = 0.4;
			} else {
				_ctx.globalAlpha = 0.2;
			}
			_ctx.lineWidth = 0;
			_ctx.fillRect(this.x, this.y, this.width, this.height);
		}
		_ctx.lineWidth = 1;
		_ctx.globalAlpha = 1.0;
		_ctx.font = this.font;
		_ctx.textAlign = "center";
		const tempBaseline = _ctx.textBaseline;
		_ctx.textBaseline = "middle";
		_ctx.fillStyle = "#FFFFFF";
		if (typeof this.label == "string") {
			_ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
		} else {
			_ctx.drawImage(this.label.image, this.x, this.y, this.width, this.height);
		}
		_ctx.textBaseline = tempBaseline;
	}
	isMouseInside() {
		return Intersector.pointInRect([Input.mouseX, Input.mouseY], [this.x, this.y, this.width, this.height]);
	}
	handleMouseClick(e: PartialMouseEvent) {
		if (this.isMouseInside() && e.button == 0) {
			this.onClick(e);
		}
	}
}
export function makeRebindButton(
	y: number,
	keybind: Keybind,
	buttonName: string,
	defaultKey: string
){
	return new Button({
		x: () => innerWidth * 0.3,
		y: () => innerHeight * y,
		width: () => innerWidth * 0.4,
		height: () => innerHeight * 0.05,
		label: () => 
			`${buttonName}: ${
				keybind.modifiers
					.filter(key => !key.startsWith("!"))
					.map(el => el + " + ")
					.join("")
				//Get the list of modifiers, remove the ones that start with !, then add " + " to each one.
			}${keybind.mainKey}`,
		color: "#08F",
		font: "15px sans-serif",
		onClick: () => {
			keybind.mainKey =
				(prompt(`Rebind ${buttonName.toLowerCase()} to:`) ?? defaultKey).toLowerCase().substring(0,1);
		}
	});
}

