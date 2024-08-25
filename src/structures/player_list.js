const Player = require("./player")

module.exports = class PlayerList extends Array {
    constructor() {
        super()
    }
    /**
     * 
     * @param {PlayerResolvable} player_resolvable
     * @returns {Player}
     */
    findPlayer(player_resolvable) {
        const player = this[this.resolve(player_resolvable)]
        return player
    }
    findPlayerIndex(player_resolvable) {
        const player = this.resolve(player_resolvable)
        return player
    }
    resolve(player_resolvable) {
        return this.findIndex(p => p.user.id == player_resolvable) ??
        this.findIndex(p => p.name == player_resolvable)
    }
    removePlayer(player_resolvable) {
        return this.splice(this.findPlayerIndex(player_resolvable), 1)[0]
    }
    addPlayer(member) {
        this.push(new Player({member, user: member.user}))
    }
}