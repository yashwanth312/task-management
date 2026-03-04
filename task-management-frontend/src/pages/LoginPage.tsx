import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data);
      navigate("/tasks");
    } catch {
      setError("root", { message: "Invalid email or password" });
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg)" }}
    >
      {/* Left panel — decorative */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 grid-bg opacity-30"
          style={{ pointerEvents: "none" }}
        />

        {/* Amber accent blob */}
        <div
          className="absolute top-1/3 -left-20 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: "var(--accent)" }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3 animate-fade">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-sm"
            style={{ background: "var(--accent)" }}
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
              <path d="M2 2h8v2H2zM2 5.5h6v2H2zM2 9h4v2H2z" fill="black" />
            </svg>
          </div>
          <span
            className="text-xl font-mono font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            TaskHub
          </span>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <div className="animate-fade-slide stagger-1">
            <p
              className="text-[11px] font-mono uppercase tracking-[0.15em] mb-3"
              style={{ color: "var(--accent)" }}
            >
              Internal Operations
            </p>
            <h1
              className="text-4xl font-mono font-semibold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Your team's
              <br />
              task control
              <br />
              center.
            </h1>
          </div>

          <div
            className="w-12 h-px animate-fade-slide stagger-2"
            style={{ background: "var(--accent)" }}
          />

          <p
            className="text-sm leading-relaxed max-w-xs animate-fade-slide stagger-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Assign, track, and complete tasks across your team with
            full visibility and accountability.
          </p>

          {/* Feature list */}
          <ul className="space-y-2 animate-fade-slide stagger-4">
            {[
              "Role-based task assignment",
              "Real-time status tracking",
              "Comments & collaboration",
              "Admin dashboard & insights",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-2.5 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <span
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ background: "var(--accent)" }}
                />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom system info */}
        <div
          className="relative flex items-center gap-4 animate-fade-slide stagger-5"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="text-[10px] font-mono uppercase tracking-widest">
            v1.0.0
          </span>
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: "var(--border-hover)" }}
          />
          <span className="text-[10px] font-mono uppercase tracking-widest">
            Secure · Encrypted
          </span>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Subtle gradient */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "radial-gradient(ellipse at 60% 50%, var(--accent) 0%, transparent 70%)",
          }}
        />

        <div className="relative w-full max-w-sm animate-fade-slide">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div
              className="w-7 h-7 flex items-center justify-center rounded-sm"
              style={{ background: "var(--accent)" }}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2 2h8v2H2zM2 5.5h6v2H2zM2 9h4v2H2z" fill="black" />
              </svg>
            </div>
            <span
              className="text-base font-mono font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              TaskHub
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2
              className="text-2xl font-mono font-semibold mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Sign in
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Enter your credentials to access the dashboard.
            </p>
          </div>

          {/* Form card */}
          <div
            className="rounded-sm overflow-hidden"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <div
              className="h-px"
              style={{
                background:
                  "linear-gradient(to right, var(--accent), transparent)",
              }}
            />
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-6 space-y-5"
            >
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                {...register("email")}
                error={errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
              />

              {errors.root && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-sm text-xs font-mono"
                  style={{
                    background: "var(--red-muted)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#f87171",
                  }}
                >
                  <span>⚠</span>
                  {errors.root.message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 border border-black/40 border-t-black/80 rounded-full animate-spin"
                    />
                    Authenticating…
                  </span>
                ) : (
                  "Sign in →"
                )}
              </Button>
            </form>
          </div>

          <p
            className="mt-5 text-center text-[10px] font-mono uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
