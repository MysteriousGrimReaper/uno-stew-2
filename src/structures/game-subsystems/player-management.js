const Player = require("../player")

module.exports = class PlayerManager {
    /**
     * 
     * @param  {...User} players The players to add.
     */
    static addPlayers(game, ...players) {
        for (let p of players) {
            const player = new Player({
                user: p,
                game
            })
            game.player_list.push(player)
        }
    }
    /**
     * 
     * @param {PlayerResolvable} player_resolvable
     */
    static removePlayer(game, player_resolvable) {
        return game.player_list.removePlayer(player_resolvable)
    }
    static get_current_player(game) {
        return game.player_list[game.current_turn]
    }
}