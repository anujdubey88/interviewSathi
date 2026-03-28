"use client";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
    Mic, MicOff, Send, Volume2, VolumeX, StopCircle,
    CheckCircle, XCircle, ChevronRight, Zap, Loader2, Flag
} from "lucide-react";

interface Evaluation {
    score: number | null;
    feedback: string | null;
    wasCorrect: boolean | null;
    keyPointsMissed: string[];
}

interface SessionSummary {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    summary: string;
}

interface ChatMessage {
    role: "ai" | "user";
    text: string;
    evaluation?: Evaluation;
    turnNumber?: number;
}

const VOICE_SILENCE_TIMEOUT_MS = 8000;

// ─── Speech Recognition type ─────────────────────────────
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

function InterviewSessionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const sessionId = searchParams.get("sessionId") || "";
    const initialTurnId = searchParams.get("turnId") || "";
    const initialQ = searchParams.get("question") || "";

    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [currentTurnId, setCurrentTurnId] = useState(initialTurnId);
    const [currentTurnNum, setCurrentTurnNum] = useState(1);
    const [answer, setAnswer] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isTTSOn, setIsTTSOn] = useState(true);
    const [sessionDone, setSessionDone] = useState(false);
    const [summary, setSummary] = useState<SessionSummary | null>(null);
    const [lastEval, setLastEval] = useState<Evaluation | null>(null);
    const [currentSessionScore, setCurrentSessionScore] = useState<number | null>(null);
    const [currentAverageScore, setCurrentAverageScore] = useState<number | null>(user?.averageScore ?? null);

    useEffect(() => {
        setCurrentAverageScore(user?.averageScore ?? null);
    }, [user?.averageScore]);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const manualStopRef = useRef(false);

    const clearSilenceTimeout = useCallback(() => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
    }, []);

    const armSilenceTimeout = useCallback(() => {
        clearSilenceTimeout();
        silenceTimeoutRef.current = setTimeout(() => {
            manualStopRef.current = true;
            recognitionRef.current?.stop();
            setIsListening(false);
            toast("Stopped listening after 8s of silence", { icon: "⏸️" });
        }, VOICE_SILENCE_TIMEOUT_MS);
    }, [clearSilenceTimeout]);

    useEffect(() => {
        return () => {
            manualStopRef.current = true;
            clearSilenceTimeout();
            recognitionRef.current?.stop();
        };
    }, [clearSilenceTimeout]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat, lastEval]);

    // Add the first question to chat on mount
    useEffect(() => {
        if (initialQ) {
            setChat([{ role: "ai", text: decodeURIComponent(initialQ), turnNumber: 1 }]);
            if (isTTSOn) speak(decodeURIComponent(initialQ));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Text-to-Speech ─────────────────────────────────────
    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.95;
        utt.pitch = 1;
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find((v) => v.lang === "en-US" && v.name.includes("Google"));
        if (preferred) utt.voice = preferred;
        window.speechSynthesis.speak(utt);
    };

    const toggleTTS = () => {
        if (isTTSOn) window.speechSynthesis?.cancel();
        setIsTTSOn(!isTTSOn);
    };

    // ── Voice Input ────────────────────────────────────────
    const toggleVoice = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { toast.error("Speech recognition not supported in this browser"); return; }

        if (isListening) {
            manualStopRef.current = true;
            clearSilenceTimeout();
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        manualStopRef.current = false;
        const recognition = new SR();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let finalTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript.trim()) {
                setAnswer((prev) => (prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim()));
            }

            armSilenceTimeout();
        };
        recognition.onerror = () => {
            clearSilenceTimeout();
            setIsListening(false);
        };
        recognition.onend = () => {
            if (manualStopRef.current) {
                clearSilenceTimeout();
                setIsListening(false);
                return;
            }

            try {
                recognition.start();
                armSilenceTimeout();
            } catch {
                clearSilenceTimeout();
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
        armSilenceTimeout();
        setIsListening(true);
        toast("Listening... you can pause briefly while speaking", { icon: "🎤" });
    }, [armSilenceTimeout, clearSilenceTimeout, isListening]);

    // ── Submit Answer ──────────────────────────────────────
    const submitAnswer = async () => {
        if (!answer.trim()) { toast.error("Please provide an answer"); return; }
        if (isLoading) return;

        const userText = answer.trim();
        setAnswer("");
        setLastEval(null);
        setIsLoading(true);

        // Append user message immediately
        setChat((prev) => [...prev, { role: "user", text: userText }]);

        try {
            const { data } = await api.post("/interview/answer", {
                sessionId,
                turnId: currentTurnId,
                answer: userText,
                inputMethod: isListening ? "voice" : "text",
            });

            // Show evaluation
            if (data.evaluation) setLastEval(data.evaluation);
            if (typeof data.currentSessionScore === "number") {
                setCurrentSessionScore(data.currentSessionScore);
            }
            if (typeof data.currentAverageScore === "number") {
                setCurrentAverageScore(data.currentAverageScore);
            }

            if (data.isSessionComplete) {
                setSummary(data.sessionSummary);
                setSessionDone(true);
                window.speechSynthesis?.cancel();
                return;
            }

            // Append AI's next question
            if (data.nextQuestion?.text) {
                const aiMsg: ChatMessage = {
                    role: "ai",
                    text: data.nextQuestion.text,
                    turnNumber: data.turnNumber,
                };
                setChat((prev) => [...prev, aiMsg]);
                setCurrentTurnId(data.turnId);
                setCurrentTurnNum(data.turnNumber);
                if (isTTSOn) speak(data.nextQuestion.text);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Something went wrong");
            // Rollback user message on error
            setChat((prev) => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitAnswer();
        }
    };

    const endEarly = async () => {
        if (!confirm("End this session early? Gemini will generate a summary based on your answers so far.")) return;
        setIsLoading(true);
        try {
            const { data } = await api.post("/interview/end", { sessionId });
            setSummary(data.sessionSummary);
            setSessionDone(true);
        } catch {
            toast.error("Failed to end session");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Session Complete Screen ────────────────────────────
    if (sessionDone && summary) {
        const scoreColor = summary.overallScore >= 70 ? "#4ade80" : summary.overallScore >= 40 ? "#facc15" : "#f87171";
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div className="animate-fade-up" style={{ maxWidth: 680, width: "100%", position: "relative", zIndex: 1 }}>
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
                        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Session Complete!</h1>
                        <p style={{ color: "rgb(var(--text-muted))" }}>Here&apos;s how you performed</p>
                    </div>

                    {/* Score ring */}
                    <div className="card" style={{ textAlign: "center", padding: "2rem", marginBottom: "1rem" }}>
                        <div style={{ fontSize: "4rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                            {summary.overallScore}
                        </div>
                        <div style={{ color: "rgb(var(--text-muted))", fontSize: "0.9rem", marginTop: "0.25rem" }}>out of 100</div>
                        <div style={{ marginTop: "1rem", fontSize: "1rem", color: "rgb(var(--text-muted))", lineHeight: 1.6 }}>
                            {summary.summary}
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div className="card">
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4ade80", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>✅ Strengths</div>
                            {summary.strengths.length ? summary.strengths.map((s, i) => (
                                <div key={i} style={{ fontSize: "0.88rem", color: "rgb(var(--text-muted))", marginBottom: "0.4rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                                    <CheckCircle size={14} color="#4ade80" style={{ marginTop: 2, flexShrink: 0 }} /> {s}
                                </div>
                            )) : <div style={{ color: "rgb(var(--text-dim))", fontSize: "0.85rem" }}>Keep practicing!</div>}
                        </div>
                        <div className="card">
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f87171", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>🎯 Improve On</div>
                            {summary.weaknesses.length ? summary.weaknesses.map((w, i) => (
                                <div key={i} style={{ fontSize: "0.88rem", color: "rgb(var(--text-muted))", marginBottom: "0.4rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                                    <XCircle size={14} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} /> {w}
                                </div>
                            )) : <div style={{ color: "rgb(var(--text-dim))", fontSize: "0.85rem" }}>Great job!</div>}
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: "1.5rem" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#a78bfa", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>📚 Study Next</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {summary.suggestions.map((s, i) => (
                                <span key={i} className="badge badge-violet">{s}</span>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button className="btn-primary" onClick={() => router.push("/dashboard")} style={{ flex: 1, padding: "0.9rem", justifyContent: "center" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                Practice Again <ChevronRight size={17} />
                            </span>
                        </button>
                        <button className="btn-ghost" onClick={() => router.push("/history")} style={{ flex: 1, padding: "0.9rem", justifyContent: "center" }}>
                            View History
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Live Interview Screen ──────────────────────────────
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", maxWidth: 860, margin: "0 auto", padding: "0 1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 0", borderBottom: "1px solid rgb(var(--border))" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap size={16} color="#fff" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>Interview<span className="gradient-text">Sathi</span></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {currentSessionScore !== null ? (
                        <span style={{ fontSize: "0.85rem", color: "rgb(var(--text-muted))" }}>
                            Session Score <strong style={{ color: "#fff" }}>{currentSessionScore}</strong>/100
                        </span>
                    ) : null}
                    {currentAverageScore !== null ? (
                        <span style={{ fontSize: "0.85rem", color: "rgb(var(--text-muted))" }}>
                            Avg Score <strong style={{ color: "#fff" }}>{currentAverageScore}</strong>/100
                        </span>
                    ) : null}
                    <span style={{ fontSize: "0.85rem", color: "rgb(var(--text-muted))" }}>
                        Question <strong style={{ color: "#fff" }}>{currentTurnNum}</strong> of <strong style={{ color: "#fff" }}>10</strong>
                    </span>
                    {/* Progress bar */}
                    <div style={{ width: 100, height: 5, background: "rgb(var(--border))", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(currentTurnNum / 10) * 100}%`, background: "linear-gradient(90deg, rgb(139,92,246), rgb(59,130,246))", transition: "width 0.4s ease", borderRadius: 99 }} />
                    </div>
                    <button onClick={toggleTTS} style={{ background: "none", border: "none", cursor: "pointer", color: isTTSOn ? "#a78bfa" : "rgb(var(--text-dim))" }} title="Toggle voice">
                        {isTTSOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button onClick={endEarly} style={{ background: "none", border: "none", cursor: "pointer", color: "rgb(var(--text-dim))" }} title="End session">
                        <Flag size={18} />
                    </button>
                </div>
            </div>

            {/* Chat */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 0", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {chat.map((msg, idx) => (
                    <div key={idx} className="animate-fade-up" style={{
                        display: "flex",
                        flexDirection: msg.role === "user" ? "row-reverse" : "row",
                        alignItems: "flex-start", gap: "0.75rem"
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                            background: msg.role === "ai"
                                ? "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))"
                                : "rgba(255,255,255,0.08)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: msg.role === "ai" ? "inherit" : "0.85rem"
                        }}>
                            {msg.role === "ai" ? <Zap size={16} color="#fff" /> : (user?.name?.[0] || "U")}
                        </div>

                        {/* Bubble */}
                        <div style={{
                            maxWidth: "75%",
                            background: msg.role === "ai" ? "rgb(var(--surface))" : "rgba(139,92,246,0.15)",
                            border: `1px solid ${msg.role === "ai" ? "rgb(var(--border))" : "rgba(139,92,246,0.3)"}`,
                            borderRadius: msg.role === "ai" ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                            padding: "0.9rem 1.1rem",
                        }}>
                            {msg.role === "ai" && msg.turnNumber && (
                                <div style={{ fontSize: "0.72rem", color: "rgb(var(--primary))", fontWeight: 600, marginBottom: "0.4rem", letterSpacing: "0.04em" }}>
                                    Q{msg.turnNumber}
                                </div>
                            )}
                            <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "rgb(var(--text))" }}>{msg.text}</p>
                        </div>
                    </div>
                ))}

                {/* Evaluation card after user answers */}
                {lastEval && lastEval.score !== null && (
                    <div className="animate-fade-up" style={{ marginLeft: "2.75rem" }}>
                        <div className="card" style={{
                            padding: "0.9rem 1.1rem", maxWidth: "75%",
                            borderColor: lastEval.wasCorrect ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)",
                            background: lastEval.wasCorrect ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                {lastEval.wasCorrect
                                    ? <CheckCircle size={15} color="#4ade80" />
                                    : <XCircle size={15} color="#f87171" />}
                                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: lastEval.wasCorrect ? "#4ade80" : "#f87171" }}>
                                    Score: {lastEval.score}/10
                                </span>
                            </div>
                            <p style={{ fontSize: "0.87rem", color: "rgb(var(--text-muted))", lineHeight: 1.5 }}>{lastEval.feedback}</p>
                            {lastEval.keyPointsMissed?.length > 0 && (
                                <div style={{ marginTop: "0.6rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                                    {lastEval.keyPointsMissed.map((k, i) => (
                                        <span key={i} className="badge badge-yellow" style={{ fontSize: "0.7rem" }}>missed: {k}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Thinking dots */}
                {isLoading && (
                    <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "0" }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <Zap size={16} color="#fff" />
                        </div>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: "1.25rem 0", borderTop: "1px solid rgb(var(--border))" }}>
                {isListening && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "#a78bfa", fontSize: "0.85rem" }}>
                        <div className="animate-blink" style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
                        Listening... speak now
                    </div>
                )}
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                    <textarea
                        ref={textareaRef}
                        id="answer-input"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                        rows={3}
                        disabled={isLoading || sessionDone}
                        className="input"
                        style={{ flex: 1, resize: "none", borderRadius: "14px", lineHeight: 1.6, fontSize: "0.95rem" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <button
                            id="voice-btn"
                            onClick={toggleVoice}
                            disabled={isLoading || sessionDone}
                            style={{
                                width: 46, height: 46, borderRadius: 12, border: "1px solid",
                                borderColor: isListening ? "#a78bfa" : "rgb(var(--border))",
                                background: isListening ? "rgba(139,92,246,0.15)" : "rgb(var(--surface-2))",
                                color: isListening ? "#a78bfa" : "rgb(var(--text-muted))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "all 0.2s"
                            }}
                            title={isListening ? "Stop recording" : "Start voice input"}
                        >
                            {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
                        </button>
                        <button
                            id="send-btn"
                            onClick={submitAnswer}
                            disabled={isLoading || !answer.trim() || sessionDone}
                            className="btn-primary"
                            style={{ width: 46, height: 46, padding: 0, borderRadius: 12 }}
                            title="Send answer"
                        >
                            {isLoading ? <Loader2 size={18} style={{ animation: "spin-slow 0.8s linear infinite" }} /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
                <p style={{ fontSize: "0.75rem", color: "rgb(var(--text-dim))", marginTop: "0.6rem" }}>
                    Press <kbd style={{ background: "rgb(var(--surface-2))", padding: "0.1rem 0.4rem", borderRadius: 4, fontSize: "0.7rem", border: "1px solid rgb(var(--border))" }}>Enter</kbd> to send &nbsp;·&nbsp;
                    <kbd style={{ background: "rgb(var(--surface-2))", padding: "0.1rem 0.4rem", borderRadius: 4, fontSize: "0.7rem", border: "1px solid rgb(var(--border))" }}>Shift+Enter</kbd> for new line
                </p>
            </div>
        </div>
    );
}

export default function InterviewSessionPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={32} style={{ animation: "spin-slow 1s linear infinite", color: "#a78bfa" }} />
            </div>
        }>
            <InterviewSessionContent />
        </Suspense>
    );
}
