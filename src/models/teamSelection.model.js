import mongoose from "mongoose";
const { Schema } = mongoose;

const teamMemberSchema = new Schema(
    {
        consultant: {
            type: Schema.Types.ObjectId,
            ref: "Consultant",
            required: true,
        },
        role: {
            type: String,
            trim: true,
        },
        allocation: {
            type: Number,
            min: 0,
            max: 100,
            default: 100,
            validate: {
                validator: Number.isInteger,
                message: "Allocation must be an integer"
            }
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
    },
    { _id: false }
);

const pricingSnapshotSchema = new Schema(
    {
        currency: { type: String, default: "USD" },
        subtotal: { type: Number, default: 0, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        total: { type: Number, default: 0, min: 0 },
    },
    { _id: false }
);

const teamSelectionSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Team selection name is required"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters"],
            maxlength: [100, "Name must be less than 100 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, "Description must be less than 1000 characters"],
        },
        client: {
            type: Schema.Types.ObjectId,
            ref: "Client",
            required: [true, "Client reference is required"],
            index: true,
        },
        members: {
            type: [teamMemberSchema],
            validate: [
                {
                    validator: function (v) {
                        return Array.isArray(v) && v.length <= 9;
                    },
                    message: "A team may contain at most 9 consultants",
                },
                {
                    validator: function (v) {
                        if (!Array.isArray(v)) return true;
                        const ids = v.map((m) => String(m.consultant));
                        return new Set(ids).size === ids.length;
                    },
                    message: "Duplicate consultants are not allowed in a team",
                },
            ],
            default: [],
        },
        totalBudget: {
            currency: { type: String, default: "USD" },
            amount: { type: Number, min: 0, default: 0 },
        },
        pricingSnapshot: {
            type: pricingSnapshotSchema,
            default: () => ({}),
        },
        billingPeriod: {
            type: String,
            enum: ["hourly", "daily", "weekly"],
            default: "hourly",
        },
        projectDuration: {
            startDate: { type: Date },
            endDate: { type: Date },
            estimatedHours: { type: Number, min: 0 },
        },
        requirements: {
            skills: [{ type: String, trim: true }],
            minExperience: { type: Number, min: 0 },
            preferredTimezone: { type: String },
            remote: { type: Boolean, default: true },
            maxHourlyRate: { type: Number, min: 0 },
        },
        shareLinkId: {
            type: String,
            unique: true,
            sparse: true,
        },
        isShared: {
            type: Boolean,
            default: false,
        },
        shareExpiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes
teamSelectionSchema.index({ client: 1 });
teamSelectionSchema.index({ "members.consultant": 1 });
teamSelectionSchema.index({ createdAt: -1 });
teamSelectionSchema.index({ shareLinkId: 1 }, { sparse: true });

// Virtuals
teamSelectionSchema.virtual("memberCount").get(function () {
    return Array.isArray(this.members) ? this.members.length : 0;
});

teamSelectionSchema.virtual("isShareExpired").get(function () {
    if (!this.isShared || !this.shareExpiresAt) return false;
    return new Date() > this.shareExpiresAt;
});

// Pre-save validation
teamSelectionSchema.pre('save', function (next) {
    // Validate project duration
    if (this.projectDuration?.startDate && this.projectDuration?.endDate) {
        if (this.projectDuration.endDate < this.projectDuration.startDate) {
            return next(new Error('Project end date must be after start date'));
        }
    }

    // Validate member dates
    for (let i = 0; i < this.members.length; i++) {
        const member = this.members[i];
        if (member.startDate && member.endDate && member.endDate < member.startDate) {
            return next(new Error(`Member ${i + 1}: end date must be after start date`));
        }
    }

    next();
});

const TeamSelection = mongoose.model("TeamSelection", teamSelectionSchema);
export default TeamSelection;