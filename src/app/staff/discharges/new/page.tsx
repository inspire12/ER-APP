"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { demoClinicalText } from "@/content/seed";
import type { ClinicalAnalysis, DiseaseTemplate, DischargeContent } from "@/lib/types";

const emptyDraft: DischargeContent = { diagnosis: "", findings: "", medication: "", education: "", warningSigns: "" };

export default function NewDischargePage() {
  const [templates, setTemplates] = useState<DiseaseTemplate[]>([]);
  const [clinicalText, setClinicalText] = useState("");
  const [demo, setDemo] = useState(false);
  const [analysis, setAnalysis] = useState<ClinicalAnalysis | null>(null);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [draft, setDraft] = useState<DischargeContent>(emptyDraft);
  const [confirmed, setConfirmed] = useState(false);
  const [patientUrl, setPatientUrl] = useState("");
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/templates").then((response) => response.json()).then((items) => setTemplates(items.filter((item: DiseaseTemplate) => item.active))); }, []);
  useEffect(() => { if (demo && !clinicalText) setClinicalText(demoClinicalText); }, [demo, clinicalText]);
  const selected = useMemo(() => templates.find((item) => item.id === selectedId), [templates, selectedId]);

  function applyTemplate(template: DiseaseTemplate, source = analysis) {
    const medication = [source?.medicationNote, template.medication].filter(Boolean).join("\n\n");
    setDraft({ diagnosis: source?.diagnosis || "", findings: source?.findings || "", medication, education: template.education, warningSigns: template.warningSigns, templateId: template.id });
    setSelectedId(template.id);
    setConfirmed(false);
    setPatientUrl("");
  }

  async function analyze() {
    setLoading(true); setMessage(""); setPatientUrl("");
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clinicalText, demo }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAnalysis(result);
      const recommendation = templates.find((item) => item.name === result.templateName);
      if (recommendation) applyTemplate(recommendation, result);
      else setDraft({ ...emptyDraft, diagnosis: result.diagnosis, findings: result.findings, medication: result.medicationNote });
      setMessage("분석했습니다. 추천 안내문과 환자별 내용을 직접 확인해 주세요.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "분석하지 못했습니다."); }
    finally { setLoading(false); }
  }

  async function approve() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/discharges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: draft, confirmed, demo }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const absoluteUrl = new URL(result.url, window.location.origin).toString();
      setPatientUrl(absoluteUrl);
      setQr(await QRCode.toDataURL(absoluteUrl, { width: 280, margin: 2, errorCorrectionLevel: "M" }));
      setMessage("안내문이 승인되었습니다. 링크와 QR을 환자에게 전달해 주세요.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "발급하지 못했습니다."); }
    finally { setLoading(false); }
  }

  return <>
    <h1>퇴원 안내문 작성</h1><p className="muted">검수된 안내문을 선택하고 의료진이 직접 확인한 후 발급합니다.</p>
    <section className="card"><div className="step">STEP 1</div><h2>진료 내용 입력</h2>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input style={{ width: 18 }} type="checkbox" checked={demo} onChange={(event) => setDemo(event.target.checked)} />데모 모드</label>
      <div className="field"><label htmlFor="clinical">진단명, 검사·진찰 소견, 처방 내용</label><textarea id="clinical" value={clinicalText} onChange={(event) => setClinicalText(event.target.value)} placeholder="예: 급성 장염 의심. 복부는 부드럽고 반발통 없음..." /></div>
      <button onClick={analyze} disabled={loading || !clinicalText.trim()}>{loading ? "분석 중..." : "진료 내용 분석"}</button>
    </section>

    {analysis && <section className="card"><div className="step">STEP 2</div><h2>안내문 선택 및 확인</h2>
      <p className="muted">AI 추천: <strong>{analysis.templateName || "추천 없음 — 직접 선택해 주세요"}</strong></p>
      <div className="field"><label htmlFor="template">질환별 안내문</label><select id="template" value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}><option value={0}>선택하세요</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <button className="secondary" disabled={!selected} onClick={() => selected && applyTemplate(selected)}>선택한 안내문 적용</button>
      <div className="field"><label>진단명 또는 의심 진단</label><input value={draft.diagnosis} onChange={(event) => setDraft({ ...draft, diagnosis: event.target.value })} /></div>
      <div className="field"><label>검사 및 진찰 소견</label><textarea value={draft.findings} onChange={(event) => setDraft({ ...draft, findings: event.target.value })} /></div>
      <div className="field"><label>처방 및 복약 안내</label><textarea value={draft.medication} onChange={(event) => setDraft({ ...draft, medication: event.target.value })} /></div>
      <div className="field"><label>생활·식이·자가관리 안내</label><textarea value={draft.education} onChange={(event) => setDraft({ ...draft, education: event.target.value })} /></div>
      <div className="field"><label>즉시 재내원해야 하는 증상</label><textarea value={draft.warningSigns} onChange={(event) => setDraft({ ...draft, warningSigns: event.target.value })} /></div>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input style={{ width: 18 }} type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />위 내용을 직접 확인했습니다.</label>
      <div className="actions"><button onClick={approve} disabled={loading || !confirmed}>{loading ? "발급 중..." : "승인 및 QR 발급"}</button></div>
    </section>}

    {message && <p className={patientUrl ? "success" : "muted"}>{message}</p>}
    {patientUrl && <section className="card"><div className="step">STEP 3</div><h2>환자 링크 및 QR</h2>
      <a className="button" href={patientUrl} target="_blank">환자용 안내문 열기</a><p style={{ overflowWrap: "anywhere" }}>{patientUrl}</p>
      {qr && <Image className="qr" src={qr} alt="환자 안내문 QR 코드" width={280} height={280} unoptimized />}
    </section>}
  </>;
}
