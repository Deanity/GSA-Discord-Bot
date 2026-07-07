import { supabase } from '../db/supabase.js';
import { StickyMessageRow, Database } from '../types/database.types.js';
import { logger } from '../utils/logger.js';
import { ModalSubmitInteraction, TextChannel } from 'discord.js';

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

/**
 * Handles the submit interaction of a sticky message modal.
 */
export async function handleStickySubmit(
  interaction: ModalSubmitInteraction,
  type: 'embed' | 'content',
  payload: string
): Promise<void> {
  const channel = interaction.channel;

  if (!channel || !('send' in channel)) {
    await interaction.editReply('❌ **Gagal:** Channel tidak dapat diakses atau bukan text channel.');
    return;
  }

  // Validate JSON if type is embed
  if (type === 'embed') {
    try {
      const parsed = JSON.parse(payload);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Payload must be an object');
      }
    } catch (e) {
      await interaction.editReply('❌ **Format JSON tidak valid!** Pastikan payload JSON memiliki format yang benar.');
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
      // Silence delete error
    }
  }

  // Persist sticky config in database
  const saved = await saveStickyConfig(channel.id, type, payload);
  if (!saved) {
    await interaction.editReply('❌ **Gagal:** Terjadi kesalahan saat menyimpan konfigurasi ke database.');
    return;
  }

  // Post the sticky message to the channel
  let sentMessage;
  try {
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

    await interaction.editReply('✅ **Sticky message berhasil dikonfigurasi dan diposting!**');
    logger.info(`Sticky message configured in channel ${channel.id} by ${interaction.user.tag}`);
  } catch (error) {
    logger.error('Error posting sticky message during modal submit:', error);
    await interaction.editReply('❌ **Terjadi kesalahan saat memposting sticky message ke Discord.** Pastikan format JSON/teks Anda benar.');
  }
}
