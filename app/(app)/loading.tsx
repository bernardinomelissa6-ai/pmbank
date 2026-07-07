import { LoadingState } from "@/components/ui/LoadingState";

export default function AppSectionLoading() {
  return (
    <div className="flex flex-col gap-4">
      <LoadingState label="Carregando dados do CasaFlow..." />
    </div>
  );
}
