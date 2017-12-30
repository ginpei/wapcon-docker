[![Build Status](https://travis-ci.org/ginpei/wapcon-docker.svg?branch=master)](https://travis-ci.org/ginpei/wapcon-docker)
[![Greenkeeper badge](https://badges.greenkeeper.io/ginpei/wapcon-docker.svg)](https://greenkeeper.io/)

# Wapcon's Docker Part

# Features

## `checkMachineStatus(event, options)`

Check if necessary machines have been running.

- {Event} `event` Not used. Can be `undefined`.
- {object} `options` Not used. Can be `undefined`.
- returns `Promise`

```javascript
const result = await docker.checkMachineStatus()
console.log(status.ok)
console.log(status.db)
console.log(status.wp)
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
  wordpressPath: 'user/wp',
  themes: [
    { id: 'xxx', path: '/path/to/theme' },
  ],
}

const result = await docker.startMachine(undefined, options)
```

## `stopMachine(event, options)`

Boot docker containers.

- {Event} `event` Not used. Can be `undefined`.
- {object} `options` Not used. Can be `undefined`.

```javascript
await docker.stopMachine()
```

# License

No, you cannot use this.
