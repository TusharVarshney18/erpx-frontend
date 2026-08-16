import { createFileRoute } from "@tanstack/react-router";
import { DataModule } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/inventory/categories")({
  head: () => ({ meta: [{ title: "Categories â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Product Categories"
        table="categories"
        permissionPrefix="category"
        newLabel="New Category"
        searchKeys={["name", "description"]}
        fields={[
          { key: "name", label: "Name", required: true },
          { key: "description", label: "Description", type: "textarea" },
        ]}
      />
    </div>
  ),
});
