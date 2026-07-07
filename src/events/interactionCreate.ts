import { Interaction, Events, Collection, GuildMember, PermissionFlagsBits } from 'discord.js';
import { logger } from '../utils/logger.js';
import { Command } from '../types/command.types.js';
import { ROLES } from '../config/constants.js';

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

  // 2. Handle Button Interactions (Gender Self-Roles)
  if (interaction.isButton()) {
    const customId = interaction.customId;
    
    if (customId.startsWith('gender_role_')) {
      const roleId = customId.replace('gender_role_', '');
      const guild = interaction.guild;
      
      if (!guild) {
        await interaction.reply({ content: 'Interaction can only be processed inside a guild.', ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const member = interaction.member as GuildMember;
        if (!member) {
          await interaction.editReply('Could not fetch your server member profile.');
          return;
        }

        const hasRole = member.roles.cache.has(roleId);
        const opposingRoleId = roleId === ROLES.GENDER_MALE ? ROLES.GENDER_FEMALE : ROLES.GENDER_MALE;

        if (hasRole) {
          // Toggle off
          await member.roles.remove(roleId);
          await interaction.editReply(`Role <@&${roleId}> telah dihapus.`);
          logger.info(`Removed gender role ${roleId} from user ${interaction.user.tag}`);
        } else {
          // Add role
          await member.roles.add(roleId);
          
          // Exclusivity check: remove the opposing gender role if they hold it
          if (member.roles.cache.has(opposingRoleId)) {
            await member.roles.remove(opposingRoleId);
            await interaction.editReply(`Role <@&${roleId}> telah diberikan, dan role <@&${opposingRoleId}> telah dihapus.`);
            logger.info(`Granted gender role ${roleId} and removed opposing role ${opposingRoleId} for user ${interaction.user.tag}`);
          } else {
            await interaction.editReply(`Role <@&${roleId}> telah diberikan.`);
            logger.info(`Granted gender role ${roleId} to user ${interaction.user.tag}`);
          }
        }
      } catch (error) {
        logger.error(`Error updating gender role for user ${interaction.user.tag}:`, error);
        await interaction.editReply('Terjadi kesalahan saat memproses permintaan role Anda. Pastikan role bot berada di atas role gender.');
      }
    }
  }
}
