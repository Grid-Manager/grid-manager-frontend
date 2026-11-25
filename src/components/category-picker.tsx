import Form from "next/form";
import type { Category, Season } from "@/lib/contracts";
import { seasonPeriod } from "@/lib/format";

export function CategoryPicker({
  action, categories, selected, id = "portal-category",
}: {
  action: string;
  categories: Category[];
  selected?: Category;
  id?: string;
}) {
  if (!selected || categories.length < 2) return null;
  const automobiles = categories.filter((category) => category.vehicleType !== "Moto");
  const motorcycles = categories.filter((category) => category.vehicleType === "Moto");
  return (
    <Form className="category-picker" action={action}>
      <label htmlFor={id}>Categoria</label>
      <select id={id} name="categoria" key={selected.id} defaultValue={String(selected.id)}>
        {automobiles.length > 0 && <optgroup label="Automobilismo">
          {automobiles.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </optgroup>}
        {motorcycles.length > 0 && <optgroup label="Motociclismo">
          {motorcycles.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </optgroup>}
      </select>
      <button type="submit">Ver categoria</button>
    </Form>
  );
}

export function SeasonPicker({ action, categoryId, seasons, selected, includeAll }: {
  action: string;
  categoryId?: number;
  seasons: Season[];
  selected?: number;
  includeAll?: boolean;
}) {
  if (!categoryId || seasons.length < 2) return null;
  return (
    <Form className="category-picker" action={action}>
      <input name="categoria" type="hidden" value={categoryId} />
      <label htmlFor="portal-season">Temporada</label>
      <select id="portal-season" name="temporada" key={selected} defaultValue={selected ?? "todas"}>
        {includeAll && <option value="todas">Todas</option>}
        {seasons.map((season) => <option key={season.id} value={season.id}>{seasonPeriod(season)}</option>)}
      </select>
      <button type="submit">Ver temporada</button>
    </Form>
  );
}
