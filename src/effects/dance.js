const { Message } = require("discord.js")
const Game = require(`../structures/game`)
const wait = require('node:timers/promises').setTimeout;
const actions = [
    `⬆️`,
    `⬇️`,
    `👏`,
    `➡️`,
    `⬅️`
]
module.exports = {
    display_name: `Dancing`,
    emoji: `🕺`,
    description: `Forces the next player to dance for 10 seconds. Click on reactions in order to keep them dancing.`,
    /**
    *
    * @param {Game} game 
    * @param {*} data 
    */
    async effect(game, data) {
        
        const dance_array = []
        let dance_index = 0
        let score = 0
        game.step()
        await game.channel.send(`${game.current_player.user}, get ready to dance in 3... 2... 1...`)
        await wait(3000)
        // dance completion condition: 75% of da_length/n other players
        const ddr_text = () => {
            let text = `**${game.current_player.name}, hit the dance floor!**\nEveryone else, tap some dance moves for ${game.current_player.name} to do!\n-# Progress: ${Math.round(score / Math.max(dance_array.length, 1) * 100)}% | Score at least ${Math.round(100 * 0.75 / (game.player_list.length - 1))}% to win.\n`
            const arrow = `🔽`
            const empty = `⬛`
            if (dance_index < 2) {
                text += empty.repeat(dance_index) + arrow + empty.repeat(4 - dance_index)
            }
            else if (dance_index > dance_array.length - 3) {
                text += empty.repeat(Math.min(4, 4 - (dance_array.length - 1 - dance_index))) + arrow + empty.repeat(Math.max(0, dance_array.length - 1 - dance_index))
            }
            else {
                text += `⬛⬛🔽⬛⬛`
            }
            text += `\n`
            if (dance_index > dance_array.length - 3) {
                const dance_sub_index = dance_array.length - dance_index
                text += dance_array.slice(Math.max(0, dance_array.length - 5), Math.max(5, dance_array.length)).join(``)
            }
            else {
                text += dance_array.slice(Math.max(0, dance_index - 2), Math.max(5, dance_index + 3)).join(``)
            }
            
            return text
        }
        /**
         * @type {Message}
         */
        const dance_message = await game.channel.send(ddr_text())

        const reaction_collector = dance_message.createReactionCollector({
            filter: (_, r) => !r.bot
        })
        reaction_collector.on(`collect`, (reaction, user) => {
            if (game.current_player.id != user.id) {
                dance_array.push(reaction.emoji)
                if (dance_index >= dance_array.length - 5) {
                    dance_message.edit(ddr_text())
                }
            }
            else {
                // process a move
                if (reaction.emoji == dance_array[dance_index]) {
                    score++
                    dance_array[dance_index] = `✅`
                }
                else {
                    dance_array[dance_index] = `❌`
                }
                dance_index++
                dance_message.edit(ddr_text())
            }
            reaction.users.remove(user)
        })
        for (let emoji of actions) {
            await dance_message.react(emoji)
        }
        await wait(60000) // CHANGE THIS BACK TO 10000
        reaction_collector.stop()
        if (0.75 / (game.player_list.length - 1) <= score / dance_array.length) {
            return await game.channel.send(`${game.current_player.name}'s dance was superb, and won't pick up any cards.`)
        }
        await game.draw(3, game.current_player)
        return await game.channel.send(`${game.current_player.name} couldn't bust out the moves... +3 cards`)
    }
}