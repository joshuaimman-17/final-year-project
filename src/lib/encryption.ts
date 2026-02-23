
/**
 * E2E Encryption Service using Web Crypto API.
 * Uses RSA-OAEP for key exchange and message encryption.
 * Private key is stored in localStorage.
 */

const PRIVATE_KEY_STORAGE_KEY = 'drplant_chat_priv';
const PUBLIC_KEY_STORAGE_KEY = 'drplant_chat_pub';

export const EncryptionService = {
    /**
     * Generates a new RSA-OAEP key pair.
     */
    async generateKeyPair() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );

        // Export keys to string format (Base64)
        const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
        const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

        const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
        const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

        // Store private key locally
        localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKeyBase64);
        localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, publicKeyBase64);

        return { publicKeyBase64, privateKeyBase64 };
    },

    /**
     * Gets the stored local public key.
     */
    getLocalPublicKey() {
        return localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);
    },

    /**
     * Encrypts a message using the recipient's public key.
     */
    async encrypt(message: string, publicKeyBase64: string) {
        const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0)).buffer;

        const publicKey = await window.crypto.subtle.importKey(
            "spki",
            publicKeyBuffer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["encrypt"]
        );

        const encodedMessage = new TextEncoder().encode(message);
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            encodedMessage
        );

        return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    },

    /**
     * Decrypts a message using the stored local private key.
     */
    async decrypt(encryptedBase64: string) {
        const privateKeyBase64 = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
        if (!privateKeyBase64) throw new Error("Private key not found");

        const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0)).buffer;

        const privateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            privateKeyBuffer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["decrypt"]
        );

        const encryptedBuffer = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0)).buffer;
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedBuffer
        );

        return new TextDecoder().decode(decryptedBuffer);
    }
};
