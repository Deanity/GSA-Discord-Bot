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
      
      .setTitle("SELAMAT DATANG DI ARCADE COMMUNITY!")
      .setDescription(
        `Selamat datang di server koordinasi resmi Google Skills Arcade 2026!\n\n` +
        `Halo **${member}**! Server ini adalah wadah belajar, berbagi progres, dan ruang diskusi santai selama kamu mengikuti program Arcade.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `**3 LANGKAH AWAL KAMU:**\n\n` +
        `**1. Cek Pengumuman** - Pantau <#1523644848522006717> untuk info terbaru & jadwal penting.\n` +
        `**2. Aturan Server** - Baca tata tertib di <#1523644848522006718> demi kenyamanan bersama.\n` +
        `**3. Say Hello!** - Yuk, kenalan dengan sesama *players* & Fasilitator di <#1523654046974480554>.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `> *“Gunakan kesempatan ini untuk mengasah skill, mengumpulkan lencana (badges), dan menyelesaikan tantangan di Google Cloud!”*\n\n` +
        `Ada kendala atau pertanyaan? Jangan ragu hubungi para Fasilitator di sini. \n\n` +
        `**Selamat belajar & seru-seruan bareng di The Arcade! 🏆**`
      )
      .setColor(4359668) // Google Blue color code (0x4285F4 = 4359668 in decimal)
      .setImage("https://cdn.discordapp.com/attachments/1523686157269995600/1523686210080604261/arcade_july_header.png?ex=6a4d02dd&is=6a4bb15d&hm=3d0043d0c9b823afbe822e6f3145c0feda3ae4e3f106b184dc250baa5ff1d5e4&")
      .setThumbnail("https://cdn.discordapp.com/attachments/1523686157269995600/1523688170150035557/image.png?ex=6a4d04b0&is=6a4bb330&hm=579247e4888f6c18cf0de5e6a8dce92ce4bbef8cb90d0f5bab93dde6f06015d3&")
      .setFooter({ text: SYSTEM.FOOTER_TEXT })
      .setTimestamp();

    await channel.send({
      content: `**SELAMAT DATANG DI ARCADE COMMUNITY! ${member}**`,
      embeds: [welcomeEmbed]
    });
    
    logger.info(`Successfully sent welcome message for ${member.user.tag} to channel #${channel.name}`);
  } catch (error) {
    logger.error(`Error sending welcome message for ${member.user.tag}:`, error);
  }
}
