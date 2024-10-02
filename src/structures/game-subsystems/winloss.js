module.exports = class WinLossHandler {
    /**
     * Checks all players if they have more than 24 cards, and eliminates them if so.
     */
    static eliminate_players_with_many_cards(game) {
        for (const player_index in game.player_list) {
            const player = game.player_list[player_index]
            if (player.hand.length >= 25) {
                game.eliminated_list.push(game.player_list.splice(player_index, 1)[0])
                game.channel.send(`**⚠️ ${player.name} has been eliminated for hoarding.**`)
            }
        }
    }
    /**
     * 
     * @returns in this order:
     * 
     * null if there are no winners (???)
     * 
     * the player who won if there is 1 player left
     * 
     * the first player it finds who has 0 cards in their hand
     * 
     * the current player if there is a 4 match
     * 
     * the sudoku condition win
     */
    static check_for_wins(game) {
        if (game.player_list.length < 1) {
            return null
        }
        if (game.player_list.length == 1) {
            return {win_reason: "elimination", player: game.player_list[0]}
        }
        const zero_cards = game.player_list.find(p => p.hand.length == 0)
        if (zero_cards) {
            return {win_reason: "0 cards", player: zero_cards}
        }
        const matching_values = (card_args, check) => {
            let is_matching = true
            const first_value = card_args[0][check]
            for (const a of card_args) {
                is_matching &&= a[check] == first_value
            }
            return is_matching
        }
        const top_cards = game.discard_piles.map(d => d.top_card)
        const is_matching = matching_values(top_cards, "color") || matching_values(top_cards, "icon")
        if (is_matching) {
            return {win_reason: "matching cards", player: game.current_player}
        }
        const sudoku_values = top_cards.map(c => parseInt(c.icon))
        if (!sudoku_values.some(value => isNaN(value))) {
            const pile_1_check = sudoku_values[0] == sudoku_values[1] + sudoku_values[2] + sudoku_values[3]
            const pile_4_check = sudoku_values[3] == sudoku_values[1] + sudoku_values[2] + sudoku_values[0]
            const sudoku_check = (args) => {
                return args[0].color == args[1].color || args[0].icon == args[1].icon
            }
            const chain1 = sudoku_check(top_cards.slice(0, 2))
            const chain2 = sudoku_check(top_cards.slice(1, 3))
            const chain3 = sudoku_check(top_cards.slice(2, 4))
            if ((pile_1_check && chain2 && chain3) || (pile_4_check && chain1 && chain2)) {
                return {win_reason: "sudoku", player: game.current_player}
            }
        }
        return false
    }
    static async handle_win(game, winner) {
        let win_reason = ''
        switch(winner.win_reason) {
            case "elimination":
                win_reason = "All other players were eliminated."
                break
            case "0 cards":
                win_reason = `${winner.player.name} ran out of cards.`
                break
            case "matching cards":
                win_reason = 'All the pile\'s cards match in color or number.'
                break
            case "sudoku":
                win_reason = "All piles' cards sum up to either the first or last pile, and all other piles can be linked through either icon or color (literally how did you do game)."
                break
        }
        game.winner = winner.player
        game.channel.send(`# 🎉 ${winner.player.name} has won! 🎉\n${win_reason} Enjoy some fresh chocolate! 🍫`)
        game.input_collector.off(`collect`, await game.process_input)
        game.interaction.client.off("interactionCreate", game.process_button)
    }
}