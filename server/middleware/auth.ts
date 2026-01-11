import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email?: string;
        role?: string;
    };
}

export async function verifyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized", message: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: "Unauthorized", message: error?.message || "Invalid token" });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.app_metadata?.role || 'user'
        };
        next();
    } catch (error) {
        console.error("Auth verification error:", error);
        res.status(401).json({ error: "Unauthorized", message: "Failed to verify session" });
    }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== 'admin') {
        // For now, if no role is set, we might want to check against a list of admin IDs or env var
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        if (req.user?.email && adminEmails.includes(req.user.email)) {
            return next();
        }

        return res.status(403).json({ error: "Forbidden", message: "Admin privileges required" });
    }
    next();
}
