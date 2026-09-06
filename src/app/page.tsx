import { redirect } from "next/navigation";

export default function Home() {
  redirect("/staff/discharges/new");
}
