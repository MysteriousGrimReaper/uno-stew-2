const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js")
const { Card, CardFace } = require("./card")
const {createCanvas, loadImage, registerFont } = require("canvas")
const cell_length = 200
const border = 20
const border_color = "white"
const canvas = createCanvas(cell_length * 5 + border * 6, cell_length * 5 + border * 6)
const ctx = canvas.getContext('2d')
registerFont("./Archivo-SemiBold.ttf", { family: "Archivo" });
module.exports = class Hand extends Array {
    constructor(data) {
        super()
        Object.assign(this, data)
        this.use_image = true // set this back to false later
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
     * @returns What the game will send.
     */
    display() {
        const message_object = {ephemeral: true, components: this.buttons()}
        message_object.embeds = [this.embed()]
        if (this.use_image) {
            const attachment = new AttachmentBuilder(this.image(), { name: 'canvas-image.png' });
            message_object.files = [attachment]
            message_object.embeds = [this.embed()
                .setDescription(` `)
                .setImage('attachment://canvas-image.png')
            ]
        }
        
        return message_object
    }
    /**
     * @returns The hand's image.
     */
    image(strike = () => false) {
        ctx.fillStyle = border_color
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const card = this[j * 5 + i]

                if (card) {
                    ctx.fillStyle = `#${CardFace[card.color].toString(16).padStart(6, '0')}`
                }
                else {
                    ctx.fillStyle = "#222222"
                }
                const top_left_corner = [i * cell_length + (i+1) * border, j * cell_length + (j+1) * border]
                ctx.fillRect(...top_left_corner, cell_length, cell_length)
                
                if (card) {
                    if (card.color === `j`) {
                        ctx.fillStyle = `white`
                        const clear_lines = 3
                        const base_offset = cell_length / clear_lines
                        for (let k = 0; k < clear_lines; k++) {
                            const vertices = [
                                [top_left_corner[0], top_left_corner[1] + k * base_offset],
                                [top_left_corner[0] + k * base_offset, top_left_corner[1]],
                                [top_left_corner[0] + (k+0.5) * base_offset, top_left_corner[1]],
                                [top_left_corner[0], top_left_corner[1] + (k+0.5) * base_offset]
                            ]
                            ctx.beginPath()
                            ctx.moveTo(...vertices[0])
                            ctx.lineTo(...vertices[1])
                            ctx.lineTo(...vertices[2])
                            ctx.lineTo(...vertices[3])
                            ctx.lineTo(...vertices[0])
                            ctx.fill()
                        }
                    }
                    ctx.fillStyle = "black"
                    ctx.font = "50px Archivo"
                    ctx.fillText(card.display_name, (i + 0.1) * cell_length + (i+1) * border, (j + 0.3) * cell_length + (j+1) * border)
                }
            }
        }
        return canvas.toBuffer('image/png')
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
        const hand_util_buttons = [
            new ActionRowBuilder().setComponents([
                new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId(`display-${this.use_image ? `text` : `image`}`)
                .setEmoji(`${this.use_image ? `📝` : `🖼️`}`)
                .setLabel(`Display ${this.use_image ? `Text` : `Image`}`)])
        ]
        return [...hand_util_buttons,
            ...buttons]
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