"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/admin");
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back! Redirecting to dashboard...");
      router.push("/admin");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed";
      if (message.includes("invalid-credential") || message.includes("wrong-password")) {
        toast.error("Invalid email or password");
      } else if (message.includes("user-not-found")) {
        toast.error("No admin account found with this email");
      } else if (message.includes("too-many-requests")) {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error("Login failed. Check your Firebase configuration.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gold flex items-center justify-center text-[#0A0A0A] text-2xl font-bold font-[family-name:var(--font-playfair)] mx-auto mb-4">
            KV
          </div>
          <h1 className="text-2xl font-bold text-gold-gradient font-[family-name:var(--font-playfair)]">
            KAMMA VOICE
          </h1>
          <p className="text-sm text-muted mt-1">Admin Dashboard</p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-8">
          <h2 className="text-lg font-bold mb-6 text-center">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kammavoice.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0A0A] border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 rounded-lg bg-[#0A0A0A] border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted/50 mt-6">
          కమ్మ వాయిస్ © {new Date().getFullYear()} — Admin Portal
        </p>
      </div>
    </div>
  );
}
