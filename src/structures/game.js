const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, ButtonInteraction, TextChannel } = require("discord.js")
const DiscardPile = require("./discardpile")
const DrawPile = require("./drawpile")
const Player = require("./player")
const PlayerList = require("./player_list")
const path = require("path")
const { Card, CardColors } = require("./card")
const InputCollector = require("../discord-utils/input_collector")
const fs = require("fs")
const ChannelDeco = require("../discord-utils/channel_deco")
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
        this.inactive_discard_pile = Math.floor(Math.random() * 4)
        if (!this.interaction) {
            console.warn(`No interaction set for the game!`)
        }
        /**
         * @type {TextChannel}
         */
        this.channel = this.interaction.channel
        this.recent_play_message = undefined

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
}


