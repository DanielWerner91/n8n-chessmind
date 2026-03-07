import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#020617] relative overflow-hidden">
      {/* Grid + Emerald Orb Background (matches onboarding) */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(100,116,139,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100,116,139,0.15) 1px, transparent 1px),
            radial-gradient(circle at 50% 40%, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.04) 40%, transparent 70%)
          `,
          backgroundSize: '40px 40px, 40px 40px, 100% 100%',
        }}
      />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_40%,#020617_80%)]" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <LoginForm />
      </div>
    </div>
  );
}
