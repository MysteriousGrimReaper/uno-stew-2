const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
const Hand = require("../structures/hand")
const { Card, CardFace } = require("../structures/card")
module.exports = {
    display_name: "Discard Color",
    emoji: "🧼",
    description: "Discard all cards in your hand that match the color of this card.",
    /**
     *
     * @param {Game} game
     * @param {*} data
     */
    async effect(game, data) {
        const {play_object} = data
        const {card_index} = play_object
        const hand = game.current_player.hand
        const card_color = data.play_object.card.color
        console.log(`TEST: DISCARD COLOR`)
        const color_match = (card) => card.color == card_color
        let has_played_a_card = false
        let complete = false
        while (!complete) {
            const embed_color = CardFace[card_color]
            const hand_embed = new EmbedBuilder()
            .setDescription(hand.text((card) => card.color != card_color))
            .setColor(embed_color)
            const card_collector = new InputCollector(game, "card_index", game.current_player)
            const button_interaction = (bi) => {
                if (!bi.isButton()) {
                    return
                }
                if (bi.customId != "effect-discardcolor") {
                    return
                }
                bi.reply({embeds: [hand_embed], ephemeral: true})
            }
            game.interaction.client.on("interactionCreate", button_interaction)
            const dish = game.discard_piles[data.play_object.dish]
            const card_chosen = await card_collector.getResponse({content: `${has_played_a_card ? `${dish.top_card.display_text()} played successfully. ` : ``}Choose a${has_played_a_card ? `nother` : ``} card by its index to discard. Type \`done\` to finish discarding.`, components: [
                {components: [
                    new ButtonBuilder()
                    .setCustomId("effect-discardcolor")
                    .setLabel("Hand")
                    .setStyle(ButtonStyle.Primary)
                ]}
            ]})
            game.interaction.client.off("interactionCreate", button_interaction)
            if (card_chosen == "Done") {
                complete = true
            }
            else if (card_chosen) {
                dish.push(hand.splice(card_chosen, 1)[0])
                has_played_a_card = true
            }
            else {
                complete = true
                game.channel.send(`Response timed out.`)
            }

        }
    }
}