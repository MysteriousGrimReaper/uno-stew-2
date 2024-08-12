const fs = require("node:fs");
const path = require("node:path");
const {
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
} = require("discord.js");
const { testToken, token } = require("./config.json");
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [Partials.Channel, Partials.Message],
	allowedMentions: { parse: ["users"] },
});

client.commands = new Collection();
client.cooldowns = new Collection();
const filesPath = path.join(__dirname, "src/commands");
const commandFiles = fs.readdirSync(filesPath);

for (const file of commandFiles) {
	if (!file.endsWith(".js")) {
		continue;
	}
	const command = require(path.join(filesPath, file));
	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(
			`[WARNING] The command at ${path.join(
				filesPath,
				file
			)} is missing a required "data" or "execute" property.`
		);
	}
}

const eventsPath = path.join(__dirname, "src/events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}
client.login(token);
/*
const yourUserId = "1014413186017021952";

process.on("uncaughtException", (error) => {
	// Retrieve your user object
	const user = client.users.cache.get(yourUserId);

	// Send the error message to yourself via DM
	user.send(`An error occurred: ${error}`);
});
*/
