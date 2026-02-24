import { useEffect, useRef } from "react";

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
  const snapLoaded = useRef(false);

  useEffect(() => {
    if (snapLoaded.current) return;

    const script = document.createElement("script");
    script.src = snapJsSrc;
    script.dataset.clientKey = clientKey;
    script.async = true;
    script.onload = () => {
      snapLoaded.current = true;
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  const pay = (snapToken: string, callbacks: PayCallbacks = {}) => {
    if (!globalThis.snap) {
      console.error("Midtrans Snap is not loaded yet.");
      return;
    }
    globalThis.snap.pay(snapToken, callbacks);
  };

  return { pay };
};

export default useMidtransSnap;
