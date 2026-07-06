import { REST, Routes, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { Command } from './types/command.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
  logger.error(`Commands directory not found at: ${commandsPath}`);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

// Determine if we register to a specific guild (dev) or globally (production)
const isGuild = process.argv.includes('--guild');

async function loadAndRegister(): Promise<void> {
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      const command: Command = module.default;
      
      if (command && 'data' in command) {
        commands.push(command.data.toJSON());
      } else {
        logger.warn(`Skipping command registration for ${file}: invalid command exports.`);
      }
    } catch (error) {
      logger.error(`Error loading command file ${file} for deployment:`, error);
    }
  }

  const rest = new REST({ version: '10' }).setToken(env.TOKEN);

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    if (isGuild) {
      logger.info(`Registering commands to development guild: ${env.GUILD_ID}`);
      await rest.put(
        Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
        { body: commands }
      );
      logger.info('Successfully reloaded guild application (/) commands.');
    } else {
      logger.info('Registering commands globally...');
      await rest.put(
        Routes.applicationCommands(env.CLIENT_ID),
        { body: commands }
      );
      logger.info('Successfully reloaded global application (/) commands.');
    }
  } catch (error) {
    logger.error('Failed to register application commands:', error);
  }
}

loadAndRegister().catch(error => {
  logger.error('Unhandled error during command deployment:', error);
});
