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
        let id_resolve = this.findIndex(p => p.user.id == player_resolvable)
        if (id_resolve >= 0) {
            return id_resolve
        }
        id_resolve = this.findIndex(p => p.user.id == player_resolvable.id)
        if (id_resolve >= 0) {
            return id_resolve
        }
        id_resolve = this.findIndex(p => p.name.toLowerCase() == player_resolvable.toLowerCase())
        return id_resolve
    }
    removePlayer(player_resolvable) {
        return this.splice(this.findPlayerIndex(player_resolvable), 1)[0]
    }
    addPlayer(member) {
        this.push(new Player({member, user: member.user}))
    }
}