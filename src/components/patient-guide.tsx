import type { DischargeContent } from "@/lib/types";

function TextBlocks({ text }: { text: string }) {
  return <div className="patient-copy">{text.split(/\n\s*\n/).map((block, index) => <p key={index}>{block}</p>)}</div>;
}

export function PatientGuide({ content }: { content: DischargeContent }) {
  return <main className="shell patient-shell">
    <header className="patient-title"><span className="patient-kicker">✓ 의료진 확인 완료</span><h1>응급실 퇴원 안내</h1><p className="muted">집에서 안전하게 회복하실 수 있도록 중요한 내용을 정리했습니다.</p></header>
    <div className="diagnosis"><span aria-hidden="true">✓</span><span><small>진단명</small>{content.diagnosis}</span></div>
    <nav className="patient-quick-nav" aria-label="안내문 바로가기"><a href="#findings">진료 내용</a><a href="#medication">복약 안내</a><a href="#care">자가관리</a><a href="#warning">위험 신호</a></nav>
    <section id="findings" className="card patient-card"><div className="patient-section-title"><span className="section-icon" aria-hidden="true">⌕</span><h2>오늘 확인한 내용</h2></div><TextBlocks text={content.findings || "의료진에게 안내받은 진료 내용을 참고하세요."} /></section>
    <section id="medication" className="card patient-card"><div className="patient-section-title"><span className="section-icon" aria-hidden="true">◫</span><h2>처방 및 복약 안내</h2></div><TextBlocks text={content.medication} /></section>
    <section id="care" className="card patient-card"><div className="patient-section-title"><span className="section-icon" aria-hidden="true">⌂</span><h2>집에서 이렇게 관리하세요</h2></div><TextBlocks text={content.education} /></section>
    <section id="warning" className="card patient-card danger"><div className="patient-section-title"><span className="section-icon" aria-hidden="true">!</span><h2>이런 증상이 있으면<br className="mobile-break" /> 다시 오세요</h2></div><ul className="warning-list">{content.warningSigns.split("\n").filter(Boolean).map((item, index) => <li key={index}>{item.replace(/^[-•]\s*/, "")}</li>)}</ul><p className="emergency-note">증상이 심하거나 판단이 어려우면 즉시 119 또는 가까운 응급실에 도움을 요청하세요.</p></section>
    <p className="patient-footer"><span>✓</span><span>이 안내문은 담당 의료진이 직접 확인하고 승인한 내용입니다. 증상이 걱정되면 안내문과 관계없이 의료기관에 문의하세요.</span></p>
  </main>;
}
