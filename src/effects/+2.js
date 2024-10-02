const Game = require("../structures/game")
const draw_count = 2
module.exports = {
    display_name: `+2`,
    emoji: `<:draw_2:1276447672726978642>`,
    description: `Make the next player draw two cards.`, draw_stackable: true,
    customCheck({game, play_object}) {
        const {dish, card} = play_object
        const discard_pile = game.discard_piles[dish]
        console.log(`custom check called on card ${card.display_name}`)
        if (game.draw_stack > 0) {
            const stack_on = [...Array(draw_count).keys()].map(k => `+${k}`)
            console.log(stack_on)
            if (game.draw_stack_pile >= 0 && dish != game.draw_stack_pile) {
                return false
            }
            return stack_on.includes(discard_pile.top_card.icon) || card.icon == discard_pile.top_card.icon
        }
        else {
            let is_valid = false
            is_valid ||= card.color == discard_pile.top_card.color || card.icon == discard_pile.top_card.icon
            is_valid ||= card.wild || card.color == "j"
            if (card.stack_on) {
                is_valid ||= card.stack_on.includes(discard_pile.top_card.icon)
            }
            is_valid &&= !game.pile_invalid(play_object["dish"])
            return is_valid
        }
        
    },
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    effect(game, data) {
        
        if (game.draw_stack_pile >= 0 && data?.play_object?.dish != game.draw_stack_pile) {
            return game.channel.send(`To continue the stack, you must play on the same dish. (${game.draw_stack_pile})`)
        }
        game.draw_stack += draw_count
        game.draw_stack_min = draw_count
        game.draw_stack_pile = data?.play_object?.dish
        return game.channel.send(`The next player must draw ${draw_count} more cards, for a total of **${game.draw_stack}** cards!`)
    }
}