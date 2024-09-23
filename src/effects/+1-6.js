const Game = require("../structures/game")
module.exports = {
    display_name: `+[1,6]`,
    emoji: `<:draw_2:1276447672726978642>`,
    description: `Make the next player draw 1-6 cards.`, draw_stackable: true,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    effect(game, data) {
        let draw_count = Math.ceil(Math.random() * 6)
        if (game.draw_stack_min > 6) return game.channel.send(`You can't play that card, it's not powerful enough!`)
        if (game.draw_stack_pile >= 0 && data?.play_object?.dish != game.draw_stack_pile) {
            return game.channel.send(`To continue the stack, you must play on the same dish. (${game.draw_stack_pile})`)
        }
        draw_count = Math.max(game.draw_stack_min, draw_count)
        game.draw_stack += draw_count
        game.draw_stack_min = draw_count
        game.draw_stack_pile = data?.play_object?.dish
        return game.channel.send(`The next player must draw ${ draw_count } more cards, for a total of **${game.draw_stack}** cards!`)
    }
}