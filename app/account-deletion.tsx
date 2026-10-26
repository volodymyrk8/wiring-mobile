import { tr, useLanguage } from "../src/i18n";
import blocks from "../src/content/account-deletion.json";
import { LegalScreen } from "../src/ui/LegalScreen";
export default function Legal() {
  useLanguage();
  return <LegalScreen title={tr("Удаление аккаунта и данных")} blocks={blocks} />;
}
