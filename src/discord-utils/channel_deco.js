const { TextChannel } = require("discord.js");

module.exports = class ChannelDeco extends TextChannel {
    constructor(originalChannel) {
        super(originalChannel.client, originalChannel.data);
        this.originalChannel = originalChannel;
        this.saved_messages = [];
    }

    async send(data) {
        // Call the send method on the original channel instance
        const message = await this.originalChannel.send(data);

        // Store the sent message in the array
        this.saved_messages.push(message);

        // Return the message so that it works as expected
        return message;
    }
}