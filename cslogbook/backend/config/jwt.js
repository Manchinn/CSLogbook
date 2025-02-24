const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN
};