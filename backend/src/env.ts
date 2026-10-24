export type Bindings = {
  DB: D1Database;
  ENVIRONMENT?: string;
  APP_VERSION?: string;
};

export type Variables = {
  requestId: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
