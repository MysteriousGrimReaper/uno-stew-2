const { User, GuildMember } = require("discord.js")
const Hand = require("./hand")
/**
 * @typedef {Object} PlayerData
 * @property {User} user
 * @property {GuildMember} member
 */
module.exports = class Player {
    
    /**
     * 
     * @param {PlayerData} data 
     */
    constructor(data) {
        Object.assign(this, data)
        this.hand ??= new Hand()
        this.popcorn ??= 1
        this.pizza ??= 1
        this.phrase ??= `hi`
        if (!this.user) {
            console.warn(`No user assigned to this player!`);
        }
    }
    get name() {
        return this.user.globalName ?? this.user.username
    }
    
}