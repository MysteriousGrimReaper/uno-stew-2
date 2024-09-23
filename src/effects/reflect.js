const Game = require(`../structures/game`)
module.exports = {
    display_name: `Reflect`,
    emoji: `🪞`,
    description: `Reflect an incoming draw stack, reversing the turn order and doubling the draw stack.\nDoes nothing if there is no draw stack.`,
    draw_stackable: true,
    /**
    *
    * @param {Game} game 
    * @param {*} data 
    */
    effect(game, data) {
        if (draw_stack > 0) {
            game.reverse(false)
            game.draw_stack *= 2
            return game.channel.send(`The draw stack was reflected and doubled!`)
        }
    }
}