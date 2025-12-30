// Mongoose schema for articles
const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true }, // current content (original or updated)
        originalContent: { type: String, required: true }, // immutable original baseline
        sourceUrl: { type: String, required: true },
        publishedDate: { type: Date },
        type: {
            type: String,
            enum: ["original", "updated"],
            default: "original",
        },
        references: { type: [String], default: [] },
    },
    {
        timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    }
);

// Indexes for faster querying
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ type: 1 });
ArticleSchema.index({ title: "text" });

module.exports = mongoose.model("Article", ArticleSchema);