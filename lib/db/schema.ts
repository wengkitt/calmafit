import { sql } from "drizzle-orm";
import type { Nutrition, Meal, PortionUnit } from "@/lib/tracking/nutrition";
import {
  boolean,
  check,
  date,
  doublePrecision,
  jsonb,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_idx").on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// Shared food records are append-only through the application data layer.
export const foods = pgTable(
  "foods",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    brand: text("brand"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("foods_name_idx").on(table.name)],
);

export const foodVersions = pgTable(
  "food_versions",
  {
    id: text("id").primaryKey(),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id),
    nutrition: jsonb("nutrition").$type<Nutrition>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("food_versions_food_idx").on(table.foodId, table.createdAt)],
);

export const diaryEntries = pgTable(
  "diary_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    meal: text("meal").$type<Meal>().notNull(),
    snapshot: jsonb("snapshot").$type<Nutrition>().notNull(),
    sourceVersionId: text("source_version_id").references(() => foodVersions.id),
    quantity: doublePrecision("quantity").notNull(),
    unit: text("unit").$type<PortionUnit>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("diary_user_date_idx").on(table.userId, table.date),
    index("diary_user_created_idx").on(table.userId, table.createdAt),
    check("diary_quantity_positive", sql`${table.quantity} > 0 AND ${table.quantity} <= 1000000`),
    check("diary_meal_valid", sql`${table.meal} IN ('breakfast','lunch','dinner','snacks')`),
    check("diary_unit_valid", sql`${table.unit} IN ('grams','servings')`),
  ],
);

export const weightEntries = pgTable(
  "weight_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    kilograms: doublePrecision("kilograms").notNull(),
  },
  (table) => [
    uniqueIndex("weight_user_date_idx").on(table.userId, table.date),
    check("weight_positive", sql`${table.kilograms} > 0 AND ${table.kilograms} <= 1000`),
  ],
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull(),
  calories: doublePrecision("calories"),
  protein: doublePrecision("protein"),
  carbs: doublePrecision("carbs"),
  fat: doublePrecision("fat"),
  targetWeight: doublePrecision("target_weight"),
});
