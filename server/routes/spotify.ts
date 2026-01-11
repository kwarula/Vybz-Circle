import { Router } from "express";
import { type Request, type Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { verifyAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Zod schema for the auth callback
const authCallbackSchema = z.object({
    code: z.string(),
    redirectUri: z.string(),
    userId: z.string(),
});

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

interface SpotifyTopItemsResponse {
    items: {
        name: string;
        genres?: string[];
        type: string;
        id: string
    }[];
}

router.post("/connect", verifyAuth, async (req: AuthenticatedRequest, reqRes: Response) => {
    try {
        const { code, redirectUri, userId } = authCallbackSchema.parse(req.body);

        // Verify that the user is actually connecting the account to themselves
        if (req.user?.id !== userId && req.user?.role !== 'admin') {
            return reqRes.status(403).json({ error: "Forbidden", message: "You can only connect Spotify to your own account" });
        }

        const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return reqRes.status(500).json({ error: "Missing Spotify credentials on server" });
        }

        // 1. Exchange Access Code for Tokens
        const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            throw new Error(`Spotify token exchange failed: ${errorData}`);
        }

        const tokens: SpotifyTokenResponse = await tokenResponse.json();

        // 2. Fetch User Profile (to confirm it works and maybe store ID)
        const profileResponse = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!profileResponse.ok) throw new Error("Failed to fetch Spotify profile");

        // 3. Fetch Top Artists (to get genres)
        const topArtistsResponse = await fetch("https://api.spotify.com/v1/me/top/artists?limit=20", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        let genres: string[] = [];
        let artists: string[] = [];

        if (topArtistsResponse.ok) {
            const topArtists: SpotifyTopItemsResponse = await topArtistsResponse.json();
            artists = topArtists.items.map(a => a.name);
            // aggregate genres
            const genreSet = new Set<string>();
            topArtists.items.forEach(artist => {
                artist.genres?.forEach(g => genreSet.add(g));
            });
            genres = Array.from(genreSet).slice(0, 50); // Limit to top 50 unique genres
        }

        // 4. Store in Database
        // calculate expiration date
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // Call storage update
        await storage.updateUserSpotifyData(userId, {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt,
            genres,
            artists
        });

        return reqRes.json({ success: true, genres, artists });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return reqRes.status(400).json({ error: error.errors });
        }
        console.error("Spotify connect error:", error);
        return reqRes.status(500).json({ error: "Internal Server Error" });
    }
});

// Get recommendations based on Spotify data
router.get("/recommendations", verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }

        // Security check: Only allow users to see their own recommendations
        if (req.user?.id !== userId && req.user?.role !== 'admin') {
            console.log(`[DEBUG] Auth mismatch on recommendations: ${req.user?.id} vs ${userId}`);
            return res.status(403).json({ error: "Forbidden", message: "You can only view your own recommendations" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
            console.log(`[DEBUG] User not found for recommendations: ${userId}`);
            return res.status(404).json({ error: "User not found" });
        }

        // If user hasn't connected Spotify, return general popular events or empty list
        const spotifyGenres = (user.spotify_genres as any as string[]) || [];
        const spotifyArtists = (user.spotify_artists as any as string[]) || [];

        const allEvents = await storage.getEvents();

        if (spotifyGenres.length === 0 && spotifyArtists.length === 0) {
            return res.json(allEvents.slice(0, 10)); // Just return some events
        }

        // Simple matching logic: find events whose category or title matches user's top genres/artists
        const recommendations = allEvents.filter(event => {
            const eventTokens = (event.title + " " + (event.category || "") + " " + (event.description || "")).toLowerCase();

            // Check genres
            const hasMatchingGenre = spotifyGenres.some((genre: string) =>
                eventTokens.includes(genre.toLowerCase())
            );

            // Check artists
            const hasMatchingArtist = spotifyArtists.some((artist: string) =>
                eventTokens.includes(artist.toLowerCase())
            );

            return hasMatchingGenre || hasMatchingArtist;
        });

        // If no specifically matched events, return some events anyway
        if (recommendations.length < 5) {
            const extra = allEvents
                .filter(e => !recommendations.find(r => r.id === e.id))
                .slice(0, Math.max(0, 10 - recommendations.length));
            return res.json([...recommendations, ...extra]);
        }

        return res.json(recommendations);
    } catch (error) {
        console.error("Spotify recommendations error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
