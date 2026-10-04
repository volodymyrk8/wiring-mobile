import { nativeRoute, rememberDestination } from "../src/routes";
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  const route = nativeRoute(path);
  rememberDestination(route);
  return route;
}
