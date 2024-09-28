const InputCollector = require("../discord-utils/input_collector")
const Game = require("../structures/game")
const Hand = require("../structures/hand")

module.exports = {
    display_name: `Shuffle Hands`,
    emoji: `🤝`,
    description: `Shuffle everyone's hands together and distribute them according to the number of cards each player had before the shuffle.`,
    /**
     * 
     * @param {Game} game 
     * @param {*} data 
     */
    async effect(game, data) {
        const grand_hand = []
        const shuffle = (array) => {
            for (let i in array) {
                if (!isNaN(i)) {
                    const j = Math.floor(Math.random() * array.length)
                    const temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                }
            }
        }
        const player_hand_counts = game.player_list.map(p => {
            const original_length = p.hand.length
            while (p.hand.length > 0) {
                grand_hand.push(p.hand.pop())
            }
            return original_length
        })
        shuffle(grand_hand)
        for (const i in player_hand_counts) {
            const amount = player_hand_counts[i]
            while (game.player_list[i].hand.length < amount) {
                game.player_list[i].hand.push(grand_hand.pop())
            }
        }
        return game.channel.send(`Everyone's hands were shuffled!`)
    }
}