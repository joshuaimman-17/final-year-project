import apiClient from './api-client';
import { CommunityPost, CommunityComment } from '@/types';

export const communityService = {
  getFeed: async (params?: any): Promise<CommunityPost[]> => {
    const response = await apiClient.get('/community/feed', { params });
    return response.data;
  },

  createPost: async (payload: { content: string; tags?: string[]; image_urls?: string[] }): Promise<CommunityPost> => {
    const response = await apiClient.post('/community/posts', payload);
    return response.data;
  },

  likePost: async (postId: string): Promise<void> => {
    await apiClient.post(`/community/posts/${postId}/like`);
  },

  getComments: async (postId: string): Promise<CommunityComment[]> => {
    const response = await apiClient.get(`/community/posts/${postId}/comments`);
    return response.data;
  },

  addComment: async (postId: string, payload: { text: string }): Promise<CommunityComment> => {
    const response = await apiClient.post(`/community/posts/${postId}/comments`, payload);
    return response.data;
  }
};
