import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {findUserByEmailOrUsername, createUser, findUserByUsername} from '../models/userModel.js';

export const signUpController = async (req: Request, res: Response) => {
    try {
        const {username, email, password} = req.body;

        // Validate input
        if (!username || !email || !password) {
            res.status(400).json({ error: "Username, email, and password are required." });   
            return;
        }

        // Check if the user already exists
        const existingUser = await findUserByEmailOrUsername(email, username);

        if (existingUser) {
            res.status(400).json({ error: "User already exists." });
            return;
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        const newUser = await createUser(username, email, hashedPassword);

        // Respond with the newly created user (excluding the password)
        res.status(201).json({ message: "User created successfully.", newUser });

    } catch (error) {
        console.error("Error during sign up:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

export const signInController = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            res.status(400).json({ error: "Username and password are required." });
            return;
        }

        // find user in database
        const user = await findUserByUsername(username);

        if (!user) {
            res.status(401).json({ error: "Invalid username or password." });
            return;
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: "Invalid username or password." });
            return;
        }

        // Generate a JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: '2h' }
        );

        // Respond with the token and user info
        res.status(200).json({
            message: "Sign in successful.",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            }
        });
    } catch (error) {
        console.error("Error during sign in:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};