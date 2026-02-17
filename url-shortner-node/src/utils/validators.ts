import validator from 'validator';

const MAX_URL_LENGTH = 2048; // Standard browser URL limit
const MAX_SHORT_ID_LENGTH = 20;
const MIN_SHORT_ID_LENGTH = 1;

/**
 * Validates and sanitizes a URL
 * @param url - The URL to validate
 * @returns Object with isValid and sanitized URL or error message
 */
export function validateAndSanitizeUrl(url: string) {
    const errors: string[] = [];

    // Check if URL is provided
    if (!url) {
        errors.push('URL is required');
        return { isValid: false, errors, sanitizedUrl: null };
    }

    // Trim whitespace
    const trimmedUrl = url.trim();

    // Check URL length
    if (trimmedUrl.length === 0) {
        errors.push('URL cannot be empty');
        return { isValid: false, errors, sanitizedUrl: null };
    }

    if (trimmedUrl.length > MAX_URL_LENGTH) {
        errors.push(`URL length cannot exceed ${MAX_URL_LENGTH} characters`);
        return { isValid: false, errors, sanitizedUrl: null };
    }

    // Validate URL format
    if (!validator.isURL(trimmedUrl, {
        protocols: ['http', 'https'],
        require_protocol: false,
        allow_underscores: true
    })) {
        errors.push('Invalid URL format. URL must be a valid HTTP(S) URL');
        return { isValid: false, errors, sanitizedUrl: null };
    }

    // Add protocol if missing
    let sanitizedUrl = trimmedUrl;
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
        sanitizedUrl = `https://${sanitizedUrl}`;
    }

    // Validate the URL using URL constructor (more strict)
    try {
        new URL(sanitizedUrl);
    } catch (error) {
        errors.push('Invalid URL format');
        return { isValid: false, errors, sanitizedUrl: null };
    }

    // Check for potentially malicious patterns
    if (validator.contains(sanitizedUrl, 'javascript:', { ignoreCase: true })) {
        errors.push('JavaScript URLs are not allowed');
        return { isValid: false, errors, sanitizedUrl: null };
    }

    if (validator.contains(sanitizedUrl, 'data:', { ignoreCase: true })) {
        errors.push('Data URLs are not allowed');
        return { isValid: false, errors, sanitizedUrl: null };
    }

    // Encode URI components to prevent injection
    try {
        const urlObj = new URL(sanitizedUrl);
        sanitizedUrl = urlObj.toString();
    } catch (error) {
        errors.push('Failed to process URL');
        return { isValid: false, errors, sanitizedUrl: null };
    }

    return {
        isValid: true,
        errors: [],
        sanitizedUrl
    };
}

/**
 * Validates a short ID
 * @param shortId - The short ID to validate
 * @returns Object with validation result
 */
export function validateShortId(shortId: string) {
    const errors: string[] = [];

    if (!shortId) {
        errors.push('Short ID is required');
        return { isValid: false, errors };
    }

    const trimmedId = shortId.trim();

    if (trimmedId.length === 0) {
        errors.push('Short ID cannot be empty');
        return { isValid: false, errors };
    }

    if (trimmedId.length < MIN_SHORT_ID_LENGTH || trimmedId.length > MAX_SHORT_ID_LENGTH) {
        errors.push(`Short ID length must be between ${MIN_SHORT_ID_LENGTH} and ${MAX_SHORT_ID_LENGTH} characters`);
        return { isValid: false, errors };
    }

    // Only allow alphanumeric characters, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
        errors.push('Short ID can only contain alphanumeric characters, hyphens, and underscores');
        return { isValid: false, errors };
    }

    return {
        isValid: true,
        errors: [],
        sanitizedId: trimmedId
    };
}
