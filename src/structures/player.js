const { User, GuildMember } = require("discord.js")
const Hand = require("./hand")
/**
 * @typedef {Object} PlayerData
 * @property {User} user
 * @property {GuildMember} member
 */
/**
 * Represents a player object.
 * 
 * @class
 * @prop {Hand} hand
 */
module.exports = class Player {
    
    /**
     * 
     * @param {PlayerData} data 
     */
    constructor(data) {
        this.test = false
        Object.assign(this, data)
        this.hand ??= new Hand({player: this})
        this.popcorn ??= 1
        this.pizza ??= 1
        this.phrase ??= `hi`
        this.chocolate ??= 0
        if (!this.user) {
            console.warn(`No user assigned to this player!`);
        }
        if (!this.game) {
            console.warn(`No game assigned to this user!`)
        }
    }
    /**
     * Draw cards without skipping a turn.
     */
    add(count = 1) {
        const added_cards = []
        for (let i = 0; i < count; i++) {
            const drawn_card = this.game.deck.deal()
            this.hand.push(drawn_card)
            added_cards.push(drawn_card)
        }
        return added_cards
    }
    
    get name() {
        return this.user.globalName ?? this.user.username
    }
    get id() {
        return this.user.id
    }
}