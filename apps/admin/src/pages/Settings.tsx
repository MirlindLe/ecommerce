import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "../lib/api";
import { useAuthStore, useNotificationStore } from "../lib/store";
import { Spinner } from "../components/UI";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "store">(
    "profile"
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const { user, setUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await authApi.getProfile();
        const userData = response.data;
        setUser(userData);
        resetProfile({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        addNotification({ type: "error", title: "Failed to load profile" });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [resetProfile, setUser, addNotification]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSavingProfile(true);
    try {
      const response = await authApi.updateProfile(data);
      setUser(response.data);
      addNotification({
        type: "success",
        title: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      addNotification({ type: "error", title: "Failed to update profile" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSavingPassword(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      addNotification({
        type: "success",
        title: "Password changed successfully",
      });
      resetPassword();
    } catch (error: any) {
      console.error("Error changing password:", error);
      const message =
        error.response?.data?.message || "Failed to change password";
      addNotification({ type: "error", title: message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const tabs = [
    {
      id: "profile" as const,
      name: "Profile",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      id: "password" as const,
      name: "Security",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    },
    {
      id: "store" as const,
      name: "Store Settings",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
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
                    d={tab.icon}
                  />
                </svg>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <>
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitProfile(onProfileSubmit)}
                  className="max-w-xl space-y-6"
                >
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h2>
                      <p className="text-gray-500">{user?.email}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        {...registerProfile("firstName")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {profileErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600">
                          {profileErrors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        {...registerProfile("lastName")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {profileErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600">
                          {profileErrors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...registerProfile("email")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {profileErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      {...registerProfile("phone")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+1 (555) 123-4567"
                    />
                    {profileErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {profileErrors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingProfile ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form
              onSubmit={handleSubmitPassword(onPasswordSubmit)}
              className="max-w-xl space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Change Password
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  Ensure your account is using a long, random password to stay
                  secure.
                </p>
              </div>

              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  {...registerPassword("currentPassword")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  {...registerPassword("newPassword")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  {...registerPassword("confirmPassword")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingPassword ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Store Settings Tab */}
          {activeTab === "store" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Store Configuration
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  Configure your store settings and preferences.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Store Name</h3>
                      <p className="text-sm text-gray-500">
                        ECommerce Platform
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      Edit
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Currency</h3>
                      <p className="text-sm text-gray-500">USD ($)</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      Edit
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Timezone</h3>
                      <p className="text-sm text-gray-500">
                        UTC (Coordinated Universal Time)
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      Edit
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Email Notifications
                      </h3>
                      <p className="text-sm text-gray-500">
                        Receive order and system notifications
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Maintenance Mode
                      </h3>
                      <p className="text-sm text-gray-500">
                        Temporarily disable the storefront
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 mt-8">
                <h3 className="font-medium text-gray-900 mb-4">Danger Zone</h3>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-800">
                        Clear All Data
                      </h4>
                      <p className="text-sm text-red-600">
                        This will permanently delete all store data
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                      Clear Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
