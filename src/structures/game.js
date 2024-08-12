const PlayerList = require("./player_list")

module.exports = class Game {
    constructor() {
        this.is_processing = false
        this.effect_queue = []
        this.player_list = new PlayerList()
    }
    /**
     * 
     * @param  {...Player} players The players to add.
     */
    addPlayers(...players) {
        this.player_list.push(...players)
    }
    /**
     * 
     * @param {PlayerResolvable} player_resolvable
     */
    removePlayer(player_resolvable) {
        return this.player_list.removePlayer(player_resolvable)
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