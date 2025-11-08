import { TMDB_IMAGE_BASE, PLACEHOLDERS } from "../config/appConfig.js";
import { truncate, formatNumber } from "../utils/helpers.js";
import { renderEmpty } from "./feedbackView.js";

export function renderMovies(container, movies, startRank = 0) {
    if (!movies.length) {
        renderEmpty(container, "No se encontraron películas destacadas.");
        return;
    }
    container.innerHTML = "";
    const size = container.dataset.size === "large" ? "col-sm-6 col-lg-3" : "col-sm-6 col-lg-4";
    movies.forEach((movie, index) => {
        const col = document.createElement("div");
        col.className = `${size} mb-4`;
        col.innerHTML = createMovieCard(movie, startRank + index + 1);
        container.appendChild(col);
    });
}

function createMovieCard(movie, position) {
    const poster = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : PLACEHOLDERS.movie;
    const title = movie.title || movie.name || "Título no disponible";
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "—";
    const overview = truncate(movie.overview || "Sinopsis no disponible.", 140);
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const votes = movie.vote_count ? formatNumber(movie.vote_count) : "0";
    const url = `https://www.themoviedb.org/movie/${movie.id}`;

    return `
        <div class="card h-100 border-0 shadow-sm position-relative">
            <div class="badge badge-primary badge-rank">#${position}</div>
            <img class="card-img-top" src="${poster}" alt="${title}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title mb-2">${title}</h5>
                <p class="small text-muted mb-2">${year} · Puntuación ${rating} (${votes} votos)</p>
                <p class="card-text flex-grow-1">${overview}</p>
            </div>
            <div class="card-footer bg-transparent border-0 pt-0 pb-4">
                <a class="btn btn-sm btn-outline-primary" href="${url}" target="_blank" rel="noopener">Ver en TMDb</a>
            </div>
        </div>
    `;
}

