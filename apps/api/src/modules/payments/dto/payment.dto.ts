import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}

export class RefundPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number; // Partial refund amount, if not provided, full refund

  @IsOptional()
  @IsString()
  reason?: string;
}

export class WebhookEventDto {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}
