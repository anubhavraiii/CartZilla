import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim : true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password not required if signing up with Google
        },
        minlength: [6, "Password must be at least 6 characters long"]
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    profilePicture: {
        type: String,
        default: ""
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    cartItems: [
        {
            quantity: {
                type: Number,
                default: 1  
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            }
        }
    ],
    role:{
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    }
}, {
    timestamps: true // createdAt and updatedAt fields
})

// Middleware to hash password before saving
userSchema.pre("save", async function(next) {
    // Skip password hashing if user is signing up with Google
    if(!this.isModified("password") || !this.password) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
})

// Method to compare password
userSchema.methods.comparePassword = async function(password) {
    if (!this.password) return false; // No password set (Google user)
    return await bcrypt.compare(password, this.password);
}

const User = mongoose.model("User", userSchema);

export default User;