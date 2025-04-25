import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostImage } from './entities/post-image.entity';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostImage)
    private readonly imageRepository: Repository<PostImage>,
  ) {}

  async create(
    dto: CreatePostDto,
    files: Express.Multer.File[],
    userId: number,
  ) {
    const images = files.map((file) => {
      const image = new PostImage();
      image.url = `uploads/${file.filename}`;
      return image;
    });

    const post = this.postRepository.create({
      ...dto,
      user: { id: userId } as User,
      images,
    });

    return this.postRepository.save(post);
  }

  async getPosts({
    page,
    limit,
    sort,
  }: {
    page: number;
    limit: number;
    sort: 'latest' | 'popular';
  }) {
    const [posts, total] = await this.postRepository.findAndCount({
      relations: ['user', 'images'],
      order: sort === 'latest' ? { createAt: 'DESC' } : { likeCount: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      total,
      page,
      limit,
      data: posts,
    };
  }

  async update(postId: number, dto: UpdatePostDto, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('게시글이 존재하지 않습니다.');
    }

    if (post.user.id !== userId) {
      throw new NotFoundException('본인의 게시글만 수정할 수 있습니다.');
    }

    Object.assign(post, dto);
    return this.postRepository.save(post);
  }
}
