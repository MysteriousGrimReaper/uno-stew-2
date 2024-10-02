const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js")

module.exports = class GameDisplayEmbeds {
    /**
     * 
     * @param {string} type The type of embed to display
     * - start_game - Displays the start of a new game. 
     * - table - Displays the table embed.
     * - play_card - (uses options) Displays the embed after playing a card.
     * @param {Object} options Any additional information to add:
     * - text - The text to prepend on the embed.
     */
    static display_embed(game, type, options = {}) {
        let current_top_cards_text = `The current top cards are:\n${
            game.discard_piles.map(pile => {
                return pile.top_card.display_text()})
            .map((card_text, index) => `${game.pile_invalid(index) ? `🚫 ` : `` }Dish ${index + 1}: **${card_text}**`)
            .join(`\n`)
        }`
        const embed = game.default_embed
        embed.footer = {text: `Current player: ${game.current_player.name}`, iconURL: game.current_player.user.avatarURL()}
        switch (type) {
            case `start_game`: 
                embed.description = `A new UNO Stew match has started! ${current_top_cards_text}`
                return embed
            case `table`:
                embed.description = `${current_top_cards_text}`
                return embed
            case `play_card`:
                embed.description = options.text + `\n\n${current_top_cards_text}`
                return embed
        }
    }
    /**
     * The base embed used for other embeds.
     */
    static get_default_embed(game) {
        return {
            color: game.discard_piles[game.last_pile].top_card.hex,
        }
    }
    static buttons(game) {
        const buttons = [
            new ButtonBuilder()
            .setCustomId(`hand`)
            .setLabel(`Hand`)
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId(`table`)
            .setLabel(`Table`)
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId(`players`)
            .setLabel(`Players`)
            .setStyle(ButtonStyle.Primary),
        ]
        const default_action_row = new ActionRowBuilder()
        .setComponents(buttons)
        return default_action_row
    }
}