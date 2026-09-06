import { PatientGuide } from "@/components/patient-guide";

export default function DemoPatientPage() {
  return <PatientGuide content={{
    diagnosis: "급성 위장염 의심",
    findings: "활력징후는 안정적이고 의식은 명료합니다. 복부는 부드럽고 반발통이나 우하복부 국소 압통은 없습니다. 혈액검사에서는 경미한 염증수치 상승 외 특이소견이 확인되지 않았습니다.",
    medication: "위장관 증상 조절약이 처방되었습니다. 처방된 약은 처방전의 용법과 용량에 따라 복용하세요.",
    education: "초기에는 미음, 죽 등 자극 없는 유동식을 드시고, 증상이 호전되면 부드러운 일반식으로 넘어가세요. 충분한 수분 섭취가 중요합니다.",
    warningSigns: "38도 이상의 고열이 지속될 때\n혈변이나 검은변이 나올 때\n심한 복통이 멈추지 않을 때",
  }} />;
}
