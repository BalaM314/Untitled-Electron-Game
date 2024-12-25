/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the logging wrapper. */

import { range } from "./funcs.js";
import type { TagFunction } from "./types.js";


export const Log = (() => {
	const styles = {
		UEG: `color: #0033CC; font-weight: bolder;`,
		caution: "color: yellow;",
		warn: "color: orange;",
		error: "color: red; font-weight: bolder;",
	};
	const prefixes = {
		info: [
			`%c[UEG]%c `,
			styles.UEG,
			"",
		],
		caution: [
			`%c[UEG]%c ⚠️ `,
			styles.UEG,
			styles.caution,
		],
		warn: [
			`%c[UEG]%c ⚠️ `,
			styles.UEG,
			styles.warn,
		],
		error: [
			`%c[UEG]%c 🛑 `,
			styles.UEG,
			styles.error,
		] as const,
	} as const;
	const ColorTag = Symbol("ColorTag");
	function isColorTagged(x:unknown):x is ColorTagged {
		return x instanceof Object && ColorTag in x;
	}
	function processObject(input:Record<string, string>):string {
		return Object.entries(input).map(([k, v]) => `${k}: ${v};`).join(" ");
	}
	function style(input:string | readonly string[] | Record<string, string>, ...rest:Record<string, string>[]):ColorTagged {
		return Object.assign(
			new String(
				Array.isArray(input) ? input[0] :
				typeof input === "object" ? processObject(Object.assign({}, input, ...rest)) :
				input
			),
			{ [ColorTag]: true as const }
		);
	};
	const raw = function(stringChunks, ...varChunks){
		console.log(
			String.raw({raw: stringChunks}, ...varChunks.map(c =>
				isColorTagged(c) ? `%c` : c
			)),
			...varChunks.filter(isColorTagged)
		);
	} satisfies TagFunction<string | number | ColorTagged, void>;
	type ColorTagged = String & {
		[ColorTag]: true;
	};

	return {
		prefixes,
		...Object.fromEntries(Object.entries(prefixes).map(
			([name, [prefix, ...colors]]) => [name, (message:string, ...data:unknown[]) => {
				console.log(prefix + message, ...colors, ...data);
			}] as const
		)),
		ColorTag,
		group(message:string, callback:() => unknown, collapsed = false){
			console[collapsed ? "groupCollapsed" : "group"](prefixes.info[0] + message, prefixes.info[1], prefixes.info[2]);
			callback();
			console.groupEnd();
		},
		style: Object.assign(style, {
			[ColorTag]: true,
			toString(){
				return "";
			}
		}, Object.fromEntries(Object.entries(styles).map(
			([key, val]) => [key, style(val)] as const
		))),
		raw,
		showBanner(){
			const text = "Untitled Electron Game";
			const fontStyle = {
				"font-family": "monospace",
				"text-shadow": "2px 2px 2px black;",
			};
			const fontStyleLarge = {
				"font-size": "200%",
			}
			const fontStyleSmall = {
				"font-size": "100%",
			}
			const fontStyleSpace = {
				"font-family": "monospace",
				"color": "#0000",
				"background-color": "#0033CC",
			};
			const gradient = {
				"background-image": `linear-gradient(to right, ${range(225, 225 + 360, 30).map(i => `hsl(${i}deg, 100%, 40%)`).join(", ")})`
			};
			const subtitleLine = {
				"background-color": "#0033CC",
			};
			const subtitleStyle = {
				"background-color": "#315541",
			};
			const subtitle = " by BalaM314 ";
			raw`\
${style(fontStyleSmall, fontStyleSpace)}${" ".repeat(3 * 2)}${text.repeat(2)}${" ".repeat(3 * 2)}
${style(fontStyleLarge, fontStyleSpace)}${style(fontStyleLarge, fontStyle, gradient)}   ${text} ${style(fontStyleLarge, fontStyleSpace)}  
${style(fontStyleSmall, fontStyle, subtitleLine)}${" ".repeat((6 + text.length) * 2 - subtitle.length - 2)}${style(fontStyleSmall, fontStyle, subtitleStyle)}${subtitle}${style(fontStyleSmall, fontStyle, subtitleLine)}${" ".repeat(2)}
${style(fontStyleSmall, fontStyleSpace)}${" ".repeat(3 * 2)}${text.repeat(2)}${" ".repeat(3 * 2)}`
		},
	};
})();
