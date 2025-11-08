import { PLACEHOLDERS } from "../config/appConfig.js";
import { formatNumber } from "../utils/helpers.js";
import { renderEmpty } from "./feedbackView.js";

export function renderArtists(container, artists, startRank = 0) {
    if (!artists.length) {
        renderEmpty(container, "No se encontraron artistas destacados.");
        return;
    }
    container.innerHTML = "";
    const size = container.dataset.size === "large" ? "col-sm-6 col-lg-3" : "col-sm-6 col-lg-4";
    artists.forEach((artist, index) => {
        const col = document.createElement("div");
        col.className = `${size} mb-4`;
        col.innerHTML = createArtistCard(artist, startRank + index + 1);
        container.appendChild(col);
    });
}

function createArtistCard(artist, position) {
    const image = artist.images && artist.images.length ? artist.images[0].url : PLACEHOLDERS.artist;
    const name = artist.name || "Artista sin nombre";
    const followers = artist.followers && artist.followers.total ? formatNumber(artist.followers.total) : "0";
    const popularity = artist.popularity || 0;
    const genres = artist.genres && artist.genres.length ? artist.genres.slice(0, 3).join(", ") : "Género no disponible";
    const url = artist.external_urls && artist.external_urls.spotify ? artist.external_urls.spotify : "https://www.spotify.com";

    return `
        <div class="card h-100 border-0 shadow-sm position-relative">
            <div class="badge badge-success badge-rank">#${position}</div>
            <img class="card-img-top" src="${image}" alt="${name}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title mb-2">${name}</h5>
                <p class="small text-muted mb-2">Popularidad ${popularity} · Seguidores ${followers}</p>
                <p class="card-text flex-grow-1">${genres}</p>
            </div>
            <div class="card-footer bg-transparent border-0 pt-0 pb-4">
                <a class="btn btn-sm btn-outline-success" href="${url}" target="_blank" rel="noopener">Escuchar en Spotify</a>
            </div>
        </div>
    `;
}

