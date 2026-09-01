import { createClient } from "@supabase/supabase-js";
import { executeQuery } from "./mockDbHelper";

class MockServerBuilder {
  private spec: any;

  constructor(table: string, method: "select" | "insert" | "update" | "upsert") {
    this.spec = { table, method, filters: [] };
  }

  select(columns: string = "*") {
    this.spec.selectColumns = columns;
    return this;
  }

  eq(column: string, value: any) {
    this.spec.filters.push({ type: "eq", column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.spec.filters.push({ type: "neq", column, value });
    return this;
  }

  lt(column: string, value: any) {
    this.spec.filters.push({ type: "lt", column, value });
    return this;
  }

  in(column: string, value: any) {
    this.spec.filters.push({ type: "in", column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.spec.order = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(value: number) {
    this.spec.limit = value;
    return this;
  }

  single() {
    this.spec.single = true;
    return this;
  }

  maybeSingle() {
    this.spec.maybeSingle = true;
    return this;
  }

  update(values: any) {
    this.spec.method = "update";
    this.spec.values = values;
    return this;
  }

  upsert(values: any, options?: { onConflict?: string }) {
    this.spec.method = "upsert";
    this.spec.values = values;
    this.spec.upsertOptions = options;
    return this;
  }

  async then(onfulfilled?: (value: any) => any) {
    const result = await executeQuery(this.spec);
    if (onfulfilled) return onfulfilled(result);
    return result;
  }
}

function createMockAdminClient() {
  return {
    from(table: string) {
      return new MockServerBuilder(table, "select");
    },
    rpc(rpcName: string, values: any) {
      return {
        async then(onfulfilled?: (value: any) => any) {
          const result = await executeQuery({
            table: "",
            method: "rpc",
            rpcName,
            values,
            filters: []
          });
          if (onfulfilled) return onfulfilled(result);
          return result;
        }
      };
    }
  };
}

export function createAdminClient(): any {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return createMockAdminClient();
}