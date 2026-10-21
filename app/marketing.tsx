import blocks from "../src/content/marketing.json";
import { LegalScreen } from "../src/ui/LegalScreen";
export default function Legal() {
  return <LegalScreen title="Согласие на рассылку" blocks={blocks} />;
}
