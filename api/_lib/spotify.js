const fetch = global.fetch;
const { spotify } = require("./config");

const state = {
    token: null,
    expiresAt: 0
};

const sliceCache = new Map();
const metaCache = new Map();

async function fetchTopArtists({ limit = 6, country = spotify.market, query }) {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : spotify.maxLimit;
    const { queries, aggregate } = resolveQueries(query);

    if (!aggregate) {
        const items = await collectArtistsForQuery({
            country,
            query: queries[0],
            limit: safeLimit
        });
        const ranked = rankArtists(items);
        return ranked.slice(0, safeLimit);
    }

    const aggregated = await collectAcrossQueries({
        queries,
        country,
        required: safeLimit,
        bufferFactor: 2
    });
    const ranked = rankArtists(aggregated);
    return ranked.slice(0, safeLimit);
}

async function fetchArtistsPaginated({ page = 1, pageSize = 60, country = spotify.market, query }) {
    const safePage = Math.max(1, page);
    const safeSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 60;
    const startIndex = (safePage - 1) * safeSize;
    const { queries, aggregate } = resolveQueries(query);

    if (!aggregate) {
        return fetchArtistsPaginatedSingleQuery({
            page: safePage,
            pageSize: safeSize,
            country,
            query: queries[0],
            startIndex
        });
    }

    const required = startIndex + safeSize;
    const aggregated = await collectAcrossQueries({
        queries,
        country,
        required,
        bufferFactor: 2
    });
    const ranked = rankArtists(aggregated);
    const items = ranked.slice(startIndex, startIndex + safeSize);
    const totalResults = ranked.length;

    return {
        items,
        totalResults
    };
}

async function fetchSpotifySlice({ country, query, offset, limit }) {
    const metaKey = `${country}|${query}`;
    const cacheKey = `${metaKey}|${offset}|${limit}`;
    if (sliceCache.has(cacheKey)) {
        return sliceCache.get(cacheKey);
    }

    const token = await getSpotifyToken();
    const url = new URL("https://api.spotify.com/v1/search");
    url.search = new URLSearchParams({
        q: query,
        type: "artist",
        market: country,
        limit: String(limit),
        offset: String(offset)
    });
    const response = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error("No fue posible obtener los datos de Spotify");
    }
    const data = await response.json();
    const items = (data.artists && data.artists.items) || [];
    const total = (data.artists && data.artists.total) || 0;
    const slice = { items, total };
    sliceCache.set(cacheKey, slice);
    metaCache.set(metaKey, { total });
    return slice;
}

async function getSpotifyToken() {
    const now = Date.now();
    if (state.token && state.expiresAt > now) {
        return state.token;
    }

    const credentials = Buffer.from(`${spotify.clientId}:${spotify.clientSecret}`).toString("base64");
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`
        },
        body: "grant_type=client_credentials"
    });

    if (!response.ok) {
        throw new Error("No fue posible autenticar con Spotify");
    }

    const data = await response.json();
    state.token = data.access_token;
    state.expiresAt = now + (data.expires_in - 60) * 1000;
    return state.token;
}

function deduplicateById(items) {
    const registry = new Map();
    items.forEach((item) => {
        if (item && item.id != null && !registry.has(item.id)) {
            registry.set(item.id, item);
        }
    });
    return Array.from(registry.values());
}

function rankArtists(items) {
    const unique = deduplicateById(items);
    unique.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    return unique;
}

function resolveQueries(rawQuery) {
    if (Array.isArray(rawQuery)) {
        const prepared = rawQuery.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
        if (prepared.length) {
            return {
                queries: prepared,
                aggregate: prepared.length > 1
            };
        }
        return resolveQueries(undefined);
    }

    if (typeof rawQuery === "string") {
        const trimmed = rawQuery.trim();
        if (!trimmed || trimmed.toLowerCase() === "all") {
            const queries = getConfiguredGenreQueries();
            return {
                queries,
                aggregate: queries.length > 1
            };
        }
        return {
            queries: [trimmed],
            aggregate: false
        };
    }

    const queries = getConfiguredGenreQueries();
    return {
        queries,
        aggregate: queries.length > 1
    };
}

function getConfiguredGenreQueries() {
    if (Array.isArray(spotify.genreQueries) && spotify.genreQueries.length) {
        return spotify.genreQueries;
    }
    const fallback = getFallbackQuery();
    return fallback ? [fallback] : ["genre:pop"];
}

function getFallbackQuery() {
    if (typeof spotify.defaultQuery === "string") {
        const trimmed = spotify.defaultQuery.trim();
        if (trimmed && trimmed.toLowerCase() !== "all") {
            return trimmed;
        }
    }
    if (Array.isArray(spotify.genreQueries) && spotify.genreQueries.length) {
        return spotify.genreQueries[0];
    }
    return "genre:pop";
}

async function collectAcrossQueries({ queries, country, required, bufferFactor = 2 }) {
    const registry = new Map();
    const target = Math.max(required, spotify.maxLimit);
    const perQueryTarget = clampLimit(Math.ceil(required * bufferFactor));

    for (const currentQuery of queries) {
        const items = await collectArtistsForQuery({
            country,
            query: currentQuery,
            limit: perQueryTarget
        });
        items.forEach((item) => {
            if (item && item.id != null && !registry.has(item.id)) {
                registry.set(item.id, item);
            }
        });
        if (registry.size >= target) {
            break;
        }
    }

    return Array.from(registry.values());
}

async function collectArtistsForQuery({ country, query, limit }) {
    const collected = [];
    const safeTarget = clampLimit(limit);
    let offset = 0;

    while (collected.length < safeTarget) {
        const batchSize = Math.min(spotify.maxLimit, safeTarget - collected.length);
        const slice = await fetchSpotifySlice({ country, query, offset, limit: batchSize });
        const items = slice.items || [];
        if (!items.length) {
            break;
        }
        collected.push(...items);
        offset += items.length;
        if (items.length < batchSize) {
            break;
        }
    }

    return collected;
}

function clampLimit(limit) {
    const MIN_BATCH = spotify.maxLimit;
    const MAX_BATCH = spotify.maxLimit * 10;
    const safe = Math.max(Number.isFinite(limit) && limit > 0 ? limit : MIN_BATCH, MIN_BATCH);
    return Math.min(safe, MAX_BATCH);
}

async function fetchArtistsPaginatedSingleQuery({ page, pageSize, country, query, startIndex }) {
    const metaKey = `${country}|${query || ""}`;
    const meta = metaCache.get(metaKey);

    if (meta && typeof meta.total === "number" && startIndex >= meta.total) {
        return {
            items: [],
            totalResults: meta.total
        };
    }

    const collected = [];
    let totalResults = meta ? meta.total : null;
    let offset = startIndex;

    while (collected.length < pageSize) {
        const batchLimit = Math.min(spotify.maxLimit, pageSize - collected.length);
        const slice = await fetchSpotifySlice({ country, query, offset, limit: batchLimit });
        const items = slice.items || [];
        if (typeof slice.total === "number") {
            totalResults = slice.total;
        }
        if (!items.length) {
            break;
        }
        collected.push(...items);
        offset += items.length;
        if (items.length < batchLimit) {
            break;
        }
        if (totalResults != null && offset >= totalResults) {
            break;
        }
    }

    if (totalResults == null) {
        totalResults = collected.length + startIndex;
    }

    const unique = deduplicateById(collected);
    metaCache.set(metaKey, { total: totalResults });

    return {
        items: unique.slice(0, pageSize),
        totalResults
    };
}

module.exports = {
    fetchTopArtists,
    fetchArtistsPaginated
};

