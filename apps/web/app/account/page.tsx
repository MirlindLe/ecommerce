"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/lib/store";
import { usersApi } from "@/lib/api";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function AccountPage() {
  const { user, setUser } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handleProfileSubmit = async (data: ProfileForm) => {
    setProfileSuccess(false);
    setProfileError("");
    try {
      const response = await usersApi.updateProfile(data);
      setUser(response.data);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setProfileError(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  };

  const handlePasswordSubmit = async (data: PasswordForm) => {
    setPasswordSuccess(false);
    setPasswordError("");
    try {
      await usersApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess(true);
      passwordForm.reset();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPasswordError(
        error.response?.data?.message || "Failed to change password"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>

        {profileSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
            Profile updated successfully!
          </div>
        )}

        {profileError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {profileError}
          </div>
        )}

        <form
          onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                {...profileForm.register("firstName")}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {profileForm.formState.errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {profileForm.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                {...profileForm.register("lastName")}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {profileForm.formState.errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {profileForm.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              {...profileForm.register("phone")}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>

        {passwordSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
            Password changed successfully!
          </div>
        )}

        {passwordError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {passwordError}
          </div>
        )}

        <form
          onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              {...passwordForm.register("currentPassword")}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              {...passwordForm.register("newPassword")}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              {...passwordForm.register("confirmPassword")}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {passwordForm.formState.isSubmitting
              ? "Changing..."
              : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
