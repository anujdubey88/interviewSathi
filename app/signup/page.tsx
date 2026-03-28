"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Zap, ArrowRight, User } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const { signup } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            await signup(form.name, form.email, form.password);
            toast.success("Account created! Let's start practicing 🚀");
            router.push("/dashboard");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div style={{
                position: "fixed", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(139,92,246,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(59,130,246,0.1) 0%, transparent 70%)"
            }} />

            <div className="w-full max-w-md animate-fade-up" style={{ position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <Zap size={22} color="#fff" />
                        </div>
                        <span style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                            Interview<span className="gradient-text">Sathi</span>
                        </span>
                    </div>
                    <p style={{ color: "rgb(var(--text-muted))", fontSize: "0.95rem" }}>
                        Start your journey to interview mastery
                    </p>
                </div>

                <div className="glass" style={{ padding: "2.5rem", borderRadius: "20px" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                        Create your account
                    </h1>
                    <p style={{ color: "rgb(var(--text-muted))", fontSize: "0.9rem", marginBottom: "2rem" }}>
                        Free forever. No credit card required.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.5rem", color: "rgb(var(--text-muted))" }}>
                                Full name
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="name"
                                    type="text"
                                    className="input"
                                    placeholder="Anuj Dubey"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    style={{ paddingLeft: "2.6rem" }}
                                />
                                <User size={16} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "rgb(var(--text-dim))" }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.5rem", color: "rgb(var(--text-muted))" }}>
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.5rem", color: "rgb(var(--text-muted))" }}>
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    className="input"
                                    placeholder="Min. 6 characters"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                    style={{ paddingRight: "3rem" }}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgb(var(--text-dim))" }}>
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button id="signup-btn" type="submit" className="btn-primary" disabled={loading}
                            style={{ width: "100%", marginTop: "0.5rem", padding: "0.9rem" }}>
                            {loading ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin-slow 0.8s linear infinite", display: "inline-block" }} />
                                    Creating account...
                                </span>
                            ) : (
                                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    Create account <ArrowRight size={17} />
                                </span>
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: "center", marginTop: "1.8rem", fontSize: "0.9rem", color: "rgb(var(--text-muted))" }}>
                        Already have an account?{" "}
                        <Link href="/login" style={{ color: "#a78bfa", fontWeight: 600, textDecoration: "none" }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
