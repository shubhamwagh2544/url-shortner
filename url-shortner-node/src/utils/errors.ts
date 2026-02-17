/**
 * Custom error class for API responses
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public errors?: string[]
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Standard API error response format
 */
export interface ErrorResponse {
    success: false;
    message: string;
    errors?: string[];
    statusCode: number;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: ApiError | Error, statusCode: number = 500): ErrorResponse {
    if (error instanceof ApiError) {
        const response: ErrorResponse = {
            success: false,
            message: error.message,
            statusCode: error.statusCode
        };

        if (error.errors) {
            response.errors = error.errors;
        }

        return response;
    }

    return {
        success: false,
        message: error.message || 'An unexpected error occurred',
        statusCode
    };
}

/**
 * Standard success response format
 */
export interface SuccessResponse<T> {
    success: true;
    data: T;
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
    return {
        success: true,
        data
    };
}
