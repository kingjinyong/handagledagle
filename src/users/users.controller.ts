import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getMe(@Req() req: any) {
    return this.usersService.findProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-posts')
  async getMyPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: any,
  ) {
    return this.usersService.getMyPosts(req.user.userId, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-comments')
  async getMyComments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: any,
  ) {
    return this.usersService.getMyComments(req.user.userId, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('withdraw')
  withdraw(@Req() req: any) {
    return this.usersService.withdraw(req.user.userId);
  }
}
