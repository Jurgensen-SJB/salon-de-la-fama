const { assertConfig } = require("../_lib/config");
const { fetchTopArtists } = require("../_lib/spotify");
const { sendSuccess, sendServerError, sendMethodNotAllowed, sendBadRequest } = require("../_lib/response");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        sendMethodNotAllowed(res);
        return;
    }

    try {
        assertConfig();
        const { limit, country, query } = req.query || {};
        const parsedLimit = limit != null ? Number(limit) : undefined;

        if (parsedLimit != null && Number.isNaN(parsedLimit)) {
            sendBadRequest(res, "El parámetro 'limit' debe ser numérico.");
            return;
        }

        const items = await fetchTopArtists({
            limit: parsedLimit,
            country,
            query
        });

        sendSuccess(res, { items });
    } catch (error) {
        sendServerError(res, error);
    }
};

