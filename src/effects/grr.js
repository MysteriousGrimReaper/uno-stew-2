const Game = require(`../structures/game`)
module.exports = {
    display_name: `Grocery Bundle`,
    emoji: `🛍️`,
    description: `Force all other players to draw between 1-6 cards.`,
    stack_on: ['gr1', 'gr2'],
    /**
    *
    * @param {Game} game 
    * @param {*} data 
    */
    effect(game, data) {
        for (const i in game.player_list) {
            if (i != game.current_turn) {
                game.draw(Math.ceil(Math.random() * 6), game.player_list[i], false)
            }
        }
        return game.channel.send(`Groceries incoming! Everyone else must draw some cards.`)
    }
}