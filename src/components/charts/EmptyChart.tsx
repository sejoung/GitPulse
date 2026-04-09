import { ChartCard } from "./ChartCard";

type EmptyChartProps = {
  title: string;
};

export function EmptyChart({ title }: EmptyChartProps) {
  return <ChartCard title={title} />;
}
