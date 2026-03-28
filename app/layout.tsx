import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InterviewSathi — AI Mock Interviews",
  description:
    "Practice technical interviews with AI. Get real-time feedback powered by Gemini.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgb(255, 255, 255)",
              color: "rgb(35, 32, 24)",
              border: "1px solid rgb(219, 211, 195)",
              borderRadius: "14px",
              fontFamily: "var(--font-body), sans-serif",
              fontSize: "0.9rem",
              boxShadow: "0 8px 24px rgba(62, 53, 34, 0.12)",
            },
            success: {
              iconTheme: { primary: "#16a34a", secondary: "rgb(255, 255, 255)" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "rgb(255, 255, 255)" },
            },
          }}
        />
      </body>
    </html>
  );
}
