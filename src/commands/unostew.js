/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-case-declarations */
const wait = require("node:timers/promises").setTimeout;
const currently_playing_channels = []
const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
} = require("discord.js");
const path = require("node:path");
const Game = require("../structures/game");
const {create_signup} = require(path.join(__dirname, `../discord-utils/signup.js`))
const {deck, test} = require("../../config.json")
const rules_embed = new EmbedBuilder()
	.setTitle(`Uno Stew Rules`)
	.setDescription(
		`https://docs.google.com/document/d/12rInO_Mjnqw0bTIJEw06MAQrpqNmvr-W6N5-pd95UnM/edit?usp=sharing`
	);
module.exports = {
	data: new SlashCommandBuilder()
		.setName("unostew")
		.setDescription("Starts a game of Uno Stew."),
	async execute(interaction) {
		if (currently_playing_channels.includes(interaction.channel.id)) {
			interaction.reply({
				ephemeral: true,
				content: `There's currently an ongoing game in this channel!`,
			});
			return;
		}
        const {channel} = interaction
		currently_playing_channels.push(channel.id);
		const league = interaction.options.getBoolean(`league`);
		let player_list
		if (test) {
			const {client} = interaction
			player_list = [
				await client.users.fetch("315495597874610178"),
				await client.users.fetch("224214982756270082"),
				//await client.users.fetch("1014413186017021952")
			]
		}
		else {
			player_list = await create_signup({
				interaction,
				game_name: league ? "Uno League" : "Uno Stew",
				min_players: 2,
				minutes: 7,
				rules: [rules_embed],
				embed_color: 0xec1e22,
			});
		}
		if (player_list !== null) {
            const game = new Game({
                interaction
            })
            await game.initialize({
                players: player_list,
                deck
            })
            await game.start()
			interaction.client.on(`messageCreate`, (message) => {
				if (message.content.toLowerCase() == `close` && message.channel.id == channel.id) {
					currently_playing_channels.splice(currently_playing_channels.indexOf(channel.id), 1)
				}
			})
		} else {
			currently_playing_channels.splice(currently_playing_channels.indexOf(channel.id), 1)
		}
	},
};
