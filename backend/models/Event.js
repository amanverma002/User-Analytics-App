const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true,
  },
  event_type: {
    type: String,
    required: true,
    enum: ['page_view', 'click'],
  },
  page_url: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  // Click-specific data
  click_x: {
    type: Number,
    default: null,
  },
  click_y: {
    type: Number,
    default: null,
  },
  // Viewport dimensions at time of click (for heatmap normalization)
  viewport_width: {
    type: Number,
    default: null,
  },
  viewport_height: {
    type: Number,
    default: null,
  },
  // Additional metadata
  element_tag: {
    type: String,
    default: null,
  },
  element_text: {
    type: String,
    default: null,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

// Compound index for efficient session queries
eventSchema.index({ session_id: 1, timestamp: 1 });
// Index for heatmap queries by page
eventSchema.index({ page_url: 1, event_type: 1 });

module.exports = mongoose.model('Event', eventSchema);
