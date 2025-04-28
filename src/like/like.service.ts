import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Post } from 'src/post/entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async reactiveLikeButton(postId: number, userId: number): Promise<string> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const existingLike = await this.likeRepository.findOne({
      where: {
        post: { id: postId },
        user: { id: userId },
      },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      post.likeCount -= 1;
      await this.postRepository.save(post);
      return '좋아요 취소';
    } else {
      const like = this.likeRepository.create({
        post: { id: postId },
        user: { id: userId },
      });
      await this.likeRepository.save(like);
      post.likeCount += 1;
      await this.postRepository.save(post);
      return '좋아요';
    }
  }
}
