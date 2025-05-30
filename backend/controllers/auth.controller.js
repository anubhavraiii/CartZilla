import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {redis} from "../lib/redis.js"; 

const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m"
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d"
    });

    return { accessToken, refreshToken };
}

// refresh token is stored in upstash/redis with a 7 day expiration
const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,  // prevent xss attacks
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // prevent CSRF attacks
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", 
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
}

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    // Validate input
    try {
        const userExists = await User.findOne({ email });
        
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const user = await User.create({
            name,
            email,
            password // password will be hashed in the model
        });

        // Authenticate
        const {accessToken, refreshToken} = generateToken(user._id); // generate tokens 
        await storeRefreshToken(user._id, refreshToken); // Store refresh token in Redis

        setCookies(res, accessToken, refreshToken); // Set cookies for access and refresh tokens

        res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
    } catch (error) {
        console.log("Error in signup controller", error.message);
        return res.status(500).json({message: error.message});
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if(user && (await user.comparePassword(password))){
            const { accessToken, refreshToken } = generateToken(user._id); // generate tokens
            await storeRefreshToken(user._id, refreshToken); // Store refresh token in Redis

            setCookies(res, accessToken, refreshToken); // Set cookies for access and refresh tokens
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        } else {
			res.status(400).json({ message: "Invalid email or password" });
		}
    } catch (error) {
        console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); // decode refresh token
            await redis.del(`refresh_token:${decoded.userId}`); // Delete refresh token from Redis
        }

        res.clearCookie("accessToken"); // Clear access token cookie    
        res.clearCookie("refreshToken"); // Clear refresh token cookie
        res.json({ message: "Logged out successfully" });

    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); // decode refresh token
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`); // Get refresh token from Redis

        if( storedToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }   

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "15m"
        });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.json({ message: "Access token refreshed successfully" });
    } catch (error) {
        console.log("Error in refreshToken controller", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

// todo: implement getProfile controller
export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};