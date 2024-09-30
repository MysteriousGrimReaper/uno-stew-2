const { Message } = require("discord.js")
const { CardColors, Card } = require("../structures/card")
const Game = require("../structures/game")
const Player = require("../structures/player")

module.exports = class InputCollector {
    /**
     * 
     * @param {Game} game 
     * @param {string|function} type Must be: player, color, card, card_index, or a function that returns depending on the string input
     * @param {Player} player
     */
    constructor(game, type, player, timer = 60, allow_exit = false) {
        this.game = game
        this.type = type
        this.player = player
        this.channel = game.channel
        this.timer = timer * 1000
        this.allow_exit = allow_exit
        this.message_collector = this.channel.createMessageCollector({filter: (m) => !m.author.bot, time: this.timer })
    }
    /**
     * 
     * @param {Message} msg Message to send at the start
     * @param {Message} error_msg Message that it sends if the user provides a false input
     * @returns Given the type:
     * @param player - returns player object
     * @param color - string (color code)
     * @param card - card object
     * @param card_index - number corresponding to a card index
     */
    async getResponse(msg, error_msg = "Invalid input.") {
        const channel = this.channel
        this.response_message = await channel.send(msg)
        return new Promise((resolve, reject) => { 
            this.message_collector.on("collect", (message) => {
                const return_value = this.validate(message.content)
                if (return_value || return_value === 0) {
                    this.message_collector.stop("match")
                    resolve(return_value)
                }
                else {
                    channel.send(error_msg)
                }
            })
            this.message_collector.on("end", () => {
                if (this.message_collector.endReason == "time") {
                    resolve(false)
                }
                
            })
        })
    }
    validate(string) {
        if (string.toLowerCase() == "done" && this.allow_exit) {
            return "Done"
        }
        const card_index = parseInt(string)
        if (typeof this.type == "function") {
            return this.type(string)
        }
        switch(this.type) {
            case `player`:
                return this.game.player_list.findPlayer(string)
            case `card`:
                if (isNaN(card_index)) {
                    return false
                }
                return this.player.hand[card_index - 1]
            case `color`:
                const colors = CardColors
                let color_selected
                const titleCase = (str) => str[0].toUpperCase() + str.slice(1).toLowerCase()
                const color_names = Object.values(CardColors)
                const formattedColorName = titleCase(string)
                if (string in colors) {
                    color_selected = string
                }
                else if (color_names.includes(formattedColorName)) {
                    const color_keys = Object.keys(CardColors)
                    color_selected = color_keys[color_names.indexOf(formattedColorName)]
                }
                return color_selected
            case `card_index`:
                if (isNaN(card_index)) {
                    return false
                }
                return card_index - 1
        }
        this.channel.send(`No valid type specified! This is likely an error on MGR's part oops`)
        return false
    }
}