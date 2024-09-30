const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
const Hand = require("../structures/hand")
const { Card, CardFace } = require("../structures/card")
module.exports = {
    display_name: "Slice & Dice",
    emoji: "🔪",
    description: "Discard all except two cards in your hand.",
    /**
     *
     * @param {Game} game
     * @param {*} data
     */
    async effect(game, data) {
        const hand = game.current_player.hand
        let has_played_a_card = false
        let complete = false
        while (!complete) {
            const hand_embed = new EmbedBuilder()
            .setDescription(hand.text())
            const card_collector = new InputCollector(game, "card_index", game.current_player, 20, allow_exit = true)
            const button_interaction = (bi) => {
                if (!bi.isButton()) {
                    return
                }
                if (bi.customId != "effect-x2") {
                    return
                }
                bi.reply({embeds: [hand_embed], ephemeral: true})
            }
            game.interaction.client.on("interactionCreate", button_interaction)
            const dish = game.discard_piles[data.play_object.dish]
            const card_chosen = await card_collector.getResponse({content: `${has_played_a_card ? `${dish.top_card.display_text()} played successfully. ` : ``}Choose a${has_played_a_card ? `nother` : ``} card by its index to discard. Type \`done\` to finish discarding.`, components: [
                {components: [
                    new ButtonBuilder()
                    .setCustomId("effect-x2")
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
            if (hand.length <= 2) {
                complete = true
            }
        }
    }
}