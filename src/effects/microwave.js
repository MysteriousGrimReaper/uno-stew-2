const Game = require("../structures/game")
module.exports = {
    display_name: `Microwave`,
    emoji: `♨️`,
    description: `Force everyone to draw between 1-4 cards, including yourself.`,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    async effect(game, data) {
        for (const player of game.player_list) {
            await game.draw(Math.ceil(Math.random() * 4), player, false)
        }
        return game.channel.send(`Everyone drew some cards!`)
    }
}