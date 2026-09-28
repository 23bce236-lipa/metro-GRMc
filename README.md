Centralized Infrastructure Asset Lifecycle Tracker — Ahmedabad Metro (GMRC)
A production-grade, highly scalable full-stack enterprise application designed for the Gujarat Metro Rail Corporation (GMRC) to track, monitor, and audit infrastructure assets (such as automatic fare collection gates, escalators, and safety systems) across metro stations.🚀 Key Features & System ArchitectureImmutable Audit Trail (Asset + AssetLog): Unlike standard CRUD applications that merely overwrite status fields, every state transition (e.g., Active $\rightarrow$ Reported $\rightarrow$ Under Maintenance) simultaneously triggers an immutable audit log entry capturing the timestamp, role, and actor.Role-Based Access Control (RBAC): Granular access control protecting routes and operations across three distinct workspaces:Citizens (Public): Mobile-friendly reporting portal to flag broken or malfunctioning station infrastructure.Maintenance Technicians: Field-first mobile work order interface to review and resolve assigned tickets.Station Controllers (Admins): Comprehensive desktop dashboard featuring live metrics, a searchable data table, pagination, and a Jira-style visual audit timeline.Modern Enterprise UI/UX: Styled using Tailwind CSS with a distinct GMRC-aligned color palette (Deep Navy Blue and Vibrant Orange) supporting both Light and Dark modes.Secure Authentication: JSON Web Token (JWT) based authentication with password hashing (bcryptjs) and a 1-click demo login option for quick presentations.🛠️ Tech StackFrontend: React.js, React Router, Tailwind CSS, Axios, Lucide React, React Hot Toast.Backend: Node.js, Express.js, Mongoose.Database: MongoDB Atlas (Cloud NoSQL Database with optimized schema indexing).📂 Project Directory StructurePlaintextgrmc-asset-tracker/
│
├── server/                   # Express Backend
│   ├── models/               # Mongoose Schemas (User.js, Asset.js, AssetLog.js)
│   ├── controllers/          # Business logic & Route handlers
│   ├── routes/               # API endpoints
│   ├── middleware/           # JWT & RBAC verification middleware
│   └── server.js             # Express application entry point
│
└── client/                   # React Frontend
    ├── src/
    │   ├── components/       # Reusable UI components & Figma integrations
    │   ├── pages/            # Role-based views (LandingPage, LoginPage, OperationsDashboard)
    │   ├── services/         # Centralized Axios API configuration
    │   ├── App.jsx           # Master router & RBAC entry point
    │   └── main.jsx          # React DOM mounting
    └── package.json
⚙️ Getting Started & InstallationPrerequisitesNode.js (v18+ recommended)MongoDB Atlas Account or local MongoDB instanceGit1. Clone the RepositoryBashgit clone https://github.com/your-username/grmc-asset-tracker.git
cd grmc-asset-tracker
2. Setup the BackendNavigate to the server directory, install dependencies, and configure your environment variables.Bashcd server
npm install
Create a .env file inside the server/ folder with the following keys:Code snippetPORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here
Start the backend server using Nodemon:Bashnpm run dev
3. Setup the FrontendOpen a separate terminal tab, navigate to the client directory, install dependencies, and run the React app:Bashcd client
npm install
npm run dev
The frontend will run locally on http://localhost:5173 and communicate with the Express server running on http://localhost:5000.🔑 Demo CredentialsFor quick evaluation and testing, use the 1-click demo buttons on the login page or log in with these pre-configured accounts:RoleEmailPasswordAccess LevelStation Controlleradmin@gmrc.inadmin123Full system access, data table, and audit timelinesMaintenance Techtech@gmrc.intech123View active field reports and mark assets as fixedCitizen / PublicSelf-register or public view—Submit infrastructure failure reports🔌 Core API EndpointsMethodEndpointDescriptionAccess RolePOST/api/auth/loginAuthenticate user & return JWTPublicGET/api/assetsFetch paginated list of metro assetsAuthenticatedPOST/api/assets/:id/reportReport a broken asset (creates AssetLog)Citizen / AllPOST/api/assets/:id/fixMark an asset as resolved/activeTech / AdminGET/api/assets/:id/timelineFetch the immutable audit trail historyAdmin / Tech
