import type { Channel } from '../types';

export function filterWorkspaceChannels(channels: Channel[]): Channel[] {
    return channels.filter((ch) => ch.type === 'public' || ch.type === 'private');
}

export function filterDirectChannels(channels: Channel[]): Channel[] {
    return channels.filter((ch) => ch.type === 'dm' || ch.type === 'group');
}

export function filterVoiceChannels(channels: Channel[]): Channel[] {
    return channels.filter((ch) => ch.type === 'voice');
}
