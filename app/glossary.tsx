import blocks from "../src/content/glossary.json";
import { LegalScreen } from "../src/ui/LegalScreen";
export default function Legal() {
  return <LegalScreen title="Особенности и аббревиатуры" blocks={blocks} />;
}
