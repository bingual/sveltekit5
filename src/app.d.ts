// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  declare module '*.md';

  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  // interfaces
  interface ValidationError {
    field: string | number;
    message: string;
  }

  interface ValidationResponse {
    success: boolean;
    errors: ValidationError[];
  }

  // types
  type ActionType = 'create' | 'update' | 'delete';

  type FilePreview = {
    src: string;
    alt: string;
  };
}

export {};
