export interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  tags?: string[];
  image_url?: string;
  image_urls?: string[];
}

export interface CommunityComment {
  id: string;
  author_id: string;
  author_name?: string;
  author_role?: string;
  text: string;
  timestamp: string;
  likes_count?: number;
}
