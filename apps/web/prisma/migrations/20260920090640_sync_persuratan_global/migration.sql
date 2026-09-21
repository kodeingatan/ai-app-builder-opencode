/*
  Warnings:

  - You are about to drop the `ai_app_schemas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_component_specs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_data_models` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_deployments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_generations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_pages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_prompts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_app_schemas";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_component_specs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_data_models";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_deployments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_generations";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_pages";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_projects";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_prompts";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "global_tables" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "global_columns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tableId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "optionsJson" TEXT,
    "defaultValue" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isOrderable" BOOLEAN NOT NULL DEFAULT false,
    "isSearchable" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "global_columns_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "global_tables" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "persuratan_components" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isLooping" BOOLEAN NOT NULL DEFAULT false,
    "contentHtml" TEXT NOT NULL,
    "contentJson" TEXT,
    "bindingsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "persuratan_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contentHtml" TEXT NOT NULL,
    "contentJson" TEXT,
    "componentsJson" TEXT,
    "pageConfigJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "persuratan_administrations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fieldsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "persuratan_steps" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "administrationId" INTEGER NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "dataMappingJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "persuratan_steps_administrationId_fkey" FOREIGN KEY ("administrationId") REFERENCES "persuratan_administrations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "persuratan_steps_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "persuratan_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "persuratan_datas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "administrationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "valuesJson" TEXT,
    "stepsDataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "persuratan_datas_administrationId_fkey" FOREIGN KEY ("administrationId") REFERENCES "persuratan_administrations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "global_tables_name_key" ON "global_tables"("name");

-- CreateIndex
CREATE INDEX "global_columns_tableId_orderIndex_idx" ON "global_columns"("tableId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "global_columns_tableId_name_key" ON "global_columns"("tableId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "persuratan_components_name_key" ON "persuratan_components"("name");

-- CreateIndex
CREATE UNIQUE INDEX "persuratan_templates_name_key" ON "persuratan_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "persuratan_administrations_name_key" ON "persuratan_administrations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "persuratan_steps_administrationId_stepOrder_key" ON "persuratan_steps"("administrationId", "stepOrder");

-- CreateIndex
CREATE INDEX "persuratan_datas_administrationId_idx" ON "persuratan_datas"("administrationId");
