export type DealResult = {
    id: string;
    createdAt: number;
    title: string;
    sellerPrice: number;
    marketValue: number;
    dealScore: number; // 0-100
    condition: "Poor" | "Fair" | "Good" | "Great" | "Excellent";
    scamRisk: "Low" | "Medium" | "High";
    counterOffer: number;
    notes: string[];
    imageDataUrl?: string;
    location?: string;
  };
  
  const KEY = "dealai_v1";
  
  type DB = {
    timeline: DealResult[];
    feed: DealResult[];
    profile: { handle: string; bio: string };
  };
  
  const defaultDB: DB = {
    timeline: [],
    feed: [],
    profile: { handle: "aarav", bio: "Deal hunter. Tech + cars." },
  };
  
  export function loadDB(): DB {
    if (typeof window === "undefined") return defaultDB;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultDB;
      return { ...defaultDB, ...JSON.parse(raw) };
    } catch {
      return defaultDB;
    }
  }
  
  export function saveDB(db: DB) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(db));
  }
  
  export function upsertTimeline(deal: DealResult) {
    const db = loadDB();
    db.timeline = [deal, ...db.timeline.filter((d) => d.id !== deal.id)];
    saveDB(db);
  }
  
  export function publishToFeed(deal: DealResult) {
    const db = loadDB();
    db.feed = [deal, ...db.feed.filter((d) => d.id !== deal.id)];
    saveDB(db);
  }
  
  export function removeFromTimeline(id: string) {
    const db = loadDB();
    db.timeline = db.timeline.filter((d) => d.id !== id);
    saveDB(db);
  }
  