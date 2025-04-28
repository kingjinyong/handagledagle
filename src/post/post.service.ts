import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostImage } from './entities/post-image.entity';
import { Post } from './entities/post.entity';
import { IsNull, Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { instanceToPlain } from 'class-transformer';
import { Comment } from 'src/comment/entities/comment.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostImage)
    private readonly imageRepository: Repository<PostImage>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
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

  async getPostLists({
    page,
    limit,
    sort,
  }: {
    page: number;
    limit: number;
    sort: 'latest' | 'popular';
  }) {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.images', 'images')
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .where('post.deleteAt IS NULL');

    if (sort === 'latest') {
      queryBuilder.orderBy('post.createAt', 'DESC');
    } else if (sort === 'popular') {
      queryBuilder.orderBy('post.likeCount', 'DESC');
    }

    const [posts, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return instanceToPlain({
      total,
      page,
      limit,
      data: posts,
    });
  }

  async getPostById(id: number) {
    const post = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.images', 'images')
      .loadRelationCountAndMap('post.commentCount', 'post.comments') // 🔥
      .where('post.id = :id', { id })
      .andWhere('post.deleteAt IS NULL')
      .getOne();

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    await this.postRepository.update(id, { viewCount: post.viewCount + 1 });

    post.viewCount += 1;
    return instanceToPlain(post);
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

  async deletePost(id: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user'],
      withDeleted: true,
    });

    if (!post || post.deleteAt) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.user.id !== userId) {
      throw new ForbiddenException('게시글을 삭제할 권한이 없습니다.');
    }

    await this.postRepository.softDelete(id);
    return { message: '게시글이 삭제 되었습니다.' };
  }

  async searchPosts(type: 'title_content' | 'nickname', keyword: string) {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .addSelect([
        'user.id',
        'user.email',
        'user.name',
        'user.nickname',
        'user.deletedAt',
      ])
      .leftJoinAndSelect('post.images', 'images')
      .where('post.deleteAt IS NULL')
      .cache(false);

    if (type === 'title_content') {
      queryBuilder
        .andWhere(
          '(post.title ILIKE :keyword OR post.content ILIKE :keyword)',
          { keyword: `%${keyword}%` },
        )
        .cache(false);
    } else if (type === 'nickname') {
      queryBuilder
        .andWhere('user.nickname ILIKE :keyword', {
          keyword: `%${keyword}%`,
        })
        .cache(false);
    }

    return instanceToPlain(
      await queryBuilder
        .orderBy('post.createAt', 'DESC')
        .cache(false)
        .getMany(),
    );
  }
}
