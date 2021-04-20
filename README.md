# DAUville Project

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/Xisabla/DAUville/Node.js%20build?style=for-the-badge) ![GitHub last commit](https://img.shields.io/github/last-commit/Xisabla/DAUville?style=for-the-badge)

DAUville stands for "Dashboard Agriculture Urbaine". It is a demonstration, a first version of a web interface that allow to monitor and manage teams and resources around urban agriculture.
## Requirements

- Node.js >= 14
- [MongoDB](https://www.mongodb.com/) database (dedicated or on [Atlas](https://www.mongodb.com/cloud/atlas))

## Getting started

[Clone the project](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) on your computer and set the configuration values:
- The configuration values are read from the file `server/.env` which is not on the project's git to avoid security issues.
- You can find a template of the `server/.env` [here](./example.env) with the description of all the fields as comments.
- Make sure that the file is located IN the `server` folder, otherwise the application won't be able to read the values.

Then run the following commands from the root directory of the project:

```bash
npm install         # Install client and server dependencies
npm start           # Build and run the project
```

Now, the client files are bundled and the server is running on the given port, everything is up and running.

**NOTE**: By default, the application will start even if the database connection fails (eg: the database server is down, the credentials are wrong, ...), however the application won't work really fine. In this case you will be able to read this message in the console to warn you:

![Database error](https://raw.githubusercontent.com/Xisabla/DAUville/main/.github/images/db-error.png)

## Global presentation and behaviors
### Exchanges and back-end structure

The project aims into collecting information from external resources (APIs, databases, ...) and to process them and serve them to the clients.

![Basic exchanges overview](https://raw.githubusercontent.com/Xisabla/DAUville/main/.github/images/basic-exchanges.png)

The webserver is connected to a mongoDB database to store its valuable data, and most of the retrieving operations to collect data from the external resources are API calls.

The webserver has 2 types of connections with the clients to manage data flux:
- HTTP endpoints (request/response): for the client to fetch the data from the server
- Websockets: Mostly for the server to dispatch events (eg: new data collected)

![Application exchanges](https://raw.githubusercontent.com/Xisabla/DAUville/main/.github/images/application-exchanges.png)

The hole server and its different endpoints and proccesses are stored in the [`Application`](https://xisabla.github.io/DAUville/doc/server/classes/application.html) object.

This objects contains [`Modules`](https://xisabla.github.io/DAUville/doc/server/classes/module.html) which describes a list of endpoints (HTTP or Socket) and some [`tasks`](https://xisabla.github.io/DAUville/doc/server/classes/task.html) that will run chronically.

### Data flux examples

#### Example 1: Module fetching data

![Module data fetch](https://raw.githubusercontent.com/Xisabla/DAUville/main/.github/images/module-data-fetch.png)

- At time *T*, one of the task of the module is triggered. The module is sending a request to an external API to fetch some data.
- At time *T + 1*, the external resource respond with the data.
- At time *T + 2*, the module will process the data and save or edit an entry in the database.
- At time *T + 3*, the module will send an event to all the connected sockets so that all connected users will get the new data.

#### Example 2: User requesting for data

![Client data fetch](https://raw.githubusercontent.com/Xisabla/DAUville/main/.github/images/client-data-fetch.png)

- At time *T*, the user will emit a request to the HTTP Server of the Application object, requesting data (eg: fetching `/getMyFoodMeasures`).
- At time *T + 1*, the server will recognize the route and redirect to the endpoint store in the related module (in our example, the module will be [`MeasureModule`](https://xisabla.github.io/DAUville/doc/server/classes/measuremodule.html#getmyfoodmeasureshandler)).
- At time *T + 2*, the module will process the endpoint, check for the request validity, retrieves the data from the database and check for errors (no database entry, invalid credentials, ...). This is the step with the most processes.
- At time *T + 3*, the module has processed the client request and sends him a response with the data queried, or with an error message if something went wrong.

## Back-ends modules implemented

At the moment, the backend is working with 4 modules:
- [`UserModule`](https://xisabla.github.io/DAUville/doc/server/classes/usermodule.html): It allows for a user to login and logout and for an admin user to register new users. Every password are hashed using the bcrypt algorithm so that any password can leak from the database.
- [`MeasureModule`](https://xisabla.github.io/DAUville/doc/server/classes/measuremodule.html): It retrieves the sensor data of the Aquaponic Greenhouse from MyFood every 10 minutes and save them to our database. Then, it allows users to access and filter this data. The monitoring interface is working thanks to this module.
- [`FarmbotLogsModule`](https://xisabla.github.io/DAUville/doc/server/classes/farmbotlogsmodule.html): Each day at 6 PM, this module will retrieve the logs of the farmbot to create a "sumup", store it in the database and it also sends a mail to the user for him to be notified of the daily sumup. It also allows the user to read those sumups from the client interface.
- (*experimental*) [`OccupancyRateModule`](https://xisabla.github.io/DAUville/doc/server/classes/occupancyratemodule.html): It allows the user to create and edit units and their contents for each agriculture module so as to manage their occupancy rates.

## Detailed documentation

- Client documentation can be found [here](https://xisabla.github.io/DAUville/doc/client)
- Server documentation can be found [here](https://xisabla.github.io/DAUville/doc/server)

## Contributors

- ASLI Mohamed
- BOUKARI Manal
- DENEUVILLE Enguerrand
- MIQUET Gautier
- WILLEMS Louis
- ZUILI Jacquelin

## License

The project is under [MIT License](https://opensource.org/licenses/MIT).
