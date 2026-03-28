"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
    Zap, Play, Clock, Trophy, TrendingUp, ChevronRight,
    Code2, Database, Globe, Layers, GitBranch, Cpu, LogOut, History
} from "lucide-react";

const PROGRAMS = [
    { slug: "javascript", label: "JavaScript", icon: <Code2 size={20} />, color: "#facc15" },
    { slug: "nodejs", label: "Node.js", icon: <Layers size={20} />, color: "#4ade80" },
    { slug: "react", label: "React.js", icon: <Globe size={20} />, color: "#60a5fa" },
    { slug: "nextjs", label: "Next.js", icon: <Globe size={20} />, color: "#a78bfa" },
    { slug: "system-design", label: "System Design", icon: <Cpu size={20} />, color: "#fb923c" },
    { slug: "fullstack", label: "Full Stack", icon: <Layers size={20} />, color: "#f472b6" },
    { slug: "dsa", label: "DSA", icon: <GitBranch size={20} />, color: "#34d399" },
    { slug: "mongodb", label: "MongoDB", icon: <Database size={20} />, color: "#4ade80" },
    { slug: "typescript", label: "TypeScript", icon: <Code2 size={20} />, color: "#60a5fa" },
    { slug: "expressjs", label: "Express.js", icon: <Layers size={20} />, color: "#94a3b8" },
    { slug: "html-css", label: "HTML & CSS", icon: <Globe size={20} />, color: "#fb923c" },
    { slug: "devops", label: "DevOps", icon: <GitBranch size={20} />, color: "#f472b6" },
];

const LEVELS = [
    { slug: "beginner", label: "Beginner", desc: "Fundamentals & basics", color: "#4ade80" },
    { slug: "intermediate", label: "Intermediate", desc: "Applied patterns", color: "#60a5fa" },
    { slug: "advanced-intermediate", label: "Adv. Intermediate", desc: "Edge cases & design", color: "#a78bfa" },
    { slug: "expert", label: "Expert", desc: "Deep internals", color: "#fb923c" },
    { slug: "pro", label: "Pro", desc: "Production scenarios", color: "#f472b6" },
];

interface Session {
    _id: string;
    program: string;
    level: string;
    status: string;
    feedback?: { overallScore: number };
    createdAt: string;
}

export default function DashboardPage() {
    const { user, logout, loading, refreshProfile } = useAuth();
    const router = useRouter();
    const [selectedProgram, setSelectedProgram] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [starting, setStarting] = useState(false);
    const canStartInterview = Boolean(selectedProgram && selectedLevel) && !starting;

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            refreshProfile().catch(() => { });
        }
    }, [user?._id]);

    useEffect(() => {
        if (user) {
            api.get("/interview/sessions").then(({ data }) => {
                setRecentSessions(data.sessions?.slice(0, 3) || []);
            }).catch(() => { });
        }
    }, [user]);

    const handleStart = async () => {
        if (!selectedProgram) { toast.error("Please select a program"); return; }
        if (!selectedLevel) { toast.error("Please select a difficulty level"); return; }
        setStarting(true);
        try {
            const { data } = await api.post("/interview/start", {
                program: selectedProgram,
                level: selectedLevel,
            });
            router.push(`/interview/session?sessionId=${data.sessionId}&turnId=${data.turnId}&question=${encodeURIComponent(data.question?.text || "")}&turnNumber=1`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to start session");
            setStarting(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    if (loading || !user) return null;

    const scoreColor = user.averageScore >= 70 ? "#4ade80" : user.averageScore >= 40 ? "#facc15" : "#f87171";
    const hasAnyScoredProgress = (user.totalQuestionsAnswered || 0) > 0;

    return (
        <div style={{ minHeight: "100vh", padding: "0 0 4rem 0" }}>
            {/* Background */}
            <div style={{
                position: "fixed", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse 70% 50% at 10% 10%, rgba(139,92,246,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(59,130,246,0.07) 0%, transparent 70%)"
            }} />

            {/* Navbar */}
            <nav className="glass" style={{ position: "sticky", top: 0, zIndex: 50, padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: "none", borderRight: "none", borderTop: "none", borderRadius: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap size={18} color="#fff" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                        Interview<span className="gradient-text">Sathi</span>
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <Link href="/history" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgb(var(--text-muted))", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                        <History size={16} /> History
                    </Link>
                    <button onClick={handleLogout} className="btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <LogOut size={15} /> Sign out
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem", position: "relative", zIndex: 1 }}>
                {/* Hero greeting */}
                <div className="animate-fade-up" style={{ marginBottom: "3rem" }}>
                    <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                        Hey, {user.name.split(" ")[0]} 👋
                    </h1>
                    <p style={{ color: "rgb(var(--text-muted))", marginTop: "0.5rem", fontSize: "1.05rem" }}>
                        Ready to ace your next interview? Let&apos;s practice.
                    </p>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "3rem" }} className="animate-fade-up">
                    {[
                        { icon: <Trophy size={20} />, label: "Sessions Done", value: user.totalSessions, color: "#a78bfa" },
                        { icon: <TrendingUp size={20} />, label: "Avg. Score", value: hasAnyScoredProgress ? `${user.averageScore}/100` : "—", color: scoreColor },
                        { icon: <Clock size={20} />, label: "Practice Streak", value: "Keep going!", color: "#60a5fa" },
                    ].map((stat) => (
                        <div key={stat.label} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color, flexShrink: 0 }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: "0.78rem", color: "rgb(var(--text-muted))", fontWeight: 500 }}>{stat.label}</div>
                                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Start Interview Section */}
                <div className="card animate-fade-up" style={{ marginBottom: "2rem", padding: "2rem", borderRadius: "20px", background: "rgb(var(--surface))" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                        🚀 Start a New Interview
                    </h2>
                    <p style={{ color: "rgb(var(--text-muted))", fontSize: "0.9rem", marginBottom: "2rem" }}>
                        Select a topic and difficulty to begin your practice session
                    </p>

                    {/* Program Grid */}
                    <div style={{ marginBottom: "1.75rem" }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgb(var(--text-muted))", marginBottom: "0.9rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            1. Choose Topic
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.7rem" }}>
                            {PROGRAMS.map((p) => (
                                <button key={p.slug} id={`program-${p.slug}`}
                                    onClick={() => setSelectedProgram(p.slug)}
                                    className={`card card-interactive ${selectedProgram === p.slug ? "card-selected" : ""}`}
                                    style={{ padding: "0.9rem", textAlign: "left", border: "1px solid", cursor: "pointer", transition: "all 0.2s" }}>
                                    <div style={{ color: p.color, marginBottom: "0.5rem" }}>{p.icon}</div>
                                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{p.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Level Selector */}
                    <div style={{ marginBottom: "2rem" }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgb(var(--text-muted))", marginBottom: "0.9rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            2. Choose Difficulty
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
                            {LEVELS.map((l) => (
                                <button key={l.slug} id={`level-${l.slug}`}
                                    onClick={() => setSelectedLevel(l.slug)}
                                    className={`card card-interactive ${selectedLevel === l.slug ? "card-selected" : ""}`}
                                    style={{ padding: "0.75rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 160, flex: "0 0 auto" }}>
                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flexShrink: 0, boxShadow: `0 0 8px ${l.color}` }} />
                                    <div>
                                        <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{l.label}</div>
                                        <div style={{ fontSize: "0.75rem", color: "rgb(var(--text-muted))" }}>{l.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start Button */}
                    <button id="start-interview-btn" onClick={handleStart} className="btn-primary" disabled={!canStartInterview}
                        style={{ padding: "1rem 2.5rem", fontSize: "1rem", borderRadius: "14px" }}>
                        {starting ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin-slow 0.8s linear infinite", display: "inline-block" }} />
                                Preparing your interview...
                            </span>
                        ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Play size={18} /> Begin Interview
                            </span>
                        )}
                    </button>

                    {!selectedProgram || !selectedLevel ? (
                        <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "rgb(var(--text-muted))" }}>
                            Select both topic and difficulty to enable interview start.
                        </p>
                    ) : null}
                </div>

                {/* Recent Sessions */}
                {recentSessions.length > 0 && (
                    <div className="animate-fade-up">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Recent Sessions</h2>
                            <Link href="/history" style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#a78bfa", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 }}>
                                View all <ChevronRight size={15} />
                            </Link>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                            {recentSessions.map((s) => (
                                <Link key={s._id} href={`/history/${s._id}`} style={{ textDecoration: "none" }}>
                                    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", transition: "all 0.2s", cursor: "pointer" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Code2 size={18} color="#a78bfa" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: "0.9rem", textTransform: "capitalize" }}>{s.program.replace("-", " ")} · {s.level}</div>
                                                <div style={{ fontSize: "0.78rem", color: "rgb(var(--text-muted))" }}>
                                                    {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            {s.feedback?.overallScore !== undefined && (
                                                <span className={`badge ${s.feedback.overallScore >= 70 ? "badge-green" : s.feedback.overallScore >= 40 ? "badge-yellow" : "badge-red"}`}>
                                                    {s.feedback.overallScore}/100
                                                </span>
                                            )}
                                            <span className={`badge ${s.status === "completed" ? "badge-green" : "badge-yellow"}`}>
                                                {s.status}
                                            </span>
                                            <ChevronRight size={16} color="rgb(var(--text-dim))" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
