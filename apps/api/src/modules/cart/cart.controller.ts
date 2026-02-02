import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/guards/roles.guard';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Auth(Role.USER)
  getCart(@CurrentUser() user: { id: string }) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @Auth(Role.USER)
  addToCart(@CurrentUser() user: { id: string }, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(user.id, dto);
  }

  @Patch('items/:itemId')
  @Auth(Role.USER)
  updateCartItem(
    @CurrentUser() user: { id: string },
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  @Auth(Role.USER)
  removeFromCart(
    @CurrentUser() user: { id: string },
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeFromCart(user.id, itemId);
  }

  @Delete()
  @Auth(Role.USER)
  clearCart(@CurrentUser() user: { id: string }) {
    return this.cartService.clearCart(user.id);
  }
}
