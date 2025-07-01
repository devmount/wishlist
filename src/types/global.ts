// Vite env
declare const APP_VERSION: string;

// App level
namespace Types {
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
    id: number;
    list: number;
    title: string;
    description: string | null;
    links: string[] | null;
    price: string | null;
    state: string; // ["open", "reserved", "purchased"];
    weight: number | null;
    modified: string;
    created: string;
  };
}
