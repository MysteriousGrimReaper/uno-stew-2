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
const {create_signup} = require(path.join(__dirname, `../discord-utils/signup.js`))
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
        console.log(`hi`)
        /*
		if (currently_playing_channels.includes(interaction.channel.id)) {
			interaction.reply({
				ephemeral: true,
				content: `There's currently an ongoing game in this channel!`,
			});
			return;
		}
            */
        const {channel} = interaction
		currently_playing_channels.push(channel.id);
        
		const game_channel = interaction.channel;
		const league = interaction.options.getBoolean(`league`);
		const player_list = await create_signup({
			interaction,
			game_name: league ? "Uno League" : "Uno Stew",
			min_players: 2,
			minutes: 7,
			rules: [rules_embed],
			embed_color: 0xec1e22,
		});
		if (player_list !== null) {
			const hand_button = new ButtonBuilder()
				.setCustomId("unostew_hand")
				.setLabel("Hand")
				.setStyle(ButtonStyle.Primary);
			const table_button = new ButtonBuilder()
				.setCustomId("unostew_table")
				.setLabel("Table")
				.setStyle(ButtonStyle.Secondary);
			const player_button = new ButtonBuilder()
				.setCustomId("unostew_players")
				.setLabel("Players")
				.setStyle(ButtonStyle.Secondary);
			const game_row = new ActionRowBuilder().addComponents(
				hand_button,
				table_button,
				player_button
			);
			const drawpile = new DrawPile().load(deck);
			const wild_drawpile = new DrawPile();

			const uno_players = new PlayerManager()
				.load(player_list, interaction)
				.setGameInfo(interaction)
				.setMainDrawPile(drawpile)
				.setWildDrawPile(wild_drawpile)
				.setEffectList(effect_list);
			const user_to_player = (user) => {
				return uno_players.find((player) => player.user.id == user.id);
			};
			uno_players.forEach(async (player) => {
				player.draw(drawpile, 7);
				player.drawpile = drawpile;
				await player.user.send({ embeds: [player.init_hand_embed] });
			});
			drawpile.discard(0);
			drawpile.discard(1);
			drawpile.discard(2);
			drawpile.discard(3);
			const filter = (m) => !m.author.bot;
			const message_collector = game_channel.createMessageCollector({
				filter,
			});
			let last_interaction_processed_time = new Date();
			// (hand/table/players) button input processing
			hand_collect_reply_fn = async (i) => {
				const { customId } = i;
				if (!uno_players.map((p) => p.user.id).includes(i.user.id)) {
					await i.reply({
						content: `You aren't in the game...`,
						ephemeral: true,
					});
					return;
				}
				const player = user_to_player(i.user);
				switch (customId) {
					case `unostew_hand`:
						await i.reply({
							embeds: [player.hand_embed(uno_players)],
							ephemeral: true,
						});
						break;
					case `unostew_table`:
						await i.reply({
							embeds: [
								uno_players.oven_embed,
								drawpile.table_embed,
							],
							ephemeral: true,
						});
						break;
					case `unostew_players`:
						await i.reply({
							embeds: [uno_players.player_embed],
							ephemeral: true,
						});
				}
			};
			/* let currently_inactive_discard_pile =
				Math.max(1, Math.ceil(Math.random() * 4)) - 1;
			drawpile.set_new_inactive_discard_pile(
				currently_inactive_discard_pile
			);*/
			// update this to be an embed
			await game_channel.send({
				content: `It is now ${uno_players.current_user}'s turn!`,
				embeds: [drawpile.table_embed],
				components: [game_row],
			});
			// read messages
			let cooldown = false;
			const cooldown_timer = 0.5;
			message_collector.on(`ignore`, () => {
				cooldown = false;
			});
			message_collector.on(`collect`, async () => {
				await wait(cooldown_timer * 1000);
				cooldown = false;
			});
			// uno! collector
			message_collector.on(`collect`, async (message) => {
				const player = uno_players.find(
					(p) => p.user.id == message.author.id
				);
				if (!player) {
					return;
				}
				if (
					message.content.toLowerCase().includes(`uno!`) ||
					message.content.toLowerCase().includes(`&&!`)
				) {
					if (player.hand.length == 1) {
						player.uno_callable = false;
						await game_channel.send(
							`**UNO!!** ${player.user} has one card left!`
						);
					}
				}
				if (message.content.toLowerCase().includes(`callout`)) {
					const uno_callout_player = uno_players.find(
						(p) => p.hand.length == 1 && p.uno_callable
					);
					if (uno_callout_player) {
						await game_channel.send(
							`${uno_callout_player.user} didn't say Uno! Draw 2 cards.`
						);
						uno_callout_player.draw(drawpile, 2);
					}
				}
			});
			message_collector.on(`collect`, async (message) => {
				if (cooldown) {
					return;
				}
				if (
					new Date().getTime() -
						last_interaction_processed_time.getTime() <
						1000 * 60 * 2 &&
					message.content.includes(`timeout`)
				) {
					last_interaction_processed_time = new Date();
					const player = uno_players.current_player;
					uno_players.draw_check = 0;
					if (uno_players.draw_stack > 0) {
						const draws = await player.draw(
							drawpile,
							uno_players.draw_stack
						);
						// console.log(uno_players.draw_stack);

						await player.user.send(
							`You drew the following (${
								uno_players.draw_stack
							}) cards:\n- ${draws
								.map((card) => card.text)
								.join(`\n- `)}`
						);
						await game_channel.send(
							`You drew ${uno_players.draw_stack} cards!`
						);
						uno_players.draw_stack = 0;
						await end_turn();
						return;
					}
					await player.draw(drawpile, 1);
					await end_turn();
					return;
				}
				last_interaction_processed_time = new Date();
				cooldown = true;
				if (
					message.author.id == interaction.user.id &&
					message.content == `stop!`
				) {
					message_collector.stop();
					await game_channel.send(`Game stopped.`);
					return;
				}
				if (uno_players.input_state) {
					return;
				}
				const player = user_to_player(message.author);
				const user_index = uno_players
					.map((p) => p.user)
					.indexOf(message.author);

				// if user is not in the game
				if (player == undefined || user_index < 0) {
					return;
				}
				const current_player_flag =
					user_index == uno_players.current_turn_index;

				const args = message.content.split(` `);

				// console.log(player.hand);
				const jump_in_flag =
					args.find(
						(argument) =>
							/^j$/.test(argument) || /^jump$/.test(argument)
					) != undefined;
				const sum_flag =
					args.find((argument) => /^sum$/.test(argument)) !=
					undefined;
				const pile_indicator = args.find((argument) =>
					/^d[1-4]$/.test(argument)
				);
				// console.log(args);
				const card_chosen = args.reduce((acc, cv) => {
					if (acc) {
						return acc;
					} else {
						return player.hand.check_for_card(cv);
					}
				}, undefined);
				const debug_ids = [
					`315495597874610178`,
					`1014413186017021952`,
					`709631847923187793`,
				];
				// end of turn function
				async function end_turn() {
					uno_players.update_discard_piles();
					await uno_players.forEach(async (p) => {
						if (p.hand.length >= 25) {
							await game_channel.send(
								`${p.user} has perished to the stew... (25 or more cards)`
							);
							while (p.hand.length > (p.pizza > 0 ? 7 : 0)) {
								drawpile.unshift(p.hand.pop());
							}
							if (p.pizza > 0) {
								p.pizza--;
								await game_channel.send(
									`${p.name} has resurrected by the power of pizza! (${p.pizza} remaining)`
								);
							} else {
								uno_players.add_loser(`${p.user.id}`);
							}
							// console.log(uno_players);
						} else if (p.win_by_match) {
							await game_channel.send(
								`${p.user} has escaped the kitchen! (All piles match in color or symbol)`
							);
							uno_players.add_winner(`${p.user.id}`);
						}
					});
					console.log(uno_players.length);
					/* currently_inactive_discard_pile =
						Math.max(1, Math.ceil(Math.random() * 4)) - 1;
					drawpile.set_new_inactive_discard_pile(
						currently_inactive_discard_pile
					);*/
					if (uno_players.length == 1) {
						await game_channel.send(
							`## Congratulations to ${uno_players[0].user} for winning!\nHave some chocolate! :chocolate_bar:`
						);
						await db.set(
							`${uno_players[0].user}.name`,
							uno_players[0].name
						);
						await db.add(`${uno_players[0].user.id}.wins`, 1);
						message_collector.stop();
						hand_collect_reply_fn = null;
						return;
					}
					uno_players.step();
					// send info
					await game_channel.send({
						content: `${
							uno_players.draw_stack > 0
								? `You have been draw attacked, ${uno_players.current_user}! Type \`draw\` to draw **${uno_players.draw_stack}** cards play another draw card with equal or higher value.`
								: `It is now ${uno_players.current_user}'s turn!`
						}`,
						embeds: [drawpile.table_embed],
						components: [game_row],
					});

					await uno_players.current_player.user.send({
						embeds: [uno_players.current_player.init_hand_embed],
					});
				}
				// debug commands
				if (debug_ids.includes(message.author.id)) {
					// debug command, type "# debug remove" to use
					if (message.content.includes(`debug remove`)) {
						if (!debug_ids.includes(message.author.id)) {
							return;
						}
						const removal_index = parseInt(message.content);
						if (isNaN(removal_index)) {
							return;
						}
						player.hand.remove_card_by_index(removal_index);
						console.log(`removed card at index ${removal_index}`);
						return;
					}
					const card_parse =
						`{"color":"${args[2]}","icon":"${args[3]}"` +
						(args[4] ? `,"flex":"${args[4]}"` : ``) +
						`}`;
					// debug command, add a card (in json notation)
					if (message.content.includes(`debug addcard`)) {
						try {
							player.hand.push(
								new Card(
									new CardFace(
										JSON.parse(args.slice(2).join(` `))
									),
									new CardFace(
										JSON.parse(args.slice(2).join(` `))
									)
								)
							);
							await game_channel.send(
								`Added card \`${
									player.hand[player.hand.length - 1].text
								}\` to your hand.`
							);
						} catch (error) {
							await player.user.send(
								`An error occurred: ${error}`
							);
						}
					}
					// add a card (in spaced notation)
					if (message.content.includes(`debug +card`)) {
						try {
							player.hand.push(
								new Card(
									new CardFace(JSON.parse(card_parse)),
									new CardFace(JSON.parse(card_parse))
								)
							);
							await game_channel.send(
								`Added card \`${
									player.hand[player.hand.length - 1].text
								}\` to your hand.`
							);
						} catch (error) {
							await player.user.send(
								`An error occurred: ${error}`
							);
						}
					}
					if (message.content.includes(`debug deckcard`)) {
						try {
							drawpile.push(
								new Card(
									new CardFace(JSON.parse(card_parse)),
									new CardFace(JSON.parse(card_parse))
								)
							);
							await game_channel.send(
								`Added card \`${
									player.hand[player.hand.length - 1].text
								}\` to the top of the drawpile.`
							);
						} catch (error) {
							await player.user.send(
								`An error occurred: ${error}`
							);
						}
					}
				}

				// check your hand
				if (message.content == `hand`) {
					message.author.send({
						content: `Your hand:\n${player.hand.text(uno_players)}`,
						ephemeral: true,
					});
					return;
				}
				// draw a card
				if (
					(message.content.toLowerCase() == `draw` ||
						message.content.toLowerCase() == `d`) &&
					current_player_flag
				) {
					uno_players.draw_check = 0;
					if (uno_players.draw_stack > 0) {
						const draws = await player.draw(
							drawpile,
							uno_players.draw_stack
						);
						// console.log(uno_players.draw_stack);

						await player.user.send(
							`You drew the following (${
								uno_players.draw_stack
							}) cards:\n- ${draws
								.map((card) => card.text)
								.join(`\n- `)}`
						);
						await game_channel.send(
							`You drew ${uno_players.draw_stack} cards!`
						);
						uno_players.draw_stack = 0;
						await end_turn();
						return;
					}
					await player.draw(drawpile, 1);
					await end_turn();
					return;
				}
				// check if card exists
				if (!card_chosen) {
					// console.log(`could not find card`);
					return;
				}
				const pile_chosen =
					pile_indicator != undefined
						? drawpile.discardpiles[parseInt(pile_indicator[1]) - 1]
						: drawpile.discardpiles.find(
								(pile) =>
									pile.active &&
									uno_players.playable_on({
										card_to_play: card_chosen,
										pile_chosen: pile,
										current_player_flag,
									})
						  ) ?? drawpile.discardpiles[0];
				// console.log(pile_chosen);
				const current_card = pile_chosen.top_card;

				// effect processing
				const process_effects = async (symbol) => {
					uno_players.input_state = true;
					await effect_list[effect_names.indexOf(symbol)]?.effect({
						uno_players,
						card_chosen,
						pile_chosen,
						player,
						message,
						pile_index: drawpile.discardpiles.indexOf(pile_chosen),
					});
					uno_players.input_state = false;
				};

				// check if it's the user's turn
				if (!current_player_flag) {
					// console.log(`Not the right turn.`);
					return;
				}

				// check if card is valid
				switch (
					uno_players.playable_on({
						card_to_play: card_chosen,
						card: current_card,
						effect_list,
						current_player_flag,
						jump_in: jump_in_flag,
						pile_chosen,
					})
				) {
					case `not player's turn`:
						return;
					case `not draw stackable`:
						return await game_channel.send(
							`A draw attack was played upon you! Stack the draws by playing a draw card of equal or higher value, or by using a card's special effect. (If you have no valid cards, type \`draw\` to draw.)`
						);
					case `failed jump-in`:
						await game_channel.send(
							`${player.user} jumped in with the wrong card... draw 1 card.`
						);
						return await player.draw(drawpile, 1);
					case `jump-in`:
						player.play(card_chosen, pile_chosen);
						await game_channel.send(
							`${player.name} jumped in with a **${card_chosen.text}**!`
						);
						if (current_player_flag && player.hand.length > 1) {
							await game_channel.send(
								`**Patience bonus!** You can play **any** other food on the same dish.`
							);
							const patience_promise = new Promise((resolve) => {
								uno_players.input_state = true;
								const r_filter = (m) =>
									m.author.id === player.user.id; // Only collect messages from the author of the command
								const collector =
									uno_players.game_channel.createMessageCollector(
										{
											filter: r_filter,
											time: 60000,
										}
									);
								collector.on(
									"collect",
									async (collectedMessage) => {
										if (
											collectedMessage.content == `stop`
										) {
											collector.stop();
											resolve();
											return;
										}
										const r_args =
											collectedMessage.content.split(` `);
										const new_card_chosen = r_args.reduce(
											(acc, cv) => {
												if (acc) {
													return acc;
												} else {
													return player.hand.check_for_card(
														cv
													);
												}
											},
											undefined
										);
										if (!new_card_chosen) {
											return;
										}
										player.play(
											new_card_chosen,
											pile_chosen
										);
										await uno_players.game_channel.send({
											content: `${
												player.name
											} played a **${
												new_card_chosen.front.text
											}** on dish ${
												uno_players.drawpile.discardpiles.indexOf(
													pile_chosen
												) + 1
											}.`,
										});
										collector.stop();
										resolve();
									}
								);

								collector.on("end", async (collected) => {
									uno_players.input_state = false;
									if (collected.size === 0) {
										uno_players.game_channel.send(
											"You timed out, playing a random card..."
										);

										await uno_players.game_channel.send({
											content: `${
												player.name
											} played a **${
												player.hand[0].text
											}** on dish ${
												uno_players.drawpile.discardpiles.indexOf(
													pile_chosen
												) + 1
											}.`,
										});
										player.play(
											player.hand[0],
											pile_chosen
										);
										collector.stop();
										resolve();
									}
								});
							});
							await patience_promise;
						}
						// HOUSE RULE - jump-ins' symbols and modifiers activate
						/*
							await process_effects(card_chosen.icon);
							if (card_chosen.modifiers) {
								card_chosen.modifiers.forEach(
									async (mod) => await process_effects(mod)
								);
							}*/
						return;
					case `ono`:
						return await game_channel.send(
							`The plate refuses to accept the card.`
						);
					case `overload`:
						await game_channel.send(
							`You overloaded... turn up the heat.`
						);
						await uno_players.attack(
							Math.ceil(Math.random() * 5) + 5,
							player
						);
						break;
					case false:
						return await game_channel.send(
							`You can't play that card.`
						);
					case `inactive`:
						return await game_channel.send(
							`That pile is inactive.`
						);
					case `flex`:
						if (player.popcorn < 1) {
							return await game_channel.send(
								`You don't have enough popcorn to use that card!`
							);
						}
						player.popcorn--;
						await game_channel.send(
							`*${
								player.name
							} consumes a bucket of popcorn...* (${
								player.popcorn >= 1
									? `🍿`.repeat(player.popcorn)
									: `🪣`
							})`
						);
						break;
				}
				// playing the card
				player.play(card_chosen, pile_chosen);
				if (drawpile.check_match()) {
					player.win_by_match = true;
				}
				await game_channel.send({
					content: `${player.name} played a **${
						card_chosen.text
					}** on dish ${
						drawpile.discardpiles.indexOf(pile_chosen) + 1
					}.`,
				});
				await wait(500);
				if (player.hand.length == 0) {
					await game_channel.send(
						`${player.user} has escaped the stew!`
					);
					uno_players.add_winner(player.id);
				}
				// where the effects begin
				try {
					await process_effects(card_chosen.icon);
					if (card_chosen.modifiers) {
						card_chosen.modifiers.forEach(
							async (mod) => await process_effects(mod)
						);
					}
				} catch (error) {
					await game_channel.send(
						`There was an error with the effect...`
					);
					console.log(error);
				}
				await end_turn();
			});
			message_collector.on(`end`, () => {
				const channel_index = currently_playing_channels.indexOf(
					interaction.channel.id
				);
				if (channel_index > -1) {
					currently_playing_channels.splice(channel_index, 1);
				}
			});
		} else {
			// Game closed due to inactivity
		}
	},
};
