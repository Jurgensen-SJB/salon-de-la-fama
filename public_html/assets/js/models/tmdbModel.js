import { API_ROUTES } from "../config/appConfig.js";

export async function fetchTopMovies({ limit = 6, pages = 1 }) {
    const params = buildQuery({ limit, pages });
    const data = await requestJson(`${API_ROUTES.moviesTop}${params}`);
    return data.items || [];
}

export async function fetchMoviesPaginated({ page = 1, pageSize = 60 }) {
    const params = buildQuery({ page, pageSize });
    const data = await requestJson(`${API_ROUTES.moviesPaginated}${params}`);
    return {
        items: data.items || [],
        totalResults: typeof data.totalResults === "number" ? data.totalResults : 0
    };
}

function buildQuery(values) {
    const search = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null) {
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

