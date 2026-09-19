const STYLE_ID = "bionic-page-style";
const HEAD_CLASS = "bp-head";

export function observeDynamic(
  root: ParentNode,
  onChange: () => void,
  options?: { debounceMs?: number },
): () => void {
  const noop = (): void => {};

  try {
    if (typeof MutationObserver === "undefined" || root === null || typeof root !== "object") {
      return noop;
    }

    const debounceMs = Math.max(0, options?.debounceMs ?? 120);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rafId: number | undefined;
    let pending = false;
    let disposed = false;

    const raf =
      typeof requestAnimationFrame === "function"
        ? (cb: FrameRequestCallback): number => requestAnimationFrame(cb)
        : null;

    const run = (): void => {
      pending = false;
      rafId = undefined;
      if (disposed) return;
      try {
        onChange();
      } catch {}
    };

    const flush = (): void => {
      timer = undefined;
      if (disposed) return;
      if (raf) {
        rafId = raf(run);
      } else {
        run();
      }
    };

    const schedule = (): void => {
      if (disposed || pending) return;
      pending = true;
      timer = setTimeout(flush, debounceMs);
    };

    const ignored = (n: Node | null | undefined): boolean => {
      if (!n) return true;
      const el = n.nodeType === 1 ? (n as Element) : n.parentElement;
      if (!el) return false;
      if (el.id === STYLE_ID) return true;
      if (typeof el.closest === "function" && el.closest("." + HEAD_CLASS) !== null) {
        return true;
      }
      return false;
    };

    const isIgnorableRecord = (record: MutationRecord): boolean => {
      if (ignored(record.target)) return true;
      if (record.type === "childList") {
        const total = record.addedNodes.length + record.removedNodes.length;
        if (total === 0) return true;
        let allIgnored = true;
        record.addedNodes.forEach((n) => {
          if (!ignored(n)) allIgnored = false;
        });
        record.removedNodes.forEach((n) => {
          if (!ignored(n)) allIgnored = false;
        });
        return allIgnored;
      }
      return false;
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (!isIgnorableRecord(mutation)) {
          schedule();
          return;
        }
      }
    });

    observer.observe(root as Node, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return (): void => {
      disposed = true;
      try {
        observer.disconnect();
      } catch {}
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (rafId !== undefined) {
        try {
          if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(rafId);
        } catch {}
        rafId = undefined;
      }
    };
  } catch {
    return noop;
  }
}
