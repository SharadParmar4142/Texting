# Chat Application Backend

## Overview
This is a Node.js backend application that provides API endpoints for a chat application. It uses Firebase for authentication, MongoDB for data storage, and Agora for real-time voice/video communication capabilities.

## Technology Stack
- **Node.js & Express**: Backend framework
- **Prisma**: ORM for database operations
- **MongoDB**: Primary database
- **Firebase**: Authentication and file storage
- **Agora**: Real-time voice and video calls
- **Socket.io**: Real-time chat functionality

## Project Structure
```sh
├── config/             # Configuration files
├── controller/         # Route controllers
├── middleware/         # Custom middleware
├── prisma/            # Database schema and migrations
├── routes/            # API routes
└── utils/             # Utility functions
```

## Prerequisites
- Node.js (v14 or higher)
- MongoDB instance
- Firebase project
- Agora account

## Setup Instructions

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd <project-folder>
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Environment Variables**
   Create a .env file in the root directory with the following variables:

   ```env
   # Database
   DATABASE_URL="your_mongodb_connection_string"

   # JWT
   ACCESS_TOKEN_SECRET="your_jwt_secret"

   # Firebase Config
   FIREBASE_URL="your_firebase_database_url"
   API_KEY="your_firebase_api_key"
   AUTH_DOMAIN="your_firebase_auth_domain"
   PROJECT_ID="your_firebase_project_id"
   STORAGE_BUCKET="your_firebase_storage_bucket"
   MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
   APP_ID="your_firebase_app_id"

   # Agora Config
   AGORA_APP_ID="your_agora_app_id"
   AGORA_APP_CERTIFICATE="your_agora_app_certificate"
   ```

4. **Firebase Service Account Key**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key
   - Save the downloaded file as serviceAccountKey.json in the root directory
   - **Important**: Add serviceAccountKey.json to `.gitignore`

   This file is required for server-side Firebase operations but contains sensitive credentials
   and should never be committed to version control.

5. **Start the server**
   ```sh
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Routes

### User Routes
- Authentication endpoints
- Profile management
- User interactions

### Admin Routes
- User management
- System configuration
- Analytics

### Listener Routes
- Chat management
- Call handling
- Session management

### Dashboard Routes
- Statistics
- Reports
- Activity monitoring

## Security Notes
1. Never commit .env or serviceAccountKey.json to version control
2. Implement rate limiting for production deployments
3. Keep dependencies updated for security patches

## Database
The project uses MongoDB with Prisma as ORM. Database schema can be found in schema.prisma.

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
