import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  @Public()
  getProductReviews(
    @Param('productId') productId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.reviewsService.getProductReviews(productId, query);
  }

  @Get('product/:productId/stats')
  @Public()
  getProductReviewStats(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviewStats(productId);
  }

  @Get('my-reviews')
  @Auth(Role.USER)
  getUserReviews(
    @CurrentUser() user: { id: string },
    @Query() query: Record<string, unknown>,
  ) {
    return this.reviewsService.getUserReviews(user.id, query);
  }

  @Get('all')
  @Auth(Role.ADMIN)
  getAllReviews(@Query() query: Record<string, unknown>) {
    return this.reviewsService.getAllReviews(query);
  }

  @Post()
  @Auth(Role.USER)
  createReview(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.id, dto);
  }

  @Patch(':id')
  @Auth(Role.USER)
  updateReview(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(user.id, id, dto);
  }

  @Delete(':id')
  @Auth(Role.USER)
  deleteReview(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.reviewsService.deleteReview(user.id, id);
  }

  @Delete(':id/admin')
  @Auth(Role.ADMIN)
  adminDeleteReview(@Param('id') id: string) {
    return this.reviewsService.deleteReview('', id, true);
  }
}
