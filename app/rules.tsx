import blocks from "../src/content/rules.json";
import { LegalScreen } from "../src/ui/LegalScreen";
export default function Legal() {
  return <LegalScreen title="Правила WIRING" blocks={blocks} />;
}
