import { createContext, useContext, useState, ReactNode } from "react";

interface FeedContextType {
  feedType: string;
  setFeedType: (type: string) => void;
}

const FeedContext = createContext<FeedContextType | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [feedType, setFeedType] = useState<string>("following");
  
  return (
    <FeedContext.Provider value={{ feedType, setFeedType }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error("useFeed must be used within FeedProvider");
  }
  return context;
}
