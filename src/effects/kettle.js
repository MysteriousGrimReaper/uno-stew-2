const Game = require("../structures/game")
module.exports = {
    display_name: `Kettle`,
    emoji: `🫖`,
    description: `Force everyone to draw 2 cards, including yourself.`,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    async effect(game, data) {
        for (const player of game.player_list) {
            await game.draw(2, player, false)
        }
        return game.channel.send(`Everyone drew 2 cards!`)
    }
}