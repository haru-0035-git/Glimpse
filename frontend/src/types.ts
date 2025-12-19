export interface Article {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string; // or Date
  updatedAt: string; // or Date
  authorId?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  admin: boolean;
}
