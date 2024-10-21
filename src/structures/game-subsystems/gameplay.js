module.exports = class Gameplay {
    /**
     * Moves to the next player.
     */
    static step(game, options = {}) {
        game.current_turn += game.play_direction + game.player_list.length
        game.current_turn %= game.player_list.length
        if (options.move_inactive_discard_pile) {
            game.deactivate_next_discard_pile()
        }
    }
    /**
     * Reverses the turn order.
     * @param {boolean} skipIfTwoPlayers Skip if there are only 2 players (default true)
     * @returns true if game skipped a player, false otherwise
     */
    static reverse(game, skipIfTwoPlayers = true) {
        game.play_direction *= -1
        if (game.player_list.length <= 2 && skipIfTwoPlayers) {
            game.step()
            return true
        }
        return false
    }
    /**
     * 
     * @param {number} count How many cards to draw
     * @param {Player} player The player to make draw
     * @param {boolean} move Whether or not to move on after drawing
     * @returns 
     */
    static async draw(game, count, player = game.current_player, move = true) {
        const cards = player.add(count)
        if (move) {
            game.step({move_inactive_discard_pile: true})
        }
        for (const card of cards) {
            await game.process(card.onDraw, {player, card, cards, count, move})
        }
        return count
    }
    static resetDrawStack(game) {
        const draw_value = game.draw_stack
        game.draw_stack = 0
        game.draw_stack_min = 0
        game.draw_stack_pile = -1
        return draw_value
    }
    /**
     * Flip all cards.
     */
    static flip(game) {
        game.deck.flip()
        for (const d in game.discard_piles) {
            d.flip()
        }
        for (const p in game.player_list) {
            p.hand.flip()
        }
    }
    static deactivate_next_discard_pile(game) {
        game.inactive_discard_pile++
        game.inactive_discard_pile %= 4
    }
}