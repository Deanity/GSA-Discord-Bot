import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  TextChannel 
} from 'discord.js';
import { Command } from '../types/command.types.js';
import { logger } from '../utils/logger.js';

const sendEmbedCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('sendembed')
    .setDescription('Sends a custom JSON embed payload to the current channel.')
    .addStringOption(option => 
      option.setName('json')
        .setDescription('Paste the JSON data from Discohook')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const jsonInput = interaction.options.getString('json', true);

    await interaction.deferReply({ ephemeral: true });

    try {
      let payload: Record<string, unknown>;
      
      try {
        const parsed = JSON.parse(jsonInput);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Parsed JSON is not an object');
        }
        payload = parsed as Record<string, unknown>;
      } catch (parseError) {
        await interaction.editReply({ 
          content: '❌ **Format JSON tidak valid!** Pastikan format JSON benar (gunakan format dari Discohook).' 
        });
        return;
      }

      // Support both raw format and Discohook share/backup format
      if (Array.isArray(payload.messages) && payload.messages.length > 0) {
        const firstMessage = payload.messages[0] as Record<string, unknown>;
        if (firstMessage && typeof firstMessage === 'object') {
          payload = (firstMessage.data as Record<string, unknown>) || firstMessage;
        }
      }

      const channel = interaction.channel;
      if (!channel || !('send' in channel)) {
        await interaction.editReply({ 
          content: '❌ **Gagal mengirim:** Channel tidak dapat diakses atau bukan text channel.' 
        });
        return;
      }

      const embedsToSend = (payload.embeds as unknown[]) || [];
      const contentToSend = (payload.content as string) || undefined;

      if (!contentToSend && embedsToSend.length === 0) {
        await interaction.editReply({ 
          content: '❌ **Payload kosong!** Pastikan JSON memiliki properti `content` atau `embeds`.' 
        });
        return;
      }

      await (channel as TextChannel).send({
        content: contentToSend,
        embeds: embedsToSend as any[] // cast to any[] at the library boundary for discord.js typing compatibility
      });

      await interaction.editReply({ content: '✅ **Embed berhasil dikirim ke channel ini!**' });
      logger.info(`Admin ${interaction.user.tag} sent a custom embed in channel ${channel.id}`);
    } catch (error) {
      logger.error('Error executing sendembed command:', error);
      await interaction.editReply({ 
        content: '❌ **Terjadi kesalahan saat memproses payload embed.** Pastikan semua field (seperti warna, urls) menggunakan format Discord yang sah.' 
      });
    }
  }
};

export default sendEmbedCommand;
