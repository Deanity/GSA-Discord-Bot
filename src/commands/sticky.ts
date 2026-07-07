import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  TextChannel 
} from 'discord.js';
import { Command } from '../types/command.types.js';
import { logger } from '../utils/logger.js';
import { 
  saveStickyConfig, 
  deleteStickyConfig, 
  getStickyConfig, 
  updateLastMessageId 
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
        .addStringOption(opt => 
          opt.setName('payload')
            .setDescription('Enter the plain text or JSON payload')
            .setRequired(true)
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

    await interaction.deferReply({ ephemeral: true });

    try {
      if (subcommand === 'set') {
        const type = interaction.options.getString('type', true) as 'embed' | 'content';
        const payload = interaction.options.getString('payload', true);

        // Verify JSON if it's an embed
        if (type === 'embed') {
          try {
            const parsed = JSON.parse(payload);
            if (typeof parsed !== 'object' || parsed === null) {
              throw new Error('Payload must be an object');
            }
          } catch (e) {
            await interaction.editReply({ 
              content: '❌ **Format JSON tidak valid!** Pastikan payload JSON memiliki format yang benar.' 
            });
            return;
          }
        }

        // Clean up previous sticky message from Discord if it exists
        const existing = await getStickyConfig(channel.id);
        if (existing && existing.last_message_id) {
          try {
            const msg = await channel.messages.fetch(existing.last_message_id);
            if (msg) {
              await msg.delete();
            }
          } catch (e) {
            // Silence message delete error (e.g. if already deleted manually)
          }
        }

        // Persist sticky config in database
        const saved = await saveStickyConfig(channel.id, type, payload);
        if (!saved) {
          await interaction.editReply({ 
            content: '❌ **Gagal:** Terjadi kesalahan saat menyimpan konfigurasi ke database.' 
          });
          return;
        }

        // Post the sticky message to the channel
        let sentMessage;
        if (type === 'embed') {
          let embedPayload = JSON.parse(payload);
          
          // Support wrapped Discohook format
          if (embedPayload.messages && Array.isArray(embedPayload.messages) && embedPayload.messages.length > 0) {
            embedPayload = embedPayload.messages[0].data || embedPayload.messages[0];
          }

          const content = embedPayload.content || undefined;
          const embeds = embedPayload.embeds || [];

          sentMessage = await (channel as TextChannel).send({
            content,
            embeds: embeds as any[]
          });
        } else {
          const formattedText = payload.replace(/\\n/g, '\n');
          sentMessage = await (channel as TextChannel).send({
            content: formattedText
          });
        }

        // Save new message ID in database
        await updateLastMessageId(channel.id, sentMessage.id);

        await interaction.editReply({ 
          content: '✅ **Sticky message berhasil dikonfigurasi dan diposting!**' 
        });
        logger.info(`Sticky message configured in channel ${channel.id} by ${interaction.user.tag}`);

      } else if (subcommand === 'remove') {
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
      await interaction.editReply({ 
        content: '❌ **Terjadi kesalahan internal saat memproses perintah.**' 
      });
    }
  }
};

export default stickyCommand;
