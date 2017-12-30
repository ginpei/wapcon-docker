[![Build Status](https://travis-ci.org/ginpei/wapcon-docker.svg?branch=master)](https://travis-ci.org/ginpei/wapcon-docker)
[![Greenkeeper badge](https://badges.greenkeeper.io/ginpei/wapcon-docker.svg)](https://greenkeeper.io/)

# Wapcon's Docker Part

# Features

## `async isDockerReady()`

- returns {boolean}

```javascript
if (await docker.isDockerReady()) {
  console.log('Here you go!')
}
else {
  console.log('You need to boot docker first.')
}
```

## `async checkImageStatus()`

- returns {object}

```javascript
const result = await docker.checkImageStatus()
console.log(result.ok)
console.log(result.wp)
console.log(result.db)
```

## `async downloadImages(options)`

- {string} options.wp WordPress's version as image's tag
- {string} options.db MySQL's version as image's tag

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
