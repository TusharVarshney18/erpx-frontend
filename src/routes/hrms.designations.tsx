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
          {
            key: "name",
            label: "Job title",
            required: true,
            placeholder: "e.g. Software Developer",
            hint: "The role, not the person. Assign it to people in HRMS → Employees.",
          },
          {
            key: "code",
            label: "Code",
            required: true,
            placeholder: "e.g. SD",
            hint: "A short unique code for this title.",
          },
          {
            key: "level",
            label: "Level",
            type: "number",
            defaultValue: 0,
            placeholder: "e.g. 2",
            hint: "Seniority: 1 = junior. Higher numbers are more senior.",
            format: (v) => (v == null ? "—" : `L${v}`),
          },
        ]}
      />
    </div>
  ),
});
