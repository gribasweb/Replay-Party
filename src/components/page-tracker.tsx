"use client";

import { useEffect } from "react";

/**
 * Registra um acesso (anônimo) ao carregar a página. Dispara uma vez por
 * carregamento; navegação interna (Link) não recarrega o layout, então conta a
 * "entrada" no site. Falhas são silenciosas — nunca afetam a navegação.
 */
export function PageTracker() {
  useEffect(() => {
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: location.pathname, referrer: document.referrer }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
