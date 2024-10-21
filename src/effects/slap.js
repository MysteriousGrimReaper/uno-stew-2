const Game = require(`../structures/game`)
const { waitUntil } = require("async-wait-until")
module.exports = {
    display_name: `Slap`,
    emoji: `👏`,
    description: `Every player must race to slap this card once it's played. The last player to slap the card must draw 2 cards.`,
    /**
    *
    * @param {Game} game 
    * @param {*} data 
    */
    async effect(game, data) {
        const collector_message = await game.channel.send(`# SLAP!`)
        await collector_message.react("👏")
        const slap_collector = collector_message.createReactionCollector({time: 15000})
        const collected_users = []
        slap_collector.on("collect", (_, r) => {
            if (!collected_users.map(u => u.id).includes(r.id)) {
                collected_users.push(r)
            }
        })
        await waitUntil(() => collected_users.length >= (game.player_list.length - 1), {timeout: 15000})
        const user_ids = collected_users.map(u => u.id)
        if (collected_users.length == game.player_list.length) {
            const card_drawer = game.findPlayer(collected_users[collected_users.length - 1].id)
            await game.draw(4, card_drawer, false)
            await game.channel.send(`${card_drawer.name} drew 4 cards!`)
        }
        else {
            for (const card_drawer of game.player_list.filter(p => !user_ids.includes(p.user.id))) {
                await game.draw(4, card_drawer, false)
                await game.channel.send(`${card_drawer.name} drew 4 cards!`)
            }
        }
    }
}