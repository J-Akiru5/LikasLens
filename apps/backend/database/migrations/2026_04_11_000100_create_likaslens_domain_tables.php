<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reporter_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('open');
            $table->string('title');
            $table->text('description');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('address_text')->nullable();
            $table->unsignedTinyInteger('urgency_score')->nullable();
            $table->text('ai_triage_summary')->nullable();
            $table->decimal('ai_confidence', 5, 4)->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['reporter_user_id', 'status']);
            $table->index('created_at');
            $table->index(['latitude', 'longitude']);
        });

        Schema::create('ticket_evidence', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignUuid('uploaded_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('storage_provider');
            $table->string('storage_bucket');
            $table->string('storage_path');
            $table->string('checksum_sha256', 64)->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('exif_removed_at')->nullable();
            $table->string('yolo_status')->default('pending');
            $table->text('yolo_summary')->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'created_at']);
        });

        Schema::create('environmental_laws_ph', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('law_code')->unique();
            $table->string('title');
            $table->text('summary')->nullable();
            $table->string('issuing_agency')->nullable();
            $table->string('jurisdiction_scope')->default('national');
            $table->string('source_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
        });

        Schema::create('law_penalties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('law_id')->constrained('environmental_laws_ph')->cascadeOnDelete();
            $table->string('violation_name');
            $table->string('penalty_type');
            $table->unsignedInteger('min_fine_php')->nullable();
            $table->unsignedInteger('max_fine_php')->nullable();
            $table->unsignedInteger('min_imprisonment_days')->nullable();
            $table->unsignedInteger('max_imprisonment_days')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('law_id');
        });

        Schema::create('violation_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignUuid('law_id')->nullable()->constrained('environmental_laws_ph')->nullOnDelete();
            $table->foreignUuid('default_penalty_id')->nullable()->constrained('law_penalties')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('ticket_classifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignUuid('violation_type_id')->constrained('violation_types')->restrictOnDelete();
            $table->string('classified_by');
            $table->decimal('confidence_score', 5, 4)->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'created_at']);
        });

        Schema::create('ngo_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('region')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('ticket_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignUuid('assigned_group_id')->constrained('ngo_groups')->restrictOnDelete();
            $table->foreignUuid('assigned_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('status')->default('assigned');
            $table->text('assignment_reason')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'status']);
            $table->index('assigned_group_id');
        });

        Schema::create('partner_stores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('rewards_catalog', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partner_store_id')->constrained('partner_stores')->cascadeOnDelete();
            $table->string('reward_name');
            $table->string('reward_type');
            $table->unsignedInteger('points_cost');
            $table->unsignedInteger('stock_quantity')->default(0);
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['partner_store_id', 'is_active']);
        });

        Schema::create('reward_redemptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('reward_id')->constrained('rewards_catalog')->restrictOnDelete();
            $table->unsignedInteger('points_spent');
            $table->string('redemption_status')->default('pending');
            $table->string('redemption_code')->unique();
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'redemption_status']);
            $table->index('created_at');
        });

        Schema::create('reward_point_ledger', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('reference_type');
            $table->uuid('reference_id')->nullable();
            $table->string('direction');
            $table->unsignedInteger('points');
            $table->integer('balance_after');
            $table->timestamp('expires_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('expires_at');
        });

        Schema::create('gemini_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('context_type')->default('general');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'created_at']);
        });

        Schema::create('gemini_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('gemini_conversations')->cascadeOnDelete();
            $table->string('sender_role');
            $table->longText('message_text');
            $table->unsignedInteger('token_count_input')->nullable();
            $table->unsignedInteger('token_count_output')->nullable();
            $table->string('model_name')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['conversation_id', 'created_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('entity_type');
            $table->uuid('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('request_id')->nullable();
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index('actor_user_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('gemini_messages');
        Schema::dropIfExists('gemini_conversations');
        Schema::dropIfExists('reward_point_ledger');
        Schema::dropIfExists('reward_redemptions');
        Schema::dropIfExists('rewards_catalog');
        Schema::dropIfExists('partner_stores');
        Schema::dropIfExists('ticket_assignments');
        Schema::dropIfExists('ngo_groups');
        Schema::dropIfExists('ticket_classifications');
        Schema::dropIfExists('violation_types');
        Schema::dropIfExists('law_penalties');
        Schema::dropIfExists('environmental_laws_ph');
        Schema::dropIfExists('ticket_evidence');
        Schema::dropIfExists('tickets');
    }
};
