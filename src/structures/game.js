const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, ButtonInteraction } = require("discord.js")
const DiscardPile = require("./discardpile")
const DrawPile = require("./drawpile")
const Player = require("./player")
const PlayerList = require("./player_list")
const path = require("path")
const { Card, CardColors } = require("./card")
const InputCollector = require("../discord-utils/input_collector")
const fs = require("fs")
const subsystems = fs.readdirSync(path.join(__dirname, "game-subsystems")).map(ss => require(path.join(__dirname, "game-subsystems", ss)))
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
        this.winner = false
        if (!this.interaction) {
            console.warn(`No interaction set for the game!`)
        }
        /**
         * @type {Channel}
         */
        this.channel = this.interaction.channel

        // add all functions
        for (const ss of subsystems) {
            function withFirstArg(firstArg, fn) {
                const f = (...args) => fn(firstArg, ...args)
                return f;
            }
            const static_functions = Object.getOwnPropertyNames(ss).filter(prop => {
                return typeof ss[prop] === 'function' && prop !== 'length' && prop !== 'prototype' && prop !== 'name';
            });
            for (const command of static_functions) {
                if (ss[command].name.startsWith("get_")) {
                    Object.defineProperty(this, ss[command].name.replace("get_", ""), {
                        get: withFirstArg(this, ss[command]),
                        configurable: true
                    });
                }
                else if (ss[command].name.startsWith("set_")) {
                    Object.defineProperty(this, ss[command].name.replace("set_", ""), {
                        set: withFirstArg(this, ss[command]),
                        configurable: true,
                        writable: true
                    })
                }
                else {
                    this[command] = withFirstArg(this, ss[command])
                }
            }
        }
        
    }

    //#region GAME MANAGEMENT COMMANDS
    // /**
    //  * @param {GameData} data The information to initialize the series with. (done at the very start of a series)
    //  */
    // async initialize(data) {
    //     const {deck, players} = data
    //     this.deck = new DrawPile({
    //         game: this
    //     })
    //     this.deck.load(deck)
    //     this.discard_piles = [
    //         new DiscardPile({game: this}),
    //         new DiscardPile({game: this}),
    //         new DiscardPile({game: this}),
    //         new DiscardPile({game: this})
    //     ]
    //     this.addPlayers(...players)
    //     this.player_list.forEach(p => {
    //         p.chocolate = 0
    //     })
    //     this.input_collector = this.channel.createMessageCollector({
    //         filter: (m) => !m.author.bot
    //     })
    //     this.input_collector.on(`collect`, await this.process_input)
    //     // console.log(`Game initialized with ${this.player_list.length} players.`)
    // }
    // /**
    //  * Start a game.
    //  */
    // start() {
    //     this.deck.shuffle()
    //     for (let player of this.player_list) {
    //         player.add(this.starting_cards)
    //     }
    //     for (let dpile of this.discard_piles) {
    //         dpile.push(this.deck.deal())
    //     }
    //     this.channel.send({embeds: [this.display_embed(`start_game`)], components: [this.buttons()]})
    //     this.button_collector = this.interaction.client.on("interactionCreate", this.process_button)
    // }
    //#endregion
    //#region DECK COMMANDS
    // /**
    //  * Replenishes the deck with cards from the discard piles.
    //  */
    // replenish() {
    //     for (let pile of this.discard_piles) {
    //         while (pile.length > 1) {
    //             this.deck.push(pile.shift())
    //         }
    //     }
    //     this.deck.shuffle()
    // }
    //#endregion
    //#region EMBEDS
    // /**
    //  * 
    //  * @param {string} type The type of embed to display
    //  * - start_game - Displays the start of a new game. 
    //  * - table - Displays the table embed.
    //  * - play_card - (uses options) Displays the embed after playing a card.
    //  * @param {Object} options Any additional information to add:
    //  * - text - The text to prepend on the embed.
    //  */
    // display_embed(type, options = {}) {
    //     // console.log(this.discard_piles)
    //     let current_top_cards_text = `The current top cards are:\n${
    //         this.discard_piles.map(pile => {
    //             // console.log(pile.top_card)
    //             return pile.top_card.display_text()})
    //         .map((card_text, index) => `${index != this.draw_stack_pile && this.draw_stack_pile != -1 ? `🚫 ` : `` }Dish ${index + 1}: **${card_text}**`)
    //         .join(`\n`)
    //     }`
    //     const embed = this.default_embed
    //     switch (type) {
    //         case `start_game`: 
    //             embed.description = `A new UNO Stew match has started! ${current_top_cards_text}`
    //             return embed
    //         case `table`:
    //             embed.description = `${current_top_cards_text}`
    //             return embed
    //         case `play_card`:
    //             embed.description = options.text + `\n\n${current_top_cards_text}`
    //             return embed
    //     }
    // }
    // /**
    //  * The base embed used for other embeds.
    //  */
    // get default_embed() {
    //     return {
    //         color: this.discard_piles[this.last_pile].top_card.hex,
    //     }
    // }
    // buttons() {
    //     const buttons = [
    //         new ButtonBuilder()
    //         .setCustomId(`hand`)
    //         .setLabel(`Hand`)
    //         .setStyle(ButtonStyle.Primary),
    //         new ButtonBuilder()
    //         .setCustomId(`table`)
    //         .setLabel(`Table`)
    //         .setStyle(ButtonStyle.Primary),
    //         new ButtonBuilder()
    //         .setCustomId(`players`)
    //         .setLabel(`Players`)
    //         .setStyle(ButtonStyle.Primary),
    //     ]
    //     const default_action_row = new ActionRowBuilder()
    //     .setComponents(buttons)
    //     return default_action_row
    // }
    //#endregion
    //#region PLAYER MANAGEMENT COMMANDS
    // /**
    //  * 
    //  * @param  {...User} players The players to add.
    //  */
    // addPlayers(...players) {
    //     for (let p of players) {
    //         const player = new Player({
    //             user: p,
    //             game: this
    //         })
    //         this.player_list.push(player)
    //     }
    // }
    // /**
    //  * 
    //  * @param {PlayerResolvable} player_resolvable
    //  */
    // removePlayer(player_resolvable) {
    //     return this.player_list.removePlayer(player_resolvable)
    // }
    // get current_player() {
    //     return this.player_list[this.current_turn]
    // }
    //#endregion
    //#region PROCESSING COMMANDS
    // /**
    //  * Process the input of a message.
    //  * @param {Message} message The discord message to process.
    //  */
    // process_input = async (message) => {
    //     const {author, content, channel} = message
    //     const player = this.player_list.findPlayer(author)
    //     if (!player) {
    //         // handle any audience things here
    //         return
    //     }
    //     const parseInputType = (text) => {
    //         text = text.toLowerCase()
    //         if (text == `close`) {
    //             return `close`
    //         }
    //         if (text == `draw` || text == `d`) {
    //             return `draw`
    //         }
    //         if (/^\d/.test(text)) {
    //             return `play`
    //         }
    //         if (/^j\d/.test(text)) {
    //             return `jump`
    //         }
    //         if (text.startsWith(`debug load`) ) {
    //             return `debug load`
    //         }
    //         return false
    //     }
    //     if (parseInputType(content) == `jump`) {
    //         return this.jumpInHandler(message, player)
    //     }
    //     if (this.is_processing) {
    //         return
    //     }
        
    //     // console.log(parseInputType(content))
    //     switch (parseInputType(content)) {
    //         case `play`:
    //             this.cardInputHandler(message, player)
    //             break
    //         case `draw`:
    //             this.drawHandler(message, player)
    //             break
    //         case `close`:
    //             this.input_collector.stop()
    //             message.reply(`Game closed.`)
    //             break
    //         case `debug load`:
    //             try {
    //                 this.deck.load(content.split(` `)[2])
    //                 message.reply(`Deck loaded.`)
    //             }
    //             catch {
    //                 message.reply(`Couldn't find deck \`${content.split(` `)[2]}\`.`)
    //             }
    //             break
    //     }
    // }
    
    // /**
    //  * @typedef {Object} EffectProcessData
    //  * @param {Message} message
    //  * @param {Object} play_object
    //  */
    // /**
    //  * 
    //  * @param {function} effect The effect function to evaluate. Should take the current game state into effect.
    //  * @param {EffectProcessData} data The data to use, includes:
    //  * @param message - the Discord message
    //  * @param play_object - the play object (includes card index, dish)
    //  */
    // async process(effect, data) {
    //     if (typeof effect == "function") {
    //         this.effect_queue.push(effect)
    //     }
    //     else {
    //         return
    //     }
    //     if (this.is_processing) {
    //         return
    //     }
    //     this.is_processing = true
    //     while (this.effect_queue.length > 0) {
    //         await this.effect_queue[0](this, data)
    //         this.effect_queue.shift()
    //     }
    //     this.eliminate_players_with_many_cards()
    //     const winner = this.check_for_wins()
    //     if (winner) {
    //         await this.handle_win(winner)
    //     }
    //     this.is_processing = false
    // }
    //#endregion
    //#region WIN/LOSS CHECKS
    // /**
    //  * Checks all players if they have more than 24 cards, and eliminates them if so.
    //  */
    // eliminate_players_with_many_cards() {
    //     for (const player_index in this.player_list) {
    //         const player = this.player_list[player_index]
    //         if (player.hand.length >= 25) {
    //             this.eliminated_list.push(this.player_list.splice(player_index, 1)[0])
    //             this.channel.send(`**⚠️ ${player.name} has been eliminated for hoarding.**`)
    //         }
    //     }
    // }
    // /**
    //  * 
    //  * @returns in this order:
    //  * 
    //  * null if there are no winners (???)
    //  * 
    //  * the player who won if there is 1 player left
    //  * 
    //  * the first player it finds who has 0 cards in their hand
    //  * 
    //  * the current player if there is a 4 match
    //  * 
    //  * the sudoku condition win
    //  */
    // check_for_wins() {
    //     if (this.player_list.length < 1) {
    //         return null
    //     }
    //     if (this.player_list.length == 1) {
    //         return {win_reason: "elimination", player: this.player_list[0]}
    //     }
    //     const zero_cards = this.player_list.find(p => p.hand.length == 0)
    //     if (zero_cards) {
    //         return {win_reason: "0 cards", player: zero_cards}
    //     }
    //     const matching_values = (card_args, check) => {
    //         let is_matching = true
    //         const first_value = card_args[0][check]
    //         for (const a of card_args) {
    //             is_matching &&= a[check] == first_value
    //         }
    //         return is_matching
    //     }
    //     const top_cards = this.discard_piles.map(d => d.top_card)
    //     const is_matching = matching_values(top_cards, "color") || matching_values(top_cards, "icon")
    //     if (is_matching) {
    //         return {win_reason: "matching cards", player: this.current_player}
    //     }
    //     const sudoku_values = top_cards.map(c => parseInt(c.icon))
    //     if (!sudoku_values.some(value => isNaN(value))) {
    //         const pile_1_check = sudoku_values[0] == sudoku_values[1] + sudoku_values[2] + sudoku_values[3]
    //         const pile_4_check = sudoku_values[3] == sudoku_values[1] + sudoku_values[2] + sudoku_values[0]
    //         const sudoku_check = (args) => {
    //             return args[0].color == args[1].color || args[0].icon == args[1].icon
    //         }
    //         const chain1 = sudoku_check(top_cards.slice(0, 2))
    //         const chain2 = sudoku_check(top_cards.slice(1, 3))
    //         const chain3 = sudoku_check(top_cards.slice(2, 4))
    //         if ((pile_1_check && chain2 && chain3) || (pile_4_check && chain1 && chain2)) {
    //             return {win_reason: "sudoku", player: this.current_player}
    //         }
    //     }
    //     return false
    // }
    // async handle_win(winner) {
    //     let win_reason = ''
    //     switch(winner.win_reason) {
    //         case "elimination":
    //             win_reason = "All other players were eliminated."
    //             break
    //         case "0 cards":
    //             win_reason = `${winner.player.name} ran out of cards.`
    //             break
    //         case "matching cards":
    //             win_reason = 'All the pile\'s cards match in color or number.'
    //             break
    //         case "sudoku":
    //             win_reason = "All piles' cards sum up to either the first or last pile, and all other piles can be linked through either icon or color (literally how did you do this)."
    //             break
    //     }
    //     this.winner = winner.player
    //     this.channel.send(`# 🎉 ${winner.player.name} has won! 🎉\n${win_reason} Enjoy some fresh chocolate! 🍫`)
    //     this.input_collector.off(`collect`, await this.process_input)
    //     this.interaction.client.off("interactionCreate", this.process_button)
    // }
    //#endregion
    //#region INPUT HANDLERS
    // async cardInputHandler(message, player) {
    //     if (this.is_processing) {
    //         return
    //     }
    //     const {author, content, channel} = message
    //     const pre_effect_current_turn = this.current_turn
    //     const play_object = player.hand.parse(content)
    //     if (play_object["dish"] == undefined) {
    //         // console.log(play_object)
    //         return message.reply(`Invalid input! Make sure to include the dish.`)
    //     }
    //     if (play_object["card_index"] == undefined || isNaN(play_object["card_index"])) {
    //         // console.log(play_object)
    //         return message.reply(`Invalid input! Make sure to include the card index.`)
    //     }
    //     const discard_pile = this.discard_piles[play_object["dish"]]
    //     let is_valid = false
    //     const card = player.hand[play_object["card_index"]]
    //     // custom check
    //     if (typeof card.customCheck == 'function') {
    //         is_valid ||= card.customCheck({message, game: this})
    //     }
    //     // default check
    //     else {
    //         is_valid ||= card.color == discard_pile.top_card.color || card.icon == discard_pile.top_card.icon
    //         is_valid ||= card.wild
    //         if (card.stack_on) {
    //             is_valid ||= card.stack_on.includes(discard_pile.top_card.icon)
    //         }
    //     }
    //     if (this.draw_stack > 0) {
    //         console.log(card.draw_stackable)
    //         is_valid &&= card.draw_stackable
    //     }
    //     if (!is_valid) {
    //         return await message.reply(`You can't play that card there!`)
    //     }
    //     await this.process(card.preDiscardBehavior, {message, play_object})
    //     discard_pile.push(player.hand.splice(play_object["card_index"], 1)[0])
    //     await this.process(card.postDiscardBehavior, {message, play_object})
    //     if (card.wild) {
    //         if (!card.overrideWildBehavior) {
    //             const color_collector = new InputCollector(this, "color", this.current_player)
    //             const wild_color_collected = await color_collector.getResponse("Choose a color to set the wild card to!", "Invalid color. Choose from one of the 10 colors available.")
    //             if (wild_color_collected) {
    //                 card.color = wild_color_collected
    //                 card.wild = false
    //                 this.channel.send(`Color set to ${CardColors[card.color]}.`)
    //             }
    //             else {
    //                 card.color = discard_pile[discard_pile.length - 2].color
    //                 card.wild = false
    //                 this.channel.send(`Response timed out, defaulting to ${CardColors[card.color]}.`)
    //             }
    //         }
    //         else {
    //             await this.process(card.overrideWildBehavior, {message, play_object})
    //         }
    //     }
        
    //     await this.process(card.effect, {message, play_object})
    //     if (this.winner) {
    //         return
    //     }
    //     let play_text = `${player.name} played a ${card.display_text()} on dish ${play_object["dish"] + 1}.`
    //     if (card.dontStep) {
    //         if (pre_effect_current_turn == this.current_turn) {
    //             play_text += ` ${player.name} takes another turn!`
    //         }
    //         else {
    //             play_text += ` It's now ${this.player_list[this.current_turn].name}'s turn!`
    //         }
    //     }
    //     else {
    //         this.step()
    //         play_text += ` It's now ${this.player_list[this.current_turn].name}'s turn!`
    //     }
    //     if (this.draw_stack > 0) {
    //         play_text += `\n\n⚠️ **A draw card was played against you!** Play a draw card of +${this.draw_stack_min} or greater to pass it, or type \`d\` to draw **${this.draw_stack}** cards.`
    //     }
    //     this.last_pile = play_object["dish"]
    //     await channel.send({ 
    //         embeds: [this.display_embed(`play_card`, {text: play_text})],
    //         components: [this.buttons()]})
    // }
    // async drawHandler(message, player) {
    //     const {author, content, channel} = message
    //     if (player.id != this.current_player.id) {
    //         return
    //     }
    //     let play_text = ``
    //     if (this.draw_stack > 0) {
    //         const draw_count = this.resetDrawStack()
    //         this.draw(draw_count, player)
    //         play_text += `${player.name} drew **${draw_count}** cards. `
    //     }
    //     else {
    //         this.draw(1, player)
    //         play_text += `${player.name} drew a card. `
    //     }
    //     play_text += `It's now ${this.current_player.name}'s turn!`
    //     return await channel.send({embeds: [
    //         this.display_embed(`play_card`, {text: play_text})
    //     ],
    //     components: [this.buttons()]})
    // }
    // async jumpInHandler(message, player) {
    //     const {author, content, channel} = message
    //     // const pre_effect_current_turn = this.current_turn
    //     const play_object = player.hand.parse(content.slice(1))
    //     if (play_object["dish"] == undefined) {
    //         // console.log(play_object)
    //         return message.reply(`Invalid input! Make sure to include the dish.`)
    //     }
    //     if (play_object["card_index"] == undefined || isNaN(play_object["card_index"])) {
    //         // console.log(play_object)
    //         return message.reply(`Invalid input! Make sure to include the card index.`)
    //     }
    //     const discard_pile = this.discard_piles[play_object["dish"]]
    //     const card = player.hand[play_object["card_index"]]
    //     // default check
    //     let is_valid = card.color == discard_pile.top_card.color && card.icon == discard_pile.top_card.icon
    //     if (!is_valid) {
    //         return await message.reply(`You can't play that card there! Jump-ins must match both color and symbol.`)
    //     }
    //     else {
    //         discard_pile.push(player.hand.splice(play_object["card_index"], 1)[0])
    //     }
    //     let play_text = `${player.name} jumped in with a ${card.display_text()} on dish ${play_object["dish"] + 1}.`
    //     const components = this.is_processing ? [] : [this.buttons()]
    //     await channel.send({ 
    //         embeds: [this.display_embed(`play_card`, {text: play_text})],
    //         components})
    // }
    // /**
    //  * Process a button interaction.
    //  * @param {ButtonInteraction} button_interaction 
    //  */
    // process_button = async (button_interaction) => {
    //     if (!button_interaction.isButton()) {
    //         return
    //     }
    //     const {customId, user} = button_interaction
    //     if (customId.startsWith("effect-")) {
    //         return
    //     }
    //     const player = this.player_list.findPlayer(user.id)
    //     switch (customId) {
    //         case `hand`:
    //             if (!player) {
    //                 return button_interaction.reply({ephemeral: true, content: `You're not in this game!`})
    //             }
    //             button_interaction.reply({ephemeral: true, embeds: [player.hand.embed()], components: player.hand.buttons()}) // replace with: content: player.hand.text()
    //             break
    //         case `table`:
    //             button_interaction.reply({ephemeral: true, embeds: [this.display_embed(`table`)], components: [this.buttons()]})
    //             break
    //         case `players`:
    //             break
    //         case `history`:
    //             break
    //         default: 
    //             try {
    //                 const effect = require(path.join(__dirname, `../effects/${customId}.js`))
    //                 let desc = effect.description
    //                 if (effect.stack_on) {
    //                     desc += `\n\nCan also stack on: ${effect.stack_on.map(icon => require(path.join(__dirname, `../effects/${icon}.js`)).display_name).join(`, `)}`
    //                 }
    //                 const effect_desc_embed = new EmbedBuilder()
    //                 .setTitle(effect.display_name)
    //                 .setDescription(desc)
    //                 button_interaction.reply({ephemeral: true, embeds: [effect_desc_embed]})
    //             }
    //             catch (error) {
    //                 button_interaction.update({content: `An error occurred: ${error}`})
    //                 // console.log(`An error occurred: ${error}`)
    //             }
    //         // add part for processing effect info too https://discord.com/channels/781354877560815646/1276074561858834452/1276074569685274635
    //     }
        
    // }
    //#endregion
    //#region GAMEPLAY COMMANDS
    // /**
    //  * Moves to the next player.
    //  */
    // step() {
    //     this.current_turn += this.play_direction + this.player_list.length
    //     this.current_turn %= this.player_list.length
    // }
    // /**
    //  * Reverses the turn order.
    //  * @param {boolean} skipIfTwoPlayers Skip if there are only 2 players (default true)
    //  * @returns true if this skipped a player, false otherwise
    //  */
    // reverse(skipIfTwoPlayers = true) {
    //     this.play_direction *= -1
    //     if (this.player_list.length <= 2 && skipIfTwoPlayers) {
    //         this.step()
    //         return true
    //     }
    //     return false
    // }
    // /**
    //  * 
    //  * @param {number} count How many cards to draw
    //  * @param {Player} player The player to make draw
    //  * @param {boolean} move Whether or not to move on after drawing
    //  * @returns 
    //  */
    // draw(count, player = this.current_player, move = true) {
    //     player.add(count)
    //     if (move) {
    //         this.step()
    //     }
    //     return count
    // }
    // resetDrawStack() {
    //     const draw_value = this.draw_stack
    //     this.draw_stack = 0
    //     this.draw_stack_min = 0
    //     this.draw_stack_pile = -1
    //     return draw_value
    // }
    // /**
    //  * Flip all cards.
    //  */
    // flip() {
    //     this.deck.flip()
    //     for (const d in this.discard_piles) {
    //         d.flip()
    //     }
    //     for (const p in this.player_list) {
    //         p.hand.flip()
    //     }
    // }
    //#endregion
    //#region DEBUG
    //#endregion
}