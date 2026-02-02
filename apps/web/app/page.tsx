import Link from "next/link";
import Image from "next/image";
import { productsApi, categoriesApi } from "@/lib/api";
import { Product, Category } from "@/lib/types";
import { ProductGrid } from "@/components/products";
import { isValidImageUrl } from "@/lib/utils";

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await productsApi.getFeatured();
    return response.data;
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const response = await categoriesApi.getAll();
    return response.data.filter((c: Category) => !c.parentId).slice(0, 6);
  } catch {
    return [];
  }
}

async function getLatestProducts(): Promise<Product[]> {
  try {
    const response = await productsApi.getAll({
      limit: 8,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    return response.data.data || response.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featuredProducts, categories, latestProducts] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getLatestProducts(),
  ]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Discover Amazing Products
            </h1>
            <p className="text-lg lg:text-xl opacity-90 mb-8">
              Shop the latest trends in electronics, fashion, home decor, and
              more. Get free shipping on orders over $50!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/products?featured=true"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
              >
                View Deals
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Free Shipping</h3>
                <p className="text-sm text-gray-500">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Secure Payment</h3>
                <p className="text-sm text-gray-500">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Easy Returns</h3>
                <p className="text-sm text-gray-500">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">24/7 Support</h3>
                <p className="text-sm text-gray-500">Dedicated support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold">Shop by Category</h2>
            <Link
              href="/categories"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
                  {isValidImageUrl(category.image) ? (
                    <Image
                      src={category.image!}
                      alt={category.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <svg
                      className="w-8 h-8 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">
                  Featured Products
                </h2>
                <p className="text-gray-500 mt-1">
                  Hand-picked products just for you
                </p>
              </div>
              <Link
                href="/products?featured=true"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <ProductGrid products={featuredProducts.slice(0, 4)} />
          </div>
        </section>
      )}

      {/* Banner */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Get 20% Off Your First Order
              </h2>
              <p className="text-gray-300 mb-6">
                Sign up for our newsletter and receive a 20% discount code for
                your first purchase. Plus, be the first to know about new
                arrivals and exclusive offers.
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
            <div className="text-6xl lg:text-8xl font-bold opacity-10">
              20% OFF
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products */}
      {latestProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">New Arrivals</h2>
                <p className="text-gray-500 mt-1">
                  Check out our latest products
                </p>
              </div>
              <Link
                href="/products?sortBy=createdAt&sortOrder=desc"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <ProductGrid products={latestProducts} />
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Verified Buyer",
                text: "Amazing quality products and super fast shipping! I received my order within 2 days. Will definitely shop here again.",
                rating: 5,
              },
              {
                name: "Michael Chen",
                role: "Verified Buyer",
                text: "The customer service is exceptional. They helped me find exactly what I was looking for and the prices are very competitive.",
                rating: 5,
              },
              {
                name: "Emily Davis",
                role: "Verified Buyer",
                text: "Love the variety of products available. The website is easy to navigate and checkout was a breeze. Highly recommend!",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <svg
                      key={j}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
