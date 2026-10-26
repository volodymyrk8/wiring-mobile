import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Loading } from "../src/ui/kit";
export default function Onboard() {
  const router = useRouter();
  useEffect(() => { router.replace("/edit-profile"); }, [router]);
  return <Loading />;
}
