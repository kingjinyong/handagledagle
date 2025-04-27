import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/users/user.entity';
import { Comment } from './entities/comment.entity';
import { CommentResponseDto } from './dto/comment-response.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(dto: CreateCommentDto, userId: number): Promise<Comment> {
    const post = await this.postRepository.findOne({
      where: { id: dto.postId },
    });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      post: { id: dto.postId } as Post,
      user: { id: userId } as User,
    });

    if (dto.parentId) {
      comment.parent = { id: dto.parentId } as Comment;
    }

    return this.commentRepository.save(comment);
  }

  async getCommentsByPost(postId: number): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { post: { id: postId } },
      relations: ['user', 'parent'],
      order: { createAt: 'ASC' }, // 오래된 댓글 먼저
      withDeleted: true, // 삭제된 댓글도 조회
    });

    return comments.map((comment) => ({
      id: comment.id,
      content: comment.deleteAt ? '삭제된 댓글입니다.' : comment.content,
      user: comment.user
        ? {
            id: comment.user.id,
            nickname: comment.user.nickname,
          }
        : null,
      parentId: comment.parent ? comment.parent.id : null,
      createAt: comment.createAt,
    }));
  }

  async update(commentId: number, userId: number, dto: UpdateCommentDto) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
      withDeleted: true,
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.deleteAt) {
      throw new BadRequestException('삭제된 댓글은 수정할 수 없습니다.');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException('댓글 작성자만 수정할 수 있습니다');
    }

    comment.content = dto.content;
    return this.commentRepository.save(comment);
  }

  async delete(id: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'parent'],
      withDeleted: false,
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    if (comment.user.id !== userId) {
      throw new ForbiddenException('본인이 작성한 댓글만 삭제할 수 있습니다.');
    }

    await this.commentRepository.softDelete(id);
  }
}
