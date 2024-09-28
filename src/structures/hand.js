const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { Card } = require("./card")

module.exports = class Hand extends Array {
    constructor(data) {
        super()
        Object.assign(this, data)
    }
    /**
     * 
     * @param {string} message_content The message's content.
     * @returns {Object} play_object with the following parameters:
     * @param {number} card_index The 0-indexed card position in the hand
     * @param {number} dish The 0-indexed index of the dish to play in
     * @param {boolean} flex Whether or not to use the flex color/power
     */
    parse = (message_content) => {
        message_content = message_content.toLowerCase().replace(/\s+/g, '')
        let index = message_content.length - 1
        const play_object = {}
        const inputs_to_find = {
            "f": "flex"
        }
        for (let text of Object.values(inputs_to_find)) {
            if (message_content.includes(text)) {
                message_content.replace(text, '')
                play_object[text] = true
            }
        }
        for (let text of Object.keys(inputs_to_find)) {
            if (message_content.includes(text)) {
                message_content.replace(text, '')
                play_object[inputs_to_find[text]] = true
            }
        }
        while (index >= 0) {
            if (isNaN(message_content[index])) {
                const number = message_content.slice(index + 1)
                switch (message_content[index]) {
                    case `d`:
                        play_object["dish"] = parseInt(number) - 1
                        break
                }
                
                message_content = message_content.slice(0, index)
            }
            if (index == 0) {
                play_object["card_index"] = parseInt(message_content) - 1
                play_object["card"] = this[parseInt(message_content) - 1]
            }
            index--
        }
        return play_object
    }
    text(strike = () => false) {
        let text_builder = (card, index) => {
            let text = `${index + 1}. ${card.display_text({hand: true})}`
            if (!card.isValid(this.player.game) || strike(card, this.player.game)) {
                text += ` 🚫`
            }
            return text
        }
        return this.map(text_builder).join(`\n`)
    }
    /**
     * 
     * @returns The hand's embed display.
     */
    embed() {
        return new EmbedBuilder()
        .setDescription(this.text())
        .setTitle(`Hand (${this.length}/25)`)
        .setFooter({text: `Type any card's number to play it. | ${`🍕`.repeat(this.player.pizza)}${`🍿`.repeat(this.player.popcorn)}`})
    }
    /**
     * 
     * @returns Buttons to tell you what each your cards do.
     */
    buttons() {
        let index = 0
        const effects = this.filter(card => card.effect)
        if (effects.length < 1) {
            return []
        }
        const raw_icons = effects
        // reduction 1: filter unique icons
        .reduce((acc, cv) => {
            if (acc.some(card => card.icon == cv.icon)) {
                return acc
            }
            else {
                acc.push(cv)
                return acc
            }
        }, [])
        // reduction 2: sort into grid array
        .reduce((acc, card) => {
            if (acc[index].length > 4) {
                index++
            }
            if (!acc[index]) {
                acc[index] = []
            }
            acc[index].push(card)
            return acc
        }, [[]])
        const buttons = raw_icons.map(row => {
            return new ActionRowBuilder().setComponents(row.map(card => {
                return new ButtonBuilder()
                .setCustomId(card.icon)
                .setLabel(card.display_name)
                .setStyle(ButtonStyle.Primary)
                .setEmoji(card.emoji)
            }))
        })
        return buttons
    }
    /**
     * Flip every card in the hand.
     */
    flip() {
        for (const c of this) {
            c.flip()
        }
    }
    /**
     * @param index Index of the card
     * @returns {Card} the discarded card
     */
    discard(index) {
        return this.splice(index, 1)[0]
    }
}