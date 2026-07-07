import { supabase } from '../db/supabase.js';
import { StickyMessageRow, Database } from '../types/database.types.js';
import { logger } from '../utils/logger.js';

/**
 * Fetches the sticky message configuration for a specific channel.
 */
export async function getStickyConfig(channelId: string): Promise<StickyMessageRow | null> {
  try {
    const { data, error } = await supabase
      .from('sticky_messages')
      .select('*')
      .eq('channel_id', channelId)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching sticky config for channel ${channelId}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error(`Unexpected error fetching sticky config for channel ${channelId}:`, error);
    return null;
  }
}

/**
 * Saves or updates a sticky message configuration for a channel.
 */
export async function saveStickyConfig(
  channelId: string, 
  type: 'embed' | 'content', 
  payload: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sticky_messages')
      .upsert({
        channel_id: channelId,
        type,
        payload,
        updated_at: new Date().toISOString()
      });

    if (error) {
      logger.error(`Error saving sticky config for channel ${channelId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`Unexpected error saving sticky config for channel ${channelId}:`, error);
    return false;
  }
}

/**
 * Deletes the sticky message configuration for a channel.
 */
export async function deleteStickyConfig(channelId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sticky_messages')
      .delete()
      .eq('channel_id', channelId);

    if (error) {
      logger.error(`Error deleting sticky config for channel ${channelId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`Unexpected error deleting sticky config for channel ${channelId}:`, error);
    return false;
  }
}

/**
 * Updates the last sent sticky message ID for tracking and self-healing cleanup.
 */
export async function updateLastMessageId(channelId: string, messageId: string | null): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sticky_messages')
      .update({
        last_message_id: messageId,
        updated_at: new Date().toISOString()
      })
      .eq('channel_id', channelId);

    if (error) {
      logger.error(`Error updating last message ID for channel ${channelId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`Unexpected error updating last message ID for channel ${channelId}:`, error);
    return false;
  }
}
