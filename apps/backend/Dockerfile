# ─────────────────────────────────────────────────────────────────────────────
# LikasLens Backend — Multi-stage build (2026 best practice)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Dependencies ────────────────────────────────────────────
FROM php:8.5-cli AS vendor

RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        unzip \
        git \
        curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql pdo_mysql zip bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# ── Stage 2: Build artifacts ─────────────────────────────────────────
FROM php:8.5-cli AS build

RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        unzip \
        git \
        curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql pdo_mysql zip bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy vendor from previous stage
COPY --from=vendor /app/vendor ./vendor

COPY . .

RUN mkdir -p bootstrap/cache \
    && chmod -R 775 bootstrap/cache storage \
    && composer run-script post-autoload-dump \
    && php artisan optimize || true

# ── Stage 3: Production runtime (slim) ───────────────────────────────
FROM php:8.5-cli AS production

RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql pdo_mysql zip bcmath gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /usr/share/doc/* /usr/share/man/* /tmp/* /var/tmp/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app

# Copy only what's needed for production
COPY --from=build /app /app
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh \
    && sed -i 's/\r$//' /app/start.sh \
    && chown -R appuser:appuser /app/storage /app/bootstrap/cache /app/public

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || curl -f http://localhost:8000/api/health || exit 1

CMD ["/app/start.sh"]
