/**
 * Safely parses database file paths, returning either the direct S3 URL 
 * or prepending the local backend API domain if it's a legacy standard path.
 *
 * @param {string} dbPath - The path string directly from the database (e.g., /uploads/... or https://...)
 * @returns {string} - The safely fully-resolved URL
 */
export const getFileUrl = (dbPath) => {
    if (!dbPath) return '';
    // If the path is already formally structured as an external S3 URL, return natively
    if (dbPath.startsWith('http://') || dbPath.startsWith('https://')) return dbPath;
    
    // Fallback: prepend local developmental server route 
    // In production, you might map this dynamically based on env vars
    return `http://localhost:5000${dbPath}`;
};
