const fetch = global.fetch;
const { tmdb } = require("./config");

const meta = {
    totalResults: null,
    totalPages: null
};

const pageCache = new Map();

async function fetchTopMovies({ limit = 6, pages = 1 }) {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 0;
    const safePages = Number.isFinite(pages) && pages > 0 ? pages : 1;
    const aggregated = [];

    for (let page = 1; page <= safePages; page += 1) {
        const data = await fetchTmdbPage(page);
        aggregated.push(...(data.results || []));
        if (safeLimit && aggregated.length >= safeLimit) {
            break;
        }
        if (meta.totalPages && page >= meta.totalPages) {
            break;
        }
    }

    const uniqueMovies = deduplicateById(aggregated);
    uniqueMovies.sort((a, b) => {
        if (b.vote_average === a.vote_average) {
            return (b.vote_count || 0) - (a.vote_count || 0);
        }
        return b.vote_average - a.vote_average;
    });

    return safeLimit ? uniqueMovies.slice(0, safeLimit) : uniqueMovies;
}

async function fetchMoviesPaginated({ page = 1, pageSize = 60 }) {
    const safePage = Math.max(1, page);
    const safeSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 60;
    const startIndex = (safePage - 1) * safeSize;
    const endIndex = startIndex + safeSize;
    const startApiPage = Math.floor(startIndex / tmdb.pageSize) + 1;
    const endApiPage = Math.ceil(endIndex / tmdb.pageSize);

    if (meta.totalPages && startApiPage > meta.totalPages) {
        return {
            items: [],
            totalResults: meta.totalResults || 0
        };
    }

    const aggregated = [];
    for (let apiPage = startApiPage; apiPage <= endApiPage; apiPage += 1) {
        if (meta.totalPages && apiPage > meta.totalPages) {
            break;
        }
        const data = await fetchTmdbPage(apiPage);
        aggregated.push(...(data.results || []));
        if (data.total_pages && apiPage >= data.total_pages) {
            break;
        }
    }

    const offsetWithin = startIndex - (startApiPage - 1) * tmdb.pageSize;
    const items = aggregated.slice(offsetWithin, offsetWithin + safeSize);
    const totalResults = meta.totalResults != null ? meta.totalResults : items.length + startIndex;

    return { items, totalResults };
}

async function fetchTmdbPage(page) {
    if (meta.totalPages && page > meta.totalPages) {
        return {
            results: [],
            total_results: meta.totalResults || 0,
            total_pages: meta.totalPages
        };
    }

    if (pageCache.has(page)) {
        return pageCache.get(page);
    }

    const url = new URL(`${tmdb.baseUrl}/movie/top_rated`);
    url.search = new URLSearchParams({
        api_key: tmdb.apiKey,
        language: tmdb.language,
        page: String(page)
    });
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error("No fue posible obtener los datos de TMDb");
    }
    const data = await response.json();
    pageCache.set(page, data);
    if (typeof data.total_results === "number") {
        meta.totalResults = data.total_results;
    }
    if (typeof data.total_pages === "number") {
        meta.totalPages = data.total_pages;
    }
    return data;
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
    fetchTopMovies,
    fetchMoviesPaginated
};

