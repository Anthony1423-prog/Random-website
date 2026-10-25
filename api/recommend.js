const API_KEY = "b1952f93d7ec21858869053dadb38d5c";

const MOOD_TAGS = {
    happy: "happy",
    sad: "sad",
    energetic: "energetic",
    chill: "chill",
    romantic: "romantic",
    focused: "study"
};

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Use a GET request."
        });
    }

    const mood = String(req.query.mood || "").toLowerCase();
    const tag = MOOD_TAGS[mood];

    if (!tag) {
        return res.status(400).json({
            error: "Unknown mood."
        });
    }

    const url = new URL("https://ws.audioscrobbler.com/2.0/");

    url.searchParams.set("method", "tag.getTopTracks");
    url.searchParams.set("tag", tag);
    url.searchParams.set("api_key", API_KEY);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "50");

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.error) {
            return res.status(502).json({
                error:
                    data.message ||
                    "Last.fm could not find tracks for that mood."
            });
        }

        const results = data.tracks?.track || [];
        const lastFmTracks = Array.isArray(results) ? results : [results];

        const tracks = lastFmTracks
            .map((track) => {
                const images = track.image || [];

                const cover =
                    images.find((image) => image.size === "large")?.["#text"] ||
                    images.find((image) => image.size === "medium")?.["#text"] ||
                    "";

                return {
                    title: track.name,
                    artist: track.artist?.name || "Unknown artist",
                    cover,
                    url: track.url || ""
                };
            })
            .filter((track) => track.title && track.artist);

        return res.status(200).json({ tracks });
    } catch (error) {
        return res.status(500).json({
            error: "Could not reach Last.fm."
        });
    }
};
