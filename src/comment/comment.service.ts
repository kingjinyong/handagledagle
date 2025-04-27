import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/users/user.entity';
import { Comment } from './entities/comment.entity';

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
}
