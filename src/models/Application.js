import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        email: { type: String, required: true, lowercase: true, trim: true, index: true,unique:true },
        phone: { type: String, trim: true, maxlength: 30,unique:true },
        message: { type: String, trim: true, maxlength: 1000 },
        // helpful metadata
        sourceIp: { type: String },
        userAgent: { type: String }
    },
    { timestamps: true }
);

// Optional: quick basic email format guard (not strict)
ApplicationSchema.path("email").validate(function (v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}, "Invalid email");

export const Application = mongoose.model("Application", ApplicationSchema);
