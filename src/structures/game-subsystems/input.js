const path = require("path")
const fs = require("fs")
const { EmbedBuilder } = require("discord.js")
const InputCollector = require("../../discord-utils/input_collector")
const { CardColors } = require("../card")
module.exports = class InputHandler {
    static async cardInputHandler(game, message, player) {
        if (game.is_processing) {
            return
        }
        console.log(`handling card input`)
        const {author, content, channel} = message
        const pre_effect_current_turn = game.current_turn
        const play_object = player.hand.parse(content)
        if (play_object["dish"] == undefined) {
            // console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the dish.`)
        }
        if (play_object["dish"] >= 4) {
            return message.reply(`Dish index too high! Choose a dish from 1 to 4.`)
        }
        if (play_object["card_index"] == undefined || isNaN(play_object["card_index"])) {
            // console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the card index.`)
        }
        const discard_pile = game.discard_piles[play_object["dish"]]
        let is_valid = false
        const card = player.hand[play_object["card_index"]]
        // check if out of turn
        if (!card.canPlayOutOfTurn && player.id != game.player_list[game.current_turn].id) {
            return message.reply(`Out of turn play! To jump in, add \`j\` to the start of your play message.`)
        }
        // custom check
        if (typeof card.customCheck == 'function') {
            console.log(`custom check recognized`)
            is_valid ||= card.customCheck({message, game: game, play_object})
        }
        // default check
        else {
            is_valid ||= card.color == discard_pile.top_card.color || card.icon == discard_pile.top_card.icon
            is_valid ||= card.wild || card.color == "j"
            if (card.stack_on) {
                is_valid ||= card.stack_on.includes(discard_pile.top_card.icon)
            }
            is_valid &&= !game.pile_invalid(play_object["dish"])
        }
        if (!is_valid) {
            return await message.reply(`You can't play that card there!`)
        }
        await game.process(card.preDiscardBehavior, {message, play_object})
        discard_pile.push(player.hand.splice(play_object["card_index"], 1)[0])
        await game.process(card.postDiscardBehavior, {message, play_object})
        if (card.wild) {
            if (!card.overrideWildBehavior) {
                const color_collector = new InputCollector(game, "color", game.current_player)
                const wild_color_collected = await color_collector.getResponse("Choose a color to set the wild card to!", "Invalid color. Choose from one of the 10 colors available.")
                if (wild_color_collected) {
                    card.color = wild_color_collected
                    card.wild = false
                    game.channel.send(`Color set to ${CardColors[card.color]}.`)
                }
                else {
                    card.color = discard_pile[discard_pile.length - 2].color
                    card.wild = false
                    game.channel.send(`Response timed out, defaulting to ${CardColors[card.color]}.`)
                }
            }
            else {
                await game.process(card.overrideWildBehavior, {message, play_object})
            }
        }
        
        await game.process(card.effect, {message, play_object})
        if (await game.end_turn(pre_effect_current_turn) == null) {
            return
        }
        let play_text = `${player.name} played a ${card.display_text()} on dish ${play_object["dish"] + 1}.`
        if (!card.dontStep) {
            game.step({move_inactive_discard_pile: true})
        }
        if (pre_effect_current_turn == game.current_turn) {
            play_text += ` ${player.name} takes another turn!`
        }
        else {
            play_text += ` It's now ${game.player_list[game.current_turn].name}'s turn!`
        }
        if (game.draw_stack > 0) {
            play_text += `\n\n⚠️ **A draw card was played against you!** Play a draw card of +${game.draw_stack_min} or greater to pass it, or type \`d\` to draw **${game.draw_stack}** cards.`
        }
        game.last_pile = play_object["dish"]
        game.moderate_jelly()
        game.recent_play_message = await channel.send({ 
            embeds: [game.display_embed(`play_card`, {text: play_text})],
            components: [game.buttons()]})
    }
    static async drawHandler(game, message, player) {
        const {author, content, channel} = message
        if (player.id != game.current_player.id) {
            return
        }
        let play_text = ``
        if (game.draw_stack > 0) {
            const draw_count = game.resetDrawStack()
            await game.draw(draw_count, player)
            play_text += `${player.name} drew **${draw_count}** cards. `
        }
        else {
            await game.draw(1, player)
            play_text += `${player.name} drew a card. `
        }
        play_text += `It's now ${game.current_player.name}'s turn!`
        game.eliminate_players_with_many_cards()
        if (await game.end_turn() == null) {
            return
        }
        game.recent_play_message = await channel.send({embeds: [
            game.display_embed(`play_card`, {text: play_text})
        ],
        components: [game.buttons()]})
    }
    static async jumpInHandler(game, message, player) {
        const {author, content, channel} = message
        // const pre_effect_current_turn = game.current_turn
        const play_object = player.hand.parse(content.slice(1))
        if (play_object["dish"] == undefined) {
            // console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the dish.`)
        }
        if (play_object["card_index"] == undefined || isNaN(play_object["card_index"])) {
            // console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the card index.`)
        }
        const discard_pile = game.discard_piles[play_object["dish"]]
        const card = player.hand[play_object["card_index"]]
        // default check
        let is_valid = card.color == discard_pile.top_card.color && card.icon == discard_pile.top_card.icon
        if (!is_valid) {
            return await message.reply(`You can't play that card there! Jump-ins must match both color and symbol.`)
        }
        else {
            discard_pile.push(player.hand.splice(play_object["card_index"], 1)[0])
        }
        let play_text = `${player.name} jumped in with a ${card.display_text()} on dish ${play_object["dish"] + 1}.`
        const components = game.is_processing ? [] : [game.buttons()]
        if (!game.recent_play_message) {
            await channel.send({ 
                embeds: [game.display_embed(`play_card`, {text: play_text})],
                components})
        }
        else {
            await game.recent_play_message.edit({ 
                embeds: [game.display_embed(`play_card`, {text: play_text})],
                components})
        }
    }
    static async sumHandler(game, message, player) {
        const {author, content, channel} = message
        // const pre_effect_current_turn = game.current_turn
        const play_object = player.hand.parse(content.slice(1))
        if (play_object["dish"] == undefined) {
            // console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the dish.`)
        }
        if (play_object["card_index"] == undefined || isNaN(play_object["card_index"])) {
            // console.log(play_object)
            return message.reply(`Invalid input! Make sure to include the card index.`)
        }
        const discard_pile = game.discard_piles[play_object["dish"]]
        const card = player.hand[play_object["card_index"]]
        // default check
        let is_valid = card.color == discard_pile.top_card.color && card.icon == discard_pile.top_card.icon
        if (!is_valid) {
            return await message.reply(`You can't play that card there! Jump-ins must match both color and symbol.`)
        }
        else {
            discard_pile.push(player.hand.splice(play_object["card_index"], 1)[0])
        }
        let play_text = `${player.name} jumped in with a ${card.display_text()} on dish ${play_object["dish"] + 1}.`
        const components = game.is_processing ? [] : [game.buttons()]
        await channel.send({ 
            embeds: [game.display_embed(`play_card`, {text: play_text})],
            components})
    }
    
    /**
     * Process a button interaction.
     * @param {ButtonInteraction} button_interaction 
     */
    static process_button = async (game, button_interaction) => {
        if (!button_interaction.isButton()) {
            return
        }
        const {customId, user} = button_interaction
        if (customId.startsWith("effect-")) {
            return
        }
        const player = game.player_list.findPlayer(user.id)
        switch (customId) {
            case `hand`:
                if (!player) {
                    return button_interaction.reply({ephemeral: true, content: `You're not in the game!`})
                }
                await button_interaction.reply(player.hand.display()) // replace with: content: player.hand.text()
                break
            case `table`:
                button_interaction.reply({ephemeral: true, embeds: [game.display_embed(`table`)], components: [game.buttons()]})
                break
            case `players`:
                break
            case `history`:
                break
            case `display-image`:
                player.hand.use_image = true
                await button_interaction.reply(player.hand.display())
                break
            case `display-text`:
                player.hand.use_image = false
                await button_interaction.reply(player.hand.display()) 
                break
            default: 
                try {
                    const effect = require(path.join(__dirname, `../../effects/${customId}.js`))
                    let desc = effect.description
                    if (effect.stack_on) {
                        desc += `\n\nCan also stack on: ${effect.stack_on.map(icon => require(path.join(__dirname, `../effects/${icon}.js`)).display_name).join(`, `)}`
                    }
                    const effect_desc_embed = new EmbedBuilder()
                    .setTitle(effect.display_name)
                    .setDescription(desc)
                    button_interaction.reply({ephemeral: true, embeds: [effect_desc_embed]})
                }
                catch (error) {
                    button_interaction.update({content: `An error occurred: ${error}`})
                    // console.log(`An error occurred: ${error}`)
                }
            // add part for processing effect info too https://discord.com/channels/781354877560815646/1276074561858834452/1276074569685274635
        }
        
    }
}