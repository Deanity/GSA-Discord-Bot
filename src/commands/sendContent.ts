import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  TextChannel 
} from 'discord.js';
import { Command } from '../types/command.types.js';
import { logger } from '../utils/logger.js';

const sendContentCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('sendcontent')
    .setDescription('Sends plain text content to the current channel, preserving formatting.')
    .addStringOption(option => 
      option.setName('text')
        .setDescription('Enter or paste the text content')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const textInput = interaction.options.getString('text', true);

    await interaction.deferReply({ ephemeral: true });

    try {
      const channel = interaction.channel;
      if (!channel || !('send' in channel)) {
        await interaction.editReply({ 
          content: '❌ **Gagal mengirim:** Channel tidak dapat diakses atau bukan text channel.' 
        });
        return;
      }

      // Convert any literal '\n' character sequences into real newlines for formatting support
      const formattedText = textInput.replace(/\\n/g, '\n');

      await (channel as TextChannel).send({
        content: formattedText
      });

      await interaction.editReply({ content: '✅ **Konten berhasil dikirim ke channel ini!**' });
      logger.info(`Admin ${interaction.user.tag} sent text content in channel ${channel.id}`);
    } catch (error) {
      logger.error('Error executing sendcontent command:', error);
      await interaction.editReply({ 
        content: '❌ **Terjadi kesalahan saat mengirim konten.**' 
      });
    }
  }
};

export default sendContentCommand;
