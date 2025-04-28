import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { IsNull, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { Post } from 'src/post/entities/post.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRespository: Repository<Comment>,
  ) {}

  // 유저 생성
  async createUser(dto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
      withDeleted: true,
    });
    if (existing) {
      if (!existing.deletedAt) {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }

      // 삭제된 유저였다면 복구시키기
      await this.userRepository.update(existing.id, {
        name: dto.name,
        nickname: dto.nickname,
        password: hashedPassword,
        deletedAt: null as any,
      });
      return this.userRepository.findOneOrFail({ where: { id: existing.id } });
    }

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      withDeleted: false,
    });
  }

  async findProfile(userId: number) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
    });

    const { password, deletedAt, ...result } = user;
    return result;
  }

  async getMyPosts(userId: number, page: number, limit: number) {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.images', 'images')
      .loadRelationCountAndMap('post.commentCount', 'post.comments') // 🔥
      .where('post.user.id = :userId', { userId })
      .andWhere('post.deleteAt IS NULL')
      .orderBy('post.createAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      total,
      page,
      limit,
      data: posts,
    };
  }

  async getMyComments(userId: number, page: number, limit: number) {
    const [comments, total] = await this.commentRespository.findAndCount({
      where: { user: { id: userId }, deleteAt: IsNull() },
      skip: (page - 1) * limit,
      take: limit,
      order: { createAt: 'DESC' },
      relations: ['post'],
    });

    return {
      total,
      page,
      limit,
      data: comments,
    };
  }

  async updateProfile(userId: number, dto: UpdateUserDto) {
    await this.userRepository.update({ id: userId }, dto);
    return this.findProfile(userId);
  }

  async withdraw(userId: number): Promise<void> {
    await this.userRepository.softDelete(userId);
  }
}
