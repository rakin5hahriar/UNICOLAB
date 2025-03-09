# Student Workspace

A comprehensive web application for students to organize their course materials, assignments, and resources in one place.

## Features

- **Course Management**: Create and manage courses with details like title, code, instructor, and semester
- **Workspaces**: Organize course materials in customizable workspaces
- **File Upload**: Upload and manage PDF files and other documents
- **Rich Content**: Support for notes, assignments, readings, PDFs, documents, and videos
- **User Authentication**: Secure login and registration system

## Tech Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local file system with Multer

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd student-workspace
   ```

2. Install dependencies
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file in the backend directory with the following variables:
     ```
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     ```

4. Start the development servers
   ```
   # Start backend server
   cd backend
   npm run dev

   # In a new terminal, start frontend server
   cd frontend
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
student-workspace/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   └── server.js
│   ├── uploads/
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- All contributors who have helped improve this project
- The open-source community for providing amazing tools and libraries 