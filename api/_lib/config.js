const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_LANGUAGE = process.env.TMDB_LANGUAGE || "es-MX";
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/w500";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_MARKET = process.env.SPOTIFY_MARKET || "US";
const SPOTIFY_DEFAULT_QUERY = process.env.SPOTIFY_DEFAULT_QUERY || "genre:pop";
const DEFAULT_SPOTIFY_GENRE_QUERIES = [
    "genre:pop",
    "genre:rock",
    "genre:hip-hop",
    "genre:r&b",
    "genre:latin",
    "genre:jazz",
    "genre:electronic",
    "genre:country",
    "genre:blues",
    "genre:classical"
];
const SPOTIFY_GENRE_QUERIES = parseList(process.env.SPOTIFY_GENRE_QUERIES, DEFAULT_SPOTIFY_GENRE_QUERIES);

function assertConfig() {
    if (!TMDB_API_KEY) {
        throw new Error("Falta configurar la variable de entorno TMDB_API_KEY.");
    }
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        throw new Error("Falta configurar SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET.");
    }
}

module.exports = {
    assertConfig,
    tmdb: {
        apiKey: TMDB_API_KEY,
        baseUrl: TMDB_BASE_URL,
        language: TMDB_LANGUAGE,
        imageBase: TMDB_IMAGE_BASE,
        pageSize: 20
    },
    spotify: {
        clientId: SPOTIFY_CLIENT_ID,
        clientSecret: SPOTIFY_CLIENT_SECRET,
        market: SPOTIFY_MARKET,
        defaultQuery: SPOTIFY_DEFAULT_QUERY,
        maxLimit: 50,
        genreQueries: SPOTIFY_GENRE_QUERIES
    }
};

function parseList(value, fallback) {
    if (!value) {
        return fallback.slice();
    }
    const items = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    if (!items.length) {
        return fallback.slice();
    }
    return Array.from(new Set(items));
}

