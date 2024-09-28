module.exports = {
    display_name: `Reverse Skip`,
    emoji: `<:skip:1276559353234587688>`,
    description: `Skip the next player in the turn order.`,
    effect(game, data) {
        const reverse = game.reverse()
        game.step()
        
        return game.channel.send(`You skipped ${game.current_player.name}'s turn and reversed the turn order!`)
    }
}