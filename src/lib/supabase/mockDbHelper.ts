import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "src", "lib", "supabase", "mock-db.json");

export interface QuerySpec {
  table: string;
  method: "select" | "insert" | "update" | "upsert" | "rpc";
  selectColumns?: string;
  filters: Array<{ type: "eq" | "neq" | "lt" | "in"; column: string; value: any }>;
  order?: { column: string; ascending: boolean };
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
  values?: any;
  rpcName?: string;
  upsertOptions?: { onConflict?: string };
}

function getInitialDb() {
  const today = new Date().toISOString().split("T")[0];
  return {
    procurement_centres: [
      { id: "11111111-1111-1111-1111-111111111111", name: "GreenValley Agriculture Hub", location: "Kalyanpur Market Link Rd, Block A", average_processing_minutes: 15 },
      { id: "22222222-2222-2222-2222-222222222222", name: "Kalyanpur Krishi Mandi", location: "Mandi Bypass Chowk, Sector 4", average_processing_minutes: 45 },
      { id: "33333333-3333-3333-3333-333333333333", name: "Jai Kisan Sangrah Kendra", location: "National Highway 2, Near Toll Plaza", average_processing_minutes: 90 },
      { id: "44444444-4444-4444-4444-444444444444", name: "Setu Sahakari Samiti Kendra", location: "Rampur Village Panchayat Office", average_processing_minutes: 5 }
    ],
    bookings: [
      {
        id: "b1",
        centre_id: "11111111-1111-1111-1111-111111111111",
        booking_date: today,
        token_number: 110,
        status: "completed",
        assigned_counter: "Counter 1",
        farmer_id: "99999999-9999-9999-9999-999999999999",
        slot_id: "11111111-aaa1-1111-1111-111111111111",
        booked_at: new Date(Date.now() - 3600000).toISOString(),
        processing_started_at: new Date(Date.now() - 3000000).toISOString(),
        completed_at: new Date(Date.now() - 2000000).toISOString()
      },
      {
        id: "b2",
        centre_id: "11111111-1111-1111-1111-111111111111",
        booking_date: today,
        token_number: 111,
        status: "processing",
        assigned_counter: "Counter 2",
        farmer_id: "99999999-9999-9999-9999-999999999999",
        slot_id: "11111111-aaa2-1111-1111-111111111111",
        booked_at: new Date(Date.now() - 2400000).toISOString(),
        processing_started_at: new Date(Date.now() - 600000).toISOString(),
        completed_at: null
      },
      {
        id: "b3",
        centre_id: "11111111-1111-1111-1111-111111111111",
        booking_date: today,
        token_number: 112,
        status: "waiting",
        assigned_counter: null,
        farmer_id: "99999999-9999-9999-9999-999999999999",
        slot_id: "11111111-aaa3-1111-1111-111111111111",
        booked_at: new Date(Date.now() - 1200000).toISOString(),
        processing_started_at: null,
        completed_at: null
      }
    ],
    farmer_profiles: [
      {
        phone: "+919876543210",
        name: "Ram Singh",
        location: "Kalyanpur Village",
        area: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  };
}

export function readDb(): any {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      writeDb(initial);
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading mock database, resetting...", error);
    const initial = getInitialDb();
    writeDb(initial);
    return initial;
  }
}

export function writeDb(data: any) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing mock database", error);
  }
}

export async function executeQuery(spec: QuerySpec): Promise<{ data: any; error: any }> {
  try {
    const db = readDb();

    // 1. Handle RPC Calls
    if (spec.method === "rpc") {
      if (spec.rpcName === "create_booking") {
        const { p_farmer_id, p_centre_id, p_slot_id } = spec.values;
        const today = new Date().toISOString().split("T")[0];
        const todayBookings = (db.bookings || []).filter(
          (b: any) => b.centre_id === p_centre_id && b.booking_date === today
        );
        let maxToken = 109;
        for (const b of todayBookings) {
          if (b.token_number > maxToken) maxToken = b.token_number;
        }
        const nextToken = maxToken + 1;
        const newBooking = {
          id: "b-" + Math.random().toString(36).substring(2, 9),
          farmer_id: p_farmer_id,
          centre_id: p_centre_id,
          slot_id: p_slot_id,
          booking_date: today,
          token_number: nextToken,
          status: "booked",
          booked_at: new Date().toISOString(),
          arrived_at: null,
          completed_at: null,
          processing_started_at: null,
          assigned_counter: null
        };
        if (!db.bookings) db.bookings = [];
        db.bookings.push(newBooking);
        writeDb(db);
        return { data: newBooking, error: null };
      }
      return { data: null, error: { message: `RPC ${spec.rpcName} not mocked` } };
    }

    const table = spec.table;
    if (!db[table]) {
      db[table] = [];
    }

    // 2. Handle Upsert Operations
    if (spec.method === "upsert") {
      const onConflictCol = spec.upsertOptions?.onConflict || "phone";
      const val = spec.values;
      const existingIdx = db[table].findIndex((row: any) => row[onConflictCol] === val[onConflictCol]);
      let upsertedRow = { ...val, updated_at: new Date().toISOString() };
      if (existingIdx >= 0) {
        upsertedRow = { ...db[table][existingIdx], ...val, updated_at: new Date().toISOString() };
        db[table][existingIdx] = upsertedRow;
      } else {
        upsertedRow.created_at = new Date().toISOString();
        db[table].push(upsertedRow);
      }
      writeDb(db);
      return { data: upsertedRow, error: null };
    }

    // 3. Handle Update Operations
    if (spec.method === "update") {
      const updatedRows: any[] = [];
      db[table] = db[table].map((row: any) => {
        let matches = true;
        for (const filter of spec.filters) {
          const rowVal = row[filter.column];
          if (filter.type === "eq" && rowVal !== filter.value) matches = false;
          if (filter.type === "neq" && rowVal === filter.value) matches = false;
          if (filter.type === "lt" && !(rowVal < filter.value)) matches = false;
          if (filter.type === "in" && (!Array.isArray(filter.value) || !filter.value.includes(rowVal))) matches = false;
        }
        if (matches) {
          const updated = { ...row, ...spec.values };
          updatedRows.push(updated);
          return updated;
        }
        return row;
      });
      writeDb(db);
      const data = spec.single || spec.maybeSingle ? (updatedRows[0] || null) : updatedRows;
      return { data, error: null };
    }

    // 4. Handle Select Operations
    let filtered = [...db[table]];
    for (const filter of spec.filters) {
      const { column, type, value } = filter;
      filtered = filtered.filter((row: any) => {
        const rowVal = row[column];
        if (type === "eq") return rowVal === value;
        if (type === "neq") return rowVal !== value;
        if (type === "lt") return rowVal < value;
        if (type === "in") {
          if (Array.isArray(value)) {
            return value.includes(rowVal);
          }
          return false;
        }
        return true;
      });
    }

    if (spec.order) {
      const { column, ascending } = spec.order;
      filtered.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const comparison = aVal < bVal ? -1 : 1;
        return ascending ? comparison : -comparison;
      });
    }

    if (spec.limit !== undefined) {
      filtered = filtered.slice(0, spec.limit);
    }

    // Select specific columns if requested
    if (spec.selectColumns && spec.selectColumns !== "*") {
      const cols = spec.selectColumns.split(",").map(c => c.trim());
      filtered = filtered.map((row: any) => {
        const picked: any = {};
        for (const col of cols) {
          picked[col] = row[col];
        }
        return picked;
      });
    }

    const resultData = spec.single || spec.maybeSingle ? (filtered[0] || null) : filtered;
    return { data: resultData, error: null };

  } catch (err: any) {
    console.error("Mock query error:", err);
    return { data: null, error: { message: err.message || "Unknown error" } };
  }
}
