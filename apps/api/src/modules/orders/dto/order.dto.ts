import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
