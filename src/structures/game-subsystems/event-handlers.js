module.exports = class EventHandlers {
    static async end_turn(game, pre_effect_current_turn = game.current_turn) {
        game.eliminate_players_with_many_cards()
        const winner = game.check_for_wins()
        if (winner) {
            await game.handle_win(winner, pre_effect_current_turn)
        }
        if (game.winner) {
            return null
        }
        return true
    }
}