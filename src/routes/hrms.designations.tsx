import { createFileRoute } from "@tanstack/react-router";
import { DataModule } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/hrms/designations")({
  head: () => ({ meta: [{ title: "Designations - ERPX" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Designations"
        subtitle="Job titles you can assign to employees (e.g. Software Engineer, Sales Manager)."
        table="designations"
        permissionPrefix="designation"
        newLabel="New Designation"
        searchKeys={["name", "code"]}
        orderBy={{ column: "level", ascending: true }}
        fields={[
          { key: "name", label: "Name", required: true },
          { key: "code", label: "Code", required: true },
          {
            key: "level",
            label: "Level",
            type: "number",
            defaultValue: 0,
            format: (v) => (v == null ? "—" : `L${v}`),
          },
        ]}
      />
    </div>
  ),
});
