import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import initSql from "../../migrations/0000_init.sql?raw";
import { getDb } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import seedSql from "../../src/db/seed.sql?raw";
import type { Bindings } from "../../src/env";

describe("Database Schema, Migrations, and Constraints Tests", () => {
  const bindings = env as unknown as Bindings;
  const d1 = bindings.DB;
  const db = getDb(bindings);

  async function executeRawStatements(sql: string, delimiter: string) {
    const cleanSql = sql.replace(/--.*$/gm, "");
    const stmts = cleanSql
      .split(delimiter)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of stmts) {
      await d1.prepare(stmt).run();
    }
  }

  beforeAll(async () => {
    // Apply migration SQL statements
    await executeRawStatements(initSql, "--> statement-breakpoint");
    // Apply seed SQL statements
    await executeRawStatements(seedSql, ";");
  });

  describe("Seed Data & Idempotency", () => {
    it("seeds data correctly and running seed again does not duplicate or throw", async () => {
      const usersList = await db.select().from(schema.users);
      expect(usersList.length).toBeGreaterThanOrEqual(3);

      const locationsList = await db.select().from(schema.locations);
      expect(locationsList.length).toBeGreaterThanOrEqual(6);

      const productsList = await db.select().from(schema.products);
      expect(productsList.length).toBeGreaterThanOrEqual(10);

      const movementsList = await db.select().from(schema.shelfMovements);
      expect(movementsList.length).toBeGreaterThanOrEqual(6);

      // Re-run seed to test idempotency
      await expect(executeRawStatements(seedSql, ";")).resolves.not.toThrow();

      const usersAfter = await db.select().from(schema.users);
      expect(usersAfter.length).toBe(usersList.length);
    });
  });

  describe("Insert and Select for Main Tables", () => {
    it("can insert and select from users and sessions", async () => {
      const [insertedUser] = await db
        .insert(schema.users)
        .values({
          username: "test_staff_99",
          fullName: "Test Staff",
          pinHash: "pbkdf2$sha256$1000$salt$hash",
          role: "STAFF",
        })
        .returning();

      expect(insertedUser.id).toBeDefined();
      expect(insertedUser.username).toBe("test_staff_99");

      const [insertedSession] = await db
        .insert(schema.sessions)
        .values({
          id: "session_token_1234567890abcdef",
          userId: insertedUser.id,
          createdAt: "2026-10-25T00:00:00.000Z",
          expiresAt: "2026-11-25T00:00:00.000Z",
        })
        .returning();

      expect(insertedSession.userId).toBe(insertedUser.id);
    });

    it("can insert and select from branches and pick_batches", async () => {
      const [insertedBranch] = await db
        .insert(schema.branches)
        .values({
          kvId: 9901,
          name: "Chi nhánh Test Đà Nẵng",
          active: 1,
        })
        .returning();

      const [insertedBatch] = await db
        .insert(schema.pickBatches)
        .values({
          code: "S-9901",
          purpose: "TRANSFER",
          toBranchId: insertedBranch.kvId,
          status: "OPEN",
          createdBy: 1,
          createdAt: "2026-10-25T00:00:00.000Z",
        })
        .returning();

      expect(insertedBatch.code).toBe("S-9901");
      expect(insertedBatch.toBranchId).toBe(9901);
    });

    it("can insert and select from kv_documents, kv_document_lines, and batch_doc_links", async () => {
      const [insertedDoc] = await db
        .insert(schema.kvDocuments)
        .values({
          kvId: 88801,
          type: "TRANSFER",
          code: "CK-88801",
          status: 1,
          docDate: "2026-10-25T00:00:00.000Z",
          description: "Gắn đợt S-9901",
        })
        .returning();

      const [insertedLine] = await db
        .insert(schema.kvDocumentLines)
        .values({
          docId: insertedDoc.id,
          productId: 101,
          qty: 5,
          prevQty: 5,
        })
        .returning();

      expect(insertedLine.docId).toBe(insertedDoc.id);

      const [insertedLink] = await db
        .insert(schema.batchDocLinks)
        .values({
          batchId: 1,
          docId: insertedDoc.id,
          matchType: "NOTE",
          score: 1.0,
          linkedAt: "2026-10-25T00:00:00.000Z",
        })
        .returning();

      expect(insertedLink.docId).toBe(insertedDoc.id);
    });

    it("can insert and select from tasks and shelf_movements", async () => {
      const [insertedTask] = await db
        .insert(schema.tasks)
        .values({
          type: "REFILL",
          locationItemId: 1,
          qty: 10,
          assignedTo: 2,
          status: "OPEN",
          createdAt: "2026-10-25T00:00:00.000Z",
        })
        .returning();

      expect(insertedTask.type).toBe("REFILL");

      const [insertedMovement] = await db
        .insert(schema.shelfMovements)
        .values({
          locationItemId: 1,
          type: "REFILL",
          qty: 5,
          qtyAfter: 15,
          userId: 2,
          taskId: insertedTask.id,
          clientUuid: "uuid-test-movement-9999",
          createdAt: "2026-10-25T00:00:00.000Z",
        })
        .returning();

      expect(insertedMovement.clientUuid).toBe("uuid-test-movement-9999");
      expect(insertedMovement.qtyAfter).toBe(15);
    });

    it("can insert and select from daily_snapshots, sync_state, and audit_log", async () => {
      const [snapshot] = await db
        .insert(schema.dailySnapshots)
        .values({
          date: "2026-10-25",
          productId: 101,
          kvOnHand: 50,
          shelfQty: 10,
        })
        .returning();

      expect(snapshot.date).toBe("2026-10-25");

      const [state] = await db
        .insert(schema.syncState)
        .values({
          key: "test_key",
          value: "test_value",
          updatedAt: "2026-10-25T00:00:00.000Z",
        })
        .returning();

      expect(state.key).toBe("test_key");

      const [audit] = await db
        .insert(schema.auditLog)
        .values({
          userId: 1,
          action: "TEST_ACTION",
          entity: "users",
          entityId: "1",
          createdAt: "2026-10-25T00:00:00.000Z",
        })
        .returning();

      expect(audit.action).toBe("TEST_ACTION");
    });
  });

  describe("Important Unique Constraints", () => {
    it("enforces UNIQUE constraint on locations.code", async () => {
      await expect(
        db.insert(schema.locations).values({
          code: "A1-1-01", // Already exists in seed
          aisle: "A",
          rack: 1,
          level: 1,
          slot: 1,
          qrToken: "UNIQUE_TOKEN_X",
        }),
      ).rejects.toThrow();
    });

    it("enforces UNIQUE constraint on locations.qr_token", async () => {
      await expect(
        db.insert(schema.locations).values({
          code: "A9-9-99",
          aisle: "A",
          rack: 9,
          level: 9,
          slot: 9,
          qrToken: "7Kx9QpZa", // Already exists in seed
        }),
      ).rejects.toThrow();
    });

    it("enforces UNIQUE constraint on shelf_movements.client_uuid", async () => {
      await expect(
        db.insert(schema.shelfMovements).values({
          locationItemId: 1,
          type: "PICK",
          qty: -1,
          qtyAfter: 9,
          userId: 1,
          clientUuid: "uuid-seed-init-001", // Already exists in seed
          createdAt: "2026-10-25T00:00:00.000Z",
        }),
      ).rejects.toThrow();
    });

    it("enforces UNIQUE constraint on users.username", async () => {
      await expect(
        db.insert(schema.users).values({
          username: "admin", // Already exists in seed
          fullName: "Duplicate Admin",
          pinHash: "hash",
          role: "ADMIN",
        }),
      ).rejects.toThrow();
    });

    it("enforces UNIQUE constraint on location_items(location_id, product_id)", async () => {
      await expect(
        db.insert(schema.locationItems).values({
          locationId: 1, // Pair (1, 101) already exists in seed
          productId: 101,
        }),
      ).rejects.toThrow();
    });

    it("enforces UNIQUE constraint on kv_documents(type, kv_id)", async () => {
      await db.insert(schema.kvDocuments).values({
        kvId: 55555,
        type: "INVOICE",
        code: "HD-55555",
        status: 1,
        docDate: "2026-10-25T00:00:00.000Z",
      });

      await expect(
        db.insert(schema.kvDocuments).values({
          kvId: 55555,
          type: "INVOICE", // Duplicate pair (INVOICE, 55555)
          code: "HD-55555-DUP",
          status: 1,
          docDate: "2026-10-25T00:00:00.000Z",
        }),
      ).rejects.toThrow();
    });
  });
});
