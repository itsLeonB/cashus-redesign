export const queryKeys = {
  profile: {
    current: ["profile"] as const,
  },
  profiles: {
    all: ["profiles"] as const,
    search: (query: string) => ["profiles", "search", query] as const,
  },
  friendships: {
    all: ["friendships"] as const,
    detail: (id: string) => ["friendships", id] as const,
  },
  friendRequests: {
    all: ["friend-requests"] as const,
    sent: ["friend-requests", "sent"] as const,
    received: ["friend-requests", "received"] as const,
  },

  debts: {
    all: ["debts"] as const,
  },
  calculationMethods: {
    all: ["calculation-methods"] as const,
  },
  transferMethods: {
    all: ["transfer-methods"] as const,
    profile: (profileId: string) =>
      ["profile-transfer-methods", profileId] as const,
    filter: (filter: string) => ["transfer-methods", filter] as const,
  },

  groupExpenses: {
    all: ["group-expenses"] as const,
    detail: (id: string) => ["group-expenses", id] as const,
    status: (status: string) => ["group-expenses", status] as const,
  },
} as const;
