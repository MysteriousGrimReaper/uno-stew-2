/* eslint-disable no-case-declarations */
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	Events,
} = require("discord.js");
module.exports = {
	// create signup function
	async create_signup({
		interaction,
		game_name,
		min_players = 2,
		minutes = 5,
		channel,
		join_modal,
		rules,
		settings,
		embed_color,
	}) {
		console.log(
			`Created new signup for ${game_name} with minimum players ${min_players} and closes after ${minutes} minutes.`
		);
		return new Promise((resolve, reject) => {
			try {
				interaction.reply({
					content: `Creating signup for ${game_name}...`,
					ephemeral: true,
				});

				const game_channel = channel ?? interaction.channel; // channel where the game will be held
				const player_list = [interaction.user]; // array that holds the player list. person who starts is host
				const submissions_list = [];
				const player_name_list = () => {
					return player_list.map((player, index) =>
						index == 0
							? `${player.globalName ?? player.username} (Host)` // adds host to the host
							: index < 50
							? player.globalName ?? player.username // map the user to their username if under 50
							: index == 50
							? `+ ${player_list.length - 49} more...` // map the user to "+n more..." if 50 or over
							: ``
					);
				};
				const signup_embed = () => {
					return new EmbedBuilder()
						.setColor(embed_color ?? 0x999999)
						.setTitle(
							`${game_name} starting! Press Join to join the game.`
						)
						.setThumbnail(`https://files.catbox.moe/m3tqcs.png`)
						.setDescription(player_name_list().join("\n"));
				};
				const start_game_embed = () => {
					return new EmbedBuilder()
						.setColor(embed_color ?? 0x999999)
						.setTitle(`${game_name} started!`)
						.setThumbnail(`https://files.catbox.moe/m3tqcs.png`)
						.setDescription(player_name_list().join("\n"));
				};
				const join_button = new ButtonBuilder()
					.setCustomId("join")
					.setLabel("Join")
					.setStyle(ButtonStyle.Success);
				const quit_button = new ButtonBuilder()
					.setCustomId("quit")
					.setLabel("Quit")
					.setStyle(ButtonStyle.Danger);
				const start_button = new ButtonBuilder()
					.setCustomId("start")
					.setLabel("Start")
					.setStyle(ButtonStyle.Primary);
				const rules_button = new ButtonBuilder()
					.setCustomId("rules")
					.setLabel("Rules")
					.setStyle(ButtonStyle.Secondary);
				const settings_button = new ButtonBuilder()
					.setCustomId("settings")
					.setLabel("Settings")
					.setStyle(ButtonStyle.Secondary);
				const menu_button_row = new ActionRowBuilder().addComponents(
					join_button,
					quit_button,
					start_button,
					rules_button,
					settings_button
				);
				const send_signup_message = async () => {
					const signup_message = await game_channel.send({
						embeds: [signup_embed()],
						components: [menu_button_row],
					});
					const collector =
						signup_message.createMessageComponentCollector({
							filter: (i) =>
								i.user.id !== interaction.client.user.id,
							time: minutes * 1000 * 60,
						});
					collector.on("collect", async (i) => {
						const { customId, user } = i;
						switch (customId) {
							case "rules":
								i.reply({ ephemeral: true, embeds: rules });
								break;
							case "join":
								if (player_list.includes(user)) {
									await i.reply({
										content: "You are already in the game!",
										ephemeral: true,
									});
								} else if (join_modal) {
									await i.showModal(join_modal);
									interaction.client.on(
										Events.InteractionCreate,
										async function modal_response(
											modal_interaction
										) {
											if (
												!modal_interaction.isModalSubmit() ||
												modal_interaction.user.id !=
													i.user.id ||
												join_modal.toJSON()[
													`custom_id`
												] != modal_interaction.customId
											) {
												interaction.client.off(
													Events.InteractionCreate,
													modal_response
												);
												return;
											}
											await modal_interaction.reply({
												content:
													"You have joined the game!",
												ephemeral: true,
											});
											player_list.push(user);
											submissions_list.push({
												user: user,
												submission:
													modal_interaction.fields[
														`fields`
													],
												full_modal_interaction:
													modal_interaction,
											});
											await signup_message.edit({
												embeds: [signup_embed()],
												components: [menu_button_row],
											});
											interaction.client.off(
												Events.InteractionCreate,
												modal_response
											);
										}
									);
								} else {
									player_list.push(user);
									await i.reply({
										content: "You have joined the game!",
										ephemeral: true,
									});
									signup_message.edit({
										embeds: [signup_embed()],
										components: [menu_button_row],
									});
								}
								break;
							case "quit":
								if (user.id == interaction.user.id) {
									await i.reply({
										content:
											"You can't quit the game, you're the host!",
										ephemeral: true,
									});
									return;
								}
								const index = player_list.findIndex(
									(player) => player.id === user.id
								);
								const submission_index =
									submissions_list.findIndex((submission) => {
										submission[`user`]?.id === user.id;
									});
								if (index !== -1) {
									player_list.splice(index, 1);
									await i.reply({
										content: "You have quit the game.",
										ephemeral: true,
									});
									if (submission_index !== -1) {
										submissions_list.splice(
											submission_index,
											1
										);
									}

									signup_message.edit({
										embeds: [signup_embed()],
										components: [menu_button_row],
									});
								}
								break;
							case "start":
								if (player_list[0].id !== user.id) {
									await i.reply({
										content:
											"You are not the host, you can't start the game!",
										ephemeral: true,
									});
								} else if (player_list.length < min_players) {
									console.log(player_list.length - 1);
									console.log(min_players);
									await i.reply({
										content:
											"There aren't enough players yet!",
										ephemeral: true,
									});
								} else if (player_list[0].id === user.id) {
									await i.reply({
										content: "Starting the game...",
										ephemeral: true,
									});
									collector.stop(`Started`);
								}
								break;
						}
					});
					collector.on("end", () => {
						if (player_list.length >= min_players) {
							signup_message.edit({
								embeds: [start_game_embed(), ...rules],
								components: [],
							});
							if (submissions_list.length > 0) {
								resolve(submissions_list);
							} else {
								resolve(player_list);
							}
						} else {
							signup_message.edit({
								content: `Game closed due to inactivity.`,
								embeds: [],
								components: [],
							});
							resolve(null);
						}
					});
				};
				send_signup_message();
			} catch (error) {
				reject(error); // Reject the promise if an error occurs
			}
		});
	},
};
