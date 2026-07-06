import { Message, Events, TextChannel } from 'discord.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { TEMPLATES } from '../config/constants.js';

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message): Promise<void> {
  // Ignore messages sent by bots or outside guilds
  if (message.author.bot || !message.guild) return;

  const introChannelId = env.INTRODUCTION_CHANNEL_ID;
  
  // Only execute in the designated introduction channel
  if (!introChannelId || message.channelId !== introChannelId) return;

  const channel = message.channel as TextChannel;
  logger.info(`Message detected in introduction channel from ${message.author.tag} (${message.author.id})`);

  try {
    // Fetch last 10 messages to scan for previous bot sticky messages
    const messages = await channel.messages.fetch({ limit: 10 });
    const botId = message.client.user?.id;

    if (botId) {
      // Filter for bot's own previous messages that contain the template header
      const previousTemplates = messages.filter(
        msg => msg.author.id === botId && msg.content.includes('TEMPLATE PERKENALAN')
      );

      if (previousTemplates.size > 0) {
        logger.debug(`Found ${previousTemplates.size} previous template messages. Deleting...`);
        
        for (const [_, tempMsg] of previousTemplates) {
          try {
            await tempMsg.delete();
          } catch (deleteErr) {
            logger.warn(`Could not delete previous sticky message ${tempMsg.id}:`, deleteErr);
          }
        }
      }
    }

    // Send the fresh sticky message at the bottom of the channel
    await channel.send({
      content: TEMPLATES.INTRO_STICKY
    });

    logger.info('Successfully repositioned sticky introduction template.');
  } catch (error) {
    logger.error('Failed to handle sticky introduction message:', error);
  }
}
