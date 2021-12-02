# XQST GFX - Renderer Tests

The current specification allows for SVG's up to size 56x56 to be rendered.
Color depths (1, 2, 3, 4, 5, 8, 9, 10, 13, 16, 24, 32, 42, 48, 56, 64, 96, 128, 192, 256) extensively tested

BASIC_COLOR_DEPTH = [1, 2, 4, 11, 16, 27, 56, 256], needs to test (one, 1bpp, 2bpp, prime, 4bpp, odd, even, 8bpp)

## Major Functionality

- 1x1 -> 56x56 are rendered correctly in various color depths (56 \* 8 = 448)
- 56x56 are rendered correctly from 1-256 Colors - (256 created)

- Prime numbers up to 56 (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53) are rendered correctly in all possible shapes (256 \* 8 = 2048) -> deterministically downsample? to 105
- Oblong shapes (of non prime size) work (sizes?) (odd x odd, odd x even, even x odd, even x even) ( 4 _ 6 _ 6 \* 8 = 1152) -> deterministically downsample? to 105
- 1xN and Nx1 are rendered correctly (55 + 55 = 110)

## Features

Test with all features enabled (palette and background) and all features disabled (palette and background).

### RLE

- Simple RLE is rendered correctly (band of color the width of the image)
- Complex RLE is rendered correctly (TODO on what this is)
  - similar tests to above with different pixel generator

### Palette in Header

- Test it works at 56x56 with 256 Colors with and without background

### Background

- Images with one color is just the background
- Background works for all of the above

## On Chain Generation

- Test the max size that can also be rendered
  - tokenID -> header?
