import blocks from "../src/content/privacy.json";
import { LegalScreen } from "../src/ui/LegalScreen";
export default function Legal() {
  return <LegalScreen title="Конфиденциальность" blocks={blocks} />;
}
