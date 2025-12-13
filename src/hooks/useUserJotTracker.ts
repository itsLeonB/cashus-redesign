import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

declare global {
  var uj:
    | {
        q: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        init: (projectId: string, options?: any) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        identify: (user: any) => void;
      }
    | undefined;
}

export function useUserJotTracker() {
  const { user } = useAuth();
  const initialized = useRef<boolean>(false);

  useEffect(() => {
    const projectId = import.meta.env.VITE_USERJOT_PROJECT_ID;

    if (!projectId) {
      console.error("UserJot: VITE_USERJOT_PROJECT_ID is missing");
      return;
    }

    if (initialized.current) {
      return;
    }

    globalThis.uj?.init(projectId, {
      widget: true,
      position: "right",
      theme: "auto",
      trigger: "default",
    });

    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current || !user || !globalThis.uj) return;

    const fullName = typeof user.name === "string" ? user.name.trim() : "";
    const [firstName, ...rest] = fullName ? fullName.split(/\s+/) : [""];
    const lastName = rest.join(" ");

    globalThis.uj.identify({
      id: user.id || user.userId,
      email: user.email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      avatar: user.avatar,
    });
  }, [user]);
}
