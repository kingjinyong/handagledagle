import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async updateProfile(userId: number, dto: UpdateUserDto) {
    await this.userRepository.update({ id: userId }, dto);
    return this.findProfile(userId);
  }

  async withdraw(userId: number): Promise<void> {
    await this.userRepository.softDelete(userId);
  }
}
