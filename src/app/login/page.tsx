"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ password: form.get("password") }) });
    if (!response.ok) return setError("비밀번호가 올바르지 않습니다.");
    window.location.href = "/staff/discharges/new";
  }
  return <main className="shell"><div className="card" style={{ maxWidth: 480, margin: "80px auto" }}>
    <h1>의료진 로그인</h1><p className="muted">퇴원 안내문 작성과 콘텐츠 관리는 의료진만 사용할 수 있습니다.</p>
    <form onSubmit={login}><div className="field"><label htmlFor="password">접근 비밀번호</label><input id="password" name="password" type="password" required /></div>
      {error && <p className="error">{error}</p>}<button type="submit">로그인</button></form>
  </div></main>;
}
