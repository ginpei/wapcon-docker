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

## `async downloadImage(image, tag, callback)`

Download an image.

- {string} `image` Docker image's name. e.g. `"wordpress"`
- {string} `tag` Target tag. e.g. `"latest"`
- {function} `callback` Function called for each progress.
- returns {object}

```javascript
await docker.downloadImage('wordpress', 'latest', (status) => {
  const progressRate = Math.floor(status.numDone / status.numAll * 10000) / 100
  console.log(`Progress ${progressRate}%`)
})
```

An object that this returns and one `callback` receives are the same.

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
