const fs = require("fs")
const path = require("path")
/**
 * Card color enums
 */
class CardTypes {
    static r = 0
    static b = 1
    static g = 2
    static y = 3
    static m = 4
    static o = 5
    static p = 6
    static s = 7
    static a = 8
    static i = 9
}
class CardColors {
    static r = `Red`
    static b = `Blue`
    static g = `Green`
    static y = `Yellow`
    static m = `Magenta`
    static o = `Orange`
    static p = `Pink`
    static s = `Silver`
    static a = `Amber`
    static i = `Ivory`
    /**
     * Use this in conjunction with the CardTypes.
     * @example CardColors.c_map[this.color]
     */
    static c_map = [`Red`, `Blue`, `Green`, `Yellow`, `Magenta`, `Orange`, `Pink`, `Silver`, `Amber`, `Ivory`]
}
// all card types
class CardFace {
    constructor(card_data) {
        this.extra_text = ``
        Object.assign(this, card_data)
        this.color ??= CardTypes.r
        this.wild ??= false
        this.icon ??= `0`
        try {
            const effect_module = require(path.join(__dirname, "../effects", this.effect))
            Object.assign(this, effect_module) // assigns this.effect and this.display_name
        }
        catch {
            this.display_name = this.icon
        }
    }
    display_text() {
        return `${this.wild ? `Wild` : CardColors.c_map[this.color]} ${this.display_name} ${this.extra_text}`.trim()
    }
}

module.exports = class Card {
    constructor(front, back) {
        
    }
}