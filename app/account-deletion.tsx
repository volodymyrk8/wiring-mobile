import blocks from "../src/content/account-deletion.json";
import { LegalScreen } from "../src/ui/LegalScreen";
export default function Legal() {
  return <LegalScreen title="Удаление аккаунта и данных" blocks={blocks} />;
}
