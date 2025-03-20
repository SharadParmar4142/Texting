const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto'); // Add crypto module for random string generation

// Configure AWS SDK
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// @desc Upload image to S3
const uploadImageToS3 = async (fileBuffer, fileName, mimeType) => {
    try {
        const randomString = crypto.randomBytes(8).toString('hex'); // Generate random string
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `images/${Date.now()}-${fileName}-${randomString}`, // Unique file name with random string
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: 'public-read', // Publicly accessible
        };

        const data = await s3.upload(params).promise();
        console.log('Image uploaded to S3:', data.Location);  // Debug, Development not Production
        return data.Location; // Return public URL
    } 
    catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image to S3');
    }
};

module.exports = uploadImageToS3;