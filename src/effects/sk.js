module.exports = {
    display_name: `Skip`,
    emoji: `<:skip:1276559353234587688>`,
    description: `Skip the next player in the turn order.`,
    effect(game, data) {
        game.step()
    }
}