import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostImage } from './entities/post-image.entity';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';

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
}
