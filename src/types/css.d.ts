/**
 * Los componentes importan su .css como efecto (`import './Card.css'`). Las
 * versiones nuevas de TypeScript que trae VS Code piden declararlo; `tsc` del
 * proyecto no, pero asi el editor no marca error.
 */
declare module '*.css';
