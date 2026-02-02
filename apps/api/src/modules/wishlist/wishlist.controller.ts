import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/guards/roles.guard';
import { AddToWishlistDto } from './dto';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @Auth(Role.USER)
  getWishlist(@CurrentUser() user: { id: string }) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Post()
  @Auth(Role.USER)
  addToWishlist(
    @CurrentUser() user: { id: string },
    @Body() dto: AddToWishlistDto,
  ) {
    return this.wishlistService.addToWishlist(user.id, dto);
  }

  @Delete(':productId')
  @Auth(Role.USER)
  removeFromWishlist(
    @CurrentUser() user: { id: string },
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(user.id, productId);
  }

  @Delete()
  @Auth(Role.USER)
  clearWishlist(@CurrentUser() user: { id: string }) {
    return this.wishlistService.clearWishlist(user.id);
  }

  @Get('check/:productId')
  @Auth(Role.USER)
  checkInWishlist(
    @CurrentUser() user: { id: string },
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.checkInWishlist(user.id, productId);
  }

  @Post(':productId/move-to-cart')
  @Auth(Role.USER)
  moveToCart(
    @CurrentUser() user: { id: string },
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.moveToCart(user.id, productId);
  }
}
