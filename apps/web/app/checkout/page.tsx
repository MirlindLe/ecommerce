"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore, useAuthStore } from "@/lib/store";
import { usersApi, ordersApi } from "@/lib/api";
import { Address } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(5, "Phone number is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(3, "Zip code is required"),
  country: z.string().min(2, "Country is required"),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    async function fetchAddresses() {
      try {
        const response = await usersApi.getAddresses();
        setAddresses(response.data);
        const defaultAddress = response.data.find((a: Address) => a.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (response.data.length > 0) {
          setSelectedAddressId(response.data[0].id);
        } else {
          setShowNewAddress(true);
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAddresses();
  }, [isAuthenticated, router]);

  const handleAddAddress = async (data: AddressForm) => {
    try {
      const response = await usersApi.addAddress(data);
      setAddresses([...addresses, response.data]);
      setSelectedAddressId(response.data.id);
      setShowNewAddress(false);
      reset();
    } catch (error) {
      console.error("Failed to add address:", error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select a shipping address");
      return;
    }

    setIsPlacingOrder(true);
    setError("");

    try {
      const response = await ordersApi.create({
        addressId: selectedAddressId,
      });
      await clearCart();
      router.push(`/checkout/success?orderId=${response.data.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
          "Failed to place order. Please try again."
      );
      setIsPlacingOrder(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">
          Add some items to your cart before checkout.
        </p>
        <Link
          href="/products"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const subtotal = cart.subtotal || 0;
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - Shipping */}
        <div className="flex-1">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>

            {addresses.length > 0 && !showNewAddress && (
              <div className="space-y-3 mb-4">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAddressId === address.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium">{address.fullName}</p>
                      <p className="text-gray-600">{address.street}</p>
                      <p className="text-gray-600">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-gray-600">{address.country}</p>
                      <p className="text-gray-500 text-sm">{address.phone}</p>
                      {address.isDefault && (
                        <span className="inline-block mt-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {showNewAddress ? (
              <form
                onSubmit={handleSubmit(handleAddAddress)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      {...register("fullName")}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="John Doe"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      {...register("phone")}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+1 234 567 8900"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    {...register("street")}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="123 Main St"
                  />
                  {errors.street && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.street.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      {...register("city")}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      {...register("state")}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      {...register("zipCode")}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.zipCode && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.zipCode.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      {...register("country")}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      defaultValue="United States"
                    />
                    {errors.country && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.country.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
                  >
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddress(false)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowNewAddress(true)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Address
              </button>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <div>
                  <p className="font-medium">Pay on Delivery</p>
                  <p className="text-sm text-gray-500">
                    Pay when you receive your order
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              * Credit card payment via Stripe coming soon
            </p>
          </div>
        </div>

        {/* Right column - Order summary */}
        <div className="lg:w-96">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <hr className="mb-4" />

            {/* Totals */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !selectedAddressId}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? "Placing Order..." : "Place Order"}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By placing this order, you agree to our Terms of Service and
              Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
