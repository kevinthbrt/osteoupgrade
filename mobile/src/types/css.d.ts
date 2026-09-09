// Les imports CSS (web uniquement) sont résolus par Metro, pas par TypeScript.
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
