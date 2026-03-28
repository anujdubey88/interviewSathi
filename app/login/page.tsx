"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Zap, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success("Welcome back!");
            router.push("/dashboard");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-shell" style={{ display: "grid", placeItems: "center", padding: "1.5rem" }}>
            <div className="animate-fade-up" style={{ width: "100%", maxWidth: 980, position: "relative", zIndex: 1 }}>
                <div className="glass" style={{
                    borderRadius: 26,
                    display: "grid",
                    gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 460px)",
                    overflow: "hidden"
                }}>
                    <div style={{
                        padding: "2.5rem",
                        background: "linear-gradient(140deg, rgba(13,148,136,0.16), rgba(249,115,22,0.14))",
                        borderRight: "1px solid rgb(var(--border))"
                    }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.7rem", marginBottom: "1.1rem" }}>
                            <div className="brand-mark">
                                <Zap size={20} color="#fff" />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: "1.28rem" }}>
                                Interview<span className="gradient-text">Sathi</span>
                            </span>
                        </div>
                        <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.15rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: "0.7rem" }}>
                            Train for real interviews, not toy questions.
                        </h1>
                        <p style={{ color: "rgb(var(--text-muted))", lineHeight: 1.7, fontSize: "0.96rem" }}>
                            Simulate fast-paced interview rounds with instant scoring, detailed feedback, and a clear path to improve each day.
                        </p>
                        <div style={{ marginTop: "1.5rem", display: "grid", gap: "0.6rem" }}>
                            {[
                                "Voice and text interview modes",
                                "Structured scoring across each turn",
                                "Progress tracking over time"
                            ].map((item) => (
                                <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgb(var(--text-muted))", fontSize: "0.88rem" }}>
                                    <span style={{ width: 7, height: 7, borderRadius: 99, background: "rgb(var(--primary-dark))" }} />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ padding: "2.2rem" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                            Welcome back
                        </h2>
                        <p style={{ color: "rgb(var(--text-muted))", marginBottom: "1.7rem", fontSize: "0.92rem" }}>
                            Sign in and continue your interview prep streak.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.45rem", color: "rgb(var(--text-muted))" }}>
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
                                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.45rem", color: "rgb(var(--text-muted))" }}>
                                    Password
                                </label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        id="password"
                                        type={showPass ? "text" : "password"}
                                        className="input"
                                        placeholder="Your password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        style={{ paddingRight: "2.8rem" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        style={{
                                            position: "absolute",
                                            right: "0.85rem",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            color: "rgb(var(--text-dim))"
                                        }}
                                    >
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                id="login-btn"
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                                style={{ width: "100%", marginTop: "0.25rem", padding: "0.9rem" }}
                            >
                                {loading ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
                                        <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", animation: "spin-slow 0.8s linear infinite", display: "inline-block" }} />
                                        Signing in...
                                    </span>
                                ) : (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                                        Sign in <ArrowRight size={17} />
                                    </span>
                                )}
                            </button>
                        </form>

                        <p style={{ textAlign: "center", marginTop: "1.35rem", color: "rgb(var(--text-muted))", fontSize: "0.9rem" }}>
                            Don&apos;t have an account? {" "}
                            <Link href="/signup" style={{ color: "rgb(var(--primary-dark))", fontWeight: 700, textDecoration: "none" }}>
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
