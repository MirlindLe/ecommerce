"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@/lib/api";
import { Address } from "@/lib/types";

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(5, "Phone number is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(3, "Zip code is required"),
  country: z.string().min(2, "Country is required"),
  isDefault: z.boolean().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: "United States",
    },
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await usersApi.getAddresses();
      setAddresses(response.data);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async (data: AddressForm) => {
    try {
      if (editingId) {
        await usersApi.updateAddress(editingId, data);
      } else {
        await usersApi.addAddress(data);
      }
      await fetchAddresses();
      setShowForm(false);
      setEditingId(null);
      reset();
    } catch (error) {
      console.error("Failed to save address:", error);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setValue("fullName", address.fullName);
    setValue("phone", address.phone);
    setValue("street", address.street);
    setValue("city", address.city);
    setValue("state", address.state);
    setValue("zipCode", address.zipCode);
    setValue("country", address.country);
    setValue("isDefault", address.isDefault);
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      await usersApi.deleteAddress(addressId);
      await fetchAddresses();
    } catch (error) {
      console.error("Failed to delete address:", error);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await usersApi.setDefaultAddress(addressId);
      await fetchAddresses();
    } catch (error) {
      console.error("Failed to set default address:", error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Saved Addresses</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
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
              Add Address
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-6 p-6 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-4">
              {editingId ? "Edit Address" : "New Address"}
            </h3>
            <form
              onSubmit={handleSubmit(handleAddOrUpdate)}
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
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.country.message}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("isDefault")}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  Set as default address
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {addresses.length === 0 && !showForm ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-gray-500">No addresses saved yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-4 ${
                  address.isDefault ? "border-indigo-600 bg-indigo-50" : ""
                }`}
              >
                <div className="flex justify-between items-start">
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
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
