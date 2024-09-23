const Game = require("../structures/game")
const draw_count = 4
module.exports = {
    display_name: `+4`,
    emoji: `<:draw_4:1279852167435517973>`,
    description: `Make the next player draw 4 cards.`, draw_stackable: true,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    effect(game, data) {
        if (game.draw_stack_min > draw_count) return game.channel.send(`You can't play that card, it's not powerful enough!`)
        if (game.draw_stack_pile >= 0 && data?.play_object?.dish != game.draw_stack_pile) {
            return game.channel.send(`To continue the stack, you must play on the same dish. (${game.draw_stack_pile})`)
        }
        game.draw_stack += draw_count
        game.draw_stack_min = draw_count
        game.draw_stack_pile = data?.play_object?.dish
        return game.channel.send(`The next player must draw ${ draw_count } more cards, for a total of **${game.draw_stack}** cards!`)
    }
}