import argon2, { verify } from "argon2"

export async function hashPassword(password: string) {
    return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string) {
    return verify(hash, password);
}