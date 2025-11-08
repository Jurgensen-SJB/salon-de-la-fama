import { API_ROUTES, SPOTIFY_DEFAULTS } from "../config/appConfig.js";

export async function fetchTopArtists({ limit = 6, country = SPOTIFY_DEFAULTS.market, query = SPOTIFY_DEFAULTS.defaultQuery }) {
    const params = buildQuery({ limit, country, query });
    const data = await requestJson(`${API_ROUTES.artistsTop}${params}`);
    return data.items || [];
}

export async function fetchArtistsPaginated({ page = 1, pageSize = 60, country = SPOTIFY_DEFAULTS.market, query = SPOTIFY_DEFAULTS.defaultQuery }) {
    const params = buildQuery({ page, pageSize, country, query });
    const data = await requestJson(`${API_ROUTES.artistsPaginated}${params}`);
    return {
        items: data.items || [],
        totalResults: typeof data.totalResults === "number" ? data.totalResults : 0
    };
}

function buildQuery(values) {
    const search = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }
        search.set(key, String(value));
    });
    const queryString = search.toString();
    return queryString ? `?${queryString}` : "";
}

async function requestJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        let message = "No fue posible obtener los datos solicitados.";
        try {
            const payload = await response.json();
            if (payload && typeof payload.error === "string") {
                message = payload.error;
            }
        } catch (error) {
            // Ignorar errores de parseo y usar el mensaje predeterminado.
        }
        throw new Error(message);
    }
    return response.json();
}

