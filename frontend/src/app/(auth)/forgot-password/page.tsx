"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { userService } from "@/services/user-service";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await userService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      const errorMessage = err.response?.data?.detail || "Failed to send reset email.";
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-gray-600">Enter your email to receive a reset link</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 text-green-700 p-6 rounded-[2rem] text-center space-y-4">
            <div className="text-4xl">📧</div>
            <p className="font-bold">Reset email sent!</p>
            <p className="text-sm">Please check your inbox for instructions on how to reset your password.</p>
            <Link 
              href="/login"
              className="block w-full bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <input
                suppressHydrationWarning
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              suppressHydrationWarning 
              className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 active:scale-95'}`}
            >
              {isSubmitting ? "Please wait..." : "Send Reset Link"}
            </button>
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-green-700 hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
