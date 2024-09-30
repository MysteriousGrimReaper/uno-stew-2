class Deck {
    static replenish(game) {
        console.log(game.discard_piles)
        for (let pile of game.discard_piles) {
            while (pile.length > 1) {
                game.deck.push(pile.shift())
            }
        }
        game.deck.shuffle()
    }
}
module.exports = Deck