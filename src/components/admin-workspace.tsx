"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ResourceKey = "categories" | "pilots" | "seasons" | "races" | "results";
type Row = Record<string, unknown>;
type InputValue = string | boolean;
type FieldKind = "text" | "number" | "date" | "datetime-local" | "select" | "ids" | "positions" | "checkbox";

interface FieldDefinition {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  step?: string;
  create?: boolean;
  update?: boolean;
  resource?: ResourceKey;
  options?: { value: string; label: string }[];
  hint?: string;
}

interface ColumnDefinition {
  name: string;
  label: string;
  reference?: ResourceKey;
}

interface SectionDefinition {
  key: ResourceKey;
  label: string;
  heading: string;
  description: string;
  singular: string;
  columns: ColumnDefinition[];
  fields: FieldDefinition[];
}

const raceTypes = [
  { value: "STANDARD", label: "Padrão" },
  { value: "SPRINT", label: "Sprint" },
  { value: "FEATURE", label: "Feature" },
  { value: "ENDURANCE", label: "Endurance" },
];
const pilotStatuses = [
  { value: "FINISHED", label: "Completou" },
  { value: "DNF", label: "Não completou (DNF)" },
  { value: "DSQ", label: "Desclassificado (DSQ)" },
];
const scoringFields: FieldDefinition[] = [
  { name: "categoryId", label: "Categoria", kind: "select", resource: "categories", required: true },
  { name: "raceType", label: "Tipo de corrida", kind: "select", options: raceTypes, required: true },
  { name: "effectiveFrom", label: "Vigente a partir de", kind: "date", required: true },
  { name: "fastestLapBonus", label: "Bônus de volta mais rápida", kind: "number", step: "1", required: true },
  { name: "fastestLapRequiresTopTen", label: "Exigir piloto entre os dez primeiros", kind: "checkbox" },
  { name: "positionRules", label: "Pontos por posição", kind: "positions", required: true, hint: "Formato posição:pontos, separado por vírgulas. Exemplo: 1:25, 2:18, 3:15." },
];

const sections: SectionDefinition[] = [
  {
    key: "categories",
    label: "Categorias",
    heading: "Categorias",
    description: "Defina as categorias, características técnicas e o padrão de licença de cada competição.",
    singular: "categoria",
    columns: [
      { name: "acronym", label: "Sigla" },
      { name: "name", label: "Nome" },
      { name: "vehicleType", label: "Veículo" },
      { name: "licensePattern", label: "Padrão de licença" },
    ],
    fields: [
      { name: "name", label: "Nome", kind: "text", required: true },
      { name: "acronym", label: "Sigla", kind: "text", required: true, create: true },
      { name: "propulsionType", label: "Propulsão", kind: "text", required: true },
      { name: "vehicleType", label: "Tipo de veículo", kind: "text", required: true },
      { name: "tireSupplier", label: "Fornecedor de pneus", kind: "text", required: true },
      { name: "governingBody", label: "Entidade reguladora", kind: "text", required: true },
      { name: "horsePower", label: "Potência (hp)", kind: "number", step: "1", required: true },
      { name: "foundingYear", label: "Ano de criação", kind: "number", step: "1", required: true },
      { name: "licensePattern", label: "Formato da licença", kind: "text", required: true },
    ],
  },
  {
    key: "pilots",
    label: "Pilotos",
    heading: "Pilotos",
    description: "Mantenha o cadastro dos pilotos e vincule suas inscrições às categorias e temporadas.",
    singular: "piloto",
    columns: [
      { name: "pilotNumber", label: "Número" },
      { name: "name", label: "Piloto" },
      { name: "categoryId", label: "Categoria", reference: "categories" },
      { name: "licenseId", label: "Licença" },
    ],
    fields: [
      { name: "name", label: "Nome", kind: "text", required: true },
      { name: "age", label: "Idade", kind: "number", step: "1", required: true },
      { name: "pilotNumber", label: "Número do piloto", kind: "number", step: "1", required: true, create: true },
      { name: "categoryId", label: "Categoria", kind: "select", resource: "categories", required: true },
      { name: "licenseNumber", label: "Número da licença", kind: "text", required: true, create: true, hint: "A API cria a licença junto com o cadastro do piloto." },
      { name: "seasonIds", label: "Temporadas inscritas (IDs separados por vírgula)", kind: "ids", hint: "Opcional. Exemplo: 2, 5." },
    ],
  },
  {
    key: "seasons",
    label: "Temporadas",
    heading: "Temporadas",
    description: "Organize os campeonatos por nome, ano e categoria, com os pilotos inscritos.",
    singular: "temporada",
    columns: [
      { name: "year", label: "Ano" },
      { name: "name", label: "Temporada" },
      { name: "categoryId", label: "Categoria", reference: "categories" },
      { name: "pilotIds", label: "Pilotos" },
    ],
    fields: [
      { name: "name", label: "Nome", kind: "text", required: true },
      { name: "year", label: "Ano", kind: "number", step: "1", required: true },
      { name: "categoryId", label: "Categoria", kind: "select", resource: "categories", required: true, create: true },
      { name: "pilotIds", label: "Pilotos inscritos (IDs separados por vírgula)", kind: "ids", hint: "Opcional. Exemplo: 3, 8." },
    ],
  },
  {
    key: "races",
    label: "Corridas",
    heading: "Corridas",
    description: "Cadastre etapas e atualize detalhes permitidos pela API, incluindo tipo e condições de Safety Car.",
    singular: "corrida",
    columns: [
      { name: "realizationDate", label: "Data" },
      { name: "name", label: "Corrida" },
      { name: "seasonId", label: "Temporada", reference: "seasons" },
      { name: "raceStatus", label: "Estado" },
    ],
    fields: [
      { name: "name", label: "Nome", kind: "text", required: true },
      { name: "realizationDate", label: "Data da prova", kind: "date", required: true },
      { name: "startTime", label: "Início", kind: "datetime-local", required: true },
      { name: "laps", label: "Voltas", kind: "number", step: "1", required: true },
      { name: "circuitLength", label: "Extensão do circuito (km)", kind: "number", step: "0.001", required: true },
      { name: "seasonId", label: "Temporada", kind: "select", resource: "seasons", required: true, create: true },
      { name: "raceType", label: "Tipo de corrida", kind: "select", options: raceTypes, required: true },
      { name: "hasSafetyCar", label: "Houve Safety Car", kind: "checkbox", update: true },
      { name: "safetyCarLaps", label: "Voltas sob Safety Car", kind: "number", step: "1", update: true },
    ],
  },
  {
    key: "results",
    label: "Resultados",
    heading: "Resultados",
    description: "Registre a classificação e as ocorrências. A API calcula os pontos a partir do perfil de pontuação vigente.",
    singular: "resultado",
    columns: [
      { name: "position", label: "Posição" },
      { name: "pilotId", label: "Piloto", reference: "pilots" },
      { name: "raceId", label: "Corrida", reference: "races" },
      { name: "points", label: "Pontos" },
      { name: "raceStatusPilot", label: "Status" },
    ],
    fields: [
      { name: "position", label: "Posição final", kind: "number", step: "1", required: true },
      { name: "raceStatusPilot", label: "Status do piloto", kind: "select", options: pilotStatuses, required: true },
      { name: "penalties", label: "Penalidades", kind: "number", step: "1" },
      { name: "yellowFlags", label: "Bandeiras amarelas", kind: "number", step: "1" },
      { name: "redFlags", label: "Bandeiras vermelhas", kind: "number", step: "1" },
      { name: "flagCount", label: "Ocorrências de bandeira", kind: "number", step: "1" },
      { name: "pilotId", label: "Piloto", kind: "select", resource: "pilots", required: true, create: true },
      { name: "raceId", label: "Corrida", kind: "select", resource: "races", required: true, create: true },
    ],
  },
];

function readableError(body: string, status: number) {
  try {
    const value = JSON.parse(body) as { detail?: string; message?: string; title?: string };
    return value.detail ?? value.message ?? value.title ?? `A API recusou a operação (${status}).`;
  } catch {
    if (status === 403) return "Esta conta não tem o papel ADMIN necessário para alterar os dados.";
    if (status === 401) return "Sua sessão expirou. Entre novamente.";
    return `A API recusou a operação (${status}).`;
  }
}

function displayValue(value: unknown, reference?: ResourceKey, lookups?: Partial<Record<ResourceKey, Row[]>>) {
  if (value === null || value === undefined || value === "") return "—";
  if (reference) {
    const match = lookups?.[reference]?.find((item) => String(item.id) === String(value));
    if (match) return String(match.name ?? match.acronym ?? value);
  }
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function initialValue(field: FieldDefinition, row?: Row): InputValue {
  const value = row?.[field.name];
  if (field.kind === "checkbox") return Boolean(value);
  if (field.kind === "ids") return Array.isArray(value) ? value.join(", ") : "";
  if (field.kind === "datetime-local" && typeof value === "string") return value.slice(0, 16);
  return value === null || value === undefined ? "" : String(value);
}

export function AdminWorkspace() {
  const router = useRouter();
  const [active, setActive] = useState<ResourceKey>("categories");
  const [showScoring, setShowScoring] = useState(false);
  const [lookups, setLookups] = useState<Partial<Record<ResourceKey, Row[]>>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, InputValue>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const section = useMemo(() => sections.find((item) => item.key === active)!, [active]);
  const lookupResources = useMemo(
    () => [...new Set((showScoring ? scoringFields : section.fields).flatMap((field) => field.resource ? [field.resource] : []))],
    [section, showScoring],
  );
  const visibleFields = (showScoring ? scoringFields : section.fields).filter((field) =>
    editing ? field.update !== false && field.create !== true : field.update !== true,
  );

  useEffect(() => {
    let cancelled = false;
    async function loadLookups() {
      const results = await Promise.all(lookupResources.map(async (key) => {
        try {
          const firstResponse = await fetch(`/api/admin/${key}?page=0&size=100&sort=id,desc`, { cache: "no-store" });
          if (!firstResponse.ok) return [key, []] as const;
          const first = (await firstResponse.json()) as { content?: Row[]; totalPages?: number };
          const items = Array.isArray(first.content) ? [...first.content] : [];
          const total = typeof first.totalPages === "number" ? first.totalPages : 1;
          const pages = Array.from({ length: Math.max(0, total - 1) }, (_, index) => index + 1);
          for (let offset = 0; offset < pages.length; offset += 4) {
            const batch = await Promise.all(pages.slice(offset, offset + 4).map(async (nextPage) => {
              const response = await fetch(`/api/admin/${key}?page=${nextPage}&size=100&sort=id,desc`, { cache: "no-store" });
              if (!response.ok) throw new Error("Falha ao consultar registros vinculados.");
              const pageData = (await response.json()) as { content?: Row[] };
              return Array.isArray(pageData.content) ? pageData.content : [];
            }));
            for (const pageItems of batch) items.push(...pageItems);
          }
          return [key, items] as const;
        } catch {
          return [key, []] as const;
        }
      }));
      if (!cancelled) setLookups(Object.fromEntries(results) as Partial<Record<ResourceKey, Row[]>>);
    }
    void loadLookups();
    return () => { cancelled = true; };
  }, [lookupResources, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    async function loadRows() {
      if (showScoring) {
        setRows([]);
        setTotalPages(0);
        setTotalElements(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/${active}?page=${page}&size=100&sort=id,desc`, { cache: "no-store" });
        if (!response.ok) throw new Error(readableError(await response.text(), response.status));
        const result = (await response.json()) as { content?: Row[]; totalPages?: number; totalElements?: number };
        if (!cancelled) {
          setRows(Array.isArray(result.content) ? result.content : []);
          setTotalPages(typeof result.totalPages === "number" ? result.totalPages : 0);
          setTotalElements(typeof result.totalElements === "number" ? result.totalElements : 0);
        }
      } catch (loadError) {
        if (!cancelled) {
          setRows([]);
          setTotalPages(0);
          setTotalElements(0);
          setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os dados.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadRows();
    return () => { cancelled = true; };
  }, [active, page, refreshKey, showScoring]);

  function resetForm() {
    setEditing(null);
    const fields = showScoring ? scoringFields : section.fields;
    setForm(Object.fromEntries(fields.map((field) => [field.name, initialValue(field)])));
    setMessage("");
    setError("");
  }

  function beginEdit(row: Row) {
    setEditing(row);
    setForm(Object.fromEntries(section.fields.map((field) => [field.name, initialValue(field, row)])));
    setMessage("");
    setError("");
  }

  function changeSection(next: ResourceKey) {
    setActive(next);
    setShowScoring(false);
    setPage(0);
    setEditing(null);
    setForm({});
    setMessage("");
    setError("");
  }

  function changeToScoring() {
    setShowScoring(true);
    setEditing(null);
    setForm({
      ...Object.fromEntries(scoringFields.map((field) => [field.name, initialValue(field)])),
      fastestLapBonus: "0",
    });
    setMessage("");
    setError("");
  }

  function payloadFromForm() {
    const payload: Record<string, unknown> = {};
    for (const field of visibleFields) {
      const value = form[field.name];
      if (field.kind === "checkbox") {
        payload[field.name] = Boolean(value);
      } else if (field.kind === "positions") {
        const rules = String(value ?? "").split(/[,;]+/).map((entry) => {
          const [positionText, pointsText] = entry.trim().split(/[:=]/);
          return { position: Number(positionText), points: Number(pointsText) };
        });
        if (rules.some((rule) => !Number.isInteger(rule.position) || rule.position < 1 || !Number.isInteger(rule.points) || rule.points < 0)) {
          throw new Error("Informe pontos válidos no formato posição:pontos, como 1:25, 2:18.");
        }
        if (new Set(rules.map((rule) => rule.position)).size !== rules.length) {
          throw new Error("Cada posição pode aparecer apenas uma vez no perfil.");
        }
        payload[field.name] = rules;
      } else if (field.kind === "ids") {
        const ids = String(value ?? "")
          .split(/[\s,;]+/)
          .map((part) => Number(part))
          .filter((id) => Number.isInteger(id) && id > 0);
        if (ids.length) payload[field.name] = ids;
      } else if (field.kind === "number") {
        if (value !== "" && value !== undefined) payload[field.name] = Number(value);
      } else if (value !== "" && value !== undefined) {
        if (!(showScoring && field.name === "categoryId")) payload[field.name] = value;
      }
    }
    return payload;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const method = editing ? "PATCH" : "POST";
      const path = showScoring
        ? `/api/admin/categories/${form.categoryId}/scoring-profiles`
        : `/api/admin/${active}${editing ? `/${editing.id}` : ""}`;
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromForm()),
      });
      if (!response.ok) throw new Error(readableError(await response.text(), response.status));
      setMessage(showScoring ? "Perfil de pontuação da categoria criado. A API passa a usá-lo conforme o tipo de corrida e a data de vigência." : editing ? `${section.singular} atualizado com sucesso.` : `${section.singular} cadastrado com sucesso.`);
      setEditing(null);
      setForm({});
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar os dados.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Remover este registro de ${section.singular}?`)) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/${active}/${row.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(readableError(await response.text(), response.status));
      setMessage(`${section.singular} removido com sucesso.`);
      if (editing?.id === row.id) resetForm();
      setRefreshKey((value) => value + 1);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Não foi possível remover o registro.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main id="main-content" className="admin-page">
      <div className="admin-frame">
        <aside className="admin-sidebar" aria-label="Seções administrativas">
          <div className="admin-sidebar__intro">
            <p className="eyebrow"><span className="eyebrow__mark" />Gestão</p>
            <h1>Gestão esportiva</h1>
            <p>Gerencie os dados publicados no portal Grid Manager.</p>
          </div>
          <nav className="admin-tabs" aria-label="Recursos do painel">
            {sections.map((item) => (
              <button
                type="button"
                key={item.key}
                className={!showScoring && active === item.key ? "admin-tab is-active" : "admin-tab"}
                aria-current={!showScoring && active === item.key ? "page" : undefined}
                onClick={() => changeSection(item.key)}
              >
                <span>{item.label}</span><span className="mono">↗</span>
              </button>
            ))}
            <button
              type="button"
              className={showScoring ? "admin-tab is-active" : "admin-tab"}
              aria-current={showScoring ? "page" : undefined}
              onClick={changeToScoring}
            >
              <span>Pontuação</span><span className="mono">↗</span>
            </button>
          </nav>
          <div className="admin-sidebar__bottom">
            <span className="admin-session-label"><i />Sessão protegida</span>
            <button type="button" className="admin-logout" onClick={logout}>Encerrar sessão</button>
          </div>
        </aside>

        <section className="admin-content" aria-labelledby="admin-section-title">
          <div className="admin-topline">
            <span className="mono">GRID MANAGER / CONTROLE</span>
            <Link href="/" className="admin-back-link">Voltar ao portal ↗</Link>
          </div>
          <header className="admin-section-heading">
            <div>
              <p className="eyebrow">{showScoring ? "Regras da competição" : "Dados esportivos"}</p>
              <h2 id="admin-section-title">{showScoring ? "Pontuação" : section.heading}</h2>
              <p>{showScoring ? "Configure a pontuação base por categoria, tipo de corrida e data de vigência." : section.description}</p>
            </div>
            {!showScoring && !loading && !error ? <span className="admin-record-count"><span className="mono">{totalElements}</span> registros</span> : null}
          </header>

          {message ? <p className="admin-form-success" role="status">{message}</p> : null}
          {error ? <p className="admin-form-error" role="alert">{error}</p> : null}

          <div className={showScoring ? "admin-work-grid admin-work-grid--scoring" : "admin-work-grid"}>
            {showScoring ? (
              <section className="admin-score-context">
                <h3>Perfil por categoria</h3>
                <p>Os pontos dos resultados seguem o perfil vigente para a categoria e o tipo da corrida.</p>
                <p className="admin-score-pending">Regras específicas por temporada ainda não estão disponíveis.</p>
                <p className="admin-score-footnote">Este painel permite criar perfis. A consulta e edição de perfis existentes ainda não estão disponíveis.</p>
              </section>
            ) : (
            <section className="admin-list-panel" aria-label={`Lista de ${section.label.toLowerCase()}`}>
              <div className="admin-panel-heading">
                <div>
                  <h3>{section.label}</h3>
                </div>
                <span className="mono">PÁGINA {(page + 1).toString().padStart(2, "0")}</span>
              </div>
              {loading ? (
                <p className="admin-empty">Carregando registros…</p>
              ) : rows.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        {section.columns.map((column) => <th key={column.name} scope="col">{column.label}</th>)}
                        <th scope="col"><span className="sr-only">Ações</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={String(row.id)}>
                          {section.columns.map((column) => (
                            <td key={column.name} className={column.name === "position" || column.name === "points" ? "mono" : undefined}>
                              {displayValue(row[column.name], column.reference, lookups)}
                            </td>
                          ))}
                          <td className="admin-row-actions">
                            <button type="button" aria-label={`Editar ${section.singular} ${row.name ?? row.id}`} onClick={() => beginEdit(row)}>Editar</button>
                            <button type="button" aria-label={`Remover ${section.singular} ${row.name ?? row.id}`} disabled={busy} onClick={() => void remove(row)}>Remover</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="admin-empty">{error ? "Não foi possível exibir os registros." : `Nenhuma ${section.singular} cadastrada ainda.`}</p>
              )}
              {totalPages > 1 ? (
                <nav className="admin-pagination" aria-label={`Paginação de ${section.label.toLowerCase()}`}>
                  <button type="button" disabled={page === 0 || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}>← Anterior</button>
                  <span className="mono">{page + 1} / {totalPages}</span>
                  <button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Próxima →</button>
                </nav>
              ) : null}
            </section>
            )}

            <section className="admin-form-panel" aria-labelledby="admin-form-title">
              <div className="admin-panel-heading">
                <div>
                  <p className="eyebrow">{editing ? `ID ${editing.id}` : showScoring ? "Perfil base" : "Novo registro"}</p>
                  <h3 id="admin-form-title">{showScoring ? "Criar perfil de categoria" : editing ? `Editar ${section.singular}` : `Cadastrar ${section.singular}`}</h3>
                </div>
                {editing && !showScoring ? <button type="button" className="admin-cancel" onClick={resetForm}>Cancelar</button> : null}
              </div>
              <form className="admin-data-form" onSubmit={save} key={`${showScoring ? "scoring" : active}-${editing?.id ?? "new"}`}>
                {visibleFields.map((field) => {
                  const value = form[field.name] ?? initialValue(field, editing ?? undefined);
                  if (field.kind === "checkbox") {
                    return (
                      <label className="admin-checkbox" key={field.name}>
                        <input type="checkbox" checked={Boolean(value)} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.checked }))} />
                        <span>{field.label}</span>
                      </label>
                    );
                  }
                  if (field.kind === "select") {
                    const choices = field.options ?? (field.resource ? (lookups[field.resource] ?? []).map((item) => ({
                      value: String(item.id),
                      label: String(item.name ?? item.acronym ?? `ID ${item.id}`),
                    })) : []);
                    return (
                      <label className="admin-field" key={field.name}>
                        <span>{field.label}{field.required ? " *" : ""}</span>
                        <select required={field.required} value={String(value)} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}>
                          <option value="">Selecione</option>
                          {choices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        {field.hint ? <small>{field.hint}</small> : null}
                      </label>
                    );
                  }
                  const inputType = field.kind === "number" || field.kind === "date" || field.kind === "datetime-local" ? field.kind : "text";
                  return (
                    <label className="admin-field" key={field.name}>
                      <span>{field.label}{field.required ? " *" : ""}</span>
                      <input
                        type={inputType}
                        required={field.required}
                        step={field.step}
                        value={String(value)}
                        onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      />
                      {field.hint ? <small>{field.hint}</small> : null}
                    </label>
                  );
                })}
                <div className="admin-form-actions">
                  <button className="button button--red" type="submit" disabled={busy}>
                    {busy ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar"}
                    <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
