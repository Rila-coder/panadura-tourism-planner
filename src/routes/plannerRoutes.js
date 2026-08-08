// src/routes/plannerRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");

// GET: Get all saved plans
router.get("/", async (req, res) => {
  try {
    const sql = `
            SELECT 
                plan_id,
                user_name,
                visit_date,
                total_places,
                total_distance,
                total_duration,
                total_budget,
                plan_details,
                created_at
            FROM user_plans
            ORDER BY created_at DESC
        `;

    const [rows] = await pool.query(sql);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// POST: Create a new plan
router.post("/", async (req, res) => {
  try {
    const {
      user_name,
      visit_date,
      place_ids,
      total_distance,
      total_duration,
      total_budget,
    } = req.body;

    // Validate required fields
    if (!user_name || !visit_date || !place_ids || place_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: user_name, visit_date, place_ids",
      });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert plan
      const planSql = `
                INSERT INTO user_plans (
                    user_name, 
                    visit_date, 
                    total_places,
                    total_distance,
                    total_duration,
                    total_budget
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

      const [planResult] = await connection.query(planSql, [
        user_name,
        visit_date,
        place_ids.length,
        total_distance || 0,
        total_duration || 0,
        total_budget || 0,
      ]);

      const planId = planResult.insertId;

      // Insert plan places
      for (let i = 0; i < place_ids.length; i++) {
        const placeSql = `
                    INSERT INTO plan_places (plan_id, place_id, stop_order)
                    VALUES (?, ?, ?)
                `;
        await connection.query(placeSql, [planId, place_ids[i], i + 1]);
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: "Plan created successfully",
        data: { plan_id: planId },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET: Get a single plan with details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get plan details
    const planSql = `
            SELECT 
                p.plan_id,
                p.user_name,
                p.visit_date,
                p.total_places,
                p.total_distance,
                p.total_duration,
                p.total_budget,
                p.created_at,
                pp.stop_order,
                pl.place_id,
                pl.title,
                pl.description,
                pl.latitude,
                pl.longitude,
                pl.address,
                pl.entry_fee,
                pl.est_food_cost,
                pl.avg_duration,
                pl.image_url,
                pl.rating,
                c.name as category_name
            FROM user_plans p
            JOIN plan_places pp ON p.plan_id = pp.plan_id
            JOIN places pl ON pp.place_id = pl.place_id
            LEFT JOIN categories c ON pl.category_id = c.category_id
            WHERE p.plan_id = ?
            ORDER BY pp.stop_order ASC
        `;

    const [rows] = await pool.query(planSql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Format response
    const plan = {
      plan_id: rows[0].plan_id,
      user_name: rows[0].user_name,
      visit_date: rows[0].visit_date,
      total_places: rows[0].total_places,
      total_distance: rows[0].total_distance,
      total_duration: rows[0].total_duration,
      total_budget: rows[0].total_budget,
      created_at: rows[0].created_at,
      places: rows.map((row) => ({
        stop_order: row.stop_order,
        place_id: row.place_id,
        title: row.title,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address,
        entry_fee: row.entry_fee,
        est_food_cost: row.est_food_cost,
        avg_duration: row.avg_duration,
        image_url: row.image_url,
        rating: row.rating,
        category_name: row.category_name,
      })),
    };

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error fetching plan details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plan details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// DELETE: Delete a plan
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if plan exists
    const [check] = await pool.query(
      "SELECT plan_id FROM user_plans WHERE plan_id = ?",
      [id],
    );

    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Delete plan (cascade will delete plan_places)
    await pool.query("DELETE FROM user_plans WHERE plan_id = ?", [id]);

    res.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
