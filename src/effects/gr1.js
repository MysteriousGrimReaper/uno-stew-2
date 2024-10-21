const Game = require(`../structures/game`)
module.exports = {
    display_name: `Groceries 1`,
    emoji: `🛍️`,
    description: `Force all other players to draw 1 card.`,
    /**
    *
    * @param {Game} game 
    * @param {*} data 
    */
    effect(game, data) {
        for (const i in game.player_list) {
            if (i != game.current_turn) {
                await game.draw(1, game.player_list[i], false)
            }
        }
        return game.channel.send(`Groceries incoming! Everyone else must draw a card.`)
    }
}