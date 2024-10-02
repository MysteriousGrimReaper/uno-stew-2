const Game = require(`../structures/game`)
module.exports = {
    display_name: `99`,
    emoji: `⬛`,
    description: `You cannot play this card by matching it.`,
    /**
    *
    * @param {Game} game 
    * @param {*} data 
    */
    effect(game, data) {
    },
    customCheck() {
        return false
    }
}