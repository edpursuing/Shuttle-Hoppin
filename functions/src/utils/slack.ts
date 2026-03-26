/**
 * Slack Service
 *
 * Wrapper around Slack Web API for common operations
 */

import { WebClient } from '@slack/web-api';
import { config } from './config';

// Initialize Slack client
const slackClient = new WebClient(config.slack.botToken);

/**
 * Send a direct message to a user
 */
export async function sendDM(userId: string, options: {
  text: string;
  blocks?: any[];
}): Promise<void> {
  try {
    await slackClient.chat.postMessage({
      channel: userId,
      text: options.text,
      blocks: options.blocks,
    });
  } catch (error) {
    console.error('Error sending DM:', error);
    throw error;
  }
}

/**
 * Post a message to a channel
 */
export async function postToChannel(options: {
  channel: string;
  text: string;
  blocks?: any[];
}): Promise<{ ts: string; channel: string }> {
  try {
    const result = await slackClient.chat.postMessage({
      channel: options.channel,
      text: options.text,
      blocks: options.blocks,
    });

    return {
      ts: result.ts as string,
      channel: result.channel as string,
    };
  } catch (error) {
    console.error('Error posting to channel:', error);
    throw error;
  }
}

/**
 * Update an existing message
 */
export async function updateMessage(options: {
  channel: string;
  ts: string;
  text: string;
  blocks?: any[];
}): Promise<void> {
  try {
    await slackClient.chat.update({
      channel: options.channel,
      ts: options.ts,
      text: options.text,
      blocks: options.blocks,
    });
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(channel: string, ts: string): Promise<void> {
  try {
    await slackClient.chat.delete({
      channel,
      ts,
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Open a modal dialog
 */
export async function openModal(triggerId: string, view: any): Promise<void> {
  try {
    await slackClient.views.open({
      trigger_id: triggerId,
      view,
    });
  } catch (error) {
    console.error('Error opening modal:', error);
    throw error;
  }
}

/**
 * Update a modal dialog
 */
export async function updateModal(viewId: string, view: any): Promise<void> {
  try {
    await slackClient.views.update({
      view_id: viewId,
      view,
    });
  } catch (error) {
    console.error('Error updating modal:', error);
    throw error;
  }
}

/**
 * Create a private channel
 */
export async function createPrivateChannel(name: string): Promise<{ id: string; name: string }> {
  try {
    const result = await slackClient.conversations.create({
      name,
      is_private: true,
    });

    return {
      id: result.channel?.id as string,
      name: result.channel?.name as string,
    };
  } catch (error) {
    console.error('Error creating private channel:', error);
    throw error;
  }
}

/**
 * Invite users to a channel
 */
export async function inviteToChannel(channelId: string, userIds: string[]): Promise<void> {
  try {
    await slackClient.conversations.invite({
      channel: channelId,
      users: userIds.join(','),
    });
  } catch (error) {
    console.error('Error inviting to channel:', error);
    throw error;
  }
}

/**
 * Remove a user from a channel
 */
export async function kickFromChannel(channelId: string, userId: string): Promise<void> {
  try {
    await slackClient.conversations.kick({
      channel: channelId,
      user: userId,
    });
  } catch (error) {
    console.error('Error kicking from channel:', error);
    throw error;
  }
}

/**
 * Archive a channel
 */
export async function archiveChannel(channelId: string): Promise<void> {
  try {
    await slackClient.conversations.archive({
      channel: channelId,
    });
  } catch (error) {
    console.error('Error archiving channel:', error);
    throw error;
  }
}

/**
 * Set channel topic
 */
export async function setChannelTopic(channelId: string, topic: string): Promise<void> {
  try {
    await slackClient.conversations.setTopic({
      channel: channelId,
      topic,
    });
  } catch (error) {
    console.error('Error setting channel topic:', error);
    throw error;
  }
}

/**
 * Set channel purpose
 */
export async function setChannelPurpose(channelId: string, purpose: string): Promise<void> {
  try {
    await slackClient.conversations.setPurpose({
      channel: channelId,
      purpose,
    });
  } catch (error) {
    console.error('Error setting channel purpose:', error);
    throw error;
  }
}

/**
 * Pin a message
 */
export async function pinMessage(channelId: string, timestamp: string): Promise<void> {
  try {
    await slackClient.pins.add({
      channel: channelId,
      timestamp,
    });
  } catch (error) {
    console.error('Error pinning message:', error);
    throw error;
  }
}

/**
 * Get user info including display name and avatar URL
 */
export async function getUserInfo(userId: string): Promise<{
  name: string;
  real_name: string;
  avatar_url: string;
}> {
  try {
    const result = await slackClient.users.info({ user: userId });

    return {
      name: result.user?.name as string,
      real_name: result.user?.real_name as string,
      avatar_url: (result.user?.profile as any)?.image_192 as string || '',
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
}
