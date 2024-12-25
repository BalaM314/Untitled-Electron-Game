/*!license
Copyright © <BalaM314>, 2024.
This file is part of Untitled Electron Game.
Untitled Electron Game is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
Untitled Electron Game is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with Untitled Electron Game. If not, see <https://www.gnu.org/licenses/>.
*/
import { Buildings } from "../content/content.js";
import { bundle } from "../content/i18n.js";
import { tech, objectives } from "../objectives.js";
import { tooltip, round, bindFunctionProperties } from "../util/funcs.js";
import { Pos } from "../util/geom.js";
import { Game, consts, settings } from "../vars.js";
import { Item } from "../world/world.js";
import { DOM } from "./dom.js";
import { Camera } from "./graphics.js";
import { Input, keybinds } from "./input.js";
export const HUD = {
    elements: [DOM.hudtextEl, DOM.resourcesEl, DOM.objectiveEl, DOM.toolbarEl, DOM.buttonsPane],
    hidden: true,
    hide() {
        this.hidden = true;
        this.updateVisibility();
    },
    show() {
        this.hidden = false;
        this.updateVisibility();
    },
    updateVisibility() {
        if (this.hidden) {
            tech.hideMenu();
            this.elements.forEach(e => e.classList.add("hidden"));
        }
        else
            this.elements.forEach(e => e.classList.remove("hidden"));
    },
    toggle() {
        this.hidden = !this.hidden;
    },
    updateTooltipPosition() {
        DOM.tooltipbox.style.setProperty("--x", `${Math.min(Input.mouseX, window.innerWidth - 200)}px`);
        DOM.tooltipbox.style.setProperty("--y", `${Math.min(Input.mouseY, window.innerHeight - 50)}px`);
    },
    updateTooltip() {
        const { tooltipbox } = DOM;
        const hovered = Input.latestMouseEvent?.target;
        if (!(hovered instanceof HTMLElement))
            return;
        if (hovered.id.startsWith("research_")) {
            const hoveredID = hovered.id.split("research_")[1];
            const node = tech.get(hoveredID);
            const block = Buildings.getOpt(hoveredID.split("building_")[1]);
            this.updateTooltipPosition();
            const message = node.missingItem() ? `<span style="color:#FAA"> Missing item: ${bundle.get(`item.${node.missingItem()}.name`)}</span>` : "Click to research!";
            if (node.status() == "inaccessible") {
                tooltipbox.innerHTML = "?";
            }
            else if (node.status() == "locked") {
                tooltipbox.innerHTML = block?.tooltip(message) ??
                    tooltip(bundle.get(`research.${hoveredID}.name`), [
                        bundle.get(`research.${hoveredID}.description`),
                        message,
                    ]);
                node.showCost();
            }
            else {
                tooltipbox.innerHTML = block?.tooltip() ??
                    tooltip(bundle.get(`research.${hoveredID}.name`), [
                        bundle.get(`research.${hoveredID}.description`),
                    ]);
            }
        }
        else if (keybinds.display.show_tooltip.isHeld()) {
            this.updateTooltipPosition();
            if (!hovered || hovered == DOM.clickcapture) {
                tooltipbox.innerHTML = Game.level1.getTooltip(...Camera.unproject(...Input.mouse));
            }
            else if (hovered instanceof HTMLElement) {
                if (hovered instanceof HTMLImageElement && hovered.parentElement == DOM.toolbarEl) {
                    const block = Buildings.getOpt((hovered.id.split("toolbar_")[1] ?? ""));
                    if (block) {
                        if (block.unlocked()) {
                            tooltipbox.innerHTML = block.tooltip();
                        }
                        else {
                            tooltipbox.innerHTML = tooltip("Not yet unlocked", ["Research this building to unlock it."]);
                        }
                    }
                }
                else if (hovered === DOM.hudtextEl) {
                    tooltipbox.innerHTML = tooltip("Hud Text", ["This area displays useful information, like the current FPS, cursor position, and power grid status."]);
                }
                else if (hovered === DOM.resourcesEl) {
                    tooltipbox.innerHTML = tooltip("Resources", ["These items can be used to construct buildings, or research new ones."]);
                }
                else if (hovered instanceof HTMLSpanElement && hovered.parentElement == DOM.resourcesEl) {
                    tooltipbox.innerHTML = Item.getTooltip(hovered.id);
                }
                else if (hovered === DOM.objectiveEl || hovered === DOM.objectiveTitle ||
                    hovered === DOM.objectiveText || hovered === DOM.objectiveDescription ||
                    hovered === DOM.objectiveNextButton) {
                    tooltipbox.innerHTML = tooltip("Objective", ["This box shows the current objective. It may also contain tips and useful information."]);
                    Game.transientStats.objectiveHovered = true;
                }
                else if (hovered.id == "research-button" || hovered.id == "research-header-text" || hovered.id == "research-header" || hovered.id == "research-exit-button" || hovered.id == "research-menu" || hovered.className == "research-tree-inner") {
                    tooltipbox.innerHTML = tooltip("Research", ["This menu allows you to research new buildings."]);
                }
                else if (hovered.id == "settings-button") {
                    tooltipbox.innerHTML = tooltip("Settings", ["This menu allows you to change the game settings."]);
                }
                else if (hovered.id == "buttons-pane") {
                    return;
                }
                else {
                    tooltipbox.innerHTML = `???${hovered.id}`;
                }
            }
            else {
                tooltipbox.innerHTML = "[unknown]";
            }
        }
        else {
            tooltipbox.innerHTML = "";
            tooltipbox.style.setProperty("--x", "-1000px");
            tooltipbox.style.setProperty("--y", "-1000px");
        }
    },
    updateHudText(currentFrame) {
        const mousePosition = "Mouse position: " + Camera.unproject(...Input.mouse).map(Pos.pixelToTile).join(",");
        const frameMSLast10 = Game.transientStats.frameTimes.mean(10, null);
        const frameMSLast120 = Game.transientStats.frameTimes.mean(120, null);
        const fpsLast10 = frameMSLast10 ? Math.min(consts.ups, round(1000 / frameMSLast10, 1)) : "...";
        const fpsLast120 = frameMSLast120 ? Math.min(consts.ups, round(1000 / frameMSLast120, 1)) : "...";
        const fpsText = `FPS: ${fpsLast10}/${fpsLast120}`;
        const debugText = settings.debug ? `C:${currentFrame.cps} T:${currentFrame.tps} I:${currentFrame.ips} MS:${frameMSLast10}` : "";
        const { grid } = Game.level1;
        const gridSatisfaction = grid.powerRequested == 0 ? 1 : grid.maxProduction / grid.powerRequested;
        const powergridText = grid.maxProduction == 0 && grid.powerRequested == 0 ? "" :
            `Power: <span style="color: ${gridSatisfaction < 0.3 ? "red" :
                gridSatisfaction < 0.7 ? "orange" :
                    gridSatisfaction < 1 ? "yellow" :
                        "lime"};">${Math.floor(grid.powerRequested)}/${Math.floor(grid.maxProduction)}</span>`;
        const powerLowText = gridSatisfaction < 1 ? `<span style="color:red;">Insufficient power!</span>` : "&nbsp;";
        DOM.hudtextEl.innerHTML = [mousePosition, fpsText, debugText, powergridText, powerLowText].filter(s => s.length > 0).join("<br>\n");
    },
    updateResources() {
        const { resourcesItems } = DOM;
        for (const [id, amount] of Object.entries(Game.level1.resources)) {
            const data = Game.level1.resourceDisplayData[id];
            const shouldDisplay = data.shouldShowAlways || amount > 0 || data.amountRequired != null || (data.flashEffect != null && data.flashExpireTime > Date.now());
            if (shouldDisplay) {
                resourcesItems[id]?.style.removeProperty("display");
                resourcesItems[id] ??= (() => {
                    const el = document.createElement("span");
                    el.id = id;
                    el.style.setProperty("--image-url", `url("assets/textures/item/${id}.png")`);
                    el.title = [bundle.get(`item.${id}.name`, ""), bundle.get(`item.${id}.description`, "")].filter(Boolean).join("\n");
                    DOM.resourcesEl.appendChild(el);
                    return el;
                })();
                resourcesItems[id].innerText = data.amountRequired ? `${amount.toString()}/${data.amountRequired}` : amount.toString();
                if (data.flashEffect && data.flashExpireTime > Date.now())
                    resourcesItems[id].classList.add(data.flashEffect);
                else
                    resourcesItems[id].classList.forEach(c => resourcesItems[id].classList.remove(c));
            }
            else {
                resourcesItems[id]?.style.setProperty("display", "none");
            }
        }
    },
    updateObjective() {
        const objective = objectives.objectives.find(o => !o.completed);
        if (objective) {
            DOM.objectiveText.innerHTML = objective.name().replaceAll(`\\n`, "<br>");
            DOM.objectiveDescription.innerHTML = objective.description().replaceAll(`\\n`, "<br>");
            DOM.objectiveEl.classList[objective.satisfied ? "add" : "remove"]("complete");
        }
        else {
            DOM.objectiveEl.classList.add("hidden");
        }
    },
    updateToolbar() {
        for (const block of Buildings) {
            const img = document.querySelector(`#toolbar img#toolbar_${block.id}`);
            if (!img)
                continue;
            if (block.unlocked()) {
                img.classList.remove("locked");
            }
            else {
                img.classList.add("locked");
            }
        }
    },
    display(currentFrame) {
        tech.display();
        this.updateTooltip();
        this.updateHudText(currentFrame);
        this.updateResources();
        this.updateToolbar();
        this.updateVisibility();
        this.updateObjective();
    },
};
bindFunctionProperties(HUD);
export const GUI = {
    toggleResearchMenu() {
        if (tech.menuVisible)
            tech.hideMenu();
        else
            tech.showMenu();
    },
    alerts: {
        list: [],
        active: false,
    },
    alert(message) {
        if (!this.alerts.list.includes(message))
            this.alerts.list.push(message);
    },
    closeAlert() {
        DOM.alertbox.classList.remove("active");
        this.alerts.list.shift();
        this.alerts.active = false;
    },
    updateAlertDialog() {
        if (GUI.alerts.list.length && !GUI.alerts.active) {
            Input.mouseDown = false;
            DOM.alertmessage.innerText = GUI.alerts.list[0];
            DOM.alertmessage.style.setProperty("--text-length", DOM.alertmessage.innerText.length.toString());
            DOM.alertbox.classList.add("active");
            GUI.alerts.active = true;
        }
    },
    closeDialog() {
        if (this.alerts.active)
            this.closeAlert();
        else if (tech.menuVisible)
            tech.hideMenu();
    },
};
bindFunctionProperties(GUI);
