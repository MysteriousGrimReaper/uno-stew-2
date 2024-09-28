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
/**
 * @prop draw_stack
 */
module.exports = class Game {
    /**
     * 
     * @param {GameData} data 
     */
    constructor(data) {
        Object.assign(this, data)
        this.is_processing = false
        this.effect_queue = []
        this.player_list = new PlayerList()
        this.eliminated_list = new PlayerList() // anyone who loses all their lives goes here
        this.current_turn = 0
        this.starting_cards = 7
        this.draw_stack = 0
        this.draw_stack_min = 0
        this.draw_stack_pile = -1
        this.last_pile = 0
        this.play_direction = 1
        if (!this.interaction) {
            console.warn(`No interaction set for the game!`)
        }
        /**
         * @type {Channel}
         */
        this.channel = this.interaction.channel
    }

    // GAME MANAGEMENT COMMANDS
    /**
     * @param {GameData} data The information to initialize the series with. (done at the very start of a series)
     */
    async initialize(data) {
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
        this.input_collector.on(`collect`, await this.process_input)
        // console.log(`Game initialized with ${this.player_list.length} players.`)
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
    /**
     * Replenishes the deck with cards from the discard piles.
     */
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
     * - table - Displays the table embed.
     * - play_card - (uses options) Displays the embed after playing a card.
     * @param {Object} options Any additional information to add:
     * - text - The text to prepend on the embed.
     */
    display_embed(type, options = {}) {
        // console.log(this.discard_piles)
        let current_top_cards_text = `The current top cards are:\n${
            this.discard_piles.map(pile => {
                // console.log(pile.top_card)
                return pile.top_card.display_text()})
            .map((card_text, index) => `${index != this.draw_stack_pile && this.draw_stack_pile != -1 ? `🚫 ` : `` }Dish ${index + 1}: **${card_text}**`)
            .join(`\n`)
        }`
        const embed = this.default_embed
        switch (type) {
            case `start_game`: 
                embed.description = `A new UNO Stew match has started! ${current_top_cards_text}`
                return embed
            case `table`:
                embed.description = `${current_top_cards_text}`
                return embed
            case `play_card`:
                embed.description = options.text + `\n\n${current_top_cards_text}`
                return embed
        }
    }
    /**
     * The base embed used for other embeds.
     */
    get default_embed() {
        return {
            color: this.discard_piles[this.last_pile].top_card.hex,
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
    get current_player() {
        return this.player_list[this.current_turn]
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
        if (this.is_processing) {
            return
        }
        const parseInputType = (text) => {
            text = text.toLowerCase()
            if (text == `close`) {
                return `close`
            }
            if (text == `draw` || text == `d`) {
                return `draw`
            }
            if (/^\d/.test(text)) {
                return `play`
            }
            if (text.startsWith(`debug load`) ) {
                return `debug load`
            }
            return false
        }
        // console.log(parseInputType(content))
        switch (parseInputType(content)) {
            case `play`:
                this.cardInputHandler(message, player)
                break
            case `draw`:
                this.drawHandler(message, player)
                break
            case `close`:
                this.input_collector.off(`connect`, await this.process_input)
                message.reply(`Game closed.`)
                break
            case `debug load`:
                try {
                    this.deck.load(content.split(` `)[2])
                    message.reply(`Deck loaded.`)
                }
                catch {
                    message.reply(`Couldn't find deck \`${content.split(` `)[2]}\`.`)
                }
                break
        }
    }
    
    /**
     * @typedef {Object} EffectProcessData
     * @param {Message} message
     * @param {Object} play_object
     */
    /**
     * 
     * @param {function} effect The effect function to evaluate. Should take the current game state into effect.
     * @param {EffectProcessData} data The data to use, includes:
     * @param message - the Discord message
     * @param play_object - the play object (includes card index, dish)
     */
    async process(effect, data) {
        if (typeof effect == "function") {
            this.effect_queue.push(effect)
        }
        if (this.is_processing) {
            return
        }
        this.is_processing = true
        while (this.effect_queue.length > 0) {
            await this.effect_queue[0](this, data)
            this.effect_queue.shift()
        }
        console.log(`processing complete`)
        this.is_processing = false
    }

    // HANDLERS
    async cardInputHandler(message, player) {
        if (this.is_processing) {
            return
        }
        const {author, content, channel} = message
        const pre_effect_current_turn = this.current_turn
        const play_object = player.hand.parse(content)
        if (play_object["card_index"] == undefined) {
            // console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the dish.`)
        }
        if (play_object["card_index"] == undefined || isNaN(play_object["card_index"])) {
            // console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the card index.`)
        }
        const discard_pile = this.discard_piles[play_object["dish"]]
        let is_valid = false
        const card = player.hand[play_object["card_index"]]
        // custom check
        if (typeof card.customCheck == 'function') {
            is_valid ||= card.customCheck({message, game: this})
        }
        // default check
        else {
            is_valid ||= card.color == discard_pile.top_card.color || card.icon == discard_pile.top_card.icon
            is_valid ||= card.wild
            is_valid ||= discard_pile.top_card.wild
            if (card.stack_on) {
                is_valid ||= card.stack_on.includes(discard_pile.top_card.icon)
            }
        }
        if (this.draw_stack > 0) {
            console.log(card.draw_stackable)
            is_valid &&= card.draw_stackable
        }
        if (!is_valid) {
            return await message.reply(`You can't play that card there!`)
        }
        if (typeof card.customDiscardBehavior == 'function') {
            card.customDiscardBehavior({message, game: this})
        }
        else {
            discard_pile.push(player.hand.splice(play_object["card_index"], 1)[0])
        }
        await this.process(card.effect, {message, play_object})
        let play_text = `${player.name} played a ${card.display_text()} on dish ${play_object["dish"] + 1}.`
        if (card.dontStep) {
            if (pre_effect_current_turn == this.current_turn) {
                play_text += ` ${player.name} takes another turn!`
            }
            else {
                play_text += ` It's now ${this.player_list[this.current_turn].name}'s turn!`
            }
        }
        else {
            this.step()
            play_text += ` It's now ${this.player_list[this.current_turn].name}'s turn!`
        }
        if (this.draw_stack > 0) {
            play_text += `\n\n⚠️ **A draw card was played against you!** Play a draw card of +${this.draw_stack_min} or greater to pass it, or type \`d\` to draw **${this.draw_stack}** cards.`
        }
        this.last_pile = play_object["dish"]
        await channel.send({ 
            embeds: [this.display_embed(`play_card`, {text: play_text})],
            components: [this.buttons()]})
    }
    async drawHandler(message, player) {
        const {author, content, channel} = message
        if (player.id != this.current_player.id) {
            return
        }
        let play_text = ``
        if (this.draw_stack > 0) {
            const draw_count = this.resetDrawStack()
            this.draw(draw_count, player)
            play_text += `${player.name} drew **${draw_count}** cards. `
        }
        else {
            this.draw(1, player)
            play_text += `${player.name} drew a card. `
        }
        play_text += `It's now ${this.current_player.name}'s turn!`
        return await channel.send({embeds: [
            this.display_embed(`play_card`, {text: play_text})
        ],
        components: [this.buttons()]})
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
        if (customId.startsWith("effect-")) {
            return
        }
        const player = this.player_list.findPlayer(user.id)
        switch (customId) {
            case `hand`:
                if (!player) {
                    return button_interaction.reply({ephemeral: true, content: `You're not in this game!`})
                }
                button_interaction.reply({ephemeral: true, embeds: [player.hand.embed()], components: player.hand.buttons()}) // replace with: content: player.hand.text()
                break
            case `table`:
                button_interaction.reply({ephemeral: true, embeds: [this.display_embed(`table`)], components: [this.buttons()]})
                break
            case `players`:
                break
            case `history`:
                break
            default: 
                try {
                    const effect = require(path.join(__dirname, `../effects/${customId}.js`))
                    let desc = effect.description
                    if (effect.stack_on) {
                        desc += `\n\nCan also stack on: ${effect.stack_on.map(icon => require(path.join(__dirname, `../effects/${icon}.js`)).display_name).join(`, `)}`
                    }
                    const effect_desc_embed = new EmbedBuilder()
                    .setTitle(effect.display_name)
                    .setDescription(desc)
                    button_interaction.reply({ephemeral: true, embeds: [effect_desc_embed]})
                }
                catch (error) {
                    button_interaction.update({content: `An error occurred: ${error}`})
                    // console.log(`An error occurred: ${error}`)
                }
            // add part for processing effect info too https://discord.com/channels/781354877560815646/1276074561858834452/1276074569685274635
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
     * Reverses the turn order.
     * @param {boolean} skipIfTwoPlayers Skip if there are only 2 players (default true)
     * @returns true if this skipped a player, false otherwise
     */
    reverse(skipIfTwoPlayers = true) {
        this.play_direction *= -1
        if (this.player_list.length <= 2 && skipIfTwoPlayers) {
            this.step()
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
    draw(count, player = this.current_player, move = true) {
        player.add(count)
        if (move) {
            this.step()
        }
        return count
    }
    resetDrawStack() {
        const draw_value = this.draw_stack
        this.draw_stack = 0
        this.draw_stack_min = 0
        this.draw_stack_pile = -1
        return draw_value
    }
    /**
     * Flip all cards.
     */
    flip() {
        this.deck.flip()
        for (const d in this.discard_piles) {
            d.flip()
        }
        for (const p in this.player_list) {
            p.hand.flip()
        }
    }
    // DEBUG
}