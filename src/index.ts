import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { Command } from './types/command.types.js';

// Extend Client to support commands collection
export class ExtendedClient extends Client {
  public commands = new Collection<string, Command>();
}

const client = new ExtendedClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

// ESM support for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadCommands(): Promise<void> {
  const commandsPath = path.join(__dirname, 'commands');
  
  if (!fs.existsSync(commandsPath)) {
    logger.warn(`Commands path does not exist: ${commandsPath}`);
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      const command: Command = module.default;
      
      if (command && 'data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.info(`Loaded command: /${command.data.name}`);
      } else {
        logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    } catch (error) {
      logger.error(`Failed to load command at ${filePath}`, error);
    }
  }
}

async function loadEvents(): Promise<void> {
  const eventsPath = path.join(__dirname, 'events');
  
  if (!fs.existsSync(eventsPath)) {
    logger.warn(`Events path does not exist: ${eventsPath}`);
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const event = await import(fileUrl);
      
      if (event.once) {
        client.once(event.name, (...args: unknown[]) => event.execute(...args));
      } else {
        client.on(event.name, (...args: unknown[]) => event.execute(...args));
      }
      logger.info(`Loaded event: ${event.name}`);
    } catch (error) {
      logger.error(`Failed to load event at ${filePath}`, error);
    }
  }
}

async function bootstrap(): Promise<void> {
  await loadCommands();
  await loadEvents();
  
  logger.info('Connecting to Discord...');
  await client.login(env.TOKEN);
}

bootstrap().catch(error => {
  logger.error('Error starting the bot:', error);
  process.exit(1);
});
