const Game = require("../structures/game")
const draw_count = 2
module.exports = {
    display_name: `+2`,
    emoji: `<:draw_2:1276447672726978642>`,
    description: `Make the next player draw two cards.`,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    effect(game, data) {
        if (game.draw_stack_min > draw_count) return game.channel.send(`You can't play that card, it's not powerful enough!`)
        game.draw_stack += draw_count
        game.draw_stack_min = draw_count
        game.draw_stack_pile = data?.play_object?.dish
        return game.channel.send(`The next player must draw ${draw_count} more cards, for a total of **${game.draw_stack}** cards!`)
    }
}