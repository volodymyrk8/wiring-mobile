import blocks from "../src/content/child-safety.json";
import { LegalScreen } from "../src/ui/LegalScreen";
export default function Legal() {
  return <LegalScreen title="Защита детей" blocks={blocks} />;
}
