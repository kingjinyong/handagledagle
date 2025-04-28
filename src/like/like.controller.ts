import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LikeService } from './like.service';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':postId')
  async reactiveLikeButton(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: any,
  ) {
    return this.likeService.reactiveLikeButton(postId, req.user.userId);
  }
}
