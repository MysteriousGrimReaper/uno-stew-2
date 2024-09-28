const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
module.exports = {
    display_name: `Double Scoop Ice Cream`,
    emoji: `🍨`,
    description: `Choose any other player to draw 4 cards.`,
    stack_on: [`icecream`],
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    async effect(game, data) {
        const collector = new InputCollector(game, "player", game.current_player)
        const target = await collector.getResponse(`Choose a player to draw cards!`, `Invalid player!`)
        if (target) {
            game.draw(4, target, false)
            return game.channel.send(`${target.name}, draw 4 cards.`)
        }
        else {
            return game.channel.send(`Response timed out.`)
        }
    }
}