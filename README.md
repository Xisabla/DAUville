# DAUville Project

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/Xisabla/DAUville/Node.js%20build?style=for-the-badge) ![GitHub last commit](https://img.shields.io/github/last-commit/Xisabla/DAUville?style=for-the-badge)

DAUville stands for "Dashboard Agriculture Urbaine". It is a demonstration, a first version of a web interface that allow to monitor and manage teams and resources around urban agriculture

**Project status: In development**

## Requirements

- Node.js >= 14
- MongoDB server

## Getting started

Clone the project, edit (or create) the file `server/.env` with following information:

```
# -- Application (facultative)
# Path to public dir
PUBLIC_PATH=../client/public
# Port for production
PORT=8080
# Port for development
PORT_DEV=3000

# -- Security (facultative)
# Salt rounds count for bcrypt hashing
SALT_ROUNDS=10
# Secret phrase for sessions and JWT
SECRET=secret

# -- Database
MONGO_URL=mongodb+srv://mymongoserverurl:theport/
MONGO_USER=mongod_buser
MONGO_PASS=mongodb_user_password
MONGO_DB=mongodb_database_name
```

Then run the following commands from the root of the project:

```bash
npm install         # Install client and server dependencies
npm start           # Build and run project
```

## Documentation

Coming

## Contributors

- ASLI Mohamed
- BOUKARI Manal
- DENEUVILLE Enguerrand
- MIQUET Gautier
- WILLEMS Louis
- ZUILI Jacquelin

## License

The project is under [MIT License](https://opensource.org/licenses/MIT).
