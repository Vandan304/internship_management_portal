/**
 * Safely parses database file paths, returning either the direct S3 URL 
 * or prepending the local backend API domain if it's a legacy standard path.
 *
 * @param {string} dbPath - The path string directly from the database (e.g., /uploads/... or https://...)
 * @returns {string} - The safely fully-resolved URL
 */

const ENV_API_URL = import.meta.env.VITE_API_URL;
const isDevelopment = import.meta.env.MODE === 'development';

// Dynamic BASE_URL: localhost for development, environment variable for production with fallback
export const BASE_URL = isDevelopment 
    ? 'http://localhost:5000' 
    : (ENV_API_URL || 'http://localhost:5000');

export const getFileUrl = (dbPath) => {
    if (!dbPath) return '';
    // If the path is already formally structured as an external S3 URL, return natively
    if (dbPath.startsWith('http://') || dbPath.startsWith('https://')) return dbPath;
    
    // Fallback: prepend determined BASE_URL
    return `${BASE_URL}${dbPath}`;
};
