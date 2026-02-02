import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Headers,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CreatePaymentIntentDto, RefundPaymentDto } from './dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @Auth(Role.USER)
  createPaymentIntent(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(user.id, dto);
  }

  @Get('confirm/:paymentIntentId')
  @Auth(Role.USER)
  confirmPayment(@Param('paymentIntentId') paymentIntentId: string) {
    return this.paymentsService.confirmPayment(paymentIntentId);
  }

  @Post('refund')
  @Auth(Role.ADMIN)
  refundPayment(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(dto);
  }

  @Get('methods')
  @Auth(Role.USER)
  getPaymentMethods(@CurrentUser() user: { id: string }) {
    return this.paymentsService.getPaymentMethods(user.id);
  }

  @Post('methods/:paymentMethodId/attach')
  @Auth(Role.USER)
  attachPaymentMethod(
    @CurrentUser() user: { id: string },
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return this.paymentsService.attachPaymentMethod(user.id, paymentMethodId);
  }

  @Delete('methods/:paymentMethodId')
  @Auth(Role.USER)
  detachPaymentMethod(
    @CurrentUser() user: { id: string },
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return this.paymentsService.detachPaymentMethod(user.id, paymentMethodId);
  }

  @Post('webhook')
  @Public()
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody!, signature);
  }
}
