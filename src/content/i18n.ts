/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
/* Contains the bundle system. */

import { crash } from "../util/funcs.js";


class I18NBundle {
	mapping:Map<string, string>;
	constructor(text:Array<[key:string, value:string]>){
		this.mapping = new Map(text);
	}
	static read(text:string, prefix?:string):I18NBundle {
		const entries:Array<[string, string]> = [];
		let _type = null;
		for(const l of text.split(/\r?\n/g).map(l => l.trim())){
			if(l.match(/^\[\w+\]$/)){
				_type = l.slice(1, -1);
				continue;
			} else if(l.length == 0) continue;
			const line = l.split(/ ?= ?/);
			if(line.length == 2 && line[0]!.length > 0 && line[1]!.length > 0){
				const [key, value] = line as [string, string];
				const parts = key.split(".");
				if(parts.length == 3 && parts.every(p => p.length > 0)){
					const [type, name, prop] = parts as [string, string, string];
					if(prefix) entries.push([`${type}.${prefix}${name}.${prop}`, value]);
					else entries.push([key, value]);
				} else if(parts.length == 2 && parts.every(p => p.length > 0) && _type != null){
					const [name, prop] = parts as [string, string];
					if(prefix) entries.push([`${_type}.${prefix}${name}.${prop}`, value]);
					else entries.push([`${_type}.${name}.${prop}`, value]);
				} else crash(`I18NBundle: Invalid key "${key}"`);
			} else crash(`I18NBundle: Invalid line "${l}"`);
		}
		return new I18NBundle(entries);
	}
	get(key:string, fallback = `???${key}???`){
		return this.mapping.get(key) ?? fallback;
	}
	//format?
}

export const bundle = I18NBundle.read(`\
[tile]
grass.name = Grass
stone.name = Stone
water.name = Water
sand.name = Sand
water.description = Buildings can't be built on water.
ore_coal.name = Coal Ore Node
ore_coal.description = Ore nodes are infinite, and can be mined with a miner.
ore_iron.name = Iron Ore Node
ore_iron.description = Ore nodes are infinite, and can be mined with a miner.
ore_copper.name = Copper Ore Node
ore_copper.description = Ore nodes are infinite, and can be mined with a miner.
null.name = [ERR!] Null Tile

[building]
conveyor.name = Conveyor Belt
conveyor.description = Transports items.
miner.name = Miner
miner.description = Place on ore nodes to extract ore.
trash_can.name = Trash Can
furnace.name = Furnace
furnace.description = Smelts ores into ingots.
extractor.name = Extractor
extractor.description = Can be placed over other buildings. Picks up items when placed on a conveyor or storage, and drops them into a different building. Use comma, period, and slash to change the length.
chest.name = Storage
chest.description = Stores items.
alloy_smelter.name = Alloy Smelter
alloy_smelter.description = Heats coal with iron ingots to produce steel.
resource_acceptor.name = Hub
stirling_generator.name = Stirling Generator
stirling_generator.description = Burns coal to inefficiently produce a small amount of electricity.
wiremill.name = Wiremill
wiremill.description = Turns ingots into wires.
compressor.name = Compressor
compressor.description = Turns ingots into plates.
lathe.name = Lathe
lathe.description = Turns ingots into rods.
multiblock_secondary.name = [ERR!] Multiblock Secondary
assembler.name = Assembler
assembler.description = Produces components from simpler ones.
null.name = [ERR!] No Building
arc_tower.name = Arc Tower
arc_tower.description = Shoots arcs, consuming power. Has no function other than looking cool.
power_source.name = Power Source
pipe.name = Pipe
pump.name = Pump
tank.name = Tank
boiler.name = Boiler
boiler.description = Burns coal to heat water into steam.
steam_generator.name = Steam Turbine
steam_generator.description = Produces large amounts of electricity from steam.

[item]
null.name = Debug Item
coalOre.name = Coal Ore
coalOre.description = Can be converted into Coal by a Furnace.
coal.name = Coal
stone.name = Stone
stoneBrick.name = Stone Brick
sand.name = Sand
sand.description = (unused)
ironOre.name = Iron Ore
ironOre.description = Can be smelted into Iron by a Furnace.
ironIngot.name = Iron Ingot
ironPlate.name = Iron Plate
ironRod.name = Iron Rod
steelIngot.name = Steel Ingot
steelPlate.name = Steel Plate
steelRod.name = Steel Rod
copperOre.name = Copper Ore
copperOre.description = Can be smelted into Copper by a Furnace.
copperIngot.name = Copper Ingot
copperWire.name = Copper Wire
stator.name = Stator
rotor.name = Rotor
motor.name = Motor
siliconCrude.name = Crude Silicon
siliconCrude.description = Contains many impurities, but might be suitable for large transistors.

[fluid]
water.name = Water
steam.name = Steam

[objective]
leave.name = Objective: Leave
leave.description = Go towards the left. Use WASD to move, and press Shift to scroll faster.
leave_satisfied.name = Objective: ...build a boat
leave_satisfied.description = Looks like you're stranded on an island. To get off, you'll need to make a boat from scratch.\\nClick the arrow to proceed.
tooltips.name = Use tooltips
tooltips.description = Move the mouse to this text and press Shift to show tooltips.
tooltips_satisfied.name = Use tooltips
tooltips_satisfied.description = Almost everything supports tooltips.
produceStone.name = Produce Stone
produceStone.description = Stone is used for most early-game buildings. Build a Miner on stone to produce it.
gatherStone.name = Gather Stone
gatherStone.description = Use conveyors to transport the stone to the Hub. Use the arrow keys to change the direction of placed conveyors. To break misplaced buildings, hold Backspace and move the cursor over a building.
gatherCoal.name = Gather Coal
gatherCoal.description = Most buildings will require a source of energy. Coal deposits are available close to the Hub.
researchStoneFurnace.name = Research a furnace
researchStoneFurnace.description = Coal can be used as fuel for furnaces, which can purify raw materials. Research the Furnace by clicking the 🧪 icon.
gatherStoneBrick.name = Gather Stone Bricks
gatherStoneBrick.description = The furnace can be used to produce Stone Bricks, which are more suitable for construction than raw stone. Use belts to direct Raw Stone into a Furnace.
gatherIronIngot.name = Gather Iron
gatherIronIngot.description = Iron ore nodes are found slightly farther away from the Hub in any direction. The ore requires processing before usage.
researchExtractor.name = Research the Extractor
researchExtractor.description = The extractor is a versatile item transportation device which can be placed on top of conveyors to split the flow of items. Press "," "." and "/" to change the length of the extractor.
researchAlloySmelter.name = Research the Alloy Smelter
researchAlloySmelter.description = Combining raw resources can produce stronger materials, such as steel.
gatherSteelIngot.name = Gather Steel
gatherSteelIngot.description = Steel is slow to produce. 8 alloy smelters running in parallel should produce enough to saturate a conveyor belt.
gatherCopperIngot.name = Gather Copper
gatherCopperIngot.description = Copper is a good electrical conductor, and is used in machines that produce or consume electricity. Its ore nodes are found far from the Hub.
researchStirlingGenerator.name = Research the Stirling Generator
researchStirlingGenerator.description = The Stirling Generator is a simple, but inefficient electrical generator that runs by burning items.
producePower.name = Produce Power
producePower.description = Use Coal to fuel a Stirling Generator. Produced electrical power is automatically transmitted to buildings that require power. (Note: if no buildings requiring power are present, the generator will not use any coal.)
researchCompressor.name = Research the Compressor
researchCompressor.description = The Compressor can convert metal ingots to plates.
gatherIronPlate.name = Gather Iron Plates
gatherIronPlate.description = Iron plates will be necessary to handle fluids.
researchPipe.name = Research Pipes
researchPipe.description = Pipes can be used to transport fluids. Unlike conveyors, there is no way to cross pipe lines.
researchPump.name = Research the Pump
researchPump.description = Pumps must be placed on water.
researchBoiler.name = Research the Boiler
researchBoiler.description = The Boiler can heat water to produce steam.
researchWiremill.name = Research the Wiremill
researchWiremill.description = Copper wires will be necessary for more advanced electrical buildings.
researchSteamGenerator.name = Research the Steam Turbine
researchSteamGenerator.description = This building can produce large amounts of electricity from steam. It may require more than one boiler to run at full efficiency.
activateSteamGenerator.name = Activate a Steam Turbine (or two)
activateSteamGenerator.description = Finally, enough electricity to run a properly sized factory.
researchLathe.name = Research the Lathe
researchLathe.description = The Lathe can produce rods from metal ingots. Unfortunately, most of the input is lost.
researchAssembler.name = Research the Assembler
researchAssembler.description = The Assembler is a large machine capable of producing useful items from their components.
produceStators.name = Produce Stators
produceStators.description = Stators are made from iron plates and copper wire.
produceRotors.name = Produce Rotors
produceRotors.description = Rotors are made from steel rods and copper wire.
produceMotors.name = Produce Motors
produceMotors.description = Motors are made by combining Stators and Rotors.
researchBoat.name = Research the Boat
researchBoat.description = It will take a lot of items to build a boat.

[research]
boat.name = Boat
boat.description = The final task.
`, "base_");

