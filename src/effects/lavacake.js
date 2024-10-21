const Game = require(`../structures/game`)
module.exports = {
    display_name: `Lava Cake`,
    emoji: `💥`,
    description: `**The cake erupted!** Show this card to everyone else and draw 3 more cards when you draw this card.`,
    /**
    *
    * @param {Game} game 
    * @param {*} data 
    */
    async onDraw(game, data) {
        const {player, card} = data
        await game.channel.send(`${player.name} drew a **${card.display_text()}**! Draw 3 cards.`)
        return await game.draw(3, player)
    }
}