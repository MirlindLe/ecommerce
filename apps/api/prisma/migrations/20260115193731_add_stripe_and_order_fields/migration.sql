/*
  Warnings:

  - You are about to drop the column `addressId` on the `orders` table. All the data in the column will be lost.
  - The values [COMPLETED] on the enum `payments_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMPLETED] on the enum `payments_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `salePrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `wishlistId` on the `wishlist_items` table. All the data in the column will be lost.
  - You are about to drop the `wishlists` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emailVerifyToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,productId]` on the table `wishlist_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shippingAddressId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `wishlist_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_addressId_fkey`;

-- DropForeignKey
ALTER TABLE `wishlist_items` DROP FOREIGN KEY `wishlist_items_wishlistId_fkey`;

-- DropForeignKey
ALTER TABLE `wishlists` DROP FOREIGN KEY `wishlists_userId_fkey`;

-- DropIndex
DROP INDEX `orders_addressId_fkey` ON `orders`;

-- DropIndex
DROP INDEX `wishlist_items_wishlistId_idx` ON `wishlist_items`;

-- DropIndex
DROP INDEX `wishlist_items_wishlistId_productId_key` ON `wishlist_items`;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `addressId`,
    ADD COLUMN `deliveredAt` DATETIME(3) NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `shippedAt` DATETIME(3) NULL,
    ADD COLUMN `shippingAddressId` VARCHAR(191) NOT NULL,
    ADD COLUMN `stripePaymentIntentId` VARCHAR(191) NULL,
    MODIFY `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `payments` MODIFY `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `products` DROP COLUMN `salePrice`,
    ADD COLUMN `compareAtPrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `rating` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `emailVerifyExpires` DATETIME(3) NULL,
    ADD COLUMN `emailVerifyToken` VARCHAR(191) NULL,
    ADD COLUMN `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastLogin` DATETIME(3) NULL,
    ADD COLUMN `passwordResetExpires` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(191) NULL,
    ADD COLUMN `refreshToken` TEXT NULL,
    ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `wishlist_items` DROP COLUMN `wishlistId`,
    ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `wishlists`;

-- CreateIndex
CREATE UNIQUE INDEX `orders_stripePaymentIntentId_key` ON `orders`(`stripePaymentIntentId`);

-- CreateIndex
CREATE INDEX `orders_stripePaymentIntentId_idx` ON `orders`(`stripePaymentIntentId`);

-- CreateIndex
CREATE UNIQUE INDEX `users_emailVerifyToken_key` ON `users`(`emailVerifyToken`);

-- CreateIndex
CREATE UNIQUE INDEX `users_passwordResetToken_key` ON `users`(`passwordResetToken`);

-- CreateIndex
CREATE UNIQUE INDEX `users_stripeCustomerId_key` ON `users`(`stripeCustomerId`);

-- CreateIndex
CREATE INDEX `users_emailVerifyToken_idx` ON `users`(`emailVerifyToken`);

-- CreateIndex
CREATE INDEX `users_passwordResetToken_idx` ON `users`(`passwordResetToken`);

-- CreateIndex
CREATE INDEX `wishlist_items_userId_idx` ON `wishlist_items`(`userId`);

-- CreateIndex
CREATE UNIQUE INDEX `wishlist_items_userId_productId_key` ON `wishlist_items`(`userId`, `productId`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_shippingAddressId_fkey` FOREIGN KEY (`shippingAddressId`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
