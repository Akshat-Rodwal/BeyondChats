// RESTful CRUD APIs for Article resource
const express = require('express');
const mongoose = require('mongoose');
const Article = require('../models/Article');

const router = express.Router();

// Create
router.post('/', async (req, res, next) => {
  try {
    const doc = await Article.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// Read all with optional filters: type, search, page, limit
router.get('/', async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        items: [],
        page: Number(page),
        limit: Number(limit),
        total: 0,
        pages: 0,
      });
    }
    const query = {};
    if (type) query.type = type;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Article.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Article.countDocuments(query),
    ]);
    res.json({
      items,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
});

// Read one
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Article.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Article not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Update
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Article not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Article.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
