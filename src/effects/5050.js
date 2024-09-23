const { Message } = require("discord.js")
const Game = require("../structures/game")
const wait = require('node:timers/promises').setTimeout;
const draw_count = 4
module.exports = {
    display_name: `50/50`,
    emoji: `🪙`,
    description: `Choose a player, and a coin side. Then, flip a coin. The loser must draw 4 cards.\nIf played on top of a draw stack, 4 cards are added to the draw stack and the turn immediately moves to the loser.`, draw_stackable: true,
    dontStep: true,
    /**
     * 
     * @param {Game} game 
     * @param {EffectProcessData} data 
     */
    async effect(game, data) {
        const player = game.player_list.findPlayer(data.message.author.id)
        if (game.draw_stack_min > draw_count) return game.channel.send(`You can't play that card, it's not powerful enough!`)
        if (game.draw_stack_pile >= 0 && data?.play_object?.dish != game.draw_stack_pile) {
            return game.channel.send(`To continue the stack, you must play on the same dish. (${game.draw_stack_pile})`)
        }
        // prompts here
        const input_collector = game.channel.createMessageCollector({
            filter: (m) => m.author.id == data.message.author.id
        })
        let chosen_player
        let chosen_face = -1
        game.channel.send(`Choose a player to duel.`)
        input_collector.on(`collect`, (
            /**
             * @type {Message}
             */
            message
        ) => {
            let {content} = message
            if (chosen_player) {
                if (content.toLowerCase().startsWith(`h`)) {
                    chosen_face = 0
                }
                if (content.toLowerCase().startsWith(`t`)) {
                    chosen_face = 1
                }
                return
            }
            let chosen_user_by_mention = message?.mentions?.users?.first()?.id
            chosen_player = game.player_list.findPlayer(chosen_user_by_mention ?? content.toLowerCase())
            if (chosen_player?.id == player.id) {
                chosen_player = undefined
                return game.channel.send(`You cannot choose yourself.`)
            }
            if (chosen_player) {
                return game.channel.send({content: `Choose a coin face. (heads or tails)`})
            } 
            return game.channel.send(`Invalid player name, ping them or write their display name.`)
        })
        async function process_coin() {
            while (chosen_face === -1) {
                await wait(50)
            }
            const coin = { }
            coin[chosen_face] = player
            coin[1 - chosen_face] = chosen_player
            const coin_state = (face, winner = false) => {
                switch(face) {
                    case 0:
                        return `${winner ? `**` : ``}🪙 ${coin[0].name}${winner ? `**` : ``}\n<:draw_4:1279852167435517973> ${coin[1].name}`
                    case 1:
                        return `<:draw_4:1279852167435517973> ${coin[0].name}\n${winner ? `**` : ``}🪙 ${coin[1].name}${winner ? `**` : ``}`
                }
            }
            let coin_state_value = 0
            const coin_message = await game.channel.send({
                content: coin_state(coin_state_value)
            })
            let time_between_flips = 100
            let flips = 0
            const total_flips = Math.ceil(Math.random() * 20) + 10
            while (flips < total_flips) {
                flips++
                time_between_flips += 20
                coin_state_value = 1 - coin_state_value
                await coin_message.edit(`${coin_state(coin_state_value)}`)
                await wait(time_between_flips)
            }
            await coin_message.edit(`${coin_state(coin_state_value, true)}`)
            let draw_text = `${coin[coin_state_value].name} won the duel!`
            if (game.draw_stack_pile >= 0) {
                // draw stack logic here
                game.draw_stack += draw_count
                draw_text += ` ${coin[1 - coin_state_value].name} must now draw **${game.draw_stack}** cards.`
                
                let i = 0
                while (game.current_player.id != coin[1 - coin_state_value].id) {
                    game.step()
                    i++
                    if (i > 4000) {
                        console.log(`couldn't find the player`)
                        break
                    }
                }
                return game.channel.send(draw_text)
            }
            game.draw(4, coin[1 - coin_state_value])
            game.step()
            return game.channel.send(`${draw_text} ${coin[1 - coin_state_value].name} drew 4 cards.`)
        }
        await process_coin()
    }
}