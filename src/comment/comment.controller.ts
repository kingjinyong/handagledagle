import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.commentService.update(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteComment(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.commentService.delete(id, req.user.userId);
  }
}
