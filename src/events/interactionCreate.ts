import { Interaction, Events, Collection, GuildMember, PermissionFlagsBits } from 'discord.js';
import { logger } from '../utils/logger.js';
import { Command } from '../types/command.types.js';
import { handleStickySubmit } from '../services/sticky.service.js';

interface ClientWithCommands {
  commands: Collection<string, Command>;
}

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction): Promise<void> {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const client = interaction.client as unknown as ClientWithCommands;
    
    if (!client.commands) {
      logger.error('Client commands collection is not initialized.');
      return;
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      await interaction.reply({ content: 'Command not found.', ephemeral: true });
      return;
    }

    // Protection System: Admin-only by default, unless explicitly marked as public
    if (!command.isPublic) {
      const member = interaction.member as GuildMember;
      if (!member || !member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ 
          content: '❌ **Akses Ditolak:** Hanya anggota dengan izin Administrator yang dapat menggunakan perintah ini.', 
          ephemeral: true 
        });
        logger.warn(`User ${interaction.user.tag} (${interaction.user.id}) tried to use slash command /${interaction.commandName} without Administrator permissions.`);
        return;
      }
    }

    logger.command(`User ${interaction.user.tag} (${interaction.user.id}) ran /${interaction.commandName}`);

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}`, error);
      
      const errorMessage = { 
        content: 'There was an error while executing this command! Please try again later.', 
        ephemeral: true 
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
    return;
  }

  // 2. Handle Button Interactions
  if (interaction.isButton()) {
    // Placeholder for future button interactions
  }

  // 3. Handle Modal Submits
  if (interaction.isModalSubmit()) {
    const customId = interaction.customId;

    if (customId.startsWith('sticky_modal_')) {
      const type = customId.replace('sticky_modal_', '') as 'embed' | 'content';
      const payload = interaction.fields.getTextInputValue('sticky_payload');

      // Check if user is Administrator before executing
      const member = interaction.member as GuildMember;
      if (!member || !member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ 
          content: '❌ **Akses Ditolak:** Hanya anggota dengan izin Administrator yang dapat mengatur sticky message.', 
          ephemeral: true 
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        await handleStickySubmit(interaction, type, payload);
      } catch (error) {
        logger.error('Error handling sticky modal submit:', error);
        await interaction.editReply({ 
          content: '❌ **Terjadi kesalahan saat memproses data sticky.**' 
        });
      }
    }
  }
}
