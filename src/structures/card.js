const fs = require("fs")
const path = require("path")
/**
 * Card color names
 */
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
    static j = `Jelly`
}
// all card types
class CardFace {
    static r = 0xee0000
    static b = 0x0000ee
    static g = 0x00ee00
    static y = 0xeeee00
    static m = 0xee00ee
    static o = 0xee7700
    static p = 0xee6666
    static s = 0x999999
    static a = 0x993300
    static i = 0xdddddd
    static j = 0xeeeeee
    constructor(card_data) {
        this.extra_text = ``
        this.draw_stackable = false
        Object.assign(this, card_data)
        this.color ??= `r`
        this.wild ??= false
        this.icon ??= `0`
        try {
            const effect_module = require(path.join(__dirname, "../effects", this.icon + `.js`))
            Object.assign(this, effect_module) // assigns this.effect, this.emoji, this.display_name
            //console.log(this)
        }
        catch (error) {
            this.display_name = this.icon
        }
    }
    /**
     * @param [options={}] - Any options for how to display the text.
     * - `hand` - as it would show up in your hand.
     * @returns How this card will show up when in the discard pile.
     */
    display_text(options = {}) {
        const {hand} = options
        return `${this.wild ? `Wild` : CardColors[this.color]} ${this.display_name} ${this.extra_text}`.trim()
    }
    /**
     * @returns The hex color of this card face.
     */
    get hex() {
        return CardFace[this.color] ?? 0x000
    }
}
class Card extends CardFace {
    constructor(front_data, back_data) {
        super(front_data)
        this.back = new CardFace(back_data)
    }
    /**
     * Flips the card.
     */
    flip() {
        const temp = {}
        Object.assign(temp, this.back)
        Object.assign(this.back, this)
        Object.assign(this, temp)
    }
    isValid(game) {
        if (game.draw_stack > 0 && !this.draw_stackable) {
            return false
        }
        return true
    }
    /**
     * @deprecated don't use this
     * @param {string} text The message content to parse.
     * @returns {number} Likelihood that this card is what the player is referring to.
     */
    parseInput(text) {
        let likely = 0
        if (text.includes(this.color)) {
            likely += 1
        }
        if (text.includes(this.icon)) {
            likely += 1
        }
        if (text.includes(this.color + this.icon)) {
            likely += 1
        }
        // to-do: add in all the different possible parsing combinations
        return likely
    }
}
module.exports = {
    Card,
    CardColors,
    CardFace
}