import { notFound } from "next/navigation";
import { PatientGuide } from "@/components/patient-guide";
import { findDischarge } from "@/db/repository";

export default async function PatientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const content = await findDischarge(token);
  if (!content) notFound();
  return <PatientGuide content={content} />;
}
