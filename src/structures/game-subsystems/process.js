module.exports = class CommandProcessor {
    /**
     * Process the input of a message.
     * @param {Message} message The discord message to process.
     */
    static process_input = async (game, message) => {
        const {author, content, channel} = message
        const player = game.player_list.findPlayer(author)
        if (!player) {
            // handle any audience things here
            return
        }
        const parseInputType = (text) => {
            text = text.toLowerCase()
            if (text == `close`) {
                return `close`
            }
            if (text == `draw` || text == `d`) {
                return `draw`
            }
            if (/^\d/.test(text)) {
                return `play`
            }
            if (/^j\d/.test(text)) {
                return `jump`
            }
            if (text.startsWith(`debug load`) ) {
                return `debug load`
            }
            return false
        }
        if (parseInputType(content) == `jump`) {
            return game.jumpInHandler(message, player)
        }
        if (game.is_processing) {
            return
        }
        
        // console.log(parseInputType(content))
        switch (parseInputType(content)) {
            case `play`:
                game.cardInputHandler(message, player)
                break
            case `draw`:
                game.drawHandler(message, player)
                break
            case `close`:
                game.input_collector.stop()
                message.reply(`Game closed.`)
                break
            case `debug load`:
                try {
                    game.deck.load(content.split(` `)[2])
                    message.reply(`Deck loaded.`)
                }
                catch {
                    message.reply(`Couldn't find deck \`${content.split(` `)[2]}\`.`)
                }
                break
        }
    }
    
    /**
     * @typedef {Object} EffectProcessData
     * @param {Message} message
     * @param {Object} play_object
     */
    /**
     * 
     * @param {function} effect The effect function to evaluate. Should take the current game state into effect.
     * @param {EffectProcessData} data The data to use, includes:
     * @param message - the Discord message
     * @param play_object - the play object (includes card index, dish)
     */
    static async process(game, effect, data) {
        if (typeof effect == "function") {
            game.effect_queue.push(effect)
        }
        else {
            return
        }
        if (game.is_processing) {
            return
        }
        game.is_processing = true
        while (game.effect_queue.length > 0) {
            await game.effect_queue[0](game, data)
            game.effect_queue.shift()
        }
        game.is_processing = false
    }
    static moderate_jelly(game) {
        for (const dp of game.discard_piles) {
            if (dp.top_card.color == "j") {
                dp.top_card.color = dp[dp.length - 2].color
            }
        }
    }
}