import type { DischargeContent } from "@/lib/types";

export function PatientGuide({ content }: { content: DischargeContent }) {
  return <main className="shell patient-shell">
    <header className="patient-title"><span className="patient-kicker">의료진 확인 완료</span><h1>응급실 퇴원 안내</h1><p className="muted">집에서 안전하게 회복하실 수 있도록 중요한 내용을 정리했습니다.</p></header>
    <div className="diagnosis"><span>✓</span><span>진단명 · {content.diagnosis}</span></div>
    <section className="card patient-card"><div className="patient-section-title"><span className="section-icon">⌕</span><h2>오늘 확인한 내용</h2></div><p className="patient-copy">{content.findings || "의료진에게 안내받은 진료 내용을 참고하세요."}</p></section>
    <section className="card patient-card"><div className="patient-section-title"><span className="section-icon">◫</span><h2>처방 및 복약 안내</h2></div><p className="patient-copy">{content.medication}</p></section>
    <section className="card patient-card"><div className="patient-section-title"><span className="section-icon">⌂</span><h2>집에서 이렇게 관리하세요</h2></div><p className="patient-copy">{content.education}</p></section>
    <section className="card patient-card danger"><div className="patient-section-title"><span className="section-icon">!</span><h2>이런 증상이 있으면 다시 오세요</h2></div><p className="patient-copy">{content.warningSigns}</p></section>
    <p className="patient-footer"><span>✓</span><span>이 안내문은 담당 의료진이 직접 확인하고 승인한 내용입니다. 증상이 걱정되면 안내문과 관계없이 의료기관에 문의하세요.</span></p>
  </main>;
}
