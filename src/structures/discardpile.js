module.exports = class DiscardPile extends Array {
    constructor() {
        super()
    }
    get top_card() {
        return this[this.length - 1]
    }
}