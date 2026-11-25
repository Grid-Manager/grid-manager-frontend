"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        setMessage(result.message ?? "Não foi possível entrar agora.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setMessage("Não foi possível conectar ao Grid Manager.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label>
        E-mail
        <input
          autoComplete="username"
          autoFocus
          type="email"
          name="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Senha
        <input
          autoComplete="current-password"
          type="password"
          name="password"
          required
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {message ? <p className="admin-form-error" role="alert">{message}</p> : null}
      <button className="button button--red" type="submit" disabled={busy}>
        {busy ? "Validando acesso…" : "Entrar no painel"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
