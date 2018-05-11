The client directory is where you would create a new react application with create-react-app

Once you create the app, be sure to add the following line to the generated client/package.json file:

    "proxy": "http://localhost:3001/",

This will make the connection to the API server, and avoid any CORS issues.
