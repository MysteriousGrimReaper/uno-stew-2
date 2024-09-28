const Game = require("../structures/game")

module.exports = {
    display_name: `Flip`,
    emoji: `🔄`,
    description: `Flip all the cards over to their back sides.`,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     * @returns 
     */
    effect(game, data) {
        game.flip()
        return game.channel.send(`All the cards have been flipped!`)
    }
}