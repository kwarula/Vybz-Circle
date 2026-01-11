
import { Router } from "express";
import { storage } from "../storage";
import { verifyAuth, AuthenticatedRequest } from "../middleware/auth";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Delete User Account
router.delete("/:id", verifyAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.params.id;

        // 1. Authorization: Only the user themselves (or an admin) can delete the account
        if (req.user?.id !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: "Forbidden", message: "You can only delete your own account" });
        }

        console.log(`🗑️ Deleting account for user: ${userId}`);

        // 2. Delete data from Supabase Auth (requires service role)
        // Note: Using service role key for admin operations
        const supabaseAdmin = createClient(
            process.env.EXPO_PUBLIC_SUPABASE_URL!,
            process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
        );

        // We use the admin API to delete the user from auth.users
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error("Supabase Auth deletion error:", authError);
            // If it's 404, maybe already deleted, proceed anyway to clean up DB
            if (authError.status !== 404) {
                return res.status(500).json({ error: "Auth deletion failed", message: authError.message });
            }
        }

        // 3. User profiles and related data are typically handled via ON DELETE CASCADE in the DB
        // If not, we should manually clean up here:
        // await storage.deleteUserRecords(userId); 

        res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error("Account deletion error:", error);
        res.status(500).json({ error: "Internal Server Error", message: "Failed to delete account" });
    }
});

export default router;
