"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { ArrowLeft, Code2, ChevronRight, Trophy, Clock } from "lucide-react";

interface Session {
    _id: string;
    program: string;
    level: string;
    status: string;
    totalTurns: number;
    feedback?: {
        overallScore: number;
        summary: string;
    };
    createdAt: string;
    completedAt?: string;
}

export default function HistoryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            api.get("/interview/sessions")
                .then(({ data }) => setSessions(data.sessions || []))
                .catch(() => { })
                .finally(() => setFetching(false));
        }
    }, [user]);

    if (loading || !user) return null;

    return (
        <div style={{ minHeight: "100vh", maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(139,92,246,0.07) 0%, transparent 70%)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
                    <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", color: "rgb(var(--text-muted))", textDecoration: "none", transition: "all 0.2s" }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Interview History</h1>
                        <p style={{ color: "rgb(var(--text-muted))", fontSize: "0.9rem" }}>All your past practice sessions</p>
                    </div>
                </div>

                {fetching ? (
                    <div style={{ textAlign: "center", padding: "4rem", color: "rgb(var(--text-dim))" }}>Loading sessions...</div>
                ) : sessions.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
                        <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No sessions yet</h2>
                        <p style={{ color: "rgb(var(--text-muted))", marginBottom: "1.5rem" }}>Start your first interview to see your history here</p>
                        <Link href="/dashboard">
                            <button className="btn-primary">Start Practicing</button>
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {sessions.map((s) => {
                            const score = s.feedback?.overallScore;
                            const scoreColor = !score ? "rgb(var(--text-dim))" : score >= 70 ? "#4ade80" : score >= 40 ? "#facc15" : "#f87171";
                            return (
                                <Link key={s._id} href={`/history/${s._id}`} style={{ textDecoration: "none" }}>
                                    <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.2rem 1.5rem", cursor: "pointer", transition: "all 0.2s" }}>
                                        <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Code2 size={20} color="#a78bfa" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.95rem", textTransform: "capitalize", marginBottom: "0.25rem" }}>
                                                {s.program.replace("-", " ")}
                                                <span style={{ color: "rgb(var(--text-dim))", fontWeight: 400 }}> · </span>
                                                <span style={{ color: "rgb(var(--text-muted))", textTransform: "capitalize" }}>{s.level.replace("-", " ")}</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                <span style={{ fontSize: "0.78rem", color: "rgb(var(--text-dim))", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                    <Clock size={12} />{new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                                <span style={{ fontSize: "0.78rem", color: "rgb(var(--text-dim))" }}>
                                                    {s.totalTurns || 0} questions
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                            {score !== undefined && (
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: scoreColor }}>{score}</div>
                                                    <div style={{ fontSize: "0.7rem", color: "rgb(var(--text-dim))" }}>/ 100</div>
                                                </div>
                                            )}
                                            <span className={`badge ${s.status === "completed" ? "badge-green" : "badge-yellow"}`}>{s.status}</span>
                                            <ChevronRight size={16} color="rgb(var(--text-dim))" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
