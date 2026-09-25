import DashboardShell from "@/components/dashboard/dashboard-shell";
import DatasetHeader from "./dataset-header";
import DatasetTabs from "./dataset-tabs";

export default function DatasetDetailShell({
  dataset,
  children,
}) {
  return (
    <DashboardShell>
      <DatasetHeader dataset={dataset} />

      <DatasetTabs datasetId={dataset.id} />

      {children}
    </DashboardShell>
  );
}