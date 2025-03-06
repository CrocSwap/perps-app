import { useEffect, useState } from "react";

/**
 * Custom Hook to check if the component is mounted on the client side
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
