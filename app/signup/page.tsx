"use client";

import { createSupabaseClient } from "../../lib/supabaseClient";

const supabase = createSupabaseClient();

export default function SignupPage() {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard/assessment`,
      },
    });

    if (error) {
      alert("Google sign-in failed. Please try again.");
      console.error(error);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f7f7",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#fff",
          padding: "2rem",
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1>Carbon Accounting Pro</h1>

        <p style={{ marginBottom: "1.5rem", color: "#555" }}>
          Sign up to download your full carbon report and track emissions.
        </p>

        <button
          onClick={handleGoogleSignIn}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Continue with Google
        </button>

        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.85rem",
            color: "#777",
          }}
        >
          We only use your account to save reports and improve accuracy.
        </p>
      </div>
    </main>
  );
}
