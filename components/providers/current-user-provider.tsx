"use client";

import { createContext, useContext } from "react";

type CurrentUserContextValue = {
  isAdmin: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue>({
  isAdmin: false,
});

export function CurrentUserProvider({
  isAdmin,
  children,
}: CurrentUserContextValue & { children: React.ReactNode }) {
  return (
    <CurrentUserContext.Provider value={{ isAdmin }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
