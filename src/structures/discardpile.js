const { Card } = require("./card")

module.exports = class DiscardPile extends Array {
    constructor() {
        super()
    }
    /**
     * @returns {Card}
     */
    get top_card() {
        return this[this.length - 1]
    }
    flip() {
        for (const c of this) {
            c.flip()
        }
    }
}