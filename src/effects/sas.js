const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
module.exports = {
    display_name: `Steal A Slice`,
    emoji: `🥷`,
    description: `Steal a slice of pizza from another player.`,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    async effect(game, data) {
        const collector = new InputCollector(game, "player", game.current_player)
        const player_to_steal_from = await collector.getResponse(`Choose a player to steal from!`, `Invalid player!`)
        if (player_to_steal_from) {
            if (player_to_steal_from.pizza <= 0) {
                game.draw(3, player_to_steal_from)
                return game.channel.send(`${player_to_steal_from.name} had no pizza. Draw 3 cards instead.`)
            }
            player_to_steal_from.pizza--
            game.current_player.pizza++
            console.log(player_to_steal_from.pizza)
            console.log(game.current_player.pizza)
            return game.channel.send(`You stole a piece of pizza from ${player_to_steal_from.name}!`)
        }
        else {
            return game.channel.send(`Response timed out.`)
        }
    }
}