const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
const Hand = require("../structures/hand")
module.exports = {
    display_name: "Draw Color",
    emoji: "🎨",
    description: "Make the next player draw until they get a specified color.",
    /**
     *
     * @param {Game} game
     * @param {*} data
     */
    async effect(game, data) {
        // const collector = new InputCollector(game, "color", game.current_player)
        // const color = await collector.getResponse("Choose a color to draw!", "Invalid color!")
        const color = data.play_object.card.color
        game.step()
        let total_cards = 0
        if (color) {
            while (game.deck[game.deck.length - 1].color != color) {
                total_cards++
                await game.draw(1, game.current_player, false)
                if (game.deck.length == 1) {
                    break
                }
            }
            total_cards++
            await game.draw(1, game.current_player, false)
            return game.channel.send(`${game.current_player.name} drew **${total_cards}** cards!`)
        }
        else {
            return game.channel.send("Response timed out.")
        }
    }
}