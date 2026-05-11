"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { userService } from "@/services/user-service";
import { cookieUtils } from "@/utils/cookie";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const { user, loading, login } = useAuth();
  
  useEffect(() => {
    if (!loading && user) {
      if (redirectPath) {
        router.push(redirectPath);
        return;
      }
      switch (user.role) {
        case 'ADMIN': router.push('/admin'); break;
        case 'EXPERT': router.push('/expert/queue'); break;
        case 'BUYER': router.push('/marketplace'); break;
        default: router.push('/dashboard'); break;
      }
    }
  }, [user, loading, router, redirectPath]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prevent showing the login form if we're already logged in or currently redirecting
  if (!loading && user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 italic tracking-tighter">🌿 Synchronizing...</h2>
            <p className="text-gray-500 font-medium tracking-tight">Preparing your personal dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await userService.login({
        email: email,
        password: password,
      });
      
      // Update central AuthContext
      login(response.access_token, response.user);
      localStorage.setItem("user_role", response.user.role);
      
      const routeBasedOnRole = (role: string) => {
        switch (role) {
          case 'ADMIN': return '/admin';
          case 'EXPERT': return '/expert/queue';
          case 'BUYER': return '/marketplace';
          default: return '/dashboard';
        }
      };
      
      router.push(redirectPath || routeBasedOnRole(response.user.role));
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error("Login error:", err);
      }
      const errorMessage = err.response?.data?.detail || "Authentication failed. Please try again.";
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Log in to manage your fields</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold text-center">
            {error}
          </div>
        )}

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
          <div className="relative">
            <input
              suppressHydrationWarning
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
            />
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors p-2"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            suppressHydrationWarning 
            className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 active:scale-95'}`}
          >
            {isSubmitting ? "Please wait..." : "Log In"}
          </button>
        </form>

        <div className="text-center space-y-4">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-gray-500 hover:text-green-700 hover:underline block w-full"
          >
            Forgot Password?
          </Link>

          <Link
            href="/signup"
            className="text-sm font-medium text-green-700 hover:underline"
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
