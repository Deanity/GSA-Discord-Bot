import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';
import { Command } from '../types/command.types.js';
import { logger } from '../utils/logger.js';
import { 
  deleteStickyConfig, 
  getStickyConfig 
} from '../services/sticky.service.js';

const stickyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('sticky')
    .setDescription('Manage sticky messages in the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => 
      sub.setName('set')
        .setDescription('Set or update the sticky message for the current channel.')
        .addStringOption(opt => 
          opt.setName('type')
            .setDescription('Select the type of sticky message')
            .setRequired(true)
            .addChoices(
              { name: 'Embed (JSON)', value: 'embed' },
              { name: 'Plain Content (Teks)', value: 'content' }
            )
        )
    )
    .addSubcommand(sub => 
      sub.setName('remove')
        .setDescription('Remove the sticky message from the current channel.')
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.channel;

    if (!channel || !('send' in channel)) {
      await interaction.reply({ 
        content: '❌ **Gagal:** Perintah hanya dapat digunakan pada text channel.', 
        ephemeral: true 
      });
      return;
    }

    try {
      if (subcommand === 'set') {
        const type = interaction.options.getString('type', true) as 'embed' | 'content';

        // Construct the modal builder
        const modal = new ModalBuilder()
          .setCustomId(`sticky_modal_${type}`)
          .setTitle(type === 'embed' ? 'Set Sticky Embed JSON' : 'Set Sticky Text Content');

        // Create the input fields
        const payloadInput = new TextInputBuilder()
          .setCustomId('sticky_payload')
          .setLabel(type === 'embed' ? 'Paste the Discohook JSON payload' : 'Paste the multiline text content')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder(type === 'embed' ? '{"embeds": [{"title": "Rules", "description": "..."}]}' : 'Let\'s get to know each other!\n\nName:\nCollege:')
          .setRequired(true);

        const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(payloadInput);
        modal.addComponents(actionRow);

        // Display modal to the administrator (Cannot defer reply before calling showModal)
        await interaction.showModal(modal);
        logger.info(`Admin ${interaction.user.tag} triggered sticky set modal for type ${type} in channel ${channel.id}`);

      } else if (subcommand === 'remove') {
        await interaction.deferReply({ ephemeral: true });

        const existing = await getStickyConfig(channel.id);
        if (!existing) {
          await interaction.editReply({ 
            content: '❌ **Gagal:** Tidak ada sticky message yang aktif di channel ini.' 
          });
          return;
        }

        // Attempt to clean up Discord message
        if (existing.last_message_id) {
          try {
            const msg = await channel.messages.fetch(existing.last_message_id);
            if (msg) {
              await msg.delete();
            }
          } catch (e) {
            // Silence delete error
          }
        }

        // Delete from database
        const deleted = await deleteStickyConfig(channel.id);
        if (!deleted) {
          await interaction.editReply({ 
            content: '❌ **Gagal:** Terjadi kesalahan saat menghapus konfigurasi dari database.' 
          });
          return;
        }

        await interaction.editReply({ 
          content: '✅ **Sticky message dinonaktifkan di channel ini.**' 
        });
        logger.info(`Sticky message disabled in channel ${channel.id} by ${interaction.user.tag}`);
      }
    } catch (error) {
      logger.error('Error executing sticky command:', error);
      // Respond safely depending on interaction state
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ 
          content: '❌ **Terjadi kesalahan internal saat memproses perintah.**' 
        });
      } else {
        await interaction.reply({ 
          content: '❌ **Terjadi kesalahan internal saat memproses perintah.**', 
          ephemeral: true 
        });
      }
    }
  }
};

export default stickyCommand;
