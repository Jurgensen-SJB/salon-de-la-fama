const fetch = global.fetch;
const { spotify } = require("./config");

const state = {
    token: null,
    expiresAt: 0
};

const sliceCache = new Map();
const metaCache = new Map();

async function fetchTopArtists({ limit = 6, country = spotify.market, query = spotify.defaultQuery }) {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : spotify.maxLimit;
    const collected = [];
    let offset = 0;

    while (collected.length < safeLimit) {
        const batchSize = Math.min(spotify.maxLimit, safeLimit - collected.length);
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

    const uniqueArtists = deduplicateById(collected);
    uniqueArtists.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return uniqueArtists.slice(0, safeLimit);
}

async function fetchArtistsPaginated({ page = 1, pageSize = 60, country = spotify.market, query = spotify.defaultQuery }) {
    const safePage = Math.max(1, page);
    const safeSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 60;
    const startIndex = (safePage - 1) * safeSize;
    const metaKey = `${country}|${query}`;
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

    while (collected.length < safeSize) {
        const batchLimit = Math.min(spotify.maxLimit, safeSize - collected.length);
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

    return {
        items: collected.slice(0, safeSize),
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

module.exports = {
    fetchTopArtists,
    fetchArtistsPaginated
};

