// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  // interfaces
  interface ValidationError {
    field: string;
    message: string;
  }

  interface ValidationResponse {
    error: boolean;
    errors: ValidationError[];
  }

  // types
  type ActionType = 'create' | 'update' | 'delete';
}

export {};
