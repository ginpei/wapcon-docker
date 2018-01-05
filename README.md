[![Build Status](https://travis-ci.org/ginpei/wapcon-docker.svg?branch=master)](https://travis-ci.org/ginpei/wapcon-docker)
[![Greenkeeper badge](https://badges.greenkeeper.io/ginpei/wapcon-docker.svg)](https://greenkeeper.io/)

# Wapcon's Docker Part

# Features

## `async isDockerReady()`

- returns {boolean}

```javascript
if (!await docker.isDockerReady()) {
  console.log('You need to boot docker first.')
  return
}
```

## `async function checkImageStatus({ wp, db })`

Check if images are ready.

- {string} `wp` WordPress's version as image's tag. Default is `latest`.
- {string} `db` MySQL's version as image's tag. Default is `latest`.
- returns {object}

```javascript
const result = await docker.checkImageStatus()
console.log(result.ok)
console.log(result.wp)
console.log(result.db)
```

## `async downloadImages({ wp, db })`

Download images.

- {string} `wp` WordPress's version as image's tag. Default is `latest`.
- {string} `db` MySQL's version as image's tag. Default is `latest`.
- returns {object}

```javascript
const result = await docker.checkImageStatus()
if (!result.ok) {
  await docker.downloadImages((status) => {
    console.log(`Progress ${status.all}%`)
  })
  console.log('Downloading completed!')
}
```

## `async checkMachineStatus()`

- returns {object}

```javascript
const result = await docker.checkMachineStatus()
console.log(status.ok)
console.log(status.db)
console.log(status.wp)
```

## `async startMachine(options)`

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

await docker.startMachine(options)
```

## `async stopMachine()`

```javascript
await docker.stopMachine()
```

# License

No, you cannot use this.
