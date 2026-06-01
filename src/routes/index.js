import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes.js";
import courseRoutes from "../modules/courses/routes/courses.routes.js";
import enrollmentRoutes from "../modules/enrollments/routes/enrollments.routes.js";
import permissionRoutes from "../modules/permissions/routes/permission.routes.js";
import roleRoutes from "../modules/roles/routes/role.routes.js";
import userRoutes from "../modules/users/routes/user.routes.js";

const router = Router();

router.get("/", (req, res) => {
    res.send("RD-LMS API is running.");
});

router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/enrollments", enrollmentRoutes);

export default router;
