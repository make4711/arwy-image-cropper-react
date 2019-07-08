# arwy-image-cropper-react

> 

[![NPM](https://img.shields.io/npm/v/arwy-image-cropper-react.svg)](https://www.npmjs.com/package/arwy-image-cropper-react) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save arwy-image-cropper-react
```

## Usage

```tsx
import * as React from 'react'

import { ImageCropper}  from 'arwy-image-cropper-react'

class Example extends React.Component {

  render () {
    return (
      <ImageCropper onChange={handleOnChange} src={src} thumbSize={{ w: 50, h: 50 }} preview />
    )
  }
}
```

## License

MIT © [mk](https://github.com/mk)
