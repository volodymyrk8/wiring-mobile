import { tr, useLanguage } from "../src/i18n";
import blocks from "../src/content/marketing.json";
import { LegalScreen } from "../src/ui/LegalScreen";
export default function Legal() {
  useLanguage();
  return <LegalScreen title={tr("Согласие на рассылку")} blocks={blocks} />;
}
