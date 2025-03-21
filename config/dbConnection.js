const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const connectDb = async () => {
    try {
        console.log('Attempting to connect to the database...');
        await prisma.$connect();
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = connectDb;