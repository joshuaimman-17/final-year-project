"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { userService } from "@/services/user-service";
import { useRouter } from "next/navigation";

const ProfilePage = () => {
  const { user, login } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "", // Read-only
    role: "", // Read-only
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        email: user.email || "",
        role: user.role || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const updatedUser = await userService.updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
      });
      
      // Update the user in the context
      // Note: login() helper in auth-context can be used to sync state if we have the token
      // but here we just want to update the user object. 
      // If auth-context only has login(token, user), we might need a refresh logic.
      // For now, let's assume getMe() is called on page reload or we can manually refresh.
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
      
      // Optional: Redirect or refresh state
      setTimeout(() => {
        window.location.reload(); // Simple way to sync Navbar and other components
      }, 1500);

    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.detail || "Failed to update profile. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 italic">My Profile</h1>
        <p className="text-gray-500 font-medium">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-100/50 text-center sticky top-28">
            <div className="w-32 h-32 rounded-[2.5rem] bg-green-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-green-200 mx-auto mb-6 border-4 border-white">
              {user.full_name[0].toUpperCase()}
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-1">{user.full_name}</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 mb-6 bg-green-50 inline-block px-4 py-1.5 rounded-full">
              {user.role}
            </p>
            
            <div className="pt-6 border-t border-gray-50 text-left space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Email Address</p>
                <p className="text-xs font-bold text-gray-900 truncate">{user.email}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Account Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-xs font-bold text-gray-900">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-xl shadow-gray-100/50">
            <form onSubmit={handleSubmit} className="space-y-8">
              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                  <span className="text-lg">{message.type === "success" ? "✅" : "❌"}</span>
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="full_name" className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                    placeholder="+91 00000 00000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Email Address <span className="text-[9px] text-gray-300 ml-1">(Read-only)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-gray-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-400 cursor-not-allowed outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Account Role <span className="text-[9px] text-gray-300 ml-1">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    disabled
                    className="w-full bg-gray-50/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-400 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto px-12 py-4 bg-green-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 bg-red-50/30 rounded-[2.5rem] p-8 border border-red-50">
            <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-2">Danger Zone</h3>
            <p className="text-xs text-gray-500 font-medium mb-6">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="px-8 py-3 border-2 border-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
