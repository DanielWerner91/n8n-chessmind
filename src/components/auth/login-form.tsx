"use client";

import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Colors from "@/lib/colors";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";

export function LoginForm() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="w-full max-w-sm">
      {/* Knight icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl drop-shadow-[0_0_40px_rgba(16,185,129,0.3)]"
        >
          &#9822;
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-extrabold text-white mt-4 tracking-tight"
        >
          ChessMind
        </motion.h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <NeonGradientCard borderSize={2}>
          <h2 className="text-lg font-bold text-white text-center mb-1">
            Welcome Back
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: Colors.textSecondary }}>
            Sign in to your AI chess coach
          </p>

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.1)",
                color: Colors.text,
              }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

          </div>

          <p className="text-center text-xs mt-5" style={{ color: Colors.textTertiary }}>
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline hover:text-white transition-colors">Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</a>
          </p>
        </NeonGradientCard>
      </motion.div>
    </div>
  );
}
