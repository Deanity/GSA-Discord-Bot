import { Message, Events, TextChannel } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getStickyConfig, updateLastMessageId } from '../services/sticky.service.js';

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message): Promise<void> {
  // Ignore messages sent by bots or outside guilds
  if (message.author.bot || !message.guild) return;

  try {
    // Check if current channel has a sticky message configured
    const sticky = await getStickyConfig(message.channelId);
    if (!sticky) return;

    const channel = message.channel as TextChannel;
    logger.debug(`Sticky message match found for channel ${message.channelId}. Repositioning...`);

    // 1. Delete the previous sticky message from Discord if it exists
    if (sticky.last_message_id) {
      try {
        const oldMsg = await channel.messages.fetch(sticky.last_message_id);
        if (oldMsg) {
          await oldMsg.delete();
        }
      } catch (deleteError) {
        // Silence delete errors (e.g. if the message was already deleted manually)
        logger.debug(`Could not delete previous sticky message ${sticky.last_message_id}: message may have already been deleted.`);
      }
    }

    // 2. Send the fresh sticky message at the bottom
    let sentMessage;
    if (sticky.type === 'embed') {
      let embedPayload = JSON.parse(sticky.payload);
      
      // Support wrapped Discohook format
      if (embedPayload.messages && Array.isArray(embedPayload.messages) && embedPayload.messages.length > 0) {
        embedPayload = embedPayload.messages[0].data || embedPayload.messages[0];
      }

      const content = embedPayload.content || undefined;
      const embeds = embedPayload.embeds || [];

      sentMessage = await channel.send({
        content,
        embeds: embeds as any[]
      });
    } else {
      const formattedText = sticky.payload.replace(/\\n/g, '\n');
      sentMessage = await channel.send({
        content: formattedText
      });
    }

    // 3. Persist the new message ID in the database
    await updateLastMessageId(message.channelId, sentMessage.id);
  } catch (error) {
    logger.error('Failed to reposition sticky message:', error);
  }
}
