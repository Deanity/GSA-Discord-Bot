import { GuildMember, Events, EmbedBuilder, TextChannel } from 'discord.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { SYSTEM } from '../config/constants.js';

export const name = Events.GuildMemberAdd;
export const once = false;

export async function execute(member: GuildMember): Promise<void> {
  const guild = member.guild;
  logger.info(`New member joined: ${member.user.tag} (${member.id}) in guild "${guild.name}"`);

  // Target welcome channel: prioritize env WELCOME_CHANNEL_ID, fallback to server's default system channel
  let channelId = env.WELCOME_CHANNEL_ID;
  if (!channelId) {
    channelId = guild.systemChannelId || '';
  }

  if (!channelId) {
    logger.warn(`Could not determine welcome channel for guild "${guild.name}". Set WELCOME_CHANNEL_ID in .env or configure a System Channel in server settings.`);
    return;
  }

  try {
    const channel = await guild.channels.fetch(channelId);
    
    if (!channel || !(channel instanceof TextChannel)) {
      logger.error(`Welcome channel with ID ${channelId} not found or is not a text channel.`);
      return;
    }

    const welcomeEmbed = new EmbedBuilder()
      
      .setTitle("WELCOME TO THE ARCADE COMMUNITY!")
      .setDescription(
        `Welcome to the official Google Skills Arcade 2026 coordination server!\n\n` +
        `Hey **${member}**! This server is your space to learn, share progress, and have casual discussions throughout the Arcade program.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `**YOUR FIRST 3 STEPS:**\n\n` +
        `**1. Check Announcements** - Follow <#1523644848522006717> for the latest updates & important schedules.\n` +
        `**2. Server Rules** - Read the guidelines in <#1523644848522006718> to keep things comfortable for everyone.\n` +
        `**3. Say Hello!** - Come introduce yourself to fellow *players* & Facilitators in <#1523654046974480554>.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `> *"Use this opportunity to sharpen your skills, collect badges, and complete challenges on Google Cloud!"*\n\n` +
        `Got any issues or questions? Don't hesitate to reach out to the Facilitators here.\n\n` +
        `**Happy learning & have a blast at The Arcade! 🏆**`
      )
      .setColor(4359668) // Google Blue color code (0x4285F4 = 4359668 in decimal)
      .setImage("https://cdn.discordapp.com/attachments/1523686157269995600/1523686210080604261/arcade_july_header.png?ex=6a4d02dd&is=6a4bb15d&hm=3d0043d0c9b823afbe822e6f3145c0feda3ae4e3f106b184dc250baa5ff1d5e4&")
      .setFooter({ text: SYSTEM.FOOTER_TEXT })
      .setTimestamp();

    await channel.send({
      content: `**WELCOME TO THE ARCADE COMMUNITY! ${member}**`,
      embeds: [welcomeEmbed]
    });
    
    logger.info(`Successfully sent welcome message for ${member.user.tag} to channel #${channel.name}`);
  } catch (error) {
    logger.error(`Error sending welcome message for ${member.user.tag}:`, error);
  }
}
