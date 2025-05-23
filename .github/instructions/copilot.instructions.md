---
applyTo: '**'
---
# CSLogbook - GitHub Copilot Instructions

## General Interaction Guidelines
- **Primary Language**: Please consistently use Thai for all explanations, suggestions, and direct responses to queries.
- **Code Comments**: When generating code, include comments in Thai to aid understanding for Thai-speaking developers, especially for complex logic.
- **Technical Terms**: Use common Thai technical terms where available. If an English term is more standard or precise, use the English term and provide a brief explanation in Thai.
- **Clarity over Brevity**: Prioritize clear and comprehensive explanations in Thai, even if it means being more verbose. Avoid overly simplistic English phrasing.

## Project Overview
This is a React JavaScript application called "CSLogbook" (ระบบติดตามความก้าวหน้าของนักศึกษา) - a system for tracking and monitoring student progress. The system is built with a React frontend and Node.js backend with Express framework, using MySQL as the database.

## Technologies Used
### Frontend
- **React**: Using functional components and hooks for UI development
- **React Router**: For application routing and navigation
- **Axios**: For API requests to the backend
- **React Context API**: For global state management
- **CSS/SCSS**: For styling components with responsive design
- **Ant Design version ^5.25.1**: For pre-built UI components and styling

### Backend
- **Node.js**: JavaScript runtime for server-side code
- **Express**: Web framework for building the API
- **Sequelize ORM**: For database operations and migrations
- **MySQL**: Relational database for data storage
- **JWT**: For authentication and authorization
- **Multer**: For file uploads handling

## Project Structure
The application follows a clear separation between frontend and backend:

### Backend Structure
- **controllers/**: API endpoint handlers organized by domain
- **models/**: Sequelize database models
- **routes/**: API route definitions
- **middleware/**: Custom middleware for auth, rate limiting, etc.
- **config/**: Configuration files for database, server, etc.
- **services/**: Business logic and external service integrations
- **utils/**: Utility functions and helpers
- **migrations/**: Database schema changes
- **seeders/**: Initial data for the database
- **agents/**: Background processes and scheduled tasks

### Frontend Structure
- **src/components/**: Reusable UI components
- **src/pages/**: Page-level components with routing
- **src/context/**: React context definitions for state management
- **src/hooks/**: Custom React hooks
- **src/utils/**: Utility functions for the frontend
- **src/services/**: API service integrations
- **src/assets/**: Static assets like images and icons

## When suggesting code, remember:
- This is a student progress tracking system written in React JavaScript
- Follow modern React practices with functional components and hooks
- The primary users are students and educators tracking academic progress
- The UI should be responsive and accessible
- The system manages student activities, milestones, and feedback

## React Component Best Practices
- Use modular component architecture with single responsibility principle
- Keep components small and focused on specific UI elements or functionality
- Implement clean state management with React hooks (useState, useEffect, useContext, useReducer)
- Separate business logic from presentational components
- Implement proper error boundaries and fallback UIs
- Use React.memo() for performance optimization where appropriate
- Follow accessibility best practices (proper ARIA attributes, semantic HTML, keyboard navigation)
- Write reusable utility functions and custom hooks
- Include appropriate error handling and loading states
- Design for both mobile and desktop experiences with responsive design
- Use props destructuring and default props for cleaner code
- Implement proper form validation using custom hooks or libraries
- Using Thai explanations if you can 

## Application features:

### 1. User Authentication and Role Management
- **Login/Registration System**: Secure authentication for students and educators
- **Role-Based Access Control**: Different permissions and views based on user role (student, advisor, admin)
- **Profile Management**: Allow users to update their information and preferences
- **Account Recovery**: Password reset and account recovery workflows

### 2. Student Progress Tracking and Logging
- **Activity Logging**: Students can create entries about completed work, challenges, and achievements
- **Milestone Management**: Define, track, and update key academic milestones
- **Task Management**: Create and manage academic tasks with deadlines and priorities
- **Progress Indicators**: Visual representation of completion status and advancement
- **Journal Entries**: Reflective logs where students can document their learning journey

### 3. Timeline Visualization of Activities
- **Chronological View**: Display activities and milestones in a timeline format
- **Filtering Options**: Filter timeline by date range, activity type, or status
- **Interactive Timeline**: Click to expand entries and see details
- **Calendar Integration**: View deadlines and milestones in calendar format
- **Historical Analysis**: Track progress patterns over academic terms

### 4. Feedback and Assessment Tools
- **Advisor Comments**: Allow advisors to provide feedback on student entries
- **Rating System**: Evaluate progress using defined metrics or rubrics
- **Discussion Threads**: Enable conversations around specific activities or milestones
- **Approval Workflows**: Teachers can review and approve submitted work
- **Improvement Suggestions**: System for providing constructive feedback

### 5. Reporting and Data Visualization
- **Progress Dashboards**: Visual summaries of student advancement
- **Comparative Analysis**: Compare current progress against goals or past performance
- **Exportable Reports**: Generate PDF or spreadsheet reports of student activities
- **Analytics**: Identify patterns, strengths, and areas needing improvement
- **Achievement Tracking**: Highlight completed milestones and accomplishments

## Technical Requirements:
- RESTful API integration for data persistence
- Responsive design for all screen sizes
- Form validation and error handling
- State management using React Context and hooks
- Secure data handling and privacy controls

## Please avoid:
- Class components (use functional components instead)
- Outdated React patterns
- Overly complex solutions when simple ones will work
- Assuming specific external libraries unless mentioned