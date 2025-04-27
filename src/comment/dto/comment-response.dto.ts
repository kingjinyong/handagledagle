// src/comment/dto/comment-response.dto.ts

export interface CommentResponseDto {
  id: number;
  content: string;
  user: {
    id: number;
    nickname: string;
  } | null;
  parentId: number | null;
  createAt: Date;
}
