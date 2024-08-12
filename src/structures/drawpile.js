const fs = require("fs")
const path = require("path")
module.exports = class DrawPile extends Array {
    constructor() {
        super()
    }
    load(deck) {
        const deck_string = fs.readFileSync(path.join(__dirname, `../decks`, deck + `.csv`),
        { encoding: 'utf8', flag: 'r' })
        const card_array = deck_string.replaceAll(`\r`, ``).split(`\n`).map(c => c.split(`,`).map(prop => prop.length < 1 ? undefined : prop))
        const card_object_array = card_array.slice(1).map(c => {
            return card_array[0].reduce((acc, cv, index) => {
                acc[cv] = c[index]
                return acc
            }, {})
        })
        this.push(...card_object_array)
        console.log(this)
    }
}