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
}
// all card types
class CardFace {
    constructor(card_data) {
        this.extra_text = ``
        Object.assign(this, card_data)
        console.log(card_data)
        this.color ??= `r`
        this.wild ??= false
        this.icon ??= `0`
        try {
            const effect_module = require(path.join(__dirname, "../effects", this.icon + `.js`))
            Object.assign(this, effect_module) // assigns this.effect and this.display_name
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
    /**
     * 
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