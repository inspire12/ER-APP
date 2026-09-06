import type { DischargeContent } from "@/lib/types";

export function PatientGuide({ content }: { content: DischargeContent }) {
  return <main className="shell">
    <header className="patient-title"><h1>응급실 퇴원 안내</h1><p className="muted">집에서 안전하게 회복하실 수 있도록 꼭 확인해 주세요.</p></header>
    <span className="diagnosis">진단명 · {content.diagnosis}</span>
    <section className="card"><h2>오늘 확인한 내용</h2><p className="patient-copy">{content.findings || "의료진에게 안내받은 진료 내용을 참고하세요."}</p></section>
    <section className="card"><h2>처방 및 복약 안내</h2><p className="patient-copy">{content.medication}</p></section>
    <section className="card"><h2>집에서 이렇게 관리하세요</h2><p className="patient-copy">{content.education}</p></section>
    <section className="card danger"><h2>이런 증상이 있으면 다시 오세요</h2><p className="patient-copy">{content.warningSigns}</p></section>
    <p className="muted">이 안내문은 담당 의료진이 직접 확인하고 승인한 내용입니다.</p>
  </main>;
}
