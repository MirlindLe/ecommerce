import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ecommerce.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.USER,
      isEmailVerified: true,
      phone: '+1234567890',
    },
  });

  const testUser2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.USER,
      isEmailVerified: true,
    },
  });

  // Create addresses for users
  console.log('Creating addresses...');
  await prisma.address.create({
    data: {
      userId: testUser.id,
      fullName: 'John Doe',
      phone: '+1234567890',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      userId: testUser.id,
      fullName: 'John Doe (Work)',
      phone: '+1234567891',
      street: '456 Office Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      country: 'USA',
      isDefault: false,
    },
  });

  await prisma.address.create({
    data: {
      userId: testUser2.id,
      fullName: 'Jane Smith',
      phone: '+1234567892',
      street: '789 Oak Lane',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
      isDefault: true,
    },
  });

  // Create categories
  console.log('Creating categories...');
  const electronicsCategory = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661',
      isActive: true,
    },
  });

  const clothingCategory = await prisma.category.create({
    data: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050',
      isActive: true,
    },
  });

  const homeCategory = await prisma.category.create({
    data: {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home decor and garden essentials',
      image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a',
      isActive: true,
    },
  });

  const sportsCategory = await prisma.category.create({
    data: {
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      description: 'Sports equipment and outdoor gear',
      image:
        'https://images.unsplash.com/photo-1461896836934- voices-of-fading-stars',
      isActive: true,
    },
  });

  const booksCategory = await prisma.category.create({
    data: {
      name: 'Books',
      slug: 'books',
      description: 'Books and literature',
      image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d',
      isActive: true,
    },
  });

  // Create subcategories
  const phonesCategory = await prisma.category.create({
    data: {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and accessories',
      parentId: electronicsCategory.id,
      isActive: true,
    },
  });

  const laptopsCategory = await prisma.category.create({
    data: {
      name: 'Laptops',
      slug: 'laptops',
      description: 'Notebooks and laptops',
      parentId: electronicsCategory.id,
      isActive: true,
    },
  });

  const mensClothing = await prisma.category.create({
    data: {
      name: "Men's Clothing",
      slug: 'mens-clothing',
      description: 'Clothing for men',
      parentId: clothingCategory.id,
      isActive: true,
    },
  });

  const womensClothing = await prisma.category.create({
    data: {
      name: "Women's Clothing",
      slug: 'womens-clothing',
      description: 'Clothing for women',
      parentId: clothingCategory.id,
      isActive: true,
    },
  });

  // Create products
  console.log('Creating products...');
  const products = [
    {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description:
        'The latest iPhone with advanced features including A17 Pro chip, titanium design, and Action button.',
      price: new Decimal(999.99),
      compareAtPrice: new Decimal(1099.99),
      sku: 'IPHONE15PRO',
      stock: 50,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569',
      ]),
      categoryId: phonesCategory.id,
      isFeatured: true,
      rating: 4.8,
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description:
        'Premium Android smartphone with S Pen, 200MP camera, and AI features.',
      price: new Decimal(1199.99),
      compareAtPrice: new Decimal(1299.99),
      sku: 'SAMS24ULTRA',
      stock: 35,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c',
      ]),
      categoryId: phonesCategory.id,
      isFeatured: true,
      rating: 4.7,
    },
    {
      name: 'MacBook Pro 16"',
      slug: 'macbook-pro-16',
      description:
        'Powerful laptop with M3 Max chip, stunning Liquid Retina XDR display.',
      price: new Decimal(2499.99),
      compareAtPrice: null,
      sku: 'MBP16M3MAX',
      stock: 20,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca4',
      ]),
      categoryId: laptopsCategory.id,
      isFeatured: true,
      rating: 4.9,
    },
    {
      name: 'Dell XPS 15',
      slug: 'dell-xps-15',
      description:
        'Premium Windows laptop with 13th Gen Intel Core, 4K OLED display.',
      price: new Decimal(1899.99),
      compareAtPrice: new Decimal(2099.99),
      sku: 'DELLXPS15',
      stock: 25,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89',
      ]),
      categoryId: laptopsCategory.id,
      isFeatured: false,
      rating: 4.5,
    },
    {
      name: "Men's Classic Polo Shirt",
      slug: 'mens-classic-polo-shirt',
      description:
        'Comfortable cotton polo shirt, perfect for casual or business casual wear.',
      price: new Decimal(49.99),
      compareAtPrice: new Decimal(69.99),
      sku: 'MENPOLO001',
      stock: 100,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99',
      ]),
      categoryId: mensClothing.id,
      isFeatured: false,
      rating: 4.3,
    },
    {
      name: "Men's Slim Fit Jeans",
      slug: 'mens-slim-fit-jeans',
      description: 'Classic slim fit jeans with stretch comfort technology.',
      price: new Decimal(79.99),
      compareAtPrice: null,
      sku: 'MENJEANS001',
      stock: 75,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542272604-787c3835535d',
      ]),
      categoryId: mensClothing.id,
      isFeatured: false,
      rating: 4.4,
    },
    {
      name: "Women's Summer Dress",
      slug: 'womens-summer-dress',
      description: 'Elegant floral summer dress, perfect for any occasion.',
      price: new Decimal(89.99),
      compareAtPrice: new Decimal(119.99),
      sku: 'WOMDRESS001',
      stock: 60,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1',
      ]),
      categoryId: womensClothing.id,
      isFeatured: true,
      rating: 4.6,
    },
    {
      name: "Women's Yoga Pants",
      slug: 'womens-yoga-pants',
      description: 'High-waisted yoga pants with moisture-wicking fabric.',
      price: new Decimal(59.99),
      compareAtPrice: null,
      sku: 'WOMYOGA001',
      stock: 80,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506629082955-511b1aa562c8',
      ]),
      categoryId: womensClothing.id,
      isFeatured: false,
      rating: 4.5,
    },
    {
      name: 'Smart LED Desk Lamp',
      slug: 'smart-led-desk-lamp',
      description:
        'Adjustable LED desk lamp with smart controls and multiple color temperatures.',
      price: new Decimal(79.99),
      compareAtPrice: new Decimal(99.99),
      sku: 'HOMELAMP001',
      stock: 45,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
      ]),
      categoryId: homeCategory.id,
      isFeatured: false,
      rating: 4.2,
    },
    {
      name: 'Indoor Plant Set',
      slug: 'indoor-plant-set',
      description: 'Set of 3 easy-care indoor plants with decorative pots.',
      price: new Decimal(49.99),
      compareAtPrice: null,
      sku: 'HOMEPLANT001',
      stock: 30,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1463320726281-696a485928c7',
      ]),
      categoryId: homeCategory.id,
      isFeatured: false,
      rating: 4.4,
    },
    {
      name: 'Yoga Mat Premium',
      slug: 'yoga-mat-premium',
      description: 'Extra thick non-slip yoga mat for comfortable practice.',
      price: new Decimal(39.99),
      compareAtPrice: new Decimal(49.99),
      sku: 'SPORTYOGA001',
      stock: 55,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f',
      ]),
      categoryId: sportsCategory.id,
      isFeatured: false,
      rating: 4.6,
    },
    {
      name: 'Camping Tent 4-Person',
      slug: 'camping-tent-4-person',
      description:
        'Waterproof 4-person tent with easy setup for outdoor adventures.',
      price: new Decimal(199.99),
      compareAtPrice: new Decimal(249.99),
      sku: 'SPORTTENT001',
      stock: 20,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d',
      ]),
      categoryId: sportsCategory.id,
      isFeatured: true,
      rating: 4.7,
    },
    {
      name: 'The Art of Programming',
      slug: 'the-art-of-programming',
      description:
        'Comprehensive guide to modern software development practices.',
      price: new Decimal(49.99),
      compareAtPrice: null,
      sku: 'BOOKPROG001',
      stock: 100,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      ]),
      categoryId: booksCategory.id,
      isFeatured: false,
      rating: 4.8,
    },
    {
      name: 'Wireless Earbuds Pro',
      slug: 'wireless-earbuds-pro',
      description: 'Premium wireless earbuds with active noise cancellation.',
      price: new Decimal(199.99),
      compareAtPrice: new Decimal(249.99),
      sku: 'ELECEAR001',
      stock: 40,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
      ]),
      categoryId: electronicsCategory.id,
      isFeatured: true,
      rating: 4.5,
    },
    {
      name: 'Smart Watch Series X',
      slug: 'smart-watch-series-x',
      description: 'Advanced smartwatch with health monitoring and GPS.',
      price: new Decimal(399.99),
      compareAtPrice: new Decimal(449.99),
      sku: 'ELECWATCH001',
      stock: 30,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
      ]),
      categoryId: electronicsCategory.id,
      isFeatured: true,
      rating: 4.6,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  // Create carts for users
  console.log('Creating carts...');
  const cart = await prisma.cart.create({
    data: {
      userId: testUser.id,
    },
  });

  // Get some products for cart
  const iphone = await prisma.product.findUnique({
    where: { slug: 'iphone-15-pro' },
  });
  const yogaMat = await prisma.product.findUnique({
    where: { slug: 'yoga-mat-premium' },
  });

  if (iphone && yogaMat) {
    await prisma.cartItem.createMany({
      data: [
        { cartId: cart.id, productId: iphone.id, quantity: 1 },
        { cartId: cart.id, productId: yogaMat.id, quantity: 2 },
      ],
    });
  }

  // Create sample orders
  console.log('Creating sample orders...');
  const address = await prisma.address.findFirst({
    where: { userId: testUser.id, isDefault: true },
  });
  const macbook = await prisma.product.findUnique({
    where: { slug: 'macbook-pro-16' },
  });
  const earbuds = await prisma.product.findUnique({
    where: { slug: 'wireless-earbuds-pro' },
  });

  if (address && macbook && earbuds) {
    const order1 = await prisma.order.create({
      data: {
        userId: testUser.id,
        shippingAddressId: address.id,
        orderNumber: 'ORD-001-TEST',
        subtotal: new Decimal(2699.98),
        tax: new Decimal(269.99),
        shippingCost: new Decimal(0),
        total: new Decimal(2969.97),
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        items: {
          create: [
            { productId: macbook.id, quantity: 1, price: macbook.price },
            { productId: earbuds.id, quantity: 1, price: earbuds.price },
          ],
        },
      },
    });

    // Create review for delivered products
    await prisma.review.create({
      data: {
        userId: testUser.id,
        productId: macbook.id,
        rating: 5,
        title: 'Amazing laptop!',
        comment:
          'The MacBook Pro is absolutely incredible. The M3 Max chip is blazing fast and the display is gorgeous.',
      },
    });
  }

  // Create wishlist items
  console.log('Creating wishlist items...');
  const samsung = await prisma.product.findUnique({
    where: { slug: 'samsung-galaxy-s24-ultra' },
  });
  const tent = await prisma.product.findUnique({
    where: { slug: 'camping-tent-4-person' },
  });

  if (samsung && tent) {
    await prisma.wishlistItem.createMany({
      data: [
        { userId: testUser.id, productId: samsung.id },
        { userId: testUser.id, productId: tent.id },
      ],
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('  Admin: admin@ecommerce.com / password123');
  console.log('  User: user@example.com / password123');
  console.log('  User 2: jane@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
