const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
const Hand = require("../structures/hand")
module.exports = {
    display_name: `Trade Hands`,
    emoji: `🤝`,
    description: `Trade your whole hand with another palyer.`,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    async effect(game, data) {
        const collector = new InputCollector(game, "player", game.current_player)
        const target = await collector.getResponse(`Choose a player to trade with!`, `Invalid player!`)
        if (target) {
            const target_new_hand = new Hand({player: target})
            while (game.current_player.hand.length > 0) {
                target_new_hand.push(game.current_player.hand.pop())
            }
            while (target.hand.length > 0) {
                game.current_player.hand.push(target.hand.pop())
            }
            target.hand = target_new_hand
            return game.channel.send(`You traded with ${target.name}!`)
        }
        else {
            return game.channel.send(`Response timed out.`)
        }
    }
}