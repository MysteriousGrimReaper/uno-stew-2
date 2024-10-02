module.exports = class CardValidators {
    static pile_invalid = (game, index) => {
        if (game.draw_stack_pile != -1) {
            return index != game.draw_stack_pile
        }
        else {
            return index == game.inactive_discard_pile
        }
    }
}