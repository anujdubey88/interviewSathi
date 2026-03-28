"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import api from "@/lib/api";

interface User {
    _id: string;
    name: string;
    email: string;
    preferredPrograms: string[];
    preferredLevel: string;
    totalSessions: number;
    totalQuestionsAnswered: number;
    averageScore: number;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const { data } = await api.get("/user/profile");
        if (data?.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
        }
    }, []);

    // Restore session on mount
    useEffect(() => {
        const stored = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (stored && token) setUser(JSON.parse(stored));

        if (token) {
            refreshProfile().finally(() => setLoading(false));
            return;
        }

        setLoading(false);
    }, [refreshProfile]);

    const login = async (email: string, password: string) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    };

    const signup = async (name: string, email: string, password: string) => {
        const { data } = await api.post("/auth/signup", { name, email, password });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    };

    const logout = async () => {
        await api.post("/auth/logout");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
