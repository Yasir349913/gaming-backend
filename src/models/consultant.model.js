import mongoose from "mongoose";
const { Schema } = mongoose;

const rateSchema = new Schema(
    {
        currency: { type: String, default: "USD" },
        hourly: { type: Number, default: 0 },
        daily: { type: Number },
        weekly: { type: Number },
    },
    { _id: false }
);

const availabilitySchema = new Schema(
    {
        timezone: { type: String, default: "UTC" },
        hoursPerWeek: { type: Number, default: 40 },
        hoursPerDay: { type: Number, default: 8, min: 1, max: 24 },
        availableFrom: { type: Date },
        availableTo: { type: Date },
        remote: { type: Boolean, default: true },
    },
    { _id: false }
);

const consultantSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"],
            unique: true,
            index: true,
        },
        headline: {
            type: String,
            trim: true,
        },
        bio: {
            type: String,
            trim: true,
        },
        roles: [{ type: String, trim: true }],
        skills: [{ type: String, trim: true }],
        badges: [{ type: String }],
        level: {
            type: String,
            enum: ["LV1", "LV2", "LV3", "LV4", "LV5", "LV6"],
            default: "LV1",
        },
        baseRate: {
            type: rateSchema,
            default: () => ({}),
        },
        experienceYears: {
            type: Number,
            default: 0,
        },
        availability: {
            type: availabilitySchema,
            default: () => ({}),
        },
        locations: [{ type: String, trim: true }],
        cv: { type: String },
        portfolioLinks: [{ type: String }],
        status: {
            type: String,
            enum: ["pending", "approved", "disapproved"],
            default: "pending",
        },
        approved: {
            type: Boolean,
            default: false,
        },
        approvedAt: { type: Date },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        capacity: {
            maxHoursPerWeek: { type: Number, default: 40 },
            reservedHoursPerWeek: { type: Number, default: 0 },
        },
        visibility: {
            type: String,
            enum: ["public", "private", "unlisted"],
            default: "public",
        },
    },
    { timestamps: true }
);

const Consultant = mongoose.model("Consultant", consultantSchema);
export default Consultant;