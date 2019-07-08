# arwy-image-cropper-react

> 

[![NPM](https://img.shields.io/npm/v/arwy-image-cropper-react.svg)](https://www.npmjs.com/package/arwy-image-cropper-react) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Intention
This is a small component for clipping images. It supports mouse and touch events.   
You give a base64image in and get the cropped image back at every user interaction.

## Props
| | | |
|-|-|-|
| ___thumbSize___: | width and height of the thumbnail   
| ___src___: | base64image source   
| ___preview___: | displays the thumbnail on ImageCropper. this prop is for debugging   
| ___onChange___: | callback to get thumb in base64 format   
|

___important___ you should set height of the ImageCropper parent container

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

    let src = "data:image .....
    
    let handleOnChange = (base64Image) => { 
      console.log('base64Image:', base64Image);
    };

    return (
      <ImageCropper onChange={handleOnChange} src={src} thumbSize={{ w: 50, h: 50 }} preview />
    )
  }
}
```

## License

MIT © [mk](https://github.com/mk)
