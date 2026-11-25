import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata = { title: "Acesso administrativo" };

export default function AdminLoginPage() {
  return (
    <main id="main-content" className="admin-login-page">
      <div className="admin-login-card">
        <p className="eyebrow"><span className="eyebrow__mark" />Área administrativa</p>
        <h1>Acesso à gestão.</h1>
        <p className="admin-login-copy">
          Entre com a conta administrativa configurada para o Grid Manager.
        </p>
        <AdminLoginForm />
      </div>
      <aside className="admin-login-aside" aria-label="Identidade Grid Manager">
        <span className="mono">GRID MANAGER / ADMIN</span>
        <strong>Controle da competição, com acesso protegido.</strong>
      </aside>
    </main>
  );
}
