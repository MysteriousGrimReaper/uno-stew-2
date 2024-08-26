const Game = require("../structures/game")

module.exports = {
    display_name: `Reverse`,
    emoji: `<:reverse:1276558143861555271>`,
    description: `Reverse the turn order.`,
    /**
     * 
     * @param {Game} game 
     * @param {Object} data 
     * @returns 
     */
    effect(game, data) {
        const reverse = game.reverse()
        return game.channel.send(reverse ? `You skipped ${game.current_player.name}'s turn!` : `The turn order was reversed!`)
    }
}