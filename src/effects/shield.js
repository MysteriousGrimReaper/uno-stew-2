const Game = require(`../structures/game`)
module.exports = {
    display_name: `Shield`,
    emoji: `🛡️`,
    description: `Block an incoming draw stack.\nDoes nothing if there is no draw stack.`,
    draw_stackable: true,
    /**
    *
    * @param {Game} game 
    * @param {*} data 
    */
    effect(game, data) {
        if (draw_stack > 0) {
            game.draw_stack = 0
            return game.channel.send(`The draw stack was blocked!`)
        }
    }
}