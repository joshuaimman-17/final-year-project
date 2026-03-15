
/**
 * E2E Encryption Service using Web Crypto API.
 * Uses RSA-OAEP for key exchange and message encryption.
 * Private key is stored in localStorage.
 */

/**
 * E2E Encryption Service using Web Crypto API.
 * Uses RSA-OAEP for key exchange and message encryption.
 * Private key is stored in localStorage, isolated by User ID.
 */

const STORAGE_KEYS = {
    PRIVATE: 'drplant_chat_priv',
    PUBLIC: 'drplant_chat_pub'
};

/**
 * Gets the localStorage key for a specific user.
 * Falls back to legacy key if userId is not provided or for migration.
 */
function getStorageKey(type: 'PRIVATE' | 'PUBLIC', userId?: string): string {
    const base = STORAGE_KEYS[type];
    return userId ? `${base}_${userId}` : base;
}

export const EncryptionService = {
    /**
     * Generates a new RSA-OAEP key pair and stores it for the user.
     */
    async generateKeyPair(userId?: string) {
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

        // Store keys locally with user isolation
        this.storeKeys(publicKeyBase64, privateKeyBase64, userId);

        return { publicKeyBase64, privateKeyBase64 };
    },

    /**
     * Gets the stored local public key.
     * Checks user-specific key first, then legacy global key.
     */
    getLocalPublicKey(userId?: string) {
        if (typeof window === 'undefined') return null;
        
        let key = localStorage.getItem(getStorageKey('PUBLIC', userId));
        
        // Migration: If user-specific key not found but global key exists, use it
        if (!key && userId) {
            key = localStorage.getItem(getStorageKey('PUBLIC'));
            if (key) {
                console.log(`[Encryption] Migrating global public key for user ${userId}`);
                localStorage.setItem(getStorageKey('PUBLIC', userId), key);
            }
        }
        
        return key;
    },

    /**
     * Derives a cryptographic key from a passphrase.
     */
    async _deriveKey(passphrase: string, salt: Uint8Array) {
        const encoder = new TextEncoder();
        const baseKey = await window.crypto.subtle.importKey(
            "raw",
            encoder.encode(passphrase),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            } as Pbkdf2Params,
            baseKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    },

    /**
     * Encrypts the private key with a passphrase for backup.
     */
    async encryptPrivateKey(privateKeyBase64: string, passphrase: string) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await this._deriveKey(passphrase, salt);

        const encoder = new TextEncoder();
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            encoder.encode(privateKeyBase64)
        );

        // Combine salt + iv + ciphertext
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        return btoa(String.fromCharCode(...combined));
    },

    /**
     * Decrypts a backed-up private key using a passphrase.
     */
    async decryptPrivateKey(encryptedBackupBase64: string, passphrase: string) {
        const combined = Uint8Array.from(atob(encryptedBackupBase64), c => c.charCodeAt(0));
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const ciphertext = combined.slice(28);

        const key = await this._deriveKey(passphrase, salt);

        try {
            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv },
                key,
                ciphertext
            );
            return new TextDecoder().decode(decrypted);
        } catch (e) {
            throw new Error("Invalid recovery passphrase");
        }
    },

    /**
     * Helper to safely convert ArrayBuffer to Base64 string.
     */
    _bufferToBase64(buffer: ArrayBuffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    /**
     * Helper to safely convert Base64 string to Uint8Array.
     */
    _base64ToUint8Array(base64: string) {
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    },

    /**
     * Encrypts a message using Hybrid Encryption (AES-GCM + RSA-OAEP).
     * This supports long messages and matches industry standards.
     */
    async encrypt(message: string, recipientPublicKeyBase64: string, senderPublicKeyBase64?: string) {
        // 1. Generate a random AES key
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // 2. Encrypt message with AES-GCM
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedMessage = new TextEncoder().encode(message);
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            aesKey,
            encodedMessage
        );

        // 3. Export AES key to encrypt it with RSA
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

        // 4. Encrypt AES key with Recipient's RSA Public Key
        const encryptKeyWithRSA = async (rsaPubKeyBase64: string) => {
            const pubKeyBuffer = this._base64ToUint8Array(rsaPubKeyBase64).buffer;
            const pubKey = await window.crypto.subtle.importKey(
                "spki", pubKeyBuffer, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]
            );
            const encryptedKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, exportedAesKey);
            return this._bufferToBase64(encryptedKey);
        };

        const forReceiver = await encryptKeyWithRSA(recipientPublicKeyBase64);
        let forSender = null;
        if (senderPublicKeyBase64) {
            forSender = await encryptKeyWithRSA(senderPublicKeyBase64);
        }

        // 5. Package everything
        return JSON.stringify({
            v: 2, // Version 2: Hybrid Encryption
            iv: this._bufferToBase64(iv.buffer),
            ct: this._bufferToBase64(encryptedContent),
            forReceiver,
            forSender
        });
    },

    /**
     * Legacy RSA encryption (for internal use or backward compatibility if needed)
     */
    async encryptRSA(message: string, publicKeyBase64: string) {
        const publicKeyBuffer = this._base64ToUint8Array(publicKeyBase64).buffer;
        const publicKey = await window.crypto.subtle.importKey(
            "spki", publicKeyBuffer, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]
        );

        const encodedMessage = new TextEncoder().encode(message);
        const encryptedBuffer = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encodedMessage);
        return this._bufferToBase64(encryptedBuffer);
    },

    /**
     * Decrypts a message using the stored local private key.
     * Returns null if decryption fails.
     */
    async decrypt(payload: any, userId?: string): Promise<string | null> {
        if (!payload) return "";

        // 1. Get Private Key (with user-isolation and migration fallback)
        let privateKeyBase64 = localStorage.getItem(getStorageKey('PRIVATE', userId));
        if (!privateKeyBase64 && userId) {
            privateKeyBase64 = localStorage.getItem(getStorageKey('PRIVATE'));
            if (privateKeyBase64) {
                console.log(`[Encryption] Migrating global private key for user ${userId}`);
                localStorage.setItem(getStorageKey('PRIVATE', userId), privateKeyBase64);
            }
        }

        if (!privateKeyBase64) return null;

        try {
            const privKeyBuffer = this._base64ToUint8Array(privateKeyBase64).buffer;
            const privateKey = await window.crypto.subtle.importKey(
                "pkcs8", privKeyBuffer, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]
            );

            // ── Case 1: Hybrid Payload (v2) ──
            if (typeof payload === 'object' && payload.v === 2) {
                const { encryptedKey, iv: ivBase64, ct: ctBase64 } = payload;
                if (!encryptedKey || !ivBase64 || !ctBase64) return null;

                // A. Decrypt AES Key with RSA
                const encryptedKeyBuffer = this._base64ToUint8Array(encryptedKey).buffer;
                const aesKeyRaw = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedKeyBuffer);

                // B. Import AES Key
                const aesKey = await window.crypto.subtle.importKey("raw", aesKeyRaw, { name: "AES-GCM" }, false, ["decrypt"]);

                // C. Decrypt Content with AES
                const iv = this._base64ToUint8Array(ivBase64);
                const ct = this._base64ToUint8Array(ctBase64).buffer;
                const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
                return new TextDecoder().decode(decryptedBuffer);
            }

            // ── Case 2: Legacy RSA Payload (String) ──
            const encryptedBuffer = this._base64ToUint8Array(payload).buffer;
            const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedBuffer);
            return new TextDecoder().decode(decryptedBuffer);
        } catch (e) {
            console.error("EncryptionService.decrypt failed:", e);
            return null;
        }
    },

    /**
     * Stores keys in localStorage, isolated by user.
     */
    storeKeys(publicKeyBase64: string, privateKeyBase64: string, userId?: string) {
        localStorage.setItem(getStorageKey('PUBLIC', userId), publicKeyBase64);
        localStorage.setItem(getStorageKey('PRIVATE', userId), privateKeyBase64);
    }
};
