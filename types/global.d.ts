// Vite env
declare const APP_VERSION: string

// App level
namespace Types {
  export type List = {
    id: number;
    title: string;
    color: string;
    description: string;
    slug_public: string;
    slug_private: string;
    spoiler: boolean;
    created: string;
  };
}
