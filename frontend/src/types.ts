export interface Article {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string; // or Date
  updatedAt: string; // or Date
  authorId?: number;
}

export interface UserInfo {
  id: number;
  username: string;
  admin: boolean;
}
