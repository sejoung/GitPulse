import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import { DetailPanel } from "./DetailPanel";

export type BasisItem = {
  label: string;
  value: ReactNode;
  breakWords?: boolean;
};

type AnalysisBasisPanelProps = {
  title: string;
  description: string;
  items: BasisItem[];
  onOpenSettings: () => void;
};

export function AnalysisBasisPanel({
  title,
  description,
  items,
  onOpenSettings,
}: AnalysisBasisPanelProps) {
  const { t } = useTranslation("common");

  return (
    <DetailPanel
      title={title}
      description={description}
      actions={
        <Button variant="secondary" onClick={onOpenSettings}>
          {t("actions.openSettings")}
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="gp-panel min-w-0 p-3">
            <p className="gp-kicker">{item.label}</p>
            <p className={`gp-text-secondary mt-1 text-sm ${item.breakWords ? "break-words" : ""}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </DetailPanel>
  );
}
