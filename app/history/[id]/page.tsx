"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { ArrowLeft, CheckCircle, XCircle, Zap, User } from "lucide-react";

interface Turn {
    _id: string;
    turnNumber: number;
    question: { text: string; category: string };
    answer: { text: string; inputMethod: string };
    evaluation: { score: number; feedback: string; wasCorrect: boolean; keyPointsMissed: string[] };
}
interface Session {
    _id: string;
    program: string;
    level: string;
    status: string;
    totalTurns: number;
    feedback: { overallScore: number; strengths: string[]; weaknesses: string[]; suggestions: string[]; summary: string };
    createdAt: string;
}

export default function SessionDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [session, setSession] = useState<Session | null>(null);
    const [turns, setTurns] = useState<Turn[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        if (user && id) {
            api.get(`/interview/sessions/${id}`)
                .then(({ data }) => { setSession(data.session); setTurns(data.turns); })
                .catch(() => router.push("/history"))
                .finally(() => setFetching(false));
        }
    }, [user, id, router]);

    if (loading || !user || fetching) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgb(var(--text-dim))" }}>
            Loading session...
        </div>
    );
    if (!session) return null;

    const score = session.feedback?.overallScore;
    const scoreColor = !score ? "rgb(var(--text-dim))" : score >= 70 ? "#4ade80" : score >= 40 ? "#facc15" : "#f87171";

    return (
        <div style={{ minHeight: "100vh", maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(139,92,246,0.07) 0%, transparent 70%)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                    <Link href="/history" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", color: "rgb(var(--text-muted))", textDecoration: "none" }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, textTransform: "capitalize" }}>
                            {session.program.replace("-", " ")} · {session.level.replace("-", " ")}
                        </h1>
                        <p style={{ color: "rgb(var(--text-muted))", fontSize: "0.85rem" }}>
                            {new Date(session.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                            {" · "}{session.totalTurns} questions
                        </p>
                    </div>
                </div>

                {/* Summary */}
                {session.feedback && (
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                        <div className="card" style={{ textAlign: "center", padding: "1.5rem 2rem" }}>
                            <div style={{ fontSize: "3rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
                            <div style={{ color: "rgb(var(--text-dim))", fontSize: "0.8rem" }}>/ 100</div>
                        </div>
                        <div className="card">
                            <p style={{ fontSize: "0.9rem", color: "rgb(var(--text-muted))", lineHeight: 1.6 }}>{session.feedback.summary}</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.75rem" }}>
                                {session.feedback.suggestions?.map((s, i) => <span key={i} className="badge badge-violet">{s}</span>)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Q&A Turns */}
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Full Conversation</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {turns.map((t) => (
                        <div key={t._id} className="card animate-fade-up" style={{ padding: "1.25rem" }}>
                            {/* Question */}
                            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.9rem" }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Zap size={14} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.72rem", color: "#a78bfa", fontWeight: 600, marginBottom: "0.3rem" }}>Q{t.turnNumber}</div>
                                    <p style={{ fontSize: "0.92rem", lineHeight: 1.6 }}>{t.question?.text}</p>
                                    {t.question?.category && <span className="badge badge-blue" style={{ fontSize: "0.7rem", marginTop: "0.4rem" }}>{t.question.category}</span>}
                                </div>
                            </div>
                            {/* Answer */}
                            {t.answer?.text && (
                                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", paddingLeft: "0.5rem" }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.8rem" }}>
                                        <User size={14} />
                                    </div>
                                    <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "rgb(var(--text-muted))" }}>{t.answer.text}</p>
                                </div>
                            )}
                            {/* Evaluation */}
                            {t.evaluation?.score != null && (
                                <div style={{
                                    marginTop: "0.5rem", padding: "0.75rem 1rem", borderRadius: 10,
                                    background: t.evaluation.wasCorrect ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)",
                                    border: `1px solid ${t.evaluation.wasCorrect ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                                    display: "flex", flexDirection: "column", gap: "0.4rem"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        {t.evaluation.wasCorrect ? <CheckCircle size={14} color="#4ade80" /> : <XCircle size={14} color="#f87171" />}
                                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: t.evaluation.wasCorrect ? "#4ade80" : "#f87171" }}>
                                            {t.evaluation.score}/10 — {t.evaluation.wasCorrect ? "Correct" : "Needs improvement"}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "0.85rem", color: "rgb(var(--text-muted))" }}>{t.evaluation.feedback}</p>
                                    {t.evaluation.keyPointsMissed?.length > 0 && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                                            {t.evaluation.keyPointsMissed.map((k, i) => <span key={i} className="badge badge-yellow" style={{ fontSize: "0.7rem" }}>missed: {k}</span>)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
