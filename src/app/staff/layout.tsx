import Link from "next/link";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <>
    <header className="staff-nav"><div><strong className="brand"><span className="brand-mark">+</span>ER 스마트 퇴원 안내</strong><nav aria-label="의료진 메뉴">
      <Link href="/staff/discharges/new">안내문 작성</Link>
      <Link href="/staff/content">질환 콘텐츠</Link>
    </nav></div></header>
    <main className="shell">{children}</main>
  </>;
}
