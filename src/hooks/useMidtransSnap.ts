import { useEffect, useRef, useCallback } from "react";

const snapJsSrc =
  import.meta.env.VITE_MIDTRANS_SNAP_JS_SRC ||
  "https://app.sandbox.midtrans.com/snap/snap.js";
const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

type SnapResult = Record<string, unknown>;

interface PayCallbacks {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: (result: SnapResult) => void;
}

declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks?: PayCallbacks) => void };
  }
}

const useMidtransSnap = () => {
  const SNAP_SCRIPT_ID = "midtrans-snap-sdk";
  const snapLoader = useRef<Promise<void> | null>(null);

  const loadSnap = useCallback((): Promise<void> => {
    if (snapLoader.current !== null) return snapLoader.current;
    if (globalThis.snap) return Promise.resolve();

    snapLoader.current = new Promise((resolve, reject) => {
      const existing = document.getElementById(
        SNAP_SCRIPT_ID,
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Midtrans Snap failed to load")),
        );
        return;
      }
      const script = document.createElement("script");
      script.id = SNAP_SCRIPT_ID;
      script.src = snapJsSrc;
      script.dataset.clientKey = clientKey ?? "";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Midtrans Snap failed to load"));
      document.body.appendChild(script);
    });
    return snapLoader.current;
  }, []);

  const snapLoaded = useRef(false);

  useEffect(() => {
    loadSnap().then(() => {
      snapLoaded.current = true;
    });
    return () => {
      // keep script to avoid breaking unmount/remount
    };
  }, [loadSnap]);

  const pay = (snapToken: string, callbacks: PayCallbacks = {}) => {
    loadSnap()
      .then(() => globalThis.snap?.pay(snapToken, callbacks))
      .catch(() => console.error("Failed to load payment SDK."));
  };

  return { pay };
};

export default useMidtransSnap;
