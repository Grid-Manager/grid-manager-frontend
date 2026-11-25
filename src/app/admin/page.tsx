import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminWorkspace } from "@/components/admin-workspace";

export const metadata = { title: "Painel administrativo" };

export default async function AdminPage() {
  const session = await cookies();
  if (!session.get("grid_manager_admin_session")?.value) {
    redirect("/admin/login");
  }

  return <AdminWorkspace />;
}
