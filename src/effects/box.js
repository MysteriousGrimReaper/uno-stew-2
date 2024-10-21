/**
 * Item Box (box): When you play this card, flip over the top card on the draw pile and place it on top of this one. Activate one of the following effects based on its color:
Red: Take another turn.
Green: Name a player to make them draw a card.
Yellow: The player before you draws 2 cards.
Blue: The player with the least amount of cards must draw cards equal to the most cards anyone currently has.
Magenta: Name a player to make them draw 3 cards.
Orange: Name 4 players to turn the oven up by 1-4. 
Pink: Name 3 players to make them draw 3 cards each.
Silver: Everyone else must draw a card. Take another turn.
Ivory: Steal a card from the next player.
Amber: Discard cards until you have 2 cards left in your hand.
Jelly: Discard cards until you have the least number of cards in your hand out of everyone else.
Wild: Draw 2 cards, but set the color.
 */
/**
 * const color_collector = new InputCollector(game, "color", game.current_player)
                const wild_color_collected = await color_collector.getResponse("Choose a color to set the wild card to!", "Invalid color. Choose from one of the 10 colors available.")
                if (wild_color_collected) {
                    card.color = wild_color_collected
                    card.wild = false
                    game.channel.send(`Color set to ${CardColors[card.color]}.`)
                }
                else {
                    card.color = discard_pile[discard_pile.length - 2].color
                    card.wild = false
                    game.channel.send(`Response timed out, defaulting to ${CardColors[card.color]}.`)
                }
 */
const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
const Hand = require("../structures/hand")
const description = `
When you play this card, flip over the top card on the draw pile and place it on top of this one. Activate one of the following effects based on its color:
Red: Take another turn.
Green: Name a player to make them draw a card.
Yellow: The player before you draws 2 cards.
Blue: The player with the least amount of cards must draw cards equal to the most cards anyone currently has.
Magenta: Name a player to make them draw 3 cards.
Orange: Name 4 players to turn the oven up by 1-4. 
Pink: Name 3 players to make them draw 3 cards each.
Silver: Everyone else must draw a card. Take another turn.
Ivory: Steal a card from the next player.
Amber: Discard cards until you have 2 cards left in your hand.
Jelly: Discard cards until you have the least number of cards in your hand out of everyone else.
Wild: Draw 2 cards, but set the color.
`
module.exports = {
    display_name: "Meal Kit",
    emoji: "🍔",
    description,
    /**
     *
     * @param {Game} game
     * @param {*} data
     */
    async effect(game, data) {
        const {play_object} = data
        const {dish} = play_object
        const discard_pile = game.discard_piles[dish]
        const drawn_card = game.deck.deal()
        discard_pile.push(drawn_card)
        if (drawn_card.wild) {
            const collector = new InputCollector(game, "color", game.current_player)
            const color = await collector.getResponse("Choose a color to discard!", "Invalid color!")
            if (color) {
            }
            else {
                return game.channel.send("Response timed out.")
            }
        }
        
    }
}