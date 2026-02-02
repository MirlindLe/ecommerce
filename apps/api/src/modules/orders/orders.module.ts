import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { EmailService } from '../../common/services/email.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, EmailService],
  exports: [OrdersService],
})
export class OrdersModule {}
