// Vite env
declare const APP_VERSION: string;

// App level
export type List = {
  id?: number;
  title: string;
  color: string;
  description: string | null;
  slug_public?: string;
  slug_private?: string;
  spoiler?: boolean;
  created?: string;
};

export type Item = {
  id?: number;
  list: number;
  title: string;
  description: string | null;
  links: string[] | null;
  price: string | null;
  state: ItemState; // ["open", "reserved", "purchased"];
  weight: number | null;
  modified: string;
  created: string;
};

export enum ItemState {
  Open = "open",
  Reserved = "reserved",
  Purchased = "purchased",
}
export enum InputMode {
  Insert,
  Update,
}
