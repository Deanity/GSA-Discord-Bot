import { Client, Events } from 'discord.js';
import { logger } from '../utils/logger.js';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: Client): Promise<void> {
  logger.ready(`Logged in as ${client.user?.tag || 'Discord Bot'}`);
  
  // Set basic activity
  client.user?.setActivity('Google Skills Arcade 2026', { type: 3 }); // ActivityType.Watching = 3
}
