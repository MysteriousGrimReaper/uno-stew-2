const Game = require("../structures/game")

module.exports = {
    display_name: `Skip`,
    emoji: `<:skip:1276559353234587688>`,
    description: `Skip the next player in the turn order.`,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     * @returns 
     */
    effect(game, data) {
        game.step()
        return game.channel.send(`You skipped ${game.current_player.name}'s turn!`)
    }
}