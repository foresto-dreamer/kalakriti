import { createBrowserClient } from '@supabase/ssr'

class MockChannel {
  private intervalId: any = null;

  on(event: string, filter: any, callback: () => void) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => {
      callback();
    }, 3000);
    return this;
  }

  subscribe() {
    return this;
  }

  unsubscribe() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

class MockBuilder {
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
    try {
      const response = await fetch("/api/mock-supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.spec),
      });
      const result = await response.json();
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (err: any) {
      const result = { data: null, error: { message: err.message || "Failed to fetch mock db" } };
      if (onfulfilled) return onfulfilled(result);
      return result;
    }
  }
}

function createMockClient() {
  return {
    from(table: string) {
      return new MockBuilder(table, "select");
    },
    rpc(rpcName: string, values: any) {
      return {
        async then(onfulfilled?: (value: any) => any) {
          try {
            const response = await fetch("/api/mock-supabase", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ method: "rpc", rpcName, values }),
            });
            const result = await response.json();
            if (onfulfilled) return onfulfilled(result);
            return result;
          } catch (err: any) {
            const result = { data: null, error: { message: err.message || "Failed to fetch mock RPC" } };
            if (onfulfilled) return onfulfilled(result);
            return result;
          }
        }
      };
    },
    channel(name: string) {
      return new MockChannel();
    },
    removeChannel(channel: any) {
      if (channel && typeof channel.unsubscribe === "function") {
        channel.unsubscribe();
      }
    },
  };
}

export function createClient(): any {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
  }
  return createMockClient();
}

