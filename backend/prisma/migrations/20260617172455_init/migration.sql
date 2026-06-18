-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "region" TEXT,
    "district" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farmer" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "leader_full_name" TEXT,
    "legal_address" TEXT,
    "stir" TEXT,
    "region" TEXT,
    "district" TEXT,
    "land_area" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "app_number" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "farmer_id" INTEGER,
    "subject_name" TEXT,
    "leader_full_name" TEXT,
    "legal_address" TEXT,
    "stir" TEXT,
    "mfo" TEXT,
    "bank_account" TEXT,
    "bank_name" TEXT,
    "total_land_area" DOUBLE PRECISION,
    "land_specialization" TEXT,
    "garden_area" DOUBLE PRECISION,
    "land_contour" TEXT,
    "garden_address" TEXT,
    "location_url" TEXT,
    "qr_code" TEXT,
    "land_decision_number" TEXT,
    "land_decision_date" TEXT,
    "lease_contract_number" TEXT,
    "lease_contract_date" TEXT,
    "registry_number" TEXT,
    "soil_type" TEXT,
    "soil_composition" TEXT,
    "soil_quality" TEXT,
    "soil_fertility" TEXT,
    "water_supply_info" TEXT,
    "weather_analysis" TEXT,
    "scientific_recommendation" TEXT,
    "fruit_type" TEXT,
    "fruit_variety" TEXT,
    "planting_scheme" TEXT,
    "seedling_count" INTEGER,
    "planting_period" TEXT,
    "water_source" TEXT,
    "project_amount" DOUBLE PRECISION,
    "permanent_jobs" INTEGER,
    "seasonal_jobs" INTEGER,
    "supplier_companies" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "admin_comment" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "sent_to_signer_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "word_content" TEXT,
    "word_html_content" TEXT,
    "generated_word_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationFile" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT NOT NULL,
    "comment" TEXT,
    "changed_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Application_app_number_key" ON "Application"("app_number");

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "Farmer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFile" ADD CONSTRAINT "ApplicationFile_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
