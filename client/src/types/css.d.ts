import 'react';

declare module 'react' {
  // Autorise les custom properties CSS (--i, --a, --bc...) dans l'attribut style
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
