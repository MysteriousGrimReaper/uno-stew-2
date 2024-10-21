const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
module.exports = {
    display_name: `Ice Cream`,
    emoji: `🍦`,
    description: `Choose any other player to draw 2 cards.`,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    async effect(game, data) {
        const collector = new InputCollector(game, "player", game.current_player)
        const target = await collector.getResponse(`Choose a player to draw cards!`, `Invalid player!`)
        if (target) {
            await game.draw(2, target, false)
            return game.channel.send(`${target.name}, draw 2 cards.`)
        }
        else {
            return game.channel.send(`Response timed out.`)
        }
    }
}