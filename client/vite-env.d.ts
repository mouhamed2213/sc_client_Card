// CSS module imports (side-effect only, no types needed for these)
// Vite handles CSS imports as side effects
declare module '*.css' {
  const content: void;
  export default content;
}
