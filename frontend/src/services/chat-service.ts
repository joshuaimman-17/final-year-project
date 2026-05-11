import apiClient from './api-client';
import { ChatThread, ChatMessage } from '@/types';

export const chatService = {
  getThreads: async (): Promise<ChatThread[]> => {
    const response = await apiClient.get('/chat/presence/me'); // Placeholder for threads
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    // Backend doesn't have a direct get messages by ID yet? 
    // Wait, let's assume it's part of conversations or add it
    const response = await apiClient.get(`/chat/rooms/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<ChatMessage> => {
    const response = await apiClient.post(`/chat/rooms/${conversationId}/messages`, { text: content });
    return response.data;
  }
};
