const express = require("express");
const router = express.Router();

const {
  authenticateUser,
  authorizePermission,
} = require("../middleware/authentication");
const {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
} = require("../controllers/order");

router.get("/", authenticateUser, authorizePermission("admin"), getAllOrders);
router.post("/", authenticateUser, createOrder);

router.get("/showAllMyOrders", authenticateUser, getCurrentUserOrders);

router.get("/:id", authenticateUser, getSingleOrder);
router.patch("/:id", authenticateUser, updateOrder);

module.exports = router;
