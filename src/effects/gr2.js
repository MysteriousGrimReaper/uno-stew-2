const Game = require(`../structures/game`)
module.exports = {
    display_name: `Groceries 2`,
    emoji: `🛍️`,
    description: `Force all other players to draw 2 cards.`,
    stack_on: ['gr1'],
    /**
    *
    * @param {Game} game 
    * @param {*} data 
    */
    effect(game, data) {
        for (const i in game.player_list) {
            if (i != game.current_turn) {
                game.draw(2, game.player_list[i], false)
            }
        }
        return game.channel.send(`Groceries incoming! Everyone else must draw 2 cards.`)
    }
}