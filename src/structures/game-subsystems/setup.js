const DiscardPile = require("../discardpile")
const DrawPile = require("../drawpile")

module.exports = class GameSetup {
    /**
     * @param {GameData} data The information to initialize the series with. (done at the very start of a series)
     */
    static async initialize(game, data) {
        const {deck, players} = data
        game.deck = new DrawPile({
            game
        })
        game.deck.load(deck)
        game.discard_piles = [
            new DiscardPile({game}),
            new DiscardPile({game}),
            new DiscardPile({game}),
            new DiscardPile({game})
        ]
        game.addPlayers(...players)
        game.player_list.forEach(p => {
            p.chocolate = 0
        })
        game.input_collector = game.channel.createMessageCollector({
            filter: (m) => !m.author.bot
        })
        game.input_collector.on(`collect`, await game.process_input)
    }
    /**
     * Start a game.
     */
    static async start(game) {
        game.deck.shuffle()
        for (let player of game.player_list) {
            player.add(game.starting_cards)
        }
        for (let dpile of game.discard_piles) {
            dpile.push(game.deck.deal())
        }
        await game.channel.send({embeds: [game.display_embed(`start_game`)], components: [game.buttons()]})
        game.button_collector = game.interaction.client.on("interactionCreate", game.process_button)
    }
}