const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
const Hand = require("../structures/hand")
module.exports = {
    display_name: "All-Purpose Flour",
    emoji: "🌾",
    description: "Choose between a Skip, Reverse, or Draw 2 effect. If a draw stack is currently active, this card counts as a Draw 2.",
    draw_stackable: true,
    /**
     *
     * @param {Game} game
     * @param {*} data
     */
    async effect(game, data) {
        const inputs = {
            "sk": "skip",
            "s": "skip",
            "r": "reverse",
            "re": "reverse",
            "rev": "reverse",
            "nou": "reverse",
            "+2": "draw 2",
            "d2": "draw 2",
            "2": "draw 2"
        }
        const parser = (input) => {
            for (const key in Object.keys(inputs)) {
                if (input.toLowerCase().startsWith(key)) {
                    return inputs[key]
                }
            }
            return false
        }
        let effect
        const collector = new InputCollector(game, parser, game.current_player)
        effect = await collector.getResponse("Choose an effect to perform! (skip, reverse, draw 2)", "Invalid entry.")
        if (effect) {
            switch(effect) {
                
            }
        }
        else {
            return game.channel.send("Response timed out.")
        }
    }
}