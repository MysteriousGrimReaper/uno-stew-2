const { EmbedBuilder, ButtonBuilder } = require("discord.js")
const DiscardPile = require("./discardpile")
const DrawPile = require("./drawpile")
const Player = require("./player")
const PlayerList = require("./player_list")
/**
    * @typedef {Object} GameData
    * @property {string} deck The name of the deck to use.
 */
module.exports = class Game {
    constructor(data) {
        Object.assign(this, data)
        this.is_processing = false
        this.effect_queue = []
        this.player_list = new PlayerList()
        this.current_turn = 0
        this.starting_cards = 7
        if (!this.interaction) {
            console.warn(`No interaction set for the game!`)
        }
        Object.assign(this, {
            channel: this.interaction.channel
        })
    }
    // GAME MANAGEMENT COMMANDS
    /**
     * @param {GameData} data The information to initialize the series with. (done at the very start of a series)
     */
    initialize(data) {
        const {deck, players} = data
        this.deck = new DrawPile({
            game: this
        })
        this.deck.load(deck)
        this.discard_piles = [
            new DiscardPile({game: this}),
            new DiscardPile({game: this}),
            new DiscardPile({game: this}),
            new DiscardPile({game: this})
        ]
        this.addPlayers(...players)
        this.player_list.forEach(p => {
            p.chocolate = 0
        })
        this.input_collector = this.channel.createMessageCollector({
            filter: (m) => !m.author.bot
        })
        this.input_collector.on(`collect`, this.process_input)
        console.log(`Game initialized with ${this.player_list.length} players.`)
    }
    /**
     * Start a game.
     */
    start() {
        this.deck.shuffle()
        for (let player of this.player_list) {
            player.add(this.starting_cards)
        }
        for (let dpile of this.discard_piles) {
            dpile.push(this.deck.deal())
        }
        this.channel.send({embeds: [this.display_embed(`start_game`)]})
    }
    // DECK COMMANDS
    replenish() {
        for (let pile of this.discard_piles) {
            while (pile.length > 1) {
                this.deck.push(pile.shift())
            }
        }
        this.deck.shuffle()
    }
    // EMBEDS
    /**
     * 
     * @param {string} type The type of embed to display
     * - start_game - Displays the start of a new game. 
     * - table - Displays the table embed
     */
    display_embed(type) {
        let current_top_cards_text = `The current top cards are:\n${
            this.discard_piles.map(pile => pile[pile.length - 1].display_text())
            .map((card_text, index) => `Dish ${index + 1}: **${card_text}**`)
            .join(`\n`)
        }`
        switch (type) {
            case `start_game`: 
                return {
                    description: `A new UNO Stew match has started! ${current_top_cards_text}`
                }
            case `table`:
                return {
                    description: `${current_top_cards_text}`
                }
        }
    }
    buttons() {
        const buttons = [
            new ButtonBuilder()
            .setCustomId(`hand`)
            .setLabel(`Hand`)
        ]
    }
    // PLAYER MANAGEMENT COMMANDS
    /**
     * 
     * @param  {...User} players The players to add.
     */
    addPlayers(...players) {
        for (let p of players) {
            const player = new Player({
                user: p,
                game: this
            })
            this.player_list.push(player)
        }
    }
    /**
     * 
     * @param {PlayerResolvable} player_resolvable
     */
    removePlayer(player_resolvable) {
        return this.player_list.removePlayer(player_resolvable)
    }
    async process_input(message) {
        const {author, content} = message
        // to-do: add input processing
    }
    /**
     * 
     * @param {function} effect The effect function to evaluate. Should take the current game state into effect.
     */
    async process(effect) {
        this.effect_queue.push(effect)
        if (this.is_processing) {
            return
        }
        this.is_processing = true
        while (this.effect_queue.length > 0) {
            await this.effect_queue[0](this)
            this.effect_queue.shift()
        }
    }
}