export { DeliveryRiskPage } from "./DeliveryRiskPage";

export type DeliveryEvent = {
  kind: "hotfix" | "revert" | "rollback";
  commitSha: string;
};
