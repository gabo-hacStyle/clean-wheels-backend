import jwt from 'jsonwebtoken';
import { env } from "@config/env";
import {JwtPayload} from "../types";

export const jwtUtil = {
    sign: (payload: Omit<JwtPayload, 'iat' | 'exp'>) : string =>
        jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' }),

    verify: (token: string) : JwtPayload =>
        jwt.verify(token, env.JWT_SECRET) as JwtPayload,
}