import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createComment(@Body() dto: CreateCommentDto, @Req() req: any) {
    return this.commentService.create(dto, req.user.userId);
  }

  @Get(':postId')
  async getComments(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentService.getCommentsByPost(postId);
  }
}
