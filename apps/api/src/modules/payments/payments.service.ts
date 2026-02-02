import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentIntentDto, RefundPaymentDto } from './dto';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    // Get the order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order has already been paid');
    }

    // Check if there's an existing payment intent
    if (order.stripePaymentIntentId) {
      // Retrieve existing payment intent
      try {
        const existingIntent = await this.stripe.paymentIntents.retrieve(
          order.stripePaymentIntentId,
        );

        if (
          existingIntent.status === 'requires_payment_method' ||
          existingIntent.status === 'requires_confirmation'
        ) {
          return {
            clientSecret: existingIntent.client_secret,
            paymentIntentId: existingIntent.id,
          };
        }
      } catch {
        // Payment intent not found or expired, create new one
      }
    }

    // Create a new payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.total.toNumber() * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: userId,
      },
      description: `Order ${order.orderNumber}`,
      receipt_email: order.user.email,
    });

    // Update order with payment intent ID
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async confirmPayment(paymentIntentId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
    };
  }

  async refundPayment(dto: RefundPaymentDto) {
    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      dto.paymentIntentId,
    );

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment has not been completed');
    }

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: dto.paymentIntentId,
      reason:
        (dto.reason as Stripe.RefundCreateParams.Reason) ||
        'requested_by_customer',
    };

    if (dto.amount) {
      refundParams.amount = Math.round(dto.amount * 100);
    }

    const refund = await this.stripe.refunds.create(refundParams);

    // Update order status
    const order = await this.prisma.order.findFirst({
      where: { stripePaymentIntentId: dto.paymentIntentId },
    });

    if (order) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'REFUNDED',
          status: 'REFUNDED',
        },
      });
    }

    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
    };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret!,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook error: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'PROCESSING',
        paidAt: new Date(),
      },
    });

    console.log(`Order ${orderId} payment successful`);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
      },
    });

    console.log(`Order ${orderId} payment failed`);
  }

  private async handleRefund(charge: Stripe.Charge) {
    const paymentIntentId = charge.payment_intent as string;

    const order = await this.prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (order) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'REFUNDED',
          status: 'REFUNDED',
        },
      });

      console.log(`Order ${order.id} refunded`);
    }
  }

  async getPaymentMethods(userId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      return { paymentMethods: [] };
    }

    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    return {
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      })),
    };
  }

  async createCustomer(userId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.stripeCustomerId) {
      return { customerId: user.stripeCustomerId };
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: user.id,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return { customerId: customer.id };
  }

  async attachPaymentMethod(userId: string, paymentMethodId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const { customerId: newCustomerId } = await this.createCustomer(userId);
      customerId = newCustomerId;
    }

    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return { success: true };
  }

  async detachPaymentMethod(userId: string, paymentMethodId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    // Verify payment method belongs to user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No payment methods found');
    }

    const paymentMethod =
      await this.stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== user.stripeCustomerId) {
      throw new ForbiddenException('Payment method does not belong to user');
    }

    await this.stripe.paymentMethods.detach(paymentMethodId);

    return { success: true };
  }
}
