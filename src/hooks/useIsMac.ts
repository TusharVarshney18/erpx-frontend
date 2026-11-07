import { useEffect, useState } from "react";
import { isMac } from "@/lib/shortcuts";

/**
 * macOS detection that is safe for server rendering: false on the server and
 * on the first client render, then the real value after mount, so shortcut
 * labels never cause a hydration mismatch.
 */
export function useIsMac(): boolean {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(isMac()), []);
  return mac;
}
