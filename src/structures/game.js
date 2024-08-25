const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, ButtonInteraction } = require("discord.js")
const DiscardPile = require("./discardpile")
const DrawPile = require("./drawpile")
const Player = require("./player")
const PlayerList = require("./player_list")
const path = require("path")
const { Card } = require("./card")
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
        this.eliminated_list = new PlayerList() // anyone who loses all their lives goes here
        this.current_turn = 0
        this.starting_cards = 7
        this.draw_stack = 0
        this.play_direction = 1
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
        this.channel.send({embeds: [this.display_embed(`start_game`)], components: [this.buttons()]})
        this.button_collector = this.interaction.client.on("interactionCreate", this.process_button)
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
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId(`table`)
            .setLabel(`Table`)
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId(`players`)
            .setLabel(`Players`)
            .setStyle(ButtonStyle.Primary),
        ]
        const default_action_row = new ActionRowBuilder()
        .setComponents(buttons)
        return default_action_row
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
    // PROCESSING COMMANDS
    /**
     * Process the input of a message.
     * @param {Message} message The discord message to process.
     */
    process_input = async (message) => {
        const {author, content, channel} = message
        const player = this.player_list.findPlayer(author)
        if (!player) {
            // handle any audience things here
            return
        }
        const play_object = player.hand.parse(content)
        if (!play_object["dish"]) {
            console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the dish.`)
        }
        if (play_object["card_index"] == undefined || isNaN(play_object["card_index"])) {
            console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the card index.`)
        }
        const discard_pile = this.discard_piles[play_object["dish"]]
        let is_valid = false
        const card = player.hand[play_object["card_index"]]
        if (typeof card.customCheck == 'function') {
            is_valid ||= card.customCheck({message, game: this})
        }
        else {
            is_valid ||= card.color == discard_pile.top_card.color || card.icon == discard_pile.top_card.icon
            is_valid ||= card.wild
            is_valid ||= discard_pile.top_card.wild
        }
        if (!is_valid) {
            return await message.reply(`You can't play that card there!`)
        }
        if (typeof card.customDiscardBehavior == 'function') {
            card.customDiscardBehavior({message, game: this})
        }
        else {
            discard_pile.push(player.hand.splice(play_object["card_index"], 1))
        }
        await this.process(card.effect)
        await channel.send(`${player.name} played a ${card.display_text()} on dish ${play_object["dish"]}.`)
    }
    /**
     * Process a button interaction.
     * @param {ButtonInteraction} button_interaction 
     */
    process_button = async (button_interaction) => {
        if (!button_interaction.isButton()) {
            return
        }
        const {customId, user} = button_interaction
        const player = this.player_list.findPlayer(user.id)
        switch (customId) {
            case `hand`:
                if (!player) {
                    return button_interaction.reply({ephemeral: true, content: `You're not in this game!`})
                }
                button_interaction.reply({ephemeral: true, embeds: [player.hand.embed()], components: player.hand.buttons()}) // replace with: content: player.hand.text()
                break
            case `table`:
                break
            case `players`:
                break
            case `history`:
                break
            default: 
                try {
                    const effect = require(path.join(__dirname, `../effects/${customId}.js`))
                    const effect_desc_embed = new EmbedBuilder()
                    .setTitle(effect.display_name)
                    .setDescription(effect.description)
                    button_interaction.reply({ephemeral: true, embeds: [effect_desc_embed]})
                }
                catch (error) {
                    button_interaction.update({content: `An error occurred: ${error}`})
                    console.log(`An error occurred: ${error}`)
                }
            // add part for processing effect info too https://discord.com/channels/781354877560815646/1276074561858834452/1276074569685274635
        }
        
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
    // GAMEPLAY COMMANDS
    /**
     * Moves to the next player.
     */
    step() {
        this.current_turn += this.play_direction + this.player_list.length
        this.current_turn %= this.player_list.length
    }
    /**
     * Reverses the turn order. Skips if there are only 2 players.
     * @returns true if this skipped a player, false otherwise
     */
    reverse() {
        this.play_direction *= -1
        if (this.player_list.length <= 2) {
            this.step()
            return true
        }
        return false
    }
}