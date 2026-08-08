// src/routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../config/database"); // Destructure to get pool  // This gets the promise pool

// GET: Get all categories with place counts
router.get("/", async (req, res) => {
  try {
    const sql = `
            SELECT 
                c.category_id,
                c.name,
                c.description,
                c.icon,
                COUNT(p.place_id) as place_count
            FROM categories c
            LEFT JOIN places p ON c.category_id = p.category_id
            GROUP BY c.category_id
            ORDER BY c.name ASC
        `;

    const [rows] = await pool.query(sql); // pool.query works now

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET: Get single category with its places
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get category details
    const categorySql = `
            SELECT 
                c.category_id,
                c.name,
                c.description,
                c.icon,
                COUNT(p.place_id) as place_count
            FROM categories c
            LEFT JOIN places p ON c.category_id = p.category_id
            WHERE c.category_id = ?
            GROUP BY c.category_id
        `;

    const [category] = await pool.query(categorySql, [id]);

    if (category.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get places in this category
    const placesSql = `
            SELECT 
                place_id,
                title,
                description,
                image_url,
                rating,
                entry_fee,
                avg_duration
            FROM places
            WHERE category_id = ?
            ORDER BY rating DESC
        `;

    const [places] = await pool.query(placesSql, [id]);

    res.json({
      success: true,
      data: {
        ...category[0],
        places: places,
      },
    });
  } catch (error) {
    console.error("Error fetching category details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
