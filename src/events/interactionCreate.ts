import { Interaction, Events } from 'discord.js';
import { logger } from '../utils/logger.js';
import { Collection } from 'discord.js';
import { Command } from '../types/command.types.js';

// Define a type interface for Client that includes commands collection to avoid casting issues
interface ClientWithCommands {
  commands: Collection<string, Command>;
}

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

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
}
