import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/guards/roles.guard';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Auth(Role.USER)
  getUserOrders(
    @CurrentUser() user: { id: string },
    @Query() query: Record<string, unknown>,
  ) {
    return this.ordersService.getUserOrders(user.id, query);
  }

  @Get('all')
  @Auth(Role.ADMIN)
  getAllOrders(@Query() query: Record<string, unknown>) {
    return this.ordersService.getAllOrders(query);
  }

  @Get('stats')
  @Auth(Role.ADMIN)
  getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  @Get('admin/:id')
  @Auth(Role.ADMIN)
  getOrderByIdAdmin(@Param('id') id: string) {
    return this.ordersService.getOrderById('', id, true);
  }

  @Get(':id')
  @Auth(Role.USER)
  getOrderById(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.ordersService.getOrderById(user.id, id);
  }

  @Post()
  @Auth(Role.USER)
  createOrder(
    @CurrentUser() user: { id: string },
    @Body() createDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.id, createDto);
  }

  @Post(':id/cancel')
  @Auth(Role.USER)
  cancelOrder(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.ordersService.cancelOrder(user.id, id);
  }

  @Patch(':id/status')
  @Auth(Role.ADMIN)
  updateOrderStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateDto);
  }
}
