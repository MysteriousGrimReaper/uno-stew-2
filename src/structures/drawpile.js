const fs = require("fs")
const path = require("path")
const { CardFace, Card } = require("./card")
module.exports = class DrawPile extends Array {
    constructor(data) {
        super()
        Object.assign(data)
    }
    load(deck) {
        const deck_string = fs.readFileSync(path.join(__dirname, `../decks`, deck + `.csv`),
        { encoding: 'utf8', flag: 'r' })
        const card_string_array = deck_string.replaceAll(`\r`, ``).split(`\n`).map(c => c.split(`,`).map(prop => prop.length < 1 ? undefined : prop))
        const card_face_array = card_string_array.slice(1).map(c => {
            return card_string_array[0].reduce((acc, cv, index) => {
                acc[cv] = c[index]
                return acc
            }, {})
        })
        const card_array = []
        while (card_face_array.length > 0) {
            const front = card_face_array.splice(Math.floor(Math.random() * card_face_array.length), 1)[0]
            const back = card_face_array.splice(Math.floor(Math.random() * card_face_array.length), 1)[0]
            card_array.push(new Card(front, back))
        }
        this.push(...card_array)
    }
    shuffle() {
        for (let i in this) {
            if (!isNaN(i)) {
                const j = Math.floor(Math.random() * this.length)
                const temp = this[i];
                this[i] = this[j];
                this[j] = temp;
            }
        }
    }
    /**
     * Use this instead of pop() so that the deck never runs out
     */
    deal() {
        if (this.length <= 0) {
            this.replenish()
        }
        return this.pop()
    }
    replenish() {
        for (let pile of this.game.discard_piles) {
            while (pile.length > 1) {
                this.push(pile.shift())
            }
        }
        this.shuffle()
    }
}