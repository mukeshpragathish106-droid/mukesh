import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
    default: 'System',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Electrical',
        'Plumbing & Water',
        'Furniture & Benches',
        'Wi-Fi & Network',
        'HVAC & Fans',
        'Classroom Maintenance',
        'Cleanliness & Sanitation',
        'Other',
      ],
    },
    location: {
      building: {
        type: String,
        required: true,
      },
      floor: {
        type: String,
        required: true,
      },
      room: {
        type: String,
        required: true,
      },
      landmark: {
        type: String,
        default: '',
      },
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Emergency'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    images: {
      type: [String],
      default: [],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolutionProofImage: {
      type: String,
      default: '',
    },
    estimatedHours: {
      type: Number,
      default: 24,
    },
    upvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    timeline: {
      type: [timelineEntrySchema],
      default: [],
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ 'location.building': 1, 'location.room': 1 });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
export default Complaint;
