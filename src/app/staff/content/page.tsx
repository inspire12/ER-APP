"use client";

import { FormEvent, useEffect, useState } from "react";
import type { DiseaseTemplate } from "@/lib/types";

const empty: DiseaseTemplate = { id: 0, name: "", aliases: "", medication: "", education: "", warningSigns: "", active: false };

export default function ContentPage() {
  const [templates, setTemplates] = useState<DiseaseTemplate[]>([]);
  const [form, setForm] = useState<DiseaseTemplate>(empty);
  const [message, setMessage] = useState("");
  async function load() { setTemplates(await fetch("/api/templates").then((response) => response.json())); }
  useEffect(() => { load(); }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); setMessage("");
    const response = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error);
    setMessage("콘텐츠를 저장했습니다."); await load();
  }
  return <>
    <header className="page-header"><p className="eyebrow">Clinical content</p><h1>질환별 안내 콘텐츠</h1><p className="muted">환자에게 반복해서 제공할 검수 문구를 한곳에서 관리합니다.</p></header>
    <div className="grid"><aside className="card"><h2>등록된 질환</h2><button className="secondary" onClick={() => setForm(empty)}>＋ 새 콘텐츠</button><div className="template-list">
      {templates.map((item) => <button key={item.id} className={`secondary template-item ${form.id === item.id ? "active" : ""}`} onClick={() => setForm(item)}><span>{item.name}</span><small className="status-dot">{item.active ? "사용" : "중지"}</small></button>)}
      </div>
    </aside>
    <section className="card"><h2>{form.id ? "콘텐츠 수정" : "새 콘텐츠 등록"}</h2><form onSubmit={save}>
      <div className="field"><label>질환명 *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="field"><label>별칭·검색어</label><input value={form.aliases} placeholder="장염, 위장염, 설사" onChange={(e) => setForm({ ...form, aliases: e.target.value })} /></div>
      <div className="field"><label>처방·복약 안내 *</label><textarea required value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} /></div>
      <div className="field"><label>생활·식이·자가관리 안내 *</label><textarea required value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></div>
      <div className="field"><label>즉시 재내원해야 하는 증상 *</label><textarea required value={form.warningSigns} onChange={(e) => setForm({ ...form, warningSigns: e.target.value })} /></div>
      <label className="checkbox-row"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />진료 화면에서 이 콘텐츠 사용</label>
      {message && <p className={message.includes("저장") ? "success" : "error"}>{message}</p>}<div className="actions"><button type="submit">저장</button></div>
    </form></section></div>
    {form.name && <section className="card"><h2>환자 화면 미리보기</h2><span className="diagnosis">{form.name}</span><h3>처방 및 복약 안내</h3><p className="patient-copy">{form.medication}</p><h3>집에서 이렇게 관리하세요</h3><p className="patient-copy">{form.education}</p><div className="danger"><h3>이런 증상이 있으면 다시 오세요</h3><p className="patient-copy">{form.warningSigns}</p></div></section>}
  </>;
}
