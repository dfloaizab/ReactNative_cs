// types/jsx.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      iframe: {
        src?: string;
        style?: React.CSSProperties | object;
        title?: string;
        loading?: 'lazy' | 'eager';
        allow?: string;
        width?: string | number;
        height?: string | number;
        [key: string]: unknown;
      };
    }
  }
}

export {};