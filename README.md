[![Build Status](https://travis-ci.org/ginpei/wapcon-docker.svg?branch=master)](https://travis-ci.org/ginpei/wapcon-docker)
[![Greenkeeper badge](https://badges.greenkeeper.io/ginpei/wapcon-docker.svg)](https://greenkeeper.io/)

# Wapcon's Docker Part

# Features

## `checkMachineStatus()`

Check if necessary machines are ready.

- returns `Promise`

```javascript
docker.checkMachineStatus()
  .then((status) => {
    console.log(status.ok)

    console.log(status.db)
    console.log(status.wp)
  })
```

## `startMachine(event, options)`

Boot docker containers.

- {Event} `event` Not used. Can be `undefined`.
- {object} `options`
- {string} `options.databasePath`
- {string} `options.wordpressPath` DEPRECATED

```javascript
const options = {
  databasePath: 'user/db',
  wordpressPath: 'user/wp',  // DEPRECATED
}

docker.startMachine(undefined, options)
  .then((status) => {
    console.log(status.ok)

    console.log(status.db)
    console.log(status.wp)
  })
```
